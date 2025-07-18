// Test environment debug logging utility
const debugLog = (module, message, ...args) => {
  // For test files, always log since it's test/development time
  if (args.length > 0) {
    debugLog('MATCH_SOUNDS_ACT_SPEC', `[${module}] ${message}`, ...args);
  } else {
    debugLog('MATCH_SOUNDS_ACT_SPEC', `[${module}] ${message}`);
  }
};

const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for Match Sounds (1_2) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo Match Sounds Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Match Sounds activity and perform basic interaction', async ({ page }) => {
    // Navigate to Match Sounds activity using the helper
    const activityContainer = await navigateToActivity(page, '.match-area', '1_2_pitches');
    
    // Wait for cards to be generated
    await page.waitForTimeout(1000);
    
    // Verify cards are visible
    const cards = page.locator('.match-sound-card');
    expect(await cards.count()).toBeGreaterThan(0);
    debugLog('MATCH_SOUNDS_ACT_SPEC', `Found ${await cards.count()} sound matching cards`);
    
    // Click on the first card
    await cards.first().click();
    debugLog('MATCH_SOUNDS_ACT_SPEC', 'Clicked on first match sounds card');
    await page.waitForTimeout(1000);
    
    // Click on another card (doesn't matter if it matches or not, just testing interaction)
    if (await cards.count() > 1) {
      await cards.nth(1).click();
      debugLog('MATCH_SOUNDS_ACT_SPEC', 'Clicked on second match sounds card');
      await page.waitForTimeout(1000);
    }
    
    // Check if feedback is displayed using helper function
    await checkElementVisibility(page, '#1_2_pitches .feedback-container', 'Feedback message');
    
    // Return to main using helper function
    await returnToMain(page);
  });
});
