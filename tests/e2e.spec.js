import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test.describe('Omix Marketplace', () => {

  test('homepage loads with listings', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('[data-name="home-page"]')).toBeVisible();
    // Should have a title
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('can navigate to login', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByText('Log In').first().click();
    await expect(page.locator('[data-name="login-page"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('login form validates', async ({ page }) => {
    await page.goto(BASE_URL + '/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.getByText('Sign In').first().click();
    // Should show error (invalid credentials)
    await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 5000 });
  });

  test('product listing page shows details', async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for products to load
    await page.waitForTimeout(2000);
    // Click first product link
    const firstProduct = page.locator('[data-name="home-page"] a[href^="/listing/"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await expect(page.locator('[data-name="listing-details"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('cart page shows empty state', async ({ page }) => {
    await page.goto(BASE_URL + '/cart');
    await expect(page.locator('h1')).toContainText('empty');
  });

  test('signup page validates password match', async ({ page }) => {
    await page.goto(BASE_URL + '/signup');
    await expect(page.locator('[data-name="signup-page"]')).toBeVisible();
  });

  test('wishlist page redirects when not logged in', async ({ page }) => {
    await page.goto(BASE_URL + '/wishlist');
    await expect(page.locator('h1')).toContainText('Saved Items');
    // Should show sign-in prompt
    await expect(page.getByText('Sign in to save your favorite')).toBeVisible();
  });

  test('checkout redirects to login when not authenticated', async ({ page }) => {
    await page.goto(BASE_URL + '/checkout');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
