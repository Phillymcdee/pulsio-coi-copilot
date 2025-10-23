import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { quickbooksService } from "./services/quickbooks";
import { jobberService } from "./services/jobber";
import { emailService, sendEmail } from "./services/sendgrid";
import { smsService } from "./services/twilio";
import { stripeService } from "./services/stripe";
import { sseService, eventBus } from "./services/sse";
import { cronService } from "./services/cron";
import { documentStorageService } from "./services/documentStorage";
import { ocrService } from "./services/ocr";
import { logger } from "./services/logger";
import multer from 'multer';
import { z } from 'zod';

// Set up multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // SSE endpoint for real-time updates
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const account = await storage.getAccountByUserId(userId);
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    sseService.addClient(account.id, res);
  });

  // Account routes
  app.get('/api/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.post('/api/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        companyName: z.string().min(1),
        reminderCadence: z.string().optional(),
        emailTemplate: z.string().optional(),
        smsTemplate: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const account = await storage.createAccount({
        userId,
        ...data,
      });
      
      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.patch('/api/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const schema = z.object({
        companyName: z.string().optional(),
        reminderCadence: z.string().optional(),
        emailTemplate: z.string().optional(),
        smsTemplate: z.string().optional(),
        isOnboardingComplete: z.boolean().optional(),
      });

      const data = schema.parse(req.body);
      const updatedAccount = await storage.updateAccount(account.id, data);
      
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  // QuickBooks OAuth routes
  app.get('/api/qbo/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const authUrl = await quickbooksService.getAuthUrl(account.id);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error getting QBO auth URL:", error);
      res.status(500).json({ message: "Failed to get auth URL" });
    }
  });

  app.get('/api/qbo/callback', async (req, res) => {
    try {
      const { code, state: accountId, realmId } = req.query;
      
      if (!code || !accountId || !realmId) {
        return res.status(400).json({ message: 'Missing code, account ID, or realm ID' });
      }

      const tokens = await quickbooksService.exchangeCodeForTokens(code as string, realmId as string);
      
      await storage.updateAccount(accountId as string, {
        qboCompanyId: tokens.companyId,
        qboAccessToken: tokens.accessToken,
        qboRefreshToken: tokens.refreshToken,
        qboTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
      });

      // Start initial sync
      setTimeout(async () => {
        try {
          console.log(`Starting initial QuickBooks sync for account: ${accountId}`);
          await quickbooksService.syncTerms(accountId as string);
          await quickbooksService.syncVendors(accountId as string);
          await quickbooksService.syncBills(accountId as string);
          
          // Get vendor count for event
          const vendors = await storage.getVendorsByAccountId(accountId as string);
          eventBus.emit('qbo.sync', { accountId, vendorCount: vendors.length });
          
          console.log('Initial QuickBooks sync completed successfully');
        } catch (error) {
          console.error('Error in initial QBO sync:', error);
        }
      }, 1000);

          // Redirect to success page
      res.redirect(`https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/onboarding?qbo=success`);
    } catch (error) {
      console.error("Error in QBO callback:", error);
      res.status(500).json({ message: "Failed to connect QuickBooks" });
    }
  });

  // Jobber OAuth routes
  app.get('/api/jobber/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const authUrl = jobberService.getAuthUrl(account.id);
      res.json({ authUrl });
    } catch (error) {
      logger.error("Error getting Jobber auth URL", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Failed to get auth URL" });
    }
  });

  app.get('/api/jobber/callback', async (req, res) => {
    try {
      const { code, state: accountId } = req.query;
      
      if (!code || !accountId) {
        return res.status(400).json({ message: 'Missing code or account ID' });
      }

      const tokens = await jobberService.exchangeCodeForTokens(code as string);
      
      // Store tokens in database
      await storage.updateAccount(accountId as string, {
        jobberAccountId: tokens.accountId,
        jobberAccessToken: tokens.accessToken,
        jobberRefreshToken: tokens.refreshToken,
        jobberTokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
      } as any);

      // Set default COI rules on first connect
      const account = await storage.getAccount(accountId as string);
      if (!account?.coiRules) {
        await storage.updateAccount(accountId as string, {
          coiRules: {
            minGL: 2000000, // $2M minimum General Liability
            minAuto: 1000000, // $1M minimum Auto Liability
            requireAdditionalInsured: true,
            requireWaiver: false,
            expiryWarningDays: [30, 14, 7],
          },
        } as any);
      }

      // Start initial sync in background
      setTimeout(async () => {
        try {
          logger.info(`Starting initial Jobber client sync for account: ${accountId}`);
          await jobberService.syncClients(accountId as string);
          
          // Get vendor count for event
          const vendors = await storage.getVendorsByAccountId(accountId as string);
          eventBus.emit('jobber.sync', { accountId, vendorCount: vendors.length });
          
          logger.info('Initial Jobber sync completed successfully');
        } catch (error) {
          logger.error('Error in initial Jobber sync', { error: error instanceof Error ? error.message : String(error) });
        }
      }, 1000);

      // Redirect to success page
      res.redirect(`https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/onboarding?jobber=success`);
    } catch (error) {
      logger.error("Error in Jobber callback", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Failed to connect Jobber" });
    }
  });

  // Manual Jobber sync endpoint
  app.post('/api/jobber/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      if (!account.jobberAccessToken || !account.jobberAccountId) {
        return res.status(400).json({ message: 'Jobber not connected' });
      }

      logger.info(`Manual sync requested for account: ${account.companyName}`);
      
      // Run sync
      await jobberService.syncClients(account.id);
      
      // Get updated count
      const vendors = await storage.getVendorsByAccountId(account.id);
      
      // Emit SSE event
      eventBus.emit('jobber.sync', { 
        accountId: account.id, 
        vendorCount: vendors.length 
      });
      
      res.json({ 
        message: 'Sync completed successfully',
        vendorCount: vendors.length,
        details: 'Jobber clients synced successfully'
      });
    } catch (error) {
      logger.error("Error in manual Jobber sync", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ message: "Failed to sync Jobber data" });
    }
  });

  // Vendor routes
  app.get('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const vendors = await storage.getVendorsByAccountId(account.id);
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.post('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const vendor = await storage.createVendor({
        accountId: account.id,
        qboId: null, // Manual vendors don't have QuickBooks ID
        ...data,
        w9Status: 'MISSING',
        coiStatus: 'MISSING',
      });

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'vendor_added',
        title: `New vendor added: ${vendor.name}`,
        description: `Vendor added manually by user`,
      });
      
      res.json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  // Public vendor info route for upload portal (no auth required)
  app.get('/api/vendors/:id/public', async (req, res) => {
    try {
      const { id } = req.params;
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Return only public info needed for upload portal
      res.json({
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        companyName: vendor.name, // Use vendor name as company name for now
        w9Status: vendor.w9Status,
        coiStatus: vendor.coiStatus,
      });
    } catch (error) {
      console.error("Error fetching vendor for upload:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  // Bills routes
  app.get('/api/bills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const bills = await storage.getBillsWithDiscountInfo(account.id);
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  // Get documents for a vendor (authenticated route)
  app.get('/api/vendors/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Verify vendor belongs to the user's account
      const vendor = await storage.getVendor(id);
      if (!vendor || vendor.accountId !== account.id) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const documents = await storage.getDocumentsByVendorId(id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching vendor documents:", error);
      res.status(500).json({ message: "Failed to fetch vendor documents" });
    }
  });

  app.get('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Get related data
      const documents = await storage.getDocumentsByVendorId(id);
      const reminders = await storage.getRemindersByVendorId(id);
      const bills = await storage.getBillsByVendorId(id);

      res.json({
        ...vendor,
        documents,
        reminders,
        bills,
      });
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.patch('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const schema = z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().or(z.literal('')).nullable().optional(),
        phone: z.string().nullable().optional(),
        notes: z.string().optional(),
        isExempt: z.boolean().optional(),
      });

      const data = schema.parse(req.body);
      
      // Get current vendor to compare against QB source data
      const currentVendor = await storage.getVendor(id);
      if (!currentVendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      // Set override flags only when user edits differ from QB source data
      const updateData: any = { ...data };
      if (data.name !== undefined && currentVendor.qboId) {
        updateData.nameOverride = data.name !== currentVendor.qboName;
      }
      if (data.email !== undefined && currentVendor.qboId) {
        updateData.emailOverride = data.email !== currentVendor.qboEmail;
      }
      if (data.phone !== undefined && currentVendor.qboId) {
        updateData.phoneOverride = data.phone !== currentVendor.qboPhone;
      }
      
      const vendor = await storage.updateVendor(id, updateData);
      
      // Create timeline event if basic info was updated
      if (data.name || data.email || data.phone) {
        const account = await storage.getAccountByUserId(req.user.claims.sub);
        if (account) {
          await storage.createTimelineEvent({
            accountId: account.id,
            vendorId: vendor.id,
            eventType: 'vendor_updated',
            title: `Vendor updated: ${vendor.name}`,
            description: `User manually updated vendor information (will override QB sync)`,
          });
        }
      }
      
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  // Revert vendor fields to QuickBooks data
  app.post('/api/vendors/:id/revert', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { fields } = req.body; // Array of fields to revert: ['name', 'email', 'phone']
      
      const vendor = await storage.getVendor(id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      if (!vendor.qboId) {
        return res.status(400).json({ message: 'Vendor is not synced from QuickBooks' });
      }
      
      const updateData: any = {};
      
      // Revert specified fields to QuickBooks data
      if (fields.includes('name') && vendor.qboName) {
        updateData.name = vendor.qboName;
        updateData.nameOverride = false;
      }
      if (fields.includes('email') && vendor.qboEmail) {
        updateData.email = vendor.qboEmail;
        updateData.emailOverride = false;
      }
      if (fields.includes('phone') && vendor.qboPhone) {
        updateData.phone = vendor.qboPhone;
        updateData.phoneOverride = false;
      }
      
      const updatedVendor = await storage.updateVendor(id, updateData);
      
      // Create timeline event
      const account = await storage.getAccountByUserId(req.user.claims.sub);
      if (account) {
        await storage.createTimelineEvent({
          accountId: account.id,
          vendorId: vendor.id,
          eventType: 'vendor_reverted',
          title: `Vendor data reverted: ${vendor.name}`,
          description: `Reverted ${fields.join(', ')} to QuickBooks data`,
        });
      }
      
      res.json(updatedVendor);
    } catch (error) {
      console.error("Error reverting vendor:", error);
      res.status(500).json({ message: "Failed to revert vendor data" });
    }
  });

  // Manual QuickBooks sync endpoint for testing
  app.post('/api/qbo/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      if (!account.qboAccessToken || !account.qboCompanyId) {
        return res.status(400).json({ message: 'QuickBooks not connected' });
      }

      console.log(`Manual sync requested for account: ${account.companyName}`);
      
      // Run sync with enhanced functionality
      await quickbooksService.syncTerms(account.id);
      await quickbooksService.syncVendors(account.id);
      await quickbooksService.syncBills(account.id);
      
      // Get updated counts
      const vendors = await storage.getVendorsByAccountId(account.id);
      const terms = await storage.getTermsByAccountId(account.id);
      
      // Emit SSE event
      eventBus.emit('qbo.sync', { 
        accountId: account.id, 
        vendorCount: vendors.length 
      });
      
      res.json({ 
        message: 'Sync completed successfully',
        vendorCount: vendors.length,
        termsCount: terms.length,
        details: 'Payment terms, vendors, and bills synced with enhanced discount calculations'
      });
    } catch (error) {
      console.error("Error in manual QBO sync:", error);
      res.status(500).json({ message: "Failed to sync QuickBooks data" });
    }
  });

  // Test email endpoint for SendGrid verification
  app.post('/api/test-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: 'User email not found' });
      }

      const testEmail = {
        to: user.email,
        from: process.env.FROM_EMAIL || 'noreply@pulsio.app',
        subject: 'Pulsio Email Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">SendGrid Configuration Test</h2>
            <p>Hello ${user.firstName || 'there'},</p>
            <p>This is a test email to verify that your SendGrid configuration is working correctly.</p>
            <p>✅ If you're reading this, your email system is properly configured!</p>
            <p>Best regards,<br>The Pulsio Team</p>
          </div>
        `,
        text: `SendGrid Configuration Test\n\nHello ${user.firstName || 'there'},\n\nThis is a test email to verify that your SendGrid configuration is working correctly.\n\n✅ If you're reading this, your email system is properly configured!\n\nBest regards,\nThe Pulsio Team`
      };

      const success = await sendEmail(testEmail);
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Test email sent successfully to ${user.email}`,
          emailSent: user.email
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send test email' 
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error sending test email',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Send reminder routes
  app.post('/api/vendors/:id/remind', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { type, channel } = req.body;
      
      const uploadLink = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/upload/${id}`;
      
      let success = false;
      
      if (channel === 'email') {
        if (type === 'W9') {
          success = await emailService.sendW9Reminder(id, uploadLink);
        } else if (type === 'COI') {
          success = await emailService.sendCOIReminder(id, uploadLink);
        }
      } else if (channel === 'sms') {
        if (type === 'W9') {
          success = await smsService.sendW9ReminderSMS(id, uploadLink);
        } else if (type === 'COI') {
          success = await smsService.sendCOIReminderSMS(id, uploadLink);
        }
      }

      if (success) {
        // Get vendor info for SSE event
        const vendor = await storage.getVendor(id);
        if (vendor) {
          // Emit SSE event for reminder sent
          eventBus.emit('reminder.sent', {
            accountId: vendor.accountId,
            vendorName: vendor.name,
            docType: type,
            channel,
          });
        }
        
        res.json({ success: true, message: 'Reminder sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send reminder' });
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  // Document upload route
  app.post('/api/upload/:vendorId', upload.single('document'), async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { type } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      if (!['W9', 'COI'].includes(type)) {
        return res.status(400).json({ message: 'Invalid document type' });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Upload to Replit Object Storage
      const storageKey = documentStorageService.generateStorageKey(
        vendor.accountId,
        vendorId,
        type,
        file.originalname
      );
      
      await documentStorageService.uploadDocument(file.buffer, storageKey, file.mimetype);
      const publicUrl = documentStorageService.getDocumentUrl(storageKey);

      // Create document record
      const document = await storage.createDocument({
        vendorId,
        accountId: vendor.accountId,
        type: type as 'W9' | 'COI',
        filename: file.originalname,
        storageKey,
        url: publicUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Update vendor status and extract expiry date for COI
      if (type === 'W9') {
        await storage.updateVendor(vendorId, { w9Status: 'RECEIVED' });
        
        // Check if we can now capture early payment discounts
        const capturedAmount = await quickbooksService.captureEarlyPaymentDiscounts(vendorId);
        if (capturedAmount > 0) {
          eventBus.emit('discount.captured', {
            accountId: vendor.accountId,
            vendorName: vendor.name,
            amount: capturedAmount,
          });
        }
      } else if (type === 'COI') {
        // Extract actual expiry date from COI document using OCR
        const { expiryDate: extractedDate, extractedText } = await ocrService.extractCOIInformation(file.buffer, file.mimetype);
        
        // Use extracted date or fall back to 1 year from now
        const expiryDate = extractedDate || (() => {
          const fallbackDate = new Date();
          fallbackDate.setFullYear(fallbackDate.getFullYear() + 1);
          console.warn(`No expiry date found in COI for ${vendor.name}, using 1-year fallback`);
          return fallbackDate;
        })();
        
        // Update document record with extracted text
        await storage.updateDocument(document.id, { 
          extractedText: extractedText || null,
          expiresAt: expiryDate 
        });
        
        await storage.updateVendor(vendorId, { 
          coiStatus: 'RECEIVED',
          coiExpiry: expiryDate,
        });

        // Check if we can now capture early payment discounts
        const capturedAmount = await quickbooksService.captureEarlyPaymentDiscounts(vendorId);
        if (capturedAmount > 0) {
          eventBus.emit('discount.captured', {
            accountId: vendor.accountId,
            vendorName: vendor.name,
            amount: capturedAmount,
          });
        }

        // Log the result for monitoring
        if (extractedDate) {
          console.log(`COI expiry date extracted for ${vendor.name}: ${expiryDate.toISOString()}`);
        } else {
          console.log(`COI uploaded for ${vendor.name} - using fallback expiry date: ${expiryDate.toISOString()}`);
        }
      }

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: vendor.accountId,
        vendorId,
        eventType: 'doc_received',
        title: `${vendor.name} uploaded ${type}`,
        description: `${type} document received`,
      });

      // Send SSE event
      eventBus.emit('doc.received', {
        accountId: vendor.accountId,
        vendorName: vendor.name,
        docType: type,
      });

      res.json({ success: true, document });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Document download route
  app.get('/api/documents/download/:storageKey', async (req, res) => {
    try {
      const { storageKey } = req.params;
      const decodedStorageKey = decodeURIComponent(storageKey);

      // Get document info from database
      const document = await storage.getDocumentByStorageKey(decodedStorageKey);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Download document from storage
      const fileBuffer = await documentStorageService.downloadDocument(decodedStorageKey);

      // Set appropriate headers
      res.set({
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      });

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Dashboard stats route
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const stats = await storage.getDashboardStats(account.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Timeline events route
  app.get('/api/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const events = await storage.getTimelineEventsByAccountId(account.id);
      res.json(events);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId } = req.body;
      
      const result = await stripeService.createSubscription(userId, priceId);
      res.json(result);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/create-portal-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      logger.info('Creating Stripe portal session for user', { userId });
      
      const url = await stripeService.createPortalSession(userId);
      
      logger.info('Stripe portal session created successfully', { 
        userId, 
        portalUrl: url.substring(0, 50) + '...' 
      });
      
      res.json({ url });
    } catch (error) {
      logger.error('Error creating portal session', { 
        userId: req.user?.claims?.sub, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      res.status(500).json({ 
        message: "Failed to create portal session",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/pricing', async (req, res) => {
    try {
      const pricing = await stripeService.getPricing();
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  // Stripe webhook
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      await stripeService.handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: "Webhook failed" });
    }
  });

  // Manual sync trigger
  app.post('/api/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Trigger sync
      setTimeout(async () => {
        try {
          await quickbooksService.syncVendors(userId);
          await quickbooksService.syncBills(userId);
        } catch (error) {
          console.error('Error in manual sync:', error);
        }
      }, 100);

      res.json({ success: true, message: 'Sync started' });
    } catch (error) {
      console.error("Error starting sync:", error);
      res.status(500).json({ message: "Failed to start sync" });
    }
  });

  // OCR Debug endpoint - View extracted text from documents
  app.get('/api/debug/ocr/:documentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      const { documentId } = req.params;
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      const document = await storage.getDocumentById(documentId);
      if (!document || document.accountId !== account.id) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({
        document: {
          id: document.id,
          type: document.type,
          filename: document.filename,
          uploadedAt: document.uploadedAt,
          expiresAt: document.expiresAt,
          extractedText: document.extractedText,
        },
        vendor: await storage.getVendor(document.vendorId),
      });
    } catch (error) {
      console.error("Error fetching OCR debug data:", error);
      res.status(500).json({ message: "Failed to fetch OCR debug data" });
    }
  });

  // Send test reminders
  app.post('/api/test-reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const account = await storage.getAccountByUserId(userId);
      
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Send reminders for this account
      await cronService.sendRemindersForAccount(account.id);
      
      res.json({ success: true, message: 'Test reminders sent' });
    } catch (error) {
      console.error("Error sending test reminders:", error);
      res.status(500).json({ message: "Failed to send test reminders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
