/**
 * COI Rules Evaluation Service
 * Evaluates parsed COI data against account compliance rules
 */

import { logger } from "./logger";
import type { ParsedCOIData } from "./coiParser";

export interface COIRules {
  minGL?: number; // Minimum General Liability coverage in dollars
  minAuto?: number; // Minimum Auto Liability coverage in dollars
  requireAdditionalInsured?: boolean; // Require Additional Insured endorsement
  requireWaiver?: boolean; // Require Waiver of Subrogation
  expiryWarningDays?: number[]; // Days before expiry to send reminders (e.g., [30, 14, 7])
}

export interface ComplianceViolation {
  field: string; // Which field failed (e.g., 'generalLiability', 'additionalInsured')
  message: string; // Human-readable violation message
  severity: 'critical' | 'warning'; // Severity level
  required?: any; // What was required
  actual?: any; // What was found
}

/**
 * Evaluate parsed COI data against account compliance rules
 * @param parsedData - Parsed COI data from coiParser
 * @param rules - Account compliance rules
 * @returns Array of violations (empty if compliant)
 */
export function evaluateCompliance(
  parsedData: ParsedCOIData,
  rules: COIRules
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  
  try {
    logger.info('Evaluating COI compliance', { rules });
    
    // Check General Liability coverage
    if (rules.minGL && rules.minGL > 0) {
      if (!parsedData.generalLiability) {
        violations.push({
          field: 'generalLiability',
          message: `General Liability coverage not found. Required: ${formatCurrency(rules.minGL)}`,
          severity: 'critical',
          required: rules.minGL,
          actual: null,
        });
      } else if (parsedData.generalLiability < rules.minGL) {
        violations.push({
          field: 'generalLiability',
          message: `General Liability ${formatCurrency(parsedData.generalLiability)} is below required minimum of ${formatCurrency(rules.minGL)}`,
          severity: 'critical',
          required: rules.minGL,
          actual: parsedData.generalLiability,
        });
      }
    }
    
    // Check Auto Liability coverage
    if (rules.minAuto && rules.minAuto > 0) {
      if (!parsedData.autoLiability) {
        violations.push({
          field: 'autoLiability',
          message: `Auto Liability coverage not found. Required: ${formatCurrency(rules.minAuto)}`,
          severity: 'critical',
          required: rules.minAuto,
          actual: null,
        });
      } else if (parsedData.autoLiability < rules.minAuto) {
        violations.push({
          field: 'autoLiability',
          message: `Auto Liability ${formatCurrency(parsedData.autoLiability)} is below required minimum of ${formatCurrency(rules.minAuto)}`,
          severity: 'critical',
          required: rules.minAuto,
          actual: parsedData.autoLiability,
        });
      }
    }
    
    // Check Additional Insured endorsement
    if (rules.requireAdditionalInsured === true) {
      if (!parsedData.hasAdditionalInsured) {
        violations.push({
          field: 'additionalInsured',
          message: 'Additional Insured endorsement is required but not found on certificate',
          severity: 'critical',
          required: true,
          actual: false,
        });
      }
    }
    
    // Check Waiver of Subrogation
    if (rules.requireWaiver === true) {
      if (!parsedData.hasWaiverOfSubrogation) {
        violations.push({
          field: 'waiverOfSubrogation',
          message: 'Waiver of Subrogation is required but not found on certificate',
          severity: 'critical',
          required: true,
          actual: false,
        });
      }
    }
    
    // Check expiry date (warning if expiring soon or already expired)
    if (parsedData.expiryDate) {
      const daysUntilExpiry = Math.ceil(
        (parsedData.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry < 0) {
        violations.push({
          field: 'expiryDate',
          message: `Certificate expired ${Math.abs(daysUntilExpiry)} days ago`,
          severity: 'critical',
          required: 'Valid certificate',
          actual: `Expired ${parsedData.expiryDate.toLocaleDateString()}`,
        });
      } else {
        // Use configured expiryWarningDays (default to [30] if not set)
        const warningDays = rules.expiryWarningDays && rules.expiryWarningDays.length > 0 
          ? rules.expiryWarningDays 
          : [30];
        const maxWarningDays = Math.max(...warningDays);
        
        if (daysUntilExpiry <= maxWarningDays) {
          violations.push({
            field: 'expiryDate',
            message: `Certificate expires in ${daysUntilExpiry} days on ${parsedData.expiryDate.toLocaleDateString()}`,
            severity: 'warning',
            required: 'Valid certificate',
            actual: `Expires ${parsedData.expiryDate.toLocaleDateString()}`,
          });
        }
      }
    } else {
      // No expiry date found - warning
      violations.push({
        field: 'expiryDate',
        message: 'Certificate expiry date not found',
        severity: 'warning',
        required: 'Valid expiry date',
        actual: null,
      });
    }
    
    // Check effective date (must be in the past or today)
    if (parsedData.effectiveDate) {
      const daysUntilEffective = Math.ceil(
        (parsedData.effectiveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilEffective > 0) {
        violations.push({
          field: 'effectiveDate',
          message: `Certificate not yet effective (starts in ${daysUntilEffective} days on ${parsedData.effectiveDate.toLocaleDateString()})`,
          severity: 'warning',
          required: 'Current effective date',
          actual: `Effective ${parsedData.effectiveDate.toLocaleDateString()}`,
        });
      }
    } else {
      // No effective date - warning
      violations.push({
        field: 'effectiveDate',
        message: 'Certificate effective date not found',
        severity: 'warning',
        required: 'Valid effective date',
        actual: null,
      });
    }
    
    logger.info('COI compliance evaluation completed', {
      violationCount: violations.length,
      criticalCount: violations.filter(v => v.severity === 'critical').length,
      warningCount: violations.filter(v => v.severity === 'warning').length,
    });
    
    return violations;
  } catch (error) {
    logger.error('Error evaluating COI compliance', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Return a generic error violation
    return [{
      field: 'system',
      message: 'Error evaluating compliance rules',
      severity: 'critical',
    }];
  }
}

/**
 * Format currency value for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return `$${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M`;
  } else if (amount >= 1000) {
    const thousands = amount / 1000;
    return `$${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)}K`;
  } else {
    return `$${amount.toFixed(0)}`;
  }
}

/**
 * Check if COI is compliant (no critical violations)
 * @param violations - Array of violations from evaluateCompliance
 * @returns True if compliant (no critical violations)
 */
export function isCompliant(violations: ComplianceViolation[]): boolean {
  return !violations.some(v => v.severity === 'critical');
}

/**
 * Get compliance status string
 * @param violations - Array of violations from evaluateCompliance
 * @returns Status string: 'COMPLIANT', 'EXPIRING', 'NON_COMPLIANT'
 */
export function getComplianceStatus(violations: ComplianceViolation[]): 'COMPLIANT' | 'EXPIRING' | 'NON_COMPLIANT' {
  const hasCritical = violations.some(v => v.severity === 'critical');
  const hasWarnings = violations.some(v => v.severity === 'warning');
  
  if (hasCritical) {
    return 'NON_COMPLIANT';
  } else if (hasWarnings) {
    return 'EXPIRING';
  } else {
    return 'COMPLIANT';
  }
}

/**
 * Calculate days until next reminder should be sent
 * @param expiryDate - COI expiry date
 * @param warningDays - Array of days before expiry to send reminders (e.g., [30, 14, 7])
 * @returns Days until next reminder, or null if no reminder needed
 */
export function getNextReminderDays(expiryDate: Date, warningDays: number[]): number | null {
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry < 0) {
    return null; // Already expired
  }
  
  // Sort warning days in descending order
  const sortedWarningDays = [...warningDays].sort((a, b) => b - a);
  
  // Find the next warning day that matches
  for (const warningDay of sortedWarningDays) {
    if (daysUntilExpiry >= warningDay) {
      return warningDay;
    }
  }
  
  return null;
}
