import { storage } from '../storage';

export class SMSService {
  private accountSid = process.env.TWILIO_ACCOUNT_SID;
  private authToken = process.env.TWILIO_AUTH_TOKEN;
  private fromNumber = process.env.TWILIO_FROM_NUMBER;

  constructor() {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.error('Twilio not configured');
      return false;
    }

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: to,
          Body: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Twilio SMS error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('SMS error:', error);
      return false;
    }
  }

  async sendW9ReminderSMS(vendorId: string, uploadLink: string): Promise<boolean> {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor?.phone) {
      throw new Error('Vendor phone not found');
    }

    const account = await storage.getAccount(vendor.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    let smsTemplate = account.smsTemplate;
    if (!smsTemplate) {
      smsTemplate = `Hi {{vendor_name}}, we need your W-9 form for tax reporting. Please upload it here: {{upload_link}} - {{company_name}}`;
    }

    // Replace merge tags
    const message = smsTemplate
      .replace(/{{vendor_name}}/g, vendor.name)
      .replace(/{{company_name}}/g, account.companyName)
      .replace(/{{upload_link}}/g, uploadLink);

    const success = await this.sendSMS(vendor.phone, message);

    if (success) {
      // Log the reminder
      await storage.createReminder({
        vendorId: vendor.id,
        accountId: account.id,
        type: 'W9',
        channel: 'sms',
        recipient: vendor.phone,
        subject: null,
        message,
        status: 'sent',
      });

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'reminder_sent',
        title: `SMS sent to ${vendor.name}`,
        description: `W-9 reminder sent via SMS`,
      });
    }

    return success;
  }

  async sendCOIReminderSMS(vendorId: string, uploadLink: string): Promise<boolean> {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor?.phone) {
      throw new Error('Vendor phone not found');
    }

    const account = await storage.getAccount(vendor.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    let smsTemplate = account.smsTemplate;
    if (!smsTemplate) {
      smsTemplate = `Hi {{vendor_name}}, we need your Certificate of Insurance. Please upload it here: {{upload_link}} - {{company_name}}`;
    }

    // Replace merge tags
    const message = smsTemplate
      .replace(/{{vendor_name}}/g, vendor.name)
      .replace(/{{company_name}}/g, account.companyName)
      .replace(/{{upload_link}}/g, uploadLink);

    const success = await this.sendSMS(vendor.phone, message);

    if (success) {
      // Log the reminder
      await storage.createReminder({
        vendorId: vendor.id,
        accountId: account.id,
        type: 'COI',
        channel: 'sms',
        recipient: vendor.phone,
        subject: null,
        message,
        status: 'sent',
      });

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'reminder_sent',
        title: `SMS sent to ${vendor.name}`,
        description: `COI reminder sent via SMS`,
      });
    }

    return success;
  }

  async sendCOIExpiryWarningSMS(vendorId: string, daysUntilExpiry: number): Promise<boolean> {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor?.phone) {
      throw new Error('Vendor phone not found');
    }

    const account = await storage.getAccountByUserId(vendor.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const uploadLink = `${process.env.REPLIT_DOMAINS?.split(',')[0]}/upload/${vendor.id}`;
    const message = `Hi ${vendor.name}, your Certificate of Insurance expires in ${daysUntilExpiry} days. Please upload a renewed certificate: ${uploadLink} - ${account.companyName}`;

    const success = await this.sendSMS(vendor.phone, message);

    if (success) {
      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'coi_warning',
        title: `COI expiry SMS sent to ${vendor.name}`,
        description: `COI expires in ${daysUntilExpiry} days`,
      });
    }

    return success;
  }
}

export const smsService = new SMSService();
