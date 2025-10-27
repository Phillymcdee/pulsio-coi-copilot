import crypto from 'crypto';
import { storage } from '../storage';
import { logger } from '../services/logger';
import { jobberService } from '../services/jobber';
import { emailService } from '../services/sendgrid';
import { smsService } from '../services/twilio';
import { eventBus } from '../services/sse';

/**
 * Jobber Webhook Handler
 * Processes webhook events from Jobber with HMAC signature verification
 */

interface JobberWebhookPayload {
  data: {
    webHookEvent: {
      topic: string;
      appId: string;
      accountId: string;
      itemId: string;
      occurredAt: string;
    };
  };
}

/**
 * Verify Jobber webhook HMAC signature
 * @param payload - Raw request body as string
 * @param signature - HMAC signature from X-Jobber-Hmac-SHA256 header
 * @returns True if signature is valid
 */
export function verifyJobberWebhook(payload: string, signature: string): boolean {
  try {
    const secret = process.env.JOBBER_WEBHOOK_SECRET || '';
    if (!secret) {
      logger.error('Jobber webhook secret not configured for webhook verification');
      return false;
    }

    // Calculate HMAC digest
    const digest = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest();
    
    // Base64 encode the digest
    const calculatedSignature = digest.toString('base64');
    
    // Use constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const calcBuffer = Buffer.from(calculatedSignature);
    
    if (sigBuffer.length !== calcBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(sigBuffer, calcBuffer);
  } catch (error) {
    logger.error('Error verifying Jobber webhook signature', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return false;
  }
}

/**
 * Handle CLIENT_CREATE webhook
 * Triggered when a new client is created in Jobber
 */
async function handleClientCreate(accountId: string, itemId: string): Promise<void> {
  try {
    logger.info(`Processing CLIENT_CREATE webhook for account ${accountId}, client ${itemId}`);
    
    // Find the app account that corresponds to this Jobber account
    const accounts = await storage.getAllAccounts();
    const account = accounts.find(a => a.jobberAccountId === accountId);
    
    if (!account) {
      logger.warn(`No account found for Jobber account ID: ${accountId}`);
      return;
    }

    // Fetch the client details from Jobber
    const client = await jobberService.fetchClient(account.id, itemId);
    
    if (!client) {
      logger.error(`Failed to fetch client ${itemId} from Jobber`);
      return;
    }

    // Get primary email and phone
    const primaryEmail = client.emails?.find((e: any) => e.primary)?.address || client.emails?.[0]?.address;
    const primaryPhone = client.phones?.find((p: any) => p.primary)?.number || client.phones?.[0]?.number;
    const name = client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim();

    // Check if vendor already exists
    const existingVendor = await storage.getVendorByJobberId(account.id, itemId);
    
    if (!existingVendor) {
      // Create new vendor
      const vendor = await storage.createVendor({
        accountId: account.id,
        jobberId: itemId,
        name,
        email: primaryEmail,
        phone: primaryPhone,
        w9Status: 'MISSING',
        coiStatus: 'MISSING',
      });

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'vendor_created',
        title: `New client synced from Jobber: ${name}`,
        description: `Automatically added from Jobber webhook`,
      });

      // Emit SSE event
      eventBus.emit('vendor.created', {
        accountId: account.id,
        vendorName: name,
      });

      logger.info(`Created vendor ${vendor.id} for Jobber client ${itemId}`);
    }
  } catch (error) {
    logger.error('Error handling CLIENT_CREATE webhook', { 
      error: error instanceof Error ? error.message : String(error),
      accountId,
      itemId,
    });
    throw error;
  }
}

/**
 * Handle JOB_CREATE webhook
 * Triggered when a new job is created in Jobber
 * Check if assigned client has valid COI, request if missing/expired
 */
async function handleJobCreate(accountId: string, itemId: string): Promise<void> {
  try {
    logger.info(`Processing JOB_CREATE webhook for account ${accountId}, job ${itemId}`);
    
    // Find the app account
    const accounts = await storage.getAllAccounts();
    const account = accounts.find(a => a.jobberAccountId === accountId);
    
    if (!account) {
      logger.warn(`No account found for Jobber account ID: ${accountId}`);
      return;
    }

    // Fetch job details to get client ID
    const jobQuery = `
      query GetJob($jobId: ID!) {
        job(id: $jobId) {
          id
          title
          client {
            id
            companyName
          }
        }
      }
    `;
    
    const result = await jobberService.executeGraphQL(account.id, jobQuery, { 
      jobId: itemId 
    } as Record<string, any>);
    
    if (!result?.job?.client) {
      logger.warn(`No client found for job ${itemId}`);
      return;
    }

    const clientId = result.job.client.id;
    
    // Check if we have this vendor in our system
    const vendor = await storage.getVendorByJobberId(account.id, clientId);
    
    if (!vendor) {
      logger.warn(`Vendor not found for Jobber client ${clientId}`);
      return;
    }

    // Check COI status
    const now = new Date();
    const needsCOI = vendor.coiStatus === 'MISSING' || 
                     vendor.coiStatus === 'EXPIRED' ||
                     (vendor.coiExpiry && vendor.coiExpiry < now);

    if (needsCOI) {
      logger.info(`COI missing/expired for vendor ${vendor.id}, sending request`);
      
      const uploadLink = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/upload/${vendor.id}`;
      
      // Send COI request via email
      if (vendor.email) {
        await emailService.sendCOIReminder(vendor.id, uploadLink);
      }
      
      // Send COI request via SMS if phone available
      if (vendor.phone) {
        await smsService.sendCOIReminderSMS(vendor.id, uploadLink);
      }

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'coi_requested',
        title: `COI requested for job: ${result.job.title}`,
        description: `Automatic request triggered by new job creation in Jobber`,
        metadata: { jobId: itemId, jobTitle: result.job.title },
      });

      // Emit SSE event
      eventBus.emit('coi.requested', {
        accountId: account.id,
        vendorName: vendor.name,
        jobTitle: result.job.title,
      });
    }
  } catch (error) {
    logger.error('Error handling JOB_CREATE webhook', { 
      error: error instanceof Error ? error.message : String(error),
      accountId,
      itemId,
    });
    throw error;
  }
}

/**
 * Handle JOB_CLOSE webhook
 * Triggered when a job is closed in Jobber
 */
async function handleJobClose(accountId: string, itemId: string): Promise<void> {
  try {
    logger.info(`Processing JOB_CLOSE webhook for account ${accountId}, job ${itemId}`);
    
    // Find the app account
    const accounts = await storage.getAllAccounts();
    const account = accounts.find(a => a.jobberAccountId === accountId);
    
    if (!account) {
      logger.warn(`No account found for Jobber account ID: ${accountId}`);
      return;
    }

    // You could add logic here to:
    // - Log job completion in timeline
    // - Check final compliance status
    // - Generate compliance reports
    
    logger.info(`Job ${itemId} closed for account ${accountId}`);
  } catch (error) {
    logger.error('Error handling JOB_CLOSE webhook', { 
      error: error instanceof Error ? error.message : String(error),
      accountId,
      itemId,
    });
    throw error;
  }
}

/**
 * Handle APP_DISCONNECT webhook
 * Triggered when user disconnects app from Jobber
 */
async function handleAppDisconnect(accountId: string): Promise<void> {
  try {
    logger.info(`Processing APP_DISCONNECT webhook for account ${accountId}`);
    
    // Find the app account
    const accounts = await storage.getAllAccounts();
    const account = accounts.find(a => a.jobberAccountId === accountId);
    
    if (!account) {
      logger.warn(`No account found for Jobber account ID: ${accountId}`);
      return;
    }

    // Clear Jobber tokens
    await storage.updateAccount(account.id, {
      jobberAccountId: null as any,
      jobberAccessToken: null as any,
      jobberRefreshToken: null as any,
      jobberTokenExpiry: null as any,
    });

    // Create timeline event
    await storage.createTimelineEvent({
      accountId: account.id,
      eventType: 'jobber_disconnected',
      title: 'Jobber integration disconnected',
      description: 'App was disconnected from Jobber Marketplace',
    });

    logger.info(`Jobber tokens cleared for account ${account.id}`);
  } catch (error) {
    logger.error('Error handling APP_DISCONNECT webhook', { 
      error: error instanceof Error ? error.message : String(error),
      accountId,
    });
    throw error;
  }
}

/**
 * Main webhook processing function
 * Routes webhooks to appropriate handlers
 */
export async function processJobberWebhook(payload: JobberWebhookPayload): Promise<void> {
  const { topic, accountId, itemId } = payload.data.webHookEvent;
  
  logger.info(`Processing Jobber webhook: ${topic}`, { accountId, itemId });

  try {
    switch (topic) {
      case 'CLIENT_CREATE':
        await handleClientCreate(accountId, itemId);
        break;
      
      case 'CLIENT_UPDATE':
        // Optionally handle client updates
        logger.info(`CLIENT_UPDATE webhook received for ${itemId}`);
        break;
      
      case 'JOB_CREATE':
        await handleJobCreate(accountId, itemId);
        break;
      
      case 'JOB_CLOSE':
        await handleJobClose(accountId, itemId);
        break;
      
      case 'APP_DISCONNECT':
        await handleAppDisconnect(accountId);
        break;
      
      default:
        logger.warn(`Unhandled webhook topic: ${topic}`);
    }
  } catch (error) {
    logger.error('Error processing Jobber webhook', { 
      error: error instanceof Error ? error.message : String(error),
      topic,
      accountId,
      itemId,
    });
    throw error;
  }
}
