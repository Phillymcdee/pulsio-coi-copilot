import Tesseract from 'tesseract.js';
import sharp from 'sharp';

// Dynamic import to avoid initialization issues
let pdfParseModule: any = null;

/**
 * OCR Service for extracting text and dates from COI documents
 * Supports PDF and image formats (PNG, JPEG)
 */
class OCRService {
  /**
   * Extract text from document buffer
   * @param fileBuffer - Document file buffer
   * @param mimeType - File MIME type
   * @returns Promise<string> - Extracted text
   */
  async extractTextFromDocument(fileBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(fileBuffer);
      } else if (mimeType.startsWith('image/')) {
        return await this.extractTextFromImage(fileBuffer);
      } else if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
        // For plain text files, just return the content as string
        return fileBuffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type for OCR: ${mimeType}`);
      }
    } catch (error) {
      console.error('Error extracting text from document:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   * @param pdfBuffer - PDF file buffer
   * @returns Promise<string> - Extracted text
   */
  private async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      // Lazy load pdf-parse to avoid initialization issues
      if (!pdfParseModule) {
        const pdfParse = await import('pdf-parse');
        pdfParseModule = pdfParse.default || pdfParse;
      }
      
      const data = await pdfParseModule(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      // If PDF text extraction fails, convert first page to image and use OCR
      return await this.fallbackPDFToImageOCR(pdfBuffer);
    }
  }

  /**
   * Extract text from image using Tesseract.js
   * @param imageBuffer - Image file buffer
   * @returns Promise<string> - Extracted text
   */
  private async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    try {
      // Optimize image for OCR
      const optimizedImage = await this.optimizeImageForOCR(imageBuffer);
      
      const { data: { text } } = await Tesseract.recognize(optimizedImage, 'eng', {
        logger: m => console.log('OCR Progress:', m)
      });
      
      return text;
    } catch (error) {
      console.error('Error with image OCR:', error);
      throw error;
    }
  }

  /**
   * Optimize image for better OCR results
   * @param imageBuffer - Original image buffer
   * @returns Promise<Buffer> - Optimized image buffer
   */
  private async optimizeImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .greyscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen for better text recognition
        .png() // Convert to PNG for better OCR
        .toBuffer();
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Return original if optimization fails
      return imageBuffer;
    }
  }

  /**
   * Fallback method: Convert PDF to image and use OCR
   * @param pdfBuffer - PDF file buffer
   * @returns Promise<string> - Extracted text
   */
  private async fallbackPDFToImageOCR(pdfBuffer: Buffer): Promise<string> {
    // For now, return empty string - would need pdf2pic or similar for full implementation
    console.warn('PDF to image conversion not implemented - returning empty text');
    return '';
  }

  /**
   * Extract COI expiry date from document text
   * @param documentText - Text extracted from COI document
   * @returns Date | null - Parsed expiry date or null if not found
   */
  extractCOIExpiryDate(documentText: string): Date | null {
    try {
      // Common COI expiry date patterns
      const patterns = [
        // MM/DD/YYYY or MM-DD-YYYY
        /(?:expir[es]*|expires?|exp\.?|policy period|coverage period|effective)[\s\S]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
        
        // YYYY-MM-DD
        /(?:expir[es]*|expires?|exp\.?|policy period|coverage period|effective)[\s\S]*?(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/gi,
        
        // Written dates like "December 31, 2025"
        /(?:expir[es]*|expires?|exp\.?|policy period|coverage period|effective)[\s\S]*?((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})/gi,
        
        // "TO" date patterns in policy periods
        /(?:policy period|coverage period|effective)[\s\S]*?to[\s\S]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
        
        // Expiration table patterns
        /expiration[\s\S]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
        
        // ACORD 25 table patterns - two dates side by side (effective and expiry)
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
        
        // General liability/auto liability specific ACORD patterns
        /(?:general liability|automobile liability|workers compensation)[\s\S]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
        
        // Policy EXP column patterns
        /policy\s+exp[\s\S]*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/gi,
      ];

      const dates: Date[] = [];

      // Try each pattern
      for (const pattern of patterns) {
        const matches = Array.from(documentText.matchAll(pattern));
        for (const match of matches) {
          // Handle patterns with multiple date groups (ACORD table format)
          if (match.length > 2) {
            // For ACORD format: effective date (match[1]) and expiry date (match[2])
            // We want the expiry date (second date)
            const expiryDateStr = match[2];
            const parsedDate = this.parseDate(expiryDateStr);
            if (parsedDate && this.isValidCOIDate(parsedDate)) {
              dates.push(parsedDate);
            }
          } else {
            // Standard single date patterns
            const dateStr = match[1];
            const parsedDate = this.parseDate(dateStr);
            if (parsedDate && this.isValidCOIDate(parsedDate)) {
              dates.push(parsedDate);
            }
          }
        }
      }

      if (dates.length === 0) {
        console.warn('No expiry date found in COI document');
        return null;
      }

      // Return the latest date (most likely to be expiry)
      return new Date(Math.max(...dates.map(d => d.getTime())));

    } catch (error) {
      console.error('Error extracting COI expiry date:', error);
      return null;
    }
  }

  /**
   * Parse date string into Date object
   * @param dateStr - Date string to parse
   * @returns Date | null - Parsed date or null if invalid
   */
  private parseDate(dateStr: string): Date | null {
    try {
      // Clean up the date string
      const cleanDateStr = dateStr.trim().replace(/[^\w\s\/\-,]/g, '');
      
      // Try parsing with different methods
      const parsedDate = new Date(cleanDateStr);
      
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      
      return parsedDate;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate if date is reasonable for a COI expiry
   * @param date - Date to validate
   * @returns boolean - True if date seems valid for COI
   */
  private isValidCOIDate(date: Date): boolean {
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const fiveYearsFromNow = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
    
    // COI dates should be:
    // - Not in the past (more than 30 days ago)
    // - Not more than 5 years in the future
    // - Typically within 1-3 years from now
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    return date >= thirtyDaysAgo && date <= fiveYearsFromNow;
  }

  /**
   * Extract COI information including expiry date from document
   * @param fileBuffer - Document file buffer
   * @param mimeType - File MIME type
   * @returns Promise<{expiryDate: Date | null, extractedText: string}> - COI information
   */
  async extractCOIInformation(fileBuffer: Buffer, mimeType: string): Promise<{
    expiryDate: Date | null;
    extractedText: string;
  }> {
    try {
      console.log(`Starting OCR extraction for ${mimeType} document`);
      
      const extractedText = await this.extractTextFromDocument(fileBuffer, mimeType);
      console.log('Text extraction completed, length:', extractedText.length);
      
      const expiryDate = this.extractCOIExpiryDate(extractedText);
      
      if (expiryDate) {
        console.log('COI expiry date found:', expiryDate.toISOString());
      } else {
        console.warn('No valid expiry date found in COI document');
      }
      
      return {
        expiryDate,
        extractedText,
      };
      
    } catch (error) {
      console.error('Error extracting COI information:', error);
      return {
        expiryDate: null,
        extractedText: '',
      };
    }
  }
}

// Create and export singleton instance
export const ocrService = new OCRService();