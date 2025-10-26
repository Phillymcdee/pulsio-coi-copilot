import * as cron from 'node-cron';
import { storage } from '../storage';
import { quickbooksService } from './quickbooks';
import { jobberService } from './jobber';
import { emailService } from './sendgrid';
import { smsService } from './twilio';
import { eventBus } from './sse';
import { logger } from './logger';

export class CronService {
  private jobs = new Map<string, cron.ScheduledTask>();

  start(): void {
    logger.info('Starting Pulsio cron services...');

    // QuickBooks sync - every 20 minutes (only if QBO feature is enabled)
    if (process.env.FEATURE_QBO === 'true') {
      const syncJob = cron.schedule('*/20 * * * *', async () => {
        logger.cron('quickbooks-sync', 'started');
        await this.syncAllAccounts();
      });
      this.jobs.set('qbo-sync', syncJob);
    }

    // Jobber sync - every 30 minutes (only if Jobber feature is enabled)
    if (process.env.FEATURE_JOBBER === 'true') {
      const jobberSyncJob = cron.schedule('*/30 * * * *', async () => {
        logger.cron('jobber-sync', 'started');
        await this.syncAllJobberAccounts();
      });
      this.jobs.set('jobber-sync', jobberSyncJob);
    }

    // Daily reminder job - runs at 9 AM every day
    const reminderJob = cron.schedule('0 9 * * *', async () => {
      logger.cron('daily-reminders', 'started');
      await this.sendScheduledReminders();
    });

    // COI expiry check - daily at 8 AM
    const expiryJob = cron.schedule('0 8 * * *', async () => {
      logger.cron('coi-expiry-check', 'started');
      await this.checkExpiringCOIs();
    });

    this.jobs.set('reminders', reminderJob);
    this.jobs.set('expiry', expiryJob);

    // Jobs are started by default, no need to call start()

    logger.info('Cron services started successfully');
  }

  stop(): void {
    logger.info('Stopping cron services...');
    this.jobs.forEach((job, name) => {
      job.destroy();
      logger.info(`Stopped ${name} cron job`);
    });
    this.jobs.clear();
  }

  private async syncAllAccounts(): Promise<void> {
    try {
      // Get all accounts that have QuickBooks connected
      const accounts = await storage.getAllAccounts();
      
      for (const account of accounts) {
        if (account.qboAccessToken && account.qboCompanyId) {
          try {
            const vendorsBefore = await storage.getVendorsByAccountId(account.id);
            await quickbooksService.syncTerms(account.id); // Sync payment terms first
            await quickbooksService.syncVendors(account.id); // Use account.id, not userId
            await quickbooksService.syncBills(account.id);
            const vendorsAfter = await storage.getVendorsByAccountId(account.id);
            
            // Emit SSE event for sync completion
            eventBus.emit('qbo.sync', {
              accountId: account.id,
              vendorCount: vendorsAfter.length,
            });
            
            logger.qbo('sync-completed', account.id, { companyName: account.companyName });
          } catch (error) {
            logger.error(`Error syncing account ${account.companyName}`, { 
              accountId: account.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
      
      logger.cron('quickbooks-sync', 'completed');
    } catch (error) {
      logger.cron('quickbooks-sync', 'failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private async syncAllJobberAccounts(): Promise<void> {
    try {
      // Get all accounts that have Jobber connected
      const accounts = await storage.getAllAccounts();
      
      for (const account of accounts) {
        if (account.jobberAccessToken && account.jobberAccountId) {
          try {
            logger.info(`Starting Jobber sync for account: ${account.companyName}`, { accountId: account.id });
            
            await jobberService.syncClients(account.id);
            const vendors = await storage.getVendorsByAccountId(account.id);
            
            // Emit SSE event for sync completion
            eventBus.emit('jobber.sync', {
              accountId: account.id,
              vendorCount: vendors.length,
            });
            
            logger.info(`Jobber sync completed for account: ${account.companyName}`, { 
              accountId: account.id,
              vendorCount: vendors.length 
            });
          } catch (error) {
            logger.error(`Error syncing Jobber account ${account.companyName}`, { 
              accountId: account.id,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
      
      logger.cron('jobber-sync', 'completed');
    } catch (error) {
      logger.cron('jobber-sync', 'failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  private async sendScheduledReminders(): Promise<void> {
    try {
      // Get all accounts that have completed onboarding
      const accounts = await storage.getAllAccounts();
      
      for (const account of accounts) {
        if (account.isOnboardingComplete) {
          try {
            await this.sendRemindersForAccount(account.id);
            console.log(`Sent reminders for account ${account.companyName}`);
          } catch (error) {
            console.error(`Error sending reminders for account ${account.companyName}:`, error);
          }
        }
      }
      
      console.log('Daily reminder job completed');
    } catch (error) {
      console.error('Error in reminder job:', error);
    }
  }

  private async checkExpiringCOIs(): Promise<void> {
    try {
      // Get all accounts and check for expiring COIs
      const accounts = await storage.getAllAccounts();
      
      for (const account of accounts) {
        try {
          // Get account-specific expiry warning days from coiRules
          const coiRules = (account.coiRules as any) || {};
          const warningDays = coiRules.expiryWarningDays || [30, 14, 7];
          
          const vendors = await storage.getVendorsByAccountId(account.id);
          
          for (const vendor of vendors) {
            if (vendor.coiExpiry) {
              const daysUntilExpiry = Math.ceil((vendor.coiExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              
              // Send warnings for COIs expiring on configured warning days
              if (warningDays.includes(daysUntilExpiry)) {
                await emailService.sendCOIExpiryWarning(vendor.id, daysUntilExpiry);
                
                // Log timeline event
                await storage.createTimelineEvent({
                  accountId: account.id,
                  vendorId: vendor.id,
                  eventType: 'reminder_sent',
                  title: `COI expiry warning sent to ${vendor.name}`,
                  description: `COI expiry warning sent via email (${daysUntilExpiry} days remaining)`,
                  metadata: {
                    docType: 'COI',
                    channel: 'email',
                    daysUntilExpiry,
                  },
                });
                
                if (vendor.phone) {
                  await smsService.sendCOIExpiryWarningSMS(vendor.id, daysUntilExpiry);
                  
                  // Log SMS timeline event
                  await storage.createTimelineEvent({
                    accountId: account.id,
                    vendorId: vendor.id,
                    eventType: 'reminder_sent',
                    title: `COI expiry warning sent to ${vendor.name}`,
                    description: `COI expiry warning sent via SMS (${daysUntilExpiry} days remaining)`,
                    metadata: {
                      docType: 'COI',
                      channel: 'sms',
                      daysUntilExpiry,
                    },
                  });
                }
                
                eventBus.emit('coi.expiring', {
                  accountId: account.id,
                  vendorName: vendor.name,
                  daysUntilExpiry,
                });
                
                logger.info(`COI expiry warning sent for ${vendor.name}`, {
                  vendorId: vendor.id,
                  daysUntilExpiry,
                  accountId: account.id,
                });
              }
              
              // Mark as expired if past expiry date
              if (daysUntilExpiry < 0 && vendor.coiStatus !== 'EXPIRED') {
                await storage.updateVendor(vendor.id, { coiStatus: 'EXPIRED' });
                
                // Log expiry timeline event
                await storage.createTimelineEvent({
                  accountId: account.id,
                  vendorId: vendor.id,
                  eventType: 'coi_expired',
                  title: `COI expired for ${vendor.name}`,
                  description: 'Certificate of Insurance has expired',
                  metadata: {
                    docType: 'COI',
                    channel: 'system',
                    daysUntilExpiry,
                    expiredDate: vendor.coiExpiry,
                  },
                });
                
                eventBus.emit('coi.expired', {
                  accountId: account.id,
                  vendorName: vendor.name,
                });
                
                logger.warn(`COI expired for ${vendor.name}`, {
                  vendorId: vendor.id,
                  expiryDate: vendor.coiExpiry,
                  accountId: account.id,
                });
              }
            }
          }
        } catch (error) {
          logger.error(`Error checking COIs for account ${account.companyName}`, { 
            accountId: account.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      logger.cron('coi-expiry-check', 'completed');
    } catch (error) {
      logger.cron('coi-expiry-check', 'failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  async sendRemindersForAccount(accountId: string): Promise<void> {
    try {
      const vendors = await storage.getVendorsByAccountId(accountId);
      
      for (const vendor of vendors) {
        // Skip if vendor is exempt
        if (vendor.isExempt) continue;

        const uploadLink = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/upload/${vendor.id}`;
        
        // Send COI reminder if missing or expiring
        if ((vendor.coiStatus === 'MISSING' || vendor.coiStatus === 'EXPIRED') && vendor.email) {
          try {
            await emailService.sendCOIReminder(vendor.id, uploadLink);
            
            // Emit SSE event for reminder sent
            eventBus.emit('reminder.sent', {
              accountId,
              vendorName: vendor.name,
              docType: 'COI',
              channel: 'email',
            });
            
            // Also send SMS if phone available
            if (vendor.phone) {
              await smsService.sendCOIReminderSMS(vendor.id, uploadLink);
              eventBus.emit('reminder.sent', {
                accountId,
                vendorName: vendor.name,
                docType: 'COI',
                channel: 'sms',
              });
            }
          } catch (error) {
            console.error(`Error sending COI reminder to ${vendor.name}:`, error);
          }
        }

        // Check for expiring COI
        if (vendor.coiExpiry) {
          const daysUntilExpiry = Math.ceil((vendor.coiExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            eventBus.emit('coi.expiring', {
              accountId,
              vendorName: vendor.name,
              daysUntilExpiry,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error sending reminders for account ${accountId}:`, error);
    }
  }
}

export const cronService = new CronService();

// Start cron services when module is imported
if (process.env.NODE_ENV !== 'test') {
  cronService.start();
}
