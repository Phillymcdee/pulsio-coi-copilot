import { storage } from '../storage';

interface QBOVendor {
  Id: string;
  Name?: string;
  DisplayName?: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  Vendor1099?: boolean;
}

interface QBOBill {
  Id: string;
  VendorRef: { value: string };
  DocNumber?: string;
  TotalAmt: number;
  Balance?: number;
  DueDate?: string;
  SalesTermRef?: { value: string; name?: string };
}

interface QBOTerms {
  Id: string;
  Name: string;
  Type: 'STANDARD' | 'DATE_DRIVEN';
  DueDays?: number;
  DiscountPercent?: number;
  DiscountDays?: number;
  DayOfMonthDue?: number;
  DiscountDayOfMonth?: number;
  DueNextMonthDays?: number;
  Active?: boolean;
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
    const redirectUri = process.env.QBO_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/qbo/callback`;
    
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
    const redirectUri = process.env.QBO_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/qbo/callback`;

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
    // Handle both userId and accountId - check if it's a userId first
    let account = await storage.getAccountByUserId(accountId);
    if (!account) {
      // If not found by userId, try to get by accountId directly
      const allAccounts = await storage.getAllAccounts();
      account = allAccounts.find(acc => acc.id === accountId);
    }
    if (!account?.qboAccessToken || !account.qboCompanyId) {
      throw new Error('QuickBooks not connected');
    }

    // Ensure token is valid before making API calls
    account = await this.ensureValidToken(account);
    
    // Additional check after token refresh
    if (!account) {
      throw new Error('QuickBooks account not found after token refresh');
    }

    try {
      const query = "SELECT * FROM Vendor";
      console.log(`Querying QuickBooks with: ${query}`);
      
      const response = await fetch(
        `${this.baseUrl}/v3/company/${account.qboCompanyId}/query?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${account.qboAccessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`QuickBooks API error: ${response.status} - ${errorText}`);
        
        if (response.status === 401) {
          // Try to refresh token
          if (account.qboRefreshToken) {
            console.log('Token expired, refreshing...');
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
        throw new Error(`Failed to sync vendors from QuickBooks: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const allVendors: QBOVendor[] = data.QueryResponse?.Vendor || [];
      
      // Filter for 1099 contractors only
      const vendors = allVendors.filter(vendor => vendor.Vendor1099 === true);

      console.log(`Found ${allVendors.length} total vendors, ${vendors.length} are 1099 contractors in QuickBooks for account ${account.companyName}`);

      for (const qboVendor of vendors) {
        const existingVendor = await storage.getVendorByQboId(account.id, qboVendor.Id);
        
        if (!existingVendor) {
          // Get the best available name (DisplayName is most reliable)
          const vendorName = qboVendor.DisplayName || qboVendor.CompanyName || 
                           (qboVendor.GivenName && qboVendor.FamilyName ? 
                            `${qboVendor.GivenName} ${qboVendor.FamilyName}` : null) ||
                           qboVendor.Name;
          
          if (!vendorName || vendorName.trim() === '') {
            console.log(`Skipping vendor with no name (ID: ${qboVendor.Id})`);
            continue;
          }
          
          console.log(`Creating new vendor: ${vendorName}`);
          const newVendor = await storage.createVendor({
            accountId: account.id,
            qboId: qboVendor.Id,
            name: vendorName,
            email: qboVendor.PrimaryEmailAddr?.Address || null,
            phone: qboVendor.PrimaryPhone?.FreeFormNumber || null,
            // Store QB source data
            qboName: vendorName,
            qboEmail: qboVendor.PrimaryEmailAddr?.Address || null,
            qboPhone: qboVendor.PrimaryPhone?.FreeFormNumber || null,
            qboLastSyncAt: new Date(),
          });
          
          // Send initial reminders for new vendors with email
          if (newVendor.email) {
            try {
              const { emailService } = await import('./sendgrid');
              const uploadLink = `${process.env.REPLIT_DOMAINS?.split(',')[0]}/upload/${newVendor.id}`;
              
              // Send W9 reminder
              await emailService.sendW9Reminder(newVendor.id, uploadLink);
              
              // Send COI reminder
              await emailService.sendCOIReminder(newVendor.id, uploadLink);
              
              console.log(`Sent initial reminders to new vendor: ${vendorName}`);
            } catch (error) {
              console.error(`Failed to send reminders to ${vendorName}:`, error);
            }
          }
        } else {
          // Update existing vendor (only if name exists)
          const vendorName = qboVendor.DisplayName || qboVendor.CompanyName || 
                           (qboVendor.GivenName && qboVendor.FamilyName ? 
                            `${qboVendor.GivenName} ${qboVendor.FamilyName}` : null) ||
                           qboVendor.Name;
          
          if (vendorName && vendorName.trim() !== '') {
            console.log(`Updating existing vendor: ${vendorName}`);
            
            // Smart update: only update fields that haven't been manually overridden
            const updateData: any = {
              qboName: vendorName,
              qboEmail: qboVendor.PrimaryEmailAddr?.Address || null,
              qboPhone: qboVendor.PrimaryPhone?.FreeFormNumber || null,
              qboLastSyncAt: new Date(),
            };
            
            // Update active fields only if not overridden by user
            if (!existingVendor.nameOverride) {
              updateData.name = vendorName;
            }
            if (!existingVendor.emailOverride) {
              updateData.email = qboVendor.PrimaryEmailAddr?.Address || null;
            }
            if (!existingVendor.phoneOverride) {
              updateData.phone = qboVendor.PrimaryPhone?.FreeFormNumber || null;
            }
            
            await storage.updateVendor(existingVendor.id, updateData);
          }
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

  // Calculate discount info based on terms
  private calculateDiscountInfo(totalAmount: number, terms: QBOTerms | null, billDate: Date, dueDate: Date | null) {
    if (!terms || !terms.DiscountPercent || !terms.DiscountDays || terms.DiscountPercent <= 0) {
      return {
        discountPercent: null,
        discountAmount: null,
        discountDueDate: null,
      };
    }

    const discountPercent = terms.DiscountPercent;
    const discountAmount = totalAmount * (discountPercent / 100);
    
    let discountDueDate: Date | null = null;
    
    if (terms.Type === 'STANDARD' && terms.DiscountDays) {
      // For standard terms, discount days are from bill date
      discountDueDate = new Date(billDate);
      discountDueDate.setDate(discountDueDate.getDate() + terms.DiscountDays);
    } else if (terms.Type === 'DATE_DRIVEN' && terms.DiscountDayOfMonth) {
      // For date-driven terms, discount due on specific day of month
      discountDueDate = new Date(billDate.getFullYear(), billDate.getMonth(), terms.DiscountDayOfMonth);
      
      // If the discount day has passed this month, move to next month
      if (discountDueDate <= billDate) {
        discountDueDate.setMonth(discountDueDate.getMonth() + 1);
      }
    }

    return {
      discountPercent: discountPercent.toString(),
      discountAmount: discountAmount.toString(),
      discountDueDate,
    };
  }

  // Helper method to check and refresh token if needed
  private async ensureValidToken(account: any): Promise<any> {
    // Check if token is expired or will expire soon (within 5 minutes)
    const now = new Date();
    const expiryTime = new Date(account.qboTokenExpiry);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiryTime <= fiveMinutesFromNow && account.qboRefreshToken) {
      console.log('Token expired or expiring soon, refreshing...');
      try {
        const tokens = await this.refreshAccessToken(account.qboRefreshToken);
        const updatedAccount = await storage.updateAccount(account.id, {
          qboAccessToken: tokens.accessToken,
          qboRefreshToken: tokens.refreshToken,
          qboTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
        });
        console.log('Token refreshed successfully');
        return updatedAccount;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        throw new Error('QuickBooks token refresh failed. Please reconnect your QuickBooks account.');
      }
    }

    return account;
  }

  // Sync payment terms from QuickBooks
  async syncTerms(accountId: string): Promise<void> {
    // Handle both userId and accountId - check if it's a userId first
    let account = await storage.getAccountByUserId(accountId);
    if (!account) {
      // If not found by userId, try to get by accountId directly
      const allAccounts = await storage.getAllAccounts();
      account = allAccounts.find(acc => acc.id === accountId);
    }
    if (!account?.qboAccessToken || !account.qboCompanyId) {
      throw new Error('QuickBooks not connected');
    }

    // Ensure token is valid before making API calls
    account = await this.ensureValidToken(account);
    
    // Additional check after token refresh
    if (!account) {
      throw new Error('QuickBooks account not found after token refresh');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v3/company/${account.qboCompanyId}/query?query=SELECT * FROM Term WHERE Active = true`,
        {
          headers: {
            'Authorization': `Bearer ${account.qboAccessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`QuickBooks API error in syncTerms: ${response.status} - ${errorText}`);
        
        if (response.status === 401) {
          // Token might still be invalid, try refreshing one more time
          if (account.qboRefreshToken) {
            console.log('Received 401, attempting token refresh...');
            const tokens = await this.refreshAccessToken(account.qboRefreshToken);
            await storage.updateAccount(account.id, {
              qboAccessToken: tokens.accessToken,
              qboRefreshToken: tokens.refreshToken,
              qboTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
            });
            // Retry the request
            return this.syncTerms(accountId);
          }
        }
        throw new Error(`Failed to sync terms from QuickBooks: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const qboTerms: QBOTerms[] = data.QueryResponse?.Term || [];

      console.log(`Found ${qboTerms.length} payment terms in QuickBooks for account ${account.companyName}`);

      for (const qboTerm of qboTerms) {
        const existingTerm = await storage.getTermsByQboId(account.id, qboTerm.Id);
        
        const termData = {
          accountId: account.id,
          qboId: qboTerm.Id,
          name: qboTerm.Name,
          type: qboTerm.Type,
          dueDays: qboTerm.DueDays || null,
          discountPercent: qboTerm.DiscountPercent?.toString() || null,
          discountDays: qboTerm.DiscountDays || null,
          dayOfMonthDue: qboTerm.DayOfMonthDue || null,
          discountDayOfMonth: qboTerm.DiscountDayOfMonth || null,
          dueNextMonthDays: qboTerm.DueNextMonthDays || null,
          active: qboTerm.Active !== false,
          qboLastSyncAt: new Date(),
        };

        if (!existingTerm) {
          console.log(`Creating new payment term: ${qboTerm.Name}`);
          await storage.createTerms(termData);
        } else {
          console.log(`Updating existing payment term: ${qboTerm.Name}`);
          await storage.updateTerms(existingTerm.id, termData);
        }
      }

      // Create timeline event for terms sync
      await storage.createTimelineEvent({
        accountId: account.id,
        eventType: 'qbo_sync',
        title: 'Payment terms sync completed',
        description: `${qboTerms.length} payment terms synced`,
      });

    } catch (error) {
      console.error('Error syncing terms:', error);
      throw error;
    }
  }

  async syncBills(accountId: string): Promise<void> {
    // Handle both userId and accountId - check if it's a userId first
    let account = await storage.getAccountByUserId(accountId);
    if (!account) {
      // If not found by userId, try to get by accountId directly
      const allAccounts = await storage.getAllAccounts();
      account = allAccounts.find(acc => acc.id === accountId);
    }
    if (!account?.qboAccessToken || !account.qboCompanyId) {
      throw new Error('QuickBooks not connected');
    }

    // Ensure token is valid before making API calls
    account = await this.ensureValidToken(account);
    
    // Additional check after token refresh
    if (!account) {
      throw new Error('QuickBooks account not found after token refresh');
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
        const errorText = await response.text();
        console.error(`QuickBooks API error in syncBills: ${response.status} - ${errorText}`);
        
        if (response.status === 401) {
          // Token might still be invalid, try refreshing one more time
          if (account.qboRefreshToken) {
            console.log('Received 401 in syncBills, attempting token refresh...');
            const tokens = await this.refreshAccessToken(account.qboRefreshToken);
            await storage.updateAccount(account.id, {
              qboAccessToken: tokens.accessToken,
              qboRefreshToken: tokens.refreshToken,
              qboTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour
            });
            // Retry the request
            return this.syncBills(accountId);
          }
        }
        throw new Error(`Failed to sync bills from QuickBooks: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const bills: QBOBill[] = data.QueryResponse?.Bill || [];

      console.log(`Found ${bills.length} bills in QuickBooks for account ${account.companyName}`);

      for (const qboBill of bills) {
        const vendor = await storage.getVendorByQboId(account.id, qboBill.VendorRef.value);
        if (!vendor) continue;

        const existingBill = await storage.getBillByQboId(account.id, qboBill.Id);
        
        // Get payment terms if available
        let termsId: string | null = null;
        let qboTerms: QBOTerms | null = null;
        
        if (qboBill.SalesTermRef?.value) {
          const existingTerms = await storage.getTermsByQboId(account.id, qboBill.SalesTermRef.value);
          if (existingTerms) {
            termsId = existingTerms.id;
            // Convert database terms to QBO format for calculation
            qboTerms = {
              Id: existingTerms.qboId,
              Name: existingTerms.name,
              Type: existingTerms.type as 'STANDARD' | 'DATE_DRIVEN',
              DueDays: existingTerms.dueDays || undefined,
              DiscountPercent: existingTerms.discountPercent ? parseFloat(existingTerms.discountPercent) : undefined,
              DiscountDays: existingTerms.discountDays || undefined,
              DayOfMonthDue: existingTerms.dayOfMonthDue || undefined,
              DiscountDayOfMonth: existingTerms.discountDayOfMonth || undefined,
              DueNextMonthDays: existingTerms.dueNextMonthDays || undefined,
              Active: existingTerms.active || undefined,
            };
          }
        }

        const billDate = new Date(); // Use current date as bill date
        const dueDate = qboBill.DueDate ? new Date(qboBill.DueDate) : null;
        const discountInfo = this.calculateDiscountInfo(qboBill.TotalAmt, qboTerms, billDate, dueDate);
        
        if (!existingBill) {
          console.log(`Creating new bill: ${qboBill.DocNumber || qboBill.Id} for vendor ${vendor.name}`);
          await storage.createBill({
            accountId: account.id,
            vendorId: vendor.id,
            qboId: qboBill.Id,
            billNumber: qboBill.DocNumber || null,
            amount: qboBill.TotalAmt.toString(),
            balance: (qboBill.Balance || qboBill.TotalAmt).toString(),
            dueDate,
            termsId,
            discountPercent: discountInfo.discountPercent,
            discountAmount: discountInfo.discountAmount,
            discountDueDate: discountInfo.discountDueDate,
            isPaid: qboBill.Balance === 0,
            qboLastSyncAt: new Date(),
          });
        } else {
          // Update existing bill with latest balance and payment status
          console.log(`Updating existing bill: ${qboBill.DocNumber || qboBill.Id} for vendor ${vendor.name}`);
          await storage.updateBill(existingBill.id, {
            balance: (qboBill.Balance || qboBill.TotalAmt).toString(),
            isPaid: qboBill.Balance === 0,
            paidDate: qboBill.Balance === 0 && !existingBill.isPaid ? new Date() : existingBill.paidDate,
            termsId,
            discountPercent: discountInfo.discountPercent,
            discountAmount: discountInfo.discountAmount,
            discountDueDate: discountInfo.discountDueDate,
            qboLastSyncAt: new Date(),
          });
        }
      }

      // Create timeline event for bills sync
      await storage.createTimelineEvent({
        accountId: account.id,
        eventType: 'qbo_sync',
        title: 'Bills sync completed',
        description: `${bills.length} bills synced`,
      });

    } catch (error) {
      console.error('Error syncing bills:', error);
      throw error;
    }
  }
}

export const quickbooksService = new QuickBooksService();
