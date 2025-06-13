const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for High or Low (1_1) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo High or Low Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to High or Low activity and perform basic interaction', async ({ page }) => {
    // Navigate to High or Low activity using the helper
    const activityContainer = await navigateToActivity(page, '.high-or-low-area', '1_1_pitches');
    
    // Wait for tones to be generated
    await page.waitForTimeout(1000);
    
    // Play the tones
    const playButton = page.locator('#1_1_pitches .play-btn');
    await expect(playButton).toBeVisible({ timeout: 2000 });
    await playButton.click();
    console.log('Clicked play button, tones should now play');
    
    // Wait for tones to finish playing
    await page.waitForTimeout(2000);
    
    // Answer the question - click higher
    const higherButton = page.locator('#1_1_pitches .high-btn');
    await expect(higherButton).toBeVisible({ timeout: 2000 });
    await higherButton.click();
    console.log('Clicked higher button as answer');
    
    // Wait for feedback
    await page.waitForTimeout(1000);
    
    // Check feedback is visible using helper function
    await checkElementVisibility(page, '#1_1_pitches .feedback-container', 'Feedback message');
    
    // Return to main using helper function
    await returnToMain(page);
  });
});
