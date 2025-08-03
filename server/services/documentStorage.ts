import { Client } from '@replit/object-storage';
import * as fs from 'fs/promises';
import * as path from 'path';

export class DocumentStorageService {
  private client: Client | null = null;
  private initialized: boolean = false;
  private localStorageDir: string = './storage';

  private async initializeClient(): Promise<boolean> {
    if (this.initialized) {
      return this.client !== null;
    }

    try {
      // Only try to initialize if running in a deployed Replit environment
      if (process.env.REPL_ID && process.env.REPLIT_DEPLOYMENT) {
        this.client = new Client();
        this.initialized = true;
        return true;
      } else {
        console.log('Running in development mode - using simulated storage');
        this.initialized = true;
        return false;
      }
    } catch (error) {
      console.warn('Replit Object Storage not available, using local simulation:', error);
      this.initialized = true;
      return false;
    }
  }

  /**
   * Upload a document to Replit Object Storage
   * @param file - The file buffer to upload
   * @param storageKey - The unique key for storing the file (path/filename)
   * @param contentType - MIME type of the file
   * @returns Promise<string> - The storage key of the uploaded file
   */
  async uploadDocument(file: Buffer, storageKey: string, contentType: string): Promise<string> {
    try {
      const hasStorage = await this.initializeClient();
      
      if (hasStorage && this.client) {
        // Upload file to Replit Object Storage using uploadFromBytes
        const result = await this.client.uploadFromBytes(storageKey, file, {
          compress: true, // Enable compression to save storage costs
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.error.message}`);
        }
      } else {
        // Store locally for development/testing
        const localPath = path.join(this.localStorageDir, storageKey);
        const dirPath = path.dirname(localPath);
        
        // Ensure directory exists
        await fs.mkdir(dirPath, { recursive: true });
        
        // Write file to local storage
        await fs.writeFile(localPath, file);
        console.log(`Local storage: ${storageKey} (${file.length} bytes, ${contentType})`);
      }

      return storageKey;
    } catch (error) {
      console.error('Error uploading document to object storage:', error);
      throw new Error('Failed to upload document to storage');
    }
  }

  /**
   * Generate a secure upload link for vendors to upload documents directly
   * @param vendorId - The vendor ID
   * @param docType - The document type (W9 or COI)
   * @param filename - The original filename
   * @returns Promise<{uploadUrl: string, storageKey: string}> - Presigned upload URL and storage key
   */
  async generateUploadLink(vendorId: string, docType: string, filename: string): Promise<{uploadUrl: string, storageKey: string}> {
    try {
      const timestamp = Date.now();
      const storageKey = `uploads/${vendorId}/${docType}/${timestamp}-${filename}`;
      
      // Generate presigned URL for direct upload (if supported by Replit Object Storage)
      // For now, we'll return the storage key and let the upload happen through our API
      const uploadUrl = `/api/upload/${vendorId}`;
      
      return {
        uploadUrl,
        storageKey,
      };
    } catch (error) {
      console.error('Error generating upload link:', error);
      throw new Error('Failed to generate upload link');
    }
  }

  /**
   * Delete a document from storage
   * @param storageKey - The storage key of the file to delete
   * @returns Promise<void>
   */
  async deleteDocument(storageKey: string): Promise<void> {
    try {
      const hasStorage = await this.initializeClient();
      
      if (hasStorage && this.client) {
        const result = await this.client.delete(storageKey, { ignoreNotFound: true });
        if (!result.ok) {
          throw new Error(`Delete failed: ${result.error.message}`);
        }
      } else {
        console.log(`Simulated delete: ${storageKey}`);
      }
    } catch (error) {
      console.error('Error deleting document from storage:', error);
      throw new Error('Failed to delete document from storage');
    }
  }

  /**
   * Check if a document exists in storage
   * @param storageKey - The storage key to check
   * @returns Promise<boolean> - Whether the file exists
   */
  async documentExists(storageKey: string): Promise<boolean> {
    try {
      const hasStorage = await this.initializeClient();
      
      if (hasStorage && this.client) {
        const result = await this.client.exists(storageKey);
        if (!result.ok) {
          return false;
        }
        return result.value;
      } else {
        // Check local storage in development
        const localPath = path.join(this.localStorageDir, storageKey);
        try {
          await fs.access(localPath);
          return true;
        } catch {
          return false;
        }
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get document buffer for download
   * @param storageKey - The storage key of the document
   * @returns Promise<Buffer> - Document buffer
   */
  async downloadDocument(storageKey: string): Promise<Buffer> {
    try {
      const hasStorage = await this.initializeClient();
      
      if (hasStorage && this.client) {
        const result = await this.client.downloadAsBytes(storageKey);
        if (!result.ok) {
          throw new Error(`Failed to download document: ${result.error.message}`);
        }
        
        return result.value[0]; // downloadAsBytes returns [Buffer]
      } else {
        // Read from local storage for development/testing
        const localPath = path.join(this.localStorageDir, storageKey);
        
        try {
          const fileBuffer = await fs.readFile(localPath);
          console.log(`Local download: ${storageKey} (${fileBuffer.length} bytes)`);
          return fileBuffer;
        } catch (fsError: any) {
          if (fsError.code === 'ENOENT') {
            throw new Error(`Document not found in local storage: ${storageKey}`);
          }
          throw fsError;
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Failed to download document');
    }
  }

  /**
   * Get document public URL for download
   * @param storageKey - The storage key of the document
   * @returns string - Public download URL endpoint
   */
  getDocumentUrl(storageKey: string): string {
    // Return the API endpoint for downloading documents
    return `/api/documents/download/${encodeURIComponent(storageKey)}`;
  }

  /**
   * Generate a standardized storage key for documents
   * @param accountId - The account ID
   * @param vendorId - The vendor ID
   * @param docType - Document type (W9 or COI)
   * @param filename - Original filename
   * @returns string - Standardized storage key
   */
  generateStorageKey(accountId: string, vendorId: string, docType: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${accountId}/${vendorId}/${docType}/${timestamp}-${sanitizedFilename}`;
  }
}

// Create and export a singleton instance
export const documentStorageService = new DocumentStorageService();