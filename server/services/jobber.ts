import { storage } from '../storage';
import { logger } from './logger';

/**
 * Jobber OAuth 2.0 and GraphQL API Service
 * Handles authentication, token management, and API queries for Jobber integration
 */

const JOBBER_API_BASE = 'https://api.getjobber.com';
const JOBBER_AUTH_URL = `${JOBBER_API_BASE}/api/oauth/authorize`;
const JOBBER_TOKEN_URL = `${JOBBER_API_BASE}/api/oauth/token`;
const JOBBER_GRAPHQL_URL = `${JOBBER_API_BASE}/api/graphql`;

interface JobberTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  accountId: string; // Jobber account ID from token response
}

class JobberService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.JOBBER_CLIENT_ID || '';
    this.clientSecret = process.env.JOBBER_CLIENT_SECRET || '';
    this.redirectUri = process.env.JOBBER_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret) {
      logger.warn('Jobber OAuth credentials not configured');
    }
  }

  /**
   * Generate Jobber OAuth authorization URL
   * @param accountId - App account ID (used as state parameter)
   * @returns Authorization URL
   */
  getAuthUrl(accountId: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'clients:read,clients:write,jobs:read', // Add more scopes as needed
      state: accountId, // Pass account ID as state
    });

    return `${JOBBER_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access/refresh tokens
   * @param code - Authorization code from callback
   * @returns Token information
   */
  async exchangeCodeForTokens(code: string): Promise<JobberTokens> {
    try {
      const response = await fetch(JOBBER_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Jobber token exchange failed: ${error}`);
      }

      const data = await response.json();
      
      // Extract account ID from access token or response
      // Note: Jobber might include account info in the response - adjust as needed
      const accountId = data.account_id || 'unknown';

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
        accountId,
      };
    } catch (error) {
      logger.error('Jobber token exchange error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Refresh expired access token
   * @param accountId - App account ID
   * @returns New token information
   */
  async refreshAccessToken(accountId: string): Promise<JobberTokens> {
    try {
      const account = await storage.getAccount(accountId);
      if (!account?.jobberRefreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await fetch(JOBBER_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: account.jobberRefreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Jobber token refresh failed: ${error}`);
      }

      const data = await response.json();

      // Update tokens in database
      await storage.updateAccount(accountId, {
        jobberAccessToken: data.access_token,
        jobberRefreshToken: data.refresh_token || account.jobberRefreshToken,
        jobberTokenExpiry: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      } as any);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || account.jobberRefreshToken,
        expiresIn: data.expires_in || 3600,
        accountId: account.jobberAccountId || 'unknown',
      };
    } catch (error) {
      logger.error('Jobber token refresh error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if expired)
   * @param accountId - App account ID
   * @returns Valid access token
   */
  private async getValidAccessToken(accountId: string): Promise<string> {
    const account = await storage.getAccount(accountId);
    if (!account?.jobberAccessToken) {
      throw new Error('Jobber not connected');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (!account.jobberTokenExpiry || account.jobberTokenExpiry < expiryBuffer) {
      logger.info('Jobber token expired or about to expire, refreshing...');
      const tokens = await this.refreshAccessToken(accountId);
      return tokens.accessToken;
    }

    return account.jobberAccessToken;
  }

  /**
   * Execute GraphQL query against Jobber API
   * @param accountId - App account ID
   * @param query - GraphQL query string
   * @param variables - Query variables
   * @returns Query result
   */
  async executeGraphQL(accountId: string, query: string, variables: Record<string, any> = {}): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken(accountId);

      const response = await fetch(JOBBER_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Jobber GraphQL request failed: ${error}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`Jobber GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      logger.error('Jobber GraphQL execution error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Fetch clients (vendors) from Jobber
   * @param accountId - App account ID
   * @param cursor - Pagination cursor
   * @param limit - Number of clients to fetch
   * @returns Client data with pagination info
   */
  async fetchClients(accountId: string, cursor?: string, limit: number = 50): Promise<any> {
    const query = `
      query GetClients($cursor: String, $limit: Int!) {
        clients(first: $limit, after: $cursor) {
          nodes {
            id
            firstName
            lastName
            companyName
            emails {
              address
              primary
            }
            phones {
              number
              primary
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    return await this.executeGraphQL(accountId, query, { cursor, limit } as Record<string, any>);
  }

  /**
   * Fetch a single client by ID
   * @param accountId - App account ID
   * @param clientId - Jobber client ID
   * @returns Client data
   */
  async fetchClient(accountId: string, clientId: string): Promise<any> {
    const query = `
      query GetClient($clientId: ID!) {
        client(id: $clientId) {
          id
          firstName
          lastName
          companyName
          emails {
            address
            primary
          }
          phones {
            number
            primary
          }
        }
      }
    `;

    const result = await this.executeGraphQL(accountId, query, { clientId } as Record<string, any>);
    return result.client;
  }

  /**
   * Fetch jobs from Jobber
   * @param accountId - App account ID
   * @param cursor - Pagination cursor
   * @param limit - Number of jobs to fetch
   * @returns Job data with pagination info
   */
  async fetchJobs(accountId: string, cursor?: string, limit: number = 50): Promise<any> {
    const query = `
      query GetJobs($cursor: String, $limit: Int!) {
        jobs(first: $limit, after: $cursor) {
          nodes {
            id
            title
            status
            client {
              id
              companyName
            }
            createdAt
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    return await this.executeGraphQL(accountId, query, { cursor, limit } as Record<string, any>);
  }

  /**
   * Sync all clients from Jobber to local database
   * @param accountId - App account ID
   */
  async syncClients(accountId: string): Promise<void> {
    try {
      logger.info(`Starting Jobber client sync for account: ${accountId}`);
      
      let hasMore = true;
      let cursor: string | undefined = undefined;
      let totalSynced = 0;

      while (hasMore) {
        const result = await this.fetchClients(accountId, cursor);
        const clients = result.clients.nodes;
        const pageInfo = result.clients.pageInfo;

        for (const client of clients) {
          // Get primary email and phone
          const primaryEmail = client.emails?.find((e: any) => e.primary)?.address || client.emails?.[0]?.address;
          const primaryPhone = client.phones?.find((p: any) => p.primary)?.number || client.phones?.[0]?.number;
          
          const name = client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim();

          // Check if vendor exists by Jobber ID
          const existingVendor = await storage.getVendorByJobberId(accountId, client.id);

          if (existingVendor) {
            // Update existing vendor (preserve user overrides)
            await storage.updateVendor(existingVendor.id, {
              // Only update if not overridden by user
              ...(existingVendor.nameOverride ? {} : { name }),
              ...(existingVendor.emailOverride ? {} : { email: primaryEmail }),
              ...(existingVendor.phoneOverride ? {} : { phone: primaryPhone }),
            });
          } else {
            // Create new vendor
            await storage.createVendor({
              accountId,
              jobberId: client.id,
              name,
              email: primaryEmail,
              phone: primaryPhone,
              w9Status: 'MISSING',
              coiStatus: 'MISSING',
            });
          }

          totalSynced++;
        }

        hasMore = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;
      }

      logger.info(`Jobber client sync completed: ${totalSynced} clients synced`);
    } catch (error) {
      logger.error('Jobber client sync error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Disconnect app from Jobber (notify Jobber via appDisconnect mutation)
   * @param accountId - App account ID
   */
  async disconnectApp(accountId: string): Promise<void> {
    try {
      const account = await storage.getAccount(accountId);
      if (!account?.jobberAccountId) {
        throw new Error('Jobber account ID not found');
      }

      const mutation = `
        mutation AppDisconnect($accountId: ID!) {
          appDisconnect(input: { accountId: $accountId }) {
            success
            userErrors {
              message
            }
          }
        }
      `;

      await this.executeGraphQL(accountId, mutation, { accountId: account.jobberAccountId } as Record<string, any>);
      
      // Clear Jobber tokens from database
      await storage.updateAccount(accountId, {
        jobberAccountId: null as any,
        jobberAccessToken: null as any,
        jobberRefreshToken: null as any,
        jobberTokenExpiry: null as any,
      });

      logger.info(`Jobber app disconnected for account: ${accountId}`);
    } catch (error) {
      logger.error('Jobber app disconnect error', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

export const jobberService = new JobberService();
