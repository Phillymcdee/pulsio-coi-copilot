import { MailService } from '@sendgrid/mail';
import { storage } from '../storage';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) {
      emailData.text = params.text;
    }
    
    if (params.html) {
      emailData.html = params.html;
    }
    
    console.log('📧 Attempting to send email via SendGrid:', {
      to: params.to,
      from: params.from,
      subject: params.subject,
      hasApiKey: !!process.env.SENDGRID_API_KEY
    });
    
    const response = await mailService.send(emailData);
    console.log('📧 SendGrid response:', response);
    console.log('✅ Email sent successfully to:', params.to);
    return true;
  } catch (error) {
    console.error('❌ SendGrid email error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      emailTo: params.to,
      emailFrom: params.from
    });
    return false;
  }
}

export class EmailService {
  private defaultFromEmail = process.env.FROM_EMAIL || 'noreply@pulsio.app';

  async sendW9Reminder(vendorId: string, uploadLink: string): Promise<boolean> {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor?.email) {
      throw new Error('Vendor email not found');
    }

    const account = await storage.getAccount(vendor.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    let emailTemplate = account.emailTemplate;
    if (!emailTemplate) {
      emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">W-9 Form Required</h2>
          <p>Hello {{vendor_name}},</p>
          <p>We need your completed W-9 form for our records. This is required for tax reporting purposes.</p>
          <p style="margin: 30px 0;">
            <a href="{{upload_link}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Upload W-9 Form
            </a>
          </p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>{{company_name}}</p>
        </div>
      `;
    }

    // Replace merge tags
    const htmlContent = emailTemplate
      .replace(/{{vendor_name}}/g, vendor.name)
      .replace(/{{company_name}}/g, account.companyName)
      .replace(/{{upload_link}}/g, uploadLink);

    const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n');

    // Use custom fromName if set, otherwise use company name
    const senderName = account.fromName || account.companyName;
    const fromAddress = `${senderName} <${this.defaultFromEmail}>`;

    const success = await sendEmail({
      to: vendor.email,
      from: fromAddress,
      subject: `W-9 Form Required - ${account.companyName}`,
      html: htmlContent,
      text: textContent,
    });

    if (success) {
      // Log the reminder
      await storage.createReminder({
        vendorId: vendor.id,
        accountId: account.id,
        type: 'W9',
        channel: 'email',
        recipient: vendor.email,
        subject: `W-9 Form Required - ${account.companyName}`,
        message: textContent,
        status: 'sent',
      });

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'reminder_sent',
        title: `Reminder sent to ${vendor.name}`,
        description: `W-9 reminder sent via email`,
      });
    }

    return success;
  }

  async sendCOIReminder(vendorId: string, uploadLink: string): Promise<boolean> {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor?.email) {
      throw new Error('Vendor email not found');
    }

    const account = await storage.getAccount(vendor.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    let emailTemplate = account.emailTemplate;
    if (!emailTemplate) {
      emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Certificate of Insurance Required</h2>
          <p>Hello {{vendor_name}},</p>
          <p>We need your current Certificate of Insurance (COI) for our records. This ensures proper coverage is in place for our working relationship.</p>
          <p style="margin: 30px 0;">
            <a href="{{upload_link}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Upload COI
            </a>
          </p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>{{company_name}}</p>
        </div>
      `;
    }

    // Replace merge tags
    const htmlContent = emailTemplate
      .replace(/{{vendor_name}}/g, vendor.name)
      .replace(/{{company_name}}/g, account.companyName)
      .replace(/{{upload_link}}/g, uploadLink);

    const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n');

    // Use custom fromName if set, otherwise use company name  
    const senderName = account.fromName || account.companyName;
    const fromAddress = `${senderName} <${this.defaultFromEmail}>`;

    const success = await sendEmail({
      to: vendor.email,
      from: fromAddress,
      subject: `Certificate of Insurance Required - ${account.companyName}`,
      html: htmlContent,
      text: textContent,
    });

    if (success) {
      // Log the reminder
      await storage.createReminder({
        vendorId: vendor.id,
        accountId: account.id,
        type: 'COI',
        channel: 'email',
        recipient: vendor.email,
        subject: `Certificate of Insurance Required - ${account.companyName}`,
        message: textContent,
        status: 'sent',
      });

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'reminder_sent',
        title: `Reminder sent to ${vendor.name}`,
        description: `COI reminder sent via email`,
      });
    }

    return success;
  }

  async sendWelcomeEmail(userId: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user?.email) {
      return false;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Pulsio!</h2>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>Welcome to Pulsio! We're excited to help you automate your vendor document collection process.</p>
        <p>🎉 We just nudged your first vendor—docs incoming! Your dashboard is now live and tracking document collection in real-time.</p>
        <p>Here's what happens next:</p>
        <ul>
          <li>We'll automatically remind your vendors to submit missing W-9s and COIs</li>
          <li>Documents are securely stored and organized</li>
          <li>You'll capture early payment discounts by having all docs ready</li>
          <li>Get real-time notifications when documents arrive</li>
        </ul>
        <p style="margin: 30px 0;">
          <a href="${process.env.REPLIT_DOMAINS?.split(',')[0]}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Dashboard
          </a>
        </p>
        <p>If you have any questions, we're here to help!</p>
        <p>Best regards,<br>The Pulsio Team</p>
      </div>
    `;

    const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n');

    return await sendEmail({
      to: user.email,
      from: `Pulsio Team <${this.defaultFromEmail}>`,
      subject: 'Welcome to Pulsio - Your Document Collection is Now Automated!',
      html: htmlContent,
      text: textContent,
    });
  }

  async sendCOIExpiryWarning(vendorId: string, daysUntilExpiry: number): Promise<boolean> {
    const vendor = await storage.getVendor(vendorId);
    if (!vendor?.email) {
      throw new Error('Vendor email not found');
    }

    const account = await storage.getAccountByUserId(vendor.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const uploadLink = `${process.env.REPLIT_DOMAINS?.split(',')[0]}/upload/${vendor.id}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Certificate of Insurance Expiring Soon</h2>
        <p>Hello ${vendor.name},</p>
        <p>Your Certificate of Insurance will expire in <strong>${daysUntilExpiry} days</strong>. Please upload a renewed certificate to avoid any service interruptions.</p>
        <p style="margin: 30px 0;">
          <a href="${uploadLink}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Upload New COI
          </a>
        </p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>${account.companyName}</p>
      </div>
    `;

    const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n');

    // Use custom fromName if set, otherwise use company name
    const senderName = account.fromName || account.companyName;
    const fromAddress = `${senderName} <${this.defaultFromEmail}>`;

    const success = await sendEmail({
      to: vendor.email,
      from: fromAddress,
      subject: `COI Expiring in ${daysUntilExpiry} Days - ${account.companyName}`,
      html: htmlContent,
      text: textContent,
    });

    if (success) {
      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        vendorId: vendor.id,
        eventType: 'coi_warning',
        title: `COI expiry warning sent to ${vendor.name}`,
        description: `COI expires in ${daysUntilExpiry} days`,
      });
    }

    return success;
  }
}

export const emailService = new EmailService();
