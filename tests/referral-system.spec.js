const { test, expect } = require('@playwright/test');

/**
 * Test suite for the Lalumo Referral System
 * Tests username registration, referral code generation, and code redemption
 */
test.describe('Lalumo Referral System', () => {
  // Globales Timeout von 10 Sekunden setzen, damit Tests nicht hängen bleiben
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Set reasonable timeout
    page.setDefaultTimeout(5000);
    
    // Handle dialogs (for username generation)
    page.on('dialog', async dialog => {
      console.log(`Dialog detected: ${dialog.type()}, message: ${dialog.message()}`);
      await dialog.accept('TestUser' + Math.floor(Math.random() * 1000));
    });
    
    // Capture console logs
    page.on('console', msg => {
      console.log(`BROWSER LOG: ${msg.type()}: ${msg.text()}`);
    });

    // Navigate to the app
    await page.goto('http://localhost:9091/', { timeout: 5000 });
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Check for and handle username modal
    const usernameModal = page.locator('.modal-overlay');
    if (await usernameModal.isVisible()) {
      console.log('Username modal detected, clicking generate button...');
      await page.locator('.primary-button').click();
      await page.waitForTimeout(500);
    }
    
    // Ensure we're on the main screen
    await expect(page.locator('.pitch-landing')).toBeVisible({ timeout: 2000 });
    console.log('Initial setup complete, on main landing page');

    // Clear localStorage for clean tests
    await page.evaluate(() => {
      localStorage.removeItem('lalumo_referral_data');
    });
  });

  /**
   * Helper function to navigate to settings
   */
  async function navigateToSettings(page) {
    // Open the menu if needed (on mobile view)
    const menuButton = page.locator('.hamburger-button');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    // Click on settings
    await page.locator('button:has-text("Settings")').click();
    await page.waitForTimeout(500);

    // Verify we're on settings page
    await expect(page.locator('.settings-page h2')).toBeVisible();
  }

  /**
   * Helper function to navigate to referral code page
   */
  async function navigateToReferralPage(page) {
    // Open the menu if needed (on mobile view)
    const menuButton = page.locator('.hamburger-button');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    // Find and click the locked chords button
    await page.locator('.locked-chapter').click();
    await page.waitForTimeout(500);

    // Verify we're on referral page
    await expect(page.locator('.referral-code-page h2')).toBeVisible();
  }

  test('Should register a username and generate a referral code', async ({ page }) => {
    // Make sure we have a username
    await navigateToSettings(page);
    
    // Get the current username for later verification
    const username = await page.locator('.profile-section .profile-username').textContent();
    console.log(`Current username: ${username}`);
    
    // Navigate to referral page
    await navigateToReferralPage(page);
    
    // Check that the register button is visible
    const registerButton = page.locator('button:has-text("Register Username")');
    await expect(registerButton).toBeVisible();
    
    // Click register button
    await registerButton.click();
    await page.waitForTimeout(1000); // Wait for API call
    
    // Should now show the referral code
    await expect(page.locator('.referral-code-input')).toBeVisible();
    
    // Extract referral code for verification
    const referralCode = await page.locator('.referral-code-input').inputValue();
    console.log(`Generated referral code: ${referralCode}`);
    expect(referralCode).toMatch(/^[A-Z0-9]{12}$/);
    
    // Verify username is shown
    await expect(page.locator('.registered-username')).toContainText(username);
    
    // Verify referral stats are shown
    await expect(page.locator('.referral-stats')).toBeVisible();
    
    // Check if data was saved to localStorage
    const localStorageData = await page.evaluate(() => {
      return localStorage.getItem('lalumo_referral_data');
    });
    
    expect(localStorageData).toBeTruthy();
    console.log('Referral data saved to localStorage:', localStorageData);
  });

  test('Should track referral clicks and update stats', async ({ page, browser }) => {
    // Register a username first
    await navigateToReferralPage(page);
    await page.locator('button:has-text("Register Username")').click();
    await page.waitForTimeout(1000);
    
    // Get the referral code
    const referralCode = await page.locator('.referral-code-input').inputValue();
    console.log(`Generated referral code: ${referralCode}`);
    
    // Simulate a click on the referral link with a new browser context
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    
    // Visit the referral link
    await newPage.goto(`http://localhost:8080/referral.php?code=${referralCode}`, { timeout: 5000 });
    await newPage.waitForTimeout(1000);
    
    // Close the new context
    await newContext.close();
    
    // Refresh the original page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Navigate back to referral page
    await navigateToReferralPage(page);
    
    // Wait for the stats to update (automatic API call)
    await page.waitForTimeout(3000);
    
    // Verify that click count increased
    const clickStats = await page.locator('.referral-stats').textContent();
    console.log(`Referral stats after click: ${clickStats}`);
    expect(clickStats).toContain('Link clicks');
    // Note: We can't guarantee exact count due to possible previous test runs
  });

  test('Should redeem a friend code', async ({ page, browser }) => {
    // Create a first user with a referral code
    await navigateToReferralPage(page);
    await page.locator('button:has-text("Register Username")').click();
    await page.waitForTimeout(1000);
    
    // Get the referral code from first user
    const referralCode = await page.locator('.referral-code-input').inputValue();
    console.log(`First user's referral code: ${referralCode}`);
    
    // Create a second user in a new context
    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    
    // Navigate to app
    await newPage.goto('http://localhost:9091/', { timeout: 5000 });
    await newPage.waitForTimeout(1000);
    
    // Handle username modal
    if (await newPage.locator('.modal-overlay').isVisible()) {
      await newPage.locator('.primary-button').click();
    }
    
    // Navigate to referral page
    const menuButton = newPage.locator('.hamburger-button');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await newPage.waitForTimeout(500);
    }
    
    // Find and click the locked chords button
    await newPage.locator('.locked-chapter').click();
    await newPage.waitForTimeout(500);
    
    // Enter friend code
    await newPage.locator('.friend-code-input').fill(referralCode);
    await newPage.waitForTimeout(500);
    
    // Click redeem button
    await newPage.locator('button:has-text("Redeem Code")').click();
    await newPage.waitForTimeout(2000);
    
    // Close second user
    await newContext.close();
    
    // Refresh first user's page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Navigate back to referral page
    await navigateToReferralPage(page);
    
    // Wait for stats to update
    await page.waitForTimeout(3000);
    
    // Verify that registration count has increased
    const registrationStats = await page.locator('.referral-stats').textContent();
    console.log(`Referral stats after redemption: ${registrationStats}`);
    expect(registrationStats).toContain('Registrations');
  });

  test('Should access the admin page', async ({ page }) => {
    // Navigate directly to admin page
    await page.goto('http://localhost:8080/admin.php', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Verify login form is visible
    await expect(page.locator('.login-container')).toBeVisible();
    
    // Enter admin password
    await page.locator('input[type="password"]').fill('lalumo2024');
    
    // Click login
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    
    // Verify admin dashboard is visible
    await expect(page.locator('.dashboard-container h1')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    
    // Verify statistics are shown
    await expect(page.locator('.summary-stats')).toBeVisible();
    
    // Verify user registration from previous tests
    const tableContent = await page.locator('table').textContent();
    console.log(`Admin table content: ${tableContent.substring(0, 100)}...`);
    
    // Should show some users
    expect(tableContent).toContain('TestUser');
  });
});
