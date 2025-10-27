/**
 * COI Parser Service
 * Extracts insurance coverage data from ACORD-25 COI documents using OCR text
 */

import { logger } from "./logger";

export interface ParsedCOIData {
  // Coverage limits (in dollars)
  generalLiability?: number;
  autoLiability?: number;
  
  // Required endorsements
  hasAdditionalInsured: boolean;
  hasWaiverOfSubrogation: boolean;
  
  // Policy dates
  effectiveDate?: Date;
  expiryDate?: Date;
  
  // Additional fields
  insurerName?: string;
  policyNumber?: string;
  
  // Raw extracted values for display/debugging
  raw: {
    glText?: string;
    autoText?: string;
    effectiveDateText?: string;
    expiryDateText?: string;
  };
}

/**
 * Parse monetary amount from text (handles various formats)
 * Examples: "$1,000,000", "1000000", "$1M", "1 MILLION"
 */
function parseAmount(text: string): number | undefined {
  if (!text) return undefined;
  
  // Remove whitespace and convert to uppercase
  let cleaned = text.trim().toUpperCase();
  
  // Handle million/thousand abbreviations
  const millionMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*M(?:IL)?(?:LION)?/);
  if (millionMatch) {
    return parseFloat(millionMatch[1]) * 1000000;
  }
  
  const thousandMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*K(?:THOUSAND)?/);
  if (thousandMatch) {
    return parseFloat(thousandMatch[1]) * 1000;
  }
  
  // Remove currency symbols and commas
  cleaned = cleaned.replace(/[$,]/g, '');
  
  // Extract the number
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }
  
  return undefined;
}

/**
 * Parse date from text (handles various formats)
 * Examples: "01/15/2024", "2024-01-15", "Jan 15, 2024", "January 15, 2025"
 */
function parseDate(text: string): Date | undefined {
  if (!text) return undefined;
  
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(text);
  }
  
  // Try MM/DD/YYYY or MM-DD-YYYY
  const usMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (usMatch) {
    let year = parseInt(usMatch[3]);
    if (year < 100) {
      year += 2000; // Assume 20xx for 2-digit years
    }
    return new Date(year, parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
  }
  
  // Try spelled-out month formats: "January 15, 2025", "Jan 15, 2025"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbrev = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const textLower = text.toLowerCase();
  
  for (let i = 0; i < monthNames.length; i++) {
    // Try full month name
    const fullMonthPattern = new RegExp(`${monthNames[i]}\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i');
    const fullMatch = textLower.match(fullMonthPattern);
    if (fullMatch) {
      return new Date(parseInt(fullMatch[2]), i, parseInt(fullMatch[1]));
    }
    
    // Try abbreviated month
    const abbrevMonthPattern = new RegExp(`${monthAbbrev[i]}\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i');
    const abbrevMatch = textLower.match(abbrevMonthPattern);
    if (abbrevMatch) {
      return new Date(parseInt(abbrevMatch[2]), i, parseInt(abbrevMatch[1]));
    }
  }
  
  // Try parsing as-is
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return undefined;
}

/**
 * Extract General Liability coverage amount from OCR text
 */
function extractGeneralLiability(ocrText: string): { amount?: number; text?: string } {
  const lines = ocrText.split('\n');
  
  // Common GL indicators in ACORD-25 forms
  const glPatterns = [
    /GENERAL\s+LIABILITY/i,
    /COMMERCIAL\s+GENERAL\s+LIABILITY/i,
    /CGL/i,
    /GEN(?:ERAL)?\s+LIAB/i,
  ];
  
  // Look for GL section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains GL indicator
    if (glPatterns.some(pattern => pattern.test(line))) {
      // Look in current line and next few lines for "EACH OCCURRENCE" limit
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const searchLine = lines[j];
        
        if (/EACH\s+OCCURRENCE/i.test(searchLine)) {
          // Extract amount from this line or next line
          const amountMatch = searchLine.match(/\$?[\d,]+(?:\.\d{2})?/);
          if (amountMatch) {
            return {
              amount: parseAmount(amountMatch[0]),
              text: amountMatch[0],
            };
          }
          
          // Check next line if amount not on same line
          if (j + 1 < lines.length) {
            const nextLine = lines[j + 1];
            const nextAmountMatch = nextLine.match(/\$?[\d,]+(?:\.\d{2})?/);
            if (nextAmountMatch) {
              return {
                amount: parseAmount(nextAmountMatch[0]),
                text: nextAmountMatch[0],
              };
            }
          }
        }
      }
    }
  }
  
  return {};
}

/**
 * Extract Auto Liability coverage amount from OCR text
 */
function extractAutoLiability(ocrText: string): { amount?: number; text?: string } {
  const lines = ocrText.split('\n');
  
  // Common Auto Liability indicators in ACORD-25 forms
  const autoPatterns = [
    /AUTOMOBILE\s+LIABILITY/i,
    /AUTO\s+LIABILITY/i,
    /BUSINESS\s+AUTO/i,
    /COMMERCIAL\s+AUTO/i,
  ];
  
  // Look for Auto section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains Auto indicator
    if (autoPatterns.some(pattern => pattern.test(line))) {
      // Look in current line and next few lines for "COMBINED SINGLE LIMIT" or "EACH ACCIDENT"
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const searchLine = lines[j];
        
        if (/(COMBINED\s+SINGLE\s+LIMIT|EACH\s+ACCIDENT)/i.test(searchLine)) {
          // Extract amount from this line or next line
          const amountMatch = searchLine.match(/\$?[\d,]+(?:\.\d{2})?/);
          if (amountMatch) {
            return {
              amount: parseAmount(amountMatch[0]),
              text: amountMatch[0],
            };
          }
          
          // Check next line
          if (j + 1 < lines.length) {
            const nextLine = lines[j + 1];
            const nextAmountMatch = nextLine.match(/\$?[\d,]+(?:\.\d{2})?/);
            if (nextAmountMatch) {
              return {
                amount: parseAmount(nextAmountMatch[0]),
                text: nextAmountMatch[0],
              };
            }
          }
        }
      }
    }
  }
  
  return {};
}

/**
 * Check if Additional Insured endorsement is present
 * IMPORTANT: Must find explicit checkbox marker (X, ✓, etc.) near the label
 */
function extractAdditionalInsured(ocrText: string): boolean {
  const patterns = [
    /ADDITIONAL\s+INSURED/i,
    /ADD(?:'?L)?\s+INSURED/i,
    /ADDL\s+INS/i,
  ];
  
  // Split into lines to check each line
  const lines = ocrText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains the indicator
    if (patterns.some(pattern => pattern.test(line))) {
      // Look for explicit checkbox marker in same line or adjacent lines
      // Check current line
      if (/[X✓✔☑]/i.test(line)) {
        return true;
      }
      
      // Check line before
      if (i > 0 && /[X✓✔☑]/i.test(lines[i - 1])) {
        return true;
      }
      
      // Check line after
      if (i < lines.length - 1 && /[X✓✔☑]/i.test(lines[i + 1])) {
        return true;
      }
    }
  }
  
  // No explicit checkbox found - return false
  return false;
}

/**
 * Check if Waiver of Subrogation endorsement is present
 * IMPORTANT: Must find explicit checkbox marker (X, ✓, etc.) near the label
 */
function extractWaiverOfSubrogation(ocrText: string): boolean {
  const patterns = [
    /WAIVER\s+OF\s+SUBROGATION/i,
    /SUBR\s+WVD/i,
    /SUBROGATION\s+WAIVED/i,
    /WOS/i,
  ];
  
  // Split into lines to check each line
  const lines = ocrText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains the indicator
    if (patterns.some(pattern => pattern.test(line))) {
      // Look for explicit checkbox marker in same line or adjacent lines
      // Check current line
      if (/[X✓✔☑]/i.test(line)) {
        return true;
      }
      
      // Check line before
      if (i > 0 && /[X✓✔☑]/i.test(lines[i - 1])) {
        return true;
      }
      
      // Check line after
      if (i < lines.length - 1 && /[X✓✔☑]/i.test(lines[i + 1])) {
        return true;
      }
    }
  }
  
  // No explicit checkbox found - return false
  return false;
}

/**
 * Extract policy dates from OCR text
 */
function extractDates(ocrText: string): { effectiveDate?: Date; expiryDate?: Date; effectiveDateText?: string; expiryDateText?: string } {
  const lines = ocrText.split('\n');
  let effectiveDate: Date | undefined;
  let expiryDate: Date | undefined;
  let effectiveDateText: string | undefined;
  let expiryDateText: string | undefined;
  
  // Look for date patterns near "POLICY EFFECTIVE DATE" or "POLICY EFF"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Effective date
    if (/POLICY\s+EFF(?:ECTIVE)?(?:\s+DATE)?/i.test(line) || /EFF(?:ECTIVE)?\s+DATE/i.test(line)) {
      // Try numeric format first
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (dateMatch) {
        effectiveDateText = dateMatch[0];
        effectiveDate = parseDate(dateMatch[0]);
      } else {
        // Try parsing the whole line for spelled-out dates
        const parsed = parseDate(line);
        if (parsed) {
          effectiveDate = parsed;
          effectiveDateText = line.trim();
        } else if (i + 1 < lines.length) {
          // Check next line
          const nextLine = lines[i + 1];
          const nextDateMatch = nextLine.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
          if (nextDateMatch) {
            effectiveDateText = nextDateMatch[0];
            effectiveDate = parseDate(nextDateMatch[0]);
          } else {
            // Try parsing next line for spelled-out dates
            const nextParsed = parseDate(nextLine);
            if (nextParsed) {
              effectiveDate = nextParsed;
              effectiveDateText = nextLine.trim();
            }
          }
        }
      }
    }
    
    // Expiry date
    if (/POLICY\s+EXP(?:IRATION)?(?:\s+DATE)?/i.test(line) || /EXP(?:IRATION)?\s+DATE/i.test(line)) {
      // Try numeric format first
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (dateMatch) {
        expiryDateText = dateMatch[0];
        expiryDate = parseDate(dateMatch[0]);
      } else {
        // Try parsing the whole line for spelled-out dates
        const parsed = parseDate(line);
        if (parsed) {
          expiryDate = parsed;
          expiryDateText = line.trim();
        } else if (i + 1 < lines.length) {
          // Check next line
          const nextLine = lines[i + 1];
          const nextDateMatch = nextLine.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
          if (nextDateMatch) {
            expiryDateText = nextDateMatch[0];
            expiryDate = parseDate(nextDateMatch[0]);
          } else {
            // Try parsing next line for spelled-out dates
            const nextParsed = parseDate(nextLine);
            if (nextParsed) {
              expiryDate = nextParsed;
              expiryDateText = nextLine.trim();
            }
          }
        }
      }
    }
  }
  
  return { effectiveDate, expiryDate, effectiveDateText, expiryDateText };
}

/**
 * Main function: Parse ACORD-25 COI document from OCR text
 */
export function parseCOI(ocrText: string): ParsedCOIData {
  try {
    logger.info('Parsing COI document from OCR text');
    
    // Extract all fields
    const glData = extractGeneralLiability(ocrText);
    const autoData = extractAutoLiability(ocrText);
    const hasAdditionalInsured = extractAdditionalInsured(ocrText);
    const hasWaiverOfSubrogation = extractWaiverOfSubrogation(ocrText);
    const dates = extractDates(ocrText);
    
    const result: ParsedCOIData = {
      generalLiability: glData.amount,
      autoLiability: autoData.amount,
      hasAdditionalInsured,
      hasWaiverOfSubrogation,
      effectiveDate: dates.effectiveDate,
      expiryDate: dates.expiryDate,
      raw: {
        glText: glData.text,
        autoText: autoData.text,
        effectiveDateText: dates.effectiveDateText,
        expiryDateText: dates.expiryDateText,
      },
    };
    
    logger.info('COI parsing completed', {
      foundGL: !!result.generalLiability,
      foundAuto: !!result.autoLiability,
      hasAdditionalInsured: result.hasAdditionalInsured,
      hasWaiverOfSubrogation: result.hasWaiverOfSubrogation,
      hasEffectiveDate: !!result.effectiveDate,
      hasExpiryDate: !!result.expiryDate,
    });
    
    return result;
  } catch (error) {
    logger.error('Error parsing COI document', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Return minimal data on error
    return {
      hasAdditionalInsured: false,
      hasWaiverOfSubrogation: false,
      raw: {},
    };
  }
}

export const coiParser = {
  parseCOI,
};
