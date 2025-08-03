import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Page load performance', async ({ page }) => {
    await test.step('Landing page loads quickly', async () => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    await test.step('Dashboard loads within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 5 seconds (includes API calls)
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test('API response times', async ({ page }) => {
    await test.step('API endpoints respond quickly', async () => {
      const endpoints = [
        '/api/auth/user',
        '/api/dashboard/stats',
        '/api/timeline'
      ];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await page.request.get(endpoint);
        const responseTime = Date.now() - startTime;
        
        // API should respond within 2 seconds
        expect(responseTime).toBeLessThan(2000);
        
        // Should get valid HTTP status
        expect([200, 401, 404]).toContain(response.status());
      }
    });
  });

  test('Bundle size and assets', async ({ page }) => {
    await test.step('Check bundle size', async () => {
      await page.goto('/');
      
      // Listen for all network requests
      const responses: any[] = [];
      page.on('response', response => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          responses.push({
            url: response.url(),
            size: response.headers()['content-length']
          });
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // Calculate total bundle size
      const totalSize = responses.reduce((sum, resp) => {
        const size = parseInt(resp.size || '0');
        return sum + size;
      }, 0);
      
      // Bundle should be reasonable (under 2MB uncompressed)
      expect(totalSize).toBeLessThan(2 * 1024 * 1024);
    });
  });
});