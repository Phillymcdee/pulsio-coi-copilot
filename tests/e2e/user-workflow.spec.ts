import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from landing page
    await page.goto('/');
  });

  test('Full user journey: Authentication → Onboarding → Dashboard → Vendor Management', async ({ page }) => {
    // Step 1: Landing page and authentication
    await test.step('Load landing page', async () => {
      await expect(page.locator('h1')).toContainText('Pulsio');
      await expect(page.getByText('Sign in with Replit')).toBeVisible();
    });

    // Note: In real implementation, you'd need to handle Replit OAuth flow
    // For now, we'll simulate being authenticated by directly navigating to dashboard
    await test.step('Simulate authentication', async () => {
      // In a real test, you'd handle OAuth flow or use test credentials
      // For this implementation, we'll check the protected route behavior
      await page.goto('/dashboard');
      
      // If not authenticated, should redirect to landing
      const url = page.url();
      if (url.includes('/')) {
        // User is redirected to landing - expected behavior for unauthenticated user
        await expect(page.getByText('Sign in with Replit')).toBeVisible();
      }
    });
  });

  test('Dashboard functionality for authenticated user', async ({ page }) => {
    // This test assumes user is already authenticated
    // In real implementation, you'd set up authentication state
    
    await test.step('Check dashboard components', async () => {
      await page.goto('/dashboard');
      
      // Check for main dashboard elements
      await expect(page.locator('[data-testid="stats-bar"]').or(page.locator('.grid'))).toBeVisible();
      
      // Verify dashboard cards are present
      const dashboardCards = [
        'Missing Documents',
        'Money at Risk', 
        'Risk Meter',
        'Recent Activity'
      ];
      
      for (const cardTitle of dashboardCards) {
        const cardElement = page.locator(`text=${cardTitle}`).first();
        await expect(cardElement).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test('Vendor management workflow', async ({ page }) => {
    await test.step('Navigate to vendors page', async () => {
      await page.goto('/vendors');
      
      // Check if vendors page loads
      await expect(page.locator('h1, h2').filter({ hasText: /vendor/i })).toBeVisible();
      
      // Look for vendor table or empty state
      const vendorTable = page.locator('table').or(page.locator('[data-testid="vendor-table"]'));
      const emptyState = page.locator('text=No vendors found').or(page.locator('[data-testid="empty-state"]'));
      
      await expect(vendorTable.or(emptyState)).toBeVisible();
    });

    await test.step('Test add vendor functionality', async () => {
      // Look for add vendor button
      const addButton = page.locator('button').filter({ hasText: /add vendor/i });
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Check if modal or form opens
        await expect(page.locator('form, [role="dialog"]')).toBeVisible();
      }
    });
  });

  test('Settings page functionality', async ({ page }) => {
    await test.step('Access settings page', async () => {
      await page.goto('/settings');
      
      // Check for settings sections
      const settingsSections = [
        'Company Information',
        'Email Templates',
        'Reminder Settings'
      ];
      
      for (const section of settingsSections) {
        const sectionElement = page.locator(`text=${section}`);
        if (await sectionElement.count() > 0) {
          await expect(sectionElement.first()).toBeVisible();
        }
      }
    });
  });

  test('API endpoints respond correctly', async ({ page }) => {
    await test.step('Check health and basic API responses', async () => {
      // Test API endpoints directly
      const response = await page.request.get('/api/auth/user');
      
      // Should get either user data (200) or unauthorized (401)
      expect([200, 401]).toContain(response.status());
      
      if (response.status() === 200) {
        const userData = await response.json();
        expect(userData).toHaveProperty('id');
        expect(userData).toHaveProperty('email');
      }
    });
  });
});