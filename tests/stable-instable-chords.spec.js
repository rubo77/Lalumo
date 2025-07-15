// @ts-check
const { test, expect } = require('@playwright/test');

// Set a global timeout for all tests
test.setTimeout(30000); // Increased timeout for audio activities

/**
 * Test for the 2_2 Stable/Instable Chords activity
 * 
 * Test flow:
 * 1. Accept the username (if prompted)
 * 2. Navigate to the Chords section
 * 3. Open the Stable/Instable Chords activity
 * 4. Test the play button functionality
 * 5. Test the Stable/Instable buttons and feedback
 * 6. Verify progress tracking
 */
test.describe('Lalumo Stable/Instable Chords Activity', () => {
  test.beforeEach(async ({ page }) => {
    // Set default timeout
    page.setDefaultTimeout(30000);
    
    // Handle dialogs (for username generation)
    page.on('dialog', async dialog => {
      console.log(`Dialog detected: ${dialog.type()}, message: ${dialog.message()}`);
      await dialog.accept('TestUser' + Math.floor(Math.random() * 1000));
    });
    
    // Capture console logs
    page.on('console', msg => {
      console.log(`BROWSER LOG [${msg.type()}]: ${msg.text()}`);
    });

    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:9091/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/initial-load.png' });
    
    // Check if we need to click the Web App Version button
    const webAppButton = page.locator('button:has-text("🎵 Web App Version")');
    if (await webAppButton.count() > 0) {
      console.log('Clicking Web App Version button');
      await webAppButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to 2_2 activity and test chord functionality', async ({ page }) => {
    // Listen for console errors and log them
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`BROWSER ERROR: ${msg.text()}`);
      }
    });
    
    // Listen for JavaScript errors
    page.on('pageerror', error => {
      console.log(`BROWSER JS ERROR: ${error.message}`);
    });

    console.log('Starting Stable/Instable Chords activity test');
    
    // Handle username dialog if it appears
    try {
      const isDialogVisible = await page.isVisible('.modal-overlay');
      if (isDialogVisible) {
        await page.click('.primary-button');
        console.log('Clicked on Generate Random Name button');
        await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 5000 });
      }
    } catch (e) {
      console.log('Skipping username dialog handling:', e.message);
    }
    
    // Navigate to Chords section with more robust selectors
    console.log('Navigating to Chords section...');
    
    // First, ensure we're on a page with the Chords button
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the initial page
    await page.screenshot({ path: 'test-results/initial-page.png' });
    
    // First, check if the menu is already open - if not, click the hamburger button
    console.log('Checking if menu is open...');
    const menuContent = page.locator('.menu-content');    
    const isMenuOpen = await menuContent.evaluate(node => 
      node && window.getComputedStyle(node).display !== 'none' && window.getComputedStyle(node).visibility !== 'hidden'
    );
    
    if (!isMenuOpen) {
      console.log('Menu is closed, opening it...');
      const hamburgerButton = page.locator('.hamburger-button').first();
      await expect(hamburgerButton).toBeVisible({ timeout: 10000 });
      await hamburgerButton.click();
      await page.waitForTimeout(1000); // Wait for menu animation
    }
    
    // Take a screenshot of the menu
    await page.screenshot({ path: 'test-results/menu-open.png' });
    
    // Look for the Chords button in both locked and unlocked states
    console.log('Looking for Chords button...');
    const chordsButtonSelectors = [
      // Unlocked state
      '//div[contains(@class, "menu-chapters")]//button[.//span[contains(text(), "Chords")]]',
      // Locked state
      '//div[contains(@class, "menu-chapters")]//button[.//span[contains(text(), "🔒")]]/span[contains(text(), "Chords")]/..',
      // Debug button
      '//button[contains(@class, "debug-element")]//span[contains(text(), "Chords")]/..'
    ];
    
    let chordsButton;
    for (const selector of chordsButtonSelectors) {
      const button = page.locator(selector).first();
      const count = await button.count();
      if (count > 0) {
        chordsButton = button;
        console.log(`Found Chords button with selector: ${selector}`);
        break;
      }
    }
    
    if (!chordsButton) {
      throw new Error('Could not find Chords button with any selector');
    }
    
    // Take a screenshot before clicking the button
    await page.screenshot({ path: 'test-results/before-chords-click.png' });
    
    // Click the Chords button
    console.log('Clicking Chords button...');
    await chordsButton.click({ timeout: 10000 });
    console.log('Clicked Chords button');
    
    // Wait for the menu to update
    console.log('Waiting for menu to update...');
    await page.waitForTimeout(2000);
    
    // Take a screenshot after menu update
    await page.screenshot({ path: 'test-results/after-chords-click.png' });
    
    // Now find and click the Stable or Instable button
    console.log('Looking for Stable or Instable button...');
    const stableInstableButton = page.locator('button#nav_2_2').first();
    await expect(stableInstableButton).toBeVisible({ timeout: 15000 });
    console.log('Found Stable/Instable button with ID nav_2_2');
    
    // Take a screenshot before clicking the button
    await page.screenshot({ path: 'test-results/before-stable-instable-click.png' });
    
    // Click the button
    console.log('Clicking Stable or Instable button...');
    await stableInstableButton.click({ timeout: 10000 });
    console.log('Clicked Stable or Instable button');
    
    // Wait for the activity to load
    console.log('Waiting for activity to load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Additional wait for the activity to initialize
    
    // Check for the activity container - it should have ID 2_2_chords_stable_instable and be visible
    console.log('Looking for activity container...');
    const activityContainer = page.locator('div#2_2_chords_stable_instable').first();
    await expect(activityContainer).toBeVisible({ timeout: 15000 });
    console.log('Activity container is visible');
    
    // Take a screenshot of the loaded activity
    await page.screenshot({ path: 'test-results/activity-loaded.png' });
    
    console.log('Waiting for play button...');
    const playButtonSelectors = [
      'button.play-button',
      '//button[contains(@class, "play-button")]',
      '#2_2_chords_stable_instable .play-button',
      'button:has-text("Play")',
      'button:has-text("▶️")'
    ];
    
    let playButton;
    for (const selector of playButtonSelectors) {
      try {
        playButton = page.locator(selector).first();
        await playButton.waitFor({ state: 'visible', timeout: 5000 });
        console.log(`Found play button with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`Play button not found with selector: ${selector}`);
      }
    }
    
    if (!playButton) {
      throw new Error('Could not find play button with any selector');
    }
    
    console.log('Play button is visible');
    
    // Test the play button
    console.log('Testing play button');
    const testPlayButton = page.locator('button.play-button').first();
    await expect(testPlayButton).toBeVisible({ timeout: 15000 });
    
    // Take a screenshot before clicking for debugging
    await page.screenshot({ path: 'test-results/before-play-click.png' });
    
    console.log('Clicking play button');
    await testPlayButton.click({ timeout: 15000 });
    
    // Wait for audio to start (we can't directly verify audio playback in Playwright)
    console.log('Waiting for audio to play...');
    await page.waitForTimeout(3000); // Increased timeout for audio to play
    
    // Take a screenshot after playing
    await page.screenshot({ path: 'test-results/after-play-click.png' });
    
    // Test the Stable button
    console.log('Testing Stable button');
    const stableButton = page.locator('#button_2_2_stable').first();
    await expect(stableButton).toBeVisible({ timeout: 10000 });
    
    // Take a screenshot before clicking stable button
    await page.screenshot({ path: 'test-results/before-stable-click.png' });
    
    // Click the Stable button and check for feedback
    console.log('Clicking Stable button');
    await stableButton.click({ timeout: 10000 });
    
    // Wait for feedback to appear
    console.log('Waiting for feedback...');
    const feedbackMessage = page.locator('.feedback-message').first();
    await expect(feedbackMessage).toBeVisible({ timeout: 10000 });
    console.log('Feedback message appeared');
    
    // Take a screenshot of feedback
    await page.screenshot({ path: 'test-results/after-feedback.png' });
    
    // Wait for feedback animation
    await page.waitForTimeout(2000);
    
    // Test the Instable button
    console.log('Testing Instable button');
    const instableButton = page.locator('#button_2_2_instable').first();
    await expect(instableButton).toBeVisible({ timeout: 10000 });
    
    // Take a screenshot before clicking instable button
    await page.screenshot({ path: 'test-results/before-instable-click.png' });
    
    // Click the Instable button and check for feedback
    console.log('Clicking Instable button');
    await instableButton.click({ timeout: 10000 });
    
    // Wait for feedback
    console.log('Waiting for feedback...');
    await page.waitForTimeout(2000);
    
    // Take a final screenshot
    await page.screenshot({ path: 'test-results/after-instability-test.png' });
    
    // Test progress tracking
    console.log('Testing progress tracking');
    try {
      const progressText = await page.locator('.progress_2_2 p:first-child').innerText();
      const progressMatch = progressText.match(/\d+/);
      const initialProgress = progressMatch ? parseInt(progressMatch[0]) : 0;
      console.log(`Initial progress: ${initialProgress}`);
    } catch (error) {
      console.log('Could not verify progress tracking:', error.message);
    }
    
    // Take a screenshot at the end
    await page.screenshot({ path: 'test-results/stable-instable-test.png' });
    
    console.log('Stable/Instable Chords activity test completed');
    
    // Set up a mock progress value in the middle of a level (e.g., 12)
    await page.evaluate(() => {
      const progress = { '2_2_chords_stable_instable': 12 };
      localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
      // The component should pick up the progress from localStorage
    });
    
    // Refresh to apply the progress
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get the current progress with a default value
    const initialProgress = await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('lalumo_chords_progress') || '{}');
      return progress['2_2_chords_stable_instable'] || 0;
    });
    
    console.log(`Initial progress set to: ${initialProgress}`);
    expect(initialProgress).toBe(12);
    
    // Click the play button with better error handling
    const levelResetPlayButton = page.locator('button.play-button').first();
    await expect(levelResetPlayButton).toBeVisible({ timeout: 10000 });
    await levelResetPlayButton.click({ timeout: 10000 });
    
    // Wait for the chord to play
    console.log('Waiting for chord to play...');
    await page.waitForTimeout(3000);
    
    // Make an incorrect selection to trigger level reset
    // Since we can't directly access window.currentChordType in the test,
    // we'll just click one of the buttons and check the feedback
    console.log('Making an incorrect selection to trigger level reset');
    const buttonToClick = '#button_2_2_instable'; // Start by trying the instable button
    
    console.log('Clicking button to trigger level reset');
    await page.locator(buttonToClick).click();
    
    // Wait for the reset to complete
    await page.waitForTimeout(2000);
    
    // Check if progress was reset to the start of the level (10)
    let resetProgress = 0;
    try {
      resetProgress = await page.evaluate(() => {
        const progress = JSON.parse(localStorage.getItem('lalumo_chords_progress') || '{}');
        return progress['2_2_chords_stable_instable'] || 0;
      });
    } catch (error) {
      console.log('[Error] while checking reset progress:', error.message);
    }
    
    console.log(`Progress after incorrect answer: ${resetProgress}`);
    expect(resetProgress).toBe(10);
    
    console.log('Level reset test completed');
  });
});
