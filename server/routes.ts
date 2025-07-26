import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { quickbooksService } from "./services/quickbooks";
import { emailService } from "./services/sendgrid";
import { smsService } from "./services/twilio";
import { stripeService } from "./services/stripe";
import { sseService, eventBus } from "./services/sse";
import { cronService } from "./services/cron";
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

  app.post('/api/qbo/callback', async (req, res) => {
    try {
      const { code, state: accountId } = req.body;
      
      if (!code || !accountId) {
        return res.status(400).json({ message: 'Missing code or account ID' });
      }

      const tokens = await quickbooksService.exchangeCodeForTokens(code, accountId);
      
      await storage.updateAccount(accountId, {
        qboCompanyId: tokens.companyId,
        qboAccessToken: tokens.accessToken,
        qboRefreshToken: tokens.refreshToken,
        qboTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
      });

      // Start initial sync
      setTimeout(async () => {
        try {
          await quickbooksService.syncVendors(accountId);
          await quickbooksService.syncBills(accountId);
          
          eventBus.emit('qbo.sync', { accountId, vendorCount: 0 });
        } catch (error) {
          console.error('Error in initial QBO sync:', error);
        }
      }, 1000);

      res.json({ success: true });
    } catch (error) {
      console.error("Error in QBO callback:", error);
      res.status(500).json({ message: "Failed to connect QuickBooks" });
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
        notes: z.string().optional(),
        isExempt: z.boolean().optional(),
      });

      const data = schema.parse(req.body);
      const vendor = await storage.updateVendor(id, data);
      
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  // Send reminder routes
  app.post('/api/vendors/:id/remind', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { type, channel } = req.body;
      
      const uploadLink = `${process.env.REPLIT_DOMAINS?.split(',')[0]}/upload/${id}`;
      
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

      // Here you would upload to Replit Object Storage
      // For now, we'll simulate it
      const storageKey = `${vendor.accountId}/${vendorId}/${Date.now()}-${file.originalname}`;
      const publicUrl = `https://storage.replit.com/${storageKey}`;

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

      // Update vendor status
      if (type === 'W9') {
        await storage.updateVendor(vendorId, { w9Status: 'RECEIVED' });
      } else if (type === 'COI') {
        // For COI, extract expiry date (would need OCR in production)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Assume 1 year validity
        
        await storage.updateVendor(vendorId, { 
          coiStatus: 'RECEIVED',
          coiExpiry: expiryDate,
        });
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
      const url = await stripeService.createPortalSession(userId);
      res.json({ url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
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
