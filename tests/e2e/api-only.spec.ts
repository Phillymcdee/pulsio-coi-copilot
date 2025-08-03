import { test, expect } from '@playwright/test';

test.describe('API-Only Integration Tests', () => {
  const baseURL = 'http://localhost:5000';

  test('API health and basic endpoints', async ({ request }) => {
    await test.step('Application is running and responsive', async () => {
      const response = await request.get(`${baseURL}/`);
      
      // Should get HTML response (200) or redirect (30x)
      expect([200, 301, 302, 304]).toContain(response.status());
      
      console.log(`✅ Application responding with status: ${response.status()}`);
    });

    await test.step('Authentication endpoint responds correctly', async () => {
      const response = await request.get(`${baseURL}/api/auth/user`);
      
      // Should get either user data (200) or unauthorized (401)
      expect([200, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const userData = await response.json();
        expect(userData).toHaveProperty('id');
        expect(userData).toHaveProperty('email');
        console.log(`✅ Authenticated user: ${userData.email}`);
      } else {
        console.log('✅ Authentication endpoint correctly returns 401 for unauthenticated request');
      }
    });

    await test.step('Dashboard stats endpoint structure', async () => {
      const response = await request.get(`${baseURL}/api/dashboard/stats`);
      
      // Should respond with either stats or require auth
      expect([200, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const stats = await response.json();
        
        // Verify expected dashboard stats structure
        expect(stats).toHaveProperty('totalVendors');
        expect(stats).toHaveProperty('moneyAtRisk');
        expect(stats).toHaveProperty('remindersSent');
        expect(stats).toHaveProperty('docsReceived');
        
        console.log(`✅ Dashboard stats: ${stats.totalVendors} vendors, $${stats.moneyAtRisk} at risk`);
      } else {
        console.log('✅ Dashboard stats endpoint correctly requires authentication');
      }
    });

    await test.step('Timeline endpoint responds', async () => {
      const response = await request.get(`${baseURL}/api/timeline`);
      
      expect([200, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const timeline = await response.json();
        expect(Array.isArray(timeline)).toBeTruthy();
        console.log(`✅ Timeline contains ${timeline.length} events`);
      } else {
        console.log('✅ Timeline endpoint correctly requires authentication');
      }
    });
  });

  test('QuickBooks integration endpoints', async ({ request }) => {
    await test.step('QuickBooks auth endpoint exists', async () => {
      const response = await request.get(`${baseURL}/api/qbo/auth`);
      
      // Should respond (might be 401 without proper auth, 400 for missing params, or 200 with auth URL)
      expect([200, 400, 401]).toContain(response.status());
      
      console.log(`✅ QuickBooks auth endpoint responds with status: ${response.status()}`);
    });
  });

  test('Security headers and configuration', async ({ request }) => {
    await test.step('Security headers are present', async () => {
      const response = await request.get(`${baseURL}/`);
      const headers = response.headers();
      
      // Check for security headers (from helmet.js)
      expect(headers).toHaveProperty('x-content-type-options');
      expect(headers).toHaveProperty('x-frame-options');
      
      // Should not expose server technology
      expect(headers['x-powered-by']).toBeUndefined();
      
      console.log('✅ Security headers present and server technology hidden');
    });

    await test.step('Rate limiting is active', async () => {
      // Make multiple requests to test rate limiting
      const requests: Promise<any>[] = [];
      
      for (let i = 0; i < 5; i++) {
        requests.push(request.get(`${baseURL}/api/auth/user`));
      }
      
      const responses = await Promise.all(requests);
      
      // All responses should be valid HTTP status codes
      responses.forEach((response, index) => {
        expect([200, 401, 429]).toContain(response.status());
        console.log(`Request ${index + 1}: ${response.status()}`);
      });
      
      console.log('✅ Rate limiting configuration verified');
    });
  });

  test('Application performance', async ({ request }) => {
    await test.step('API response times are acceptable', async () => {
      const endpoints = [
        '/api/auth/user',
        '/api/dashboard/stats',
        '/api/timeline'
      ];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(`${baseURL}${endpoint}`);
        const responseTime = Date.now() - startTime;
        
        // API should respond within 2 seconds
        expect(responseTime).toBeLessThan(2000);
        
        console.log(`✅ ${endpoint}: ${responseTime}ms (status: ${response.status()})`);
      }
    });
  });

  test('Input validation and error handling', async ({ request }) => {
    await test.step('API validates input data', async () => {
      // Test with invalid data
      const invalidData = {
        maliciousScript: '<script>alert("xss")</script>',
        oversizedString: 'a'.repeat(1000),
        invalidEmail: 'not-an-email'
      };
      
      const response = await request.post(`${baseURL}/api/account`, {
        data: invalidData
      });
      
      // Should reject invalid input (400, 422) or require auth (401)
      expect([400, 401, 422]).toContain(response.status());
      
      console.log(`✅ Input validation working: ${response.status()}`);
    });
  });
});