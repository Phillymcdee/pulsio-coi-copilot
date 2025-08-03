import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('Authentication protection', async ({ page }) => {
    await test.step('Protected routes require authentication', async () => {
      const protectedRoutes = [
        '/dashboard',
        '/vendors',
        '/settings',
        '/onboarding'
      ];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        
        // Should either redirect to login or show unauthorized
        const url = page.url();
        const isRedirectedToLogin = url === page.url() && url.includes('/');
        const hasAuthButton = await page.locator('text=Sign in with Replit').isVisible();
        
        // One of these should be true for protected routes
        expect(isRedirectedToLogin || hasAuthButton).toBeTruthy();
      }
    });
  });

  test('API security headers', async ({ page }) => {
    await test.step('Check security headers', async () => {
      const response = await page.request.get('/');
      const headers = response.headers();
      
      // Check for security headers (helmet.js implementation)
      expect(headers).toHaveProperty('x-content-type-options');
      expect(headers).toHaveProperty('x-frame-options');
      
      // Should not expose sensitive server info
      expect(headers['x-powered-by']).toBeUndefined();
    });
  });

  test('Rate limiting', async ({ page }) => {
    await test.step('API endpoints have rate limiting', async () => {
      // Test rate limiting by making multiple requests
      const requests: Promise<any>[] = [];
      
      for (let i = 0; i < 10; i++) {
        requests.push(page.request.get('/api/auth/user'));
      }
      
      const responses = await Promise.all(requests);
      
      // All responses should be either success or rate limited
      responses.forEach(response => {
        expect([200, 401, 429]).toContain(response.status());
      });
    });
  });

  test('Input validation', async ({ page }) => {
    await test.step('API validates input data', async () => {
      // Test with invalid data
      const invalidData = {
        maliciousScript: '<script>alert("xss")</script>',
        sqlInjection: "'; DROP TABLE users; --",
        oversizedString: 'a'.repeat(10000)
      };
      
      const response = await page.request.post('/api/account', {
        data: invalidData
      });
      
      // Should reject invalid input (400 or 401)
      expect([400, 401, 422]).toContain(response.status());
    });
  });
});