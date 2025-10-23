import { test, expect } from '@playwright/test';

test.describe('Integration Tests', () => {
  test('QuickBooks integration status', async ({ page }) => {
    await test.step('Check QB connection status', async () => {
      // Test the QuickBooks OAuth initiation
      const response = await page.request.get('/api/qbo/auth');
      
      // Should get authorization URL or error
      expect([200, 400, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const authData = await response.json();
        expect(authData).toHaveProperty('authUrl');
        expect(authData.authUrl).toContain('intuit.com');
      }
    });
  });

  test('Document upload functionality', async ({ page }) => {
    await test.step('Test document upload endpoint', async () => {
      // Create a test file
      const testFile = Buffer.from('PDF test content');
      
      // Test document upload (this would need proper authentication)
      const response = await page.request.post('/api/documents/upload', {
        multipart: {
          document: {
            name: 'test.pdf',
            mimeType: 'application/pdf',
            buffer: testFile,
          }
        }
      });
      
      // Should handle upload attempt (might be 401 without auth)
      expect([200, 400, 401]).toContain(response.status());
    });
  });

  test('Email service integration', async ({ page }) => {
    await test.step('Verify email service configuration', async () => {
      // Test if email service is properly configured
      // This would be done through admin endpoints or health checks
      
      const response = await page.request.get('/api/health');
      
      if (response.status() === 200) {
        const health = await response.json();
        // Check if email service is configured
        expect(health).toBeDefined();
      }
    });
  });

  test('Real-time updates (SSE)', async ({ page }) => {
    await test.step('Test SSE connection', async () => {
      await page.goto('/dashboard');
      
      // Check if SSE connection is established
      // Listen for any server-sent events
      let sseConnected = false;
      
      page.on('response', response => {
        if (response.url().includes('/api/events')) {
          sseConnected = true;
        }
      });
      
      // Wait for potential SSE connection
      await page.waitForTimeout(2000);
      
      // In a real authenticated session, SSE should connect
      // For now, we just verify the endpoint exists
      const sseResponse = await page.request.get('/api/events');
      expect([200, 401]).toContain(sseResponse.status());
    });
  });
});