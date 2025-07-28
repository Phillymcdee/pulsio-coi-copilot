import { storage } from '../storage';

interface QBOVendor {
  Id: string;
  Name: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
}

interface QBOBill {
  Id: string;
  VendorRef: { value: string };
  DocNumber?: string;
  TotalAmt: number;
  DueDate?: string;
}

export class QuickBooksService {
  private baseUrl = 'https://sandbox-quickbooks.api.intuit.com';

  // Calculate and capture early payment discounts
  async captureEarlyPaymentDiscounts(vendorId: string): Promise<number> {
    try {
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) return 0;

      // Only capture discounts if both W9 and COI are received and not expired
      const canCaptureDiscounts = vendor.w9Status === 'RECEIVED' && 
                                 vendor.coiStatus === 'RECEIVED';

      if (!canCaptureDiscounts) return 0;

      // Get all unpaid bills for this vendor with available discounts
      const bills = await storage.getBillsByVendorId(vendorId);
      let totalCaptured = 0;

      for (const bill of bills) {
        if (!bill.discountCaptured && bill.discountAmount && bill.discountDueDate) {
          // Check if we're still within discount period
          const isWithinDiscountPeriod = new Date() <= bill.discountDueDate;
          
          if (isWithinDiscountPeriod) {
            // Mark discount as captured
            await storage.updateBill(bill.id, { discountCaptured: true });
            const discountAmount = parseFloat(bill.discountAmount);
            totalCaptured += discountAmount;

            // Create timeline event
            await storage.createTimelineEvent({
              accountId: vendor.accountId,
              vendorId: vendor.id,
              eventType: 'discount_captured',
              title: `Discount captured from ${vendor.name}`,
              description: `$${discountAmount.toFixed(2)} early payment discount secured`,
            });
          }
        }
      }

      return totalCaptured;
    } catch (error) {
      console.error('Error capturing early payment discounts:', error);
      return 0;
    }
  }

  async getAuthUrl(accountId: string): Promise<string> {
    const clientId = process.env.QBO_CLIENT_ID;
    const redirectUri = process.env.QBO_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/qbo/callback`;
    
    const scope = 'com.intuit.quickbooks.accounting';
    const state = accountId; // Pass account ID as state for callback
    
    return `https://appcenter.intuit.com/connect/oauth2?` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `state=${state}`;
  }

  async exchangeCodeForTokens(code: string, companyId: string): Promise<{ accessToken: string; refreshToken: string; companyId: string }> {
    const clientId = process.env.QBO_CLIENT_ID;
    const clientSecret = process.env.QBO_CLIENT_SECRET;
    const redirectUri = process.env.QBO_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/qbo/callback`;

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QBO token exchange error:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      companyId, // Use the realmId passed from OAuth callback
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const clientId = process.env.QBO_CLIENT_ID;
    const clientSecret = process.env.QBO_CLIENT_SECRET;

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  async syncVendors(accountId: string): Promise<void> {
    const account = await storage.getAccountByUserId(accountId);
    if (!account?.qboAccessToken || !account.qboCompanyId) {
      throw new Error('QuickBooks not connected');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v3/company/${account.qboCompanyId}/query?query=SELECT * FROM Vendor`,
        {
          headers: {
            'Authorization': `Bearer ${account.qboAccessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          if (account.qboRefreshToken) {
            const tokens = await this.refreshAccessToken(account.qboRefreshToken);
            await storage.updateAccount(account.id, {
              qboAccessToken: tokens.accessToken,
              qboRefreshToken: tokens.refreshToken,
              qboTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
            });
            // Retry the request
            return this.syncVendors(accountId);
          }
        }
        throw new Error('Failed to sync vendors from QuickBooks');
      }

      const data = await response.json();
      const vendors: QBOVendor[] = data.QueryResponse?.Vendor || [];

      for (const qboVendor of vendors) {
        const existingVendor = await storage.getVendorByQboId(account.id, qboVendor.Id);
        
        if (!existingVendor) {
          await storage.createVendor({
            accountId: account.id,
            qboId: qboVendor.Id,
            name: qboVendor.Name,
            email: qboVendor.PrimaryEmailAddr?.Address || null,
            phone: qboVendor.PrimaryPhone?.FreeFormNumber || null,
          });
        } else {
          // Update existing vendor
          await storage.updateVendor(existingVendor.id, {
            name: qboVendor.Name,
            email: qboVendor.PrimaryEmailAddr?.Address || null,
            phone: qboVendor.PrimaryPhone?.FreeFormNumber || null,
          });
        }
      }

      // Create timeline event
      await storage.createTimelineEvent({
        accountId: account.id,
        eventType: 'qbo_sync',
        title: 'QuickBooks sync completed',
        description: `${vendors.length} vendors synced`,
      });

    } catch (error) {
      console.error('Error syncing vendors:', error);
      throw error;
    }
  }

  async syncBills(accountId: string): Promise<void> {
    const account = await storage.getAccountByUserId(accountId);
    if (!account?.qboAccessToken || !account.qboCompanyId) {
      throw new Error('QuickBooks not connected');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v3/company/${account.qboCompanyId}/query?query=SELECT * FROM Bill WHERE MetaData.LastUpdatedTime > '2024-01-01'`,
        {
          headers: {
            'Authorization': `Bearer ${account.qboAccessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync bills from QuickBooks');
      }

      const data = await response.json();
      const bills: QBOBill[] = data.QueryResponse?.Bill || [];

      for (const qboBill of bills) {
        const vendor = await storage.getVendorByQboId(account.id, qboBill.VendorRef.value);
        if (!vendor) continue;

        const existingBill = await storage.getBillByQboId(account.id, qboBill.Id);
        
        if (!existingBill) {
          await storage.createBill({
            accountId: account.id,
            vendorId: vendor.id,
            qboId: qboBill.Id,
            billNumber: qboBill.DocNumber || null,
            amount: qboBill.TotalAmt.toString(),
            dueDate: qboBill.DueDate ? new Date(qboBill.DueDate) : null,
            // Assume 2% discount if paid within 10 days
            discountPercent: '2.00',
            discountAmount: (qboBill.TotalAmt * 0.02).toString(),
            discountDueDate: qboBill.DueDate 
              ? new Date(new Date(qboBill.DueDate).getTime() - 10 * 24 * 60 * 60 * 1000)
              : null,
          });
        }
      }

    } catch (error) {
      console.error('Error syncing bills:', error);
      throw error;
    }
  }
}

export const quickbooksService = new QuickBooksService();
