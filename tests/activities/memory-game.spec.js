const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for Memory Game (1_5) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo Memory Game Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Memory Game activity and perform basic interaction', async ({ page }) => {
    // Navigate to Memory Game activity using the helper
    const activityContainer = await navigateToActivity(page, '.memory-area', '1_5_pitches');
    
    // Verify memory cards are visible
    const memoryContainer = page.locator('.memory-container');
    await expect(memoryContainer).toBeVisible({ timeout: 2000 });
    console.log('Memory container is visible');
    
    // Check if memory cards are rendered
    const memoryCards = page.locator('.memory-card');
    const cardCount = await memoryCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`Found ${cardCount} memory cards`);
    
    // Flip the first card
    const firstCard = memoryCards.first();
    await expect(firstCard).toBeVisible({ timeout: 2000 });
    await firstCard.click();
    console.log('Clicked on first memory card');
    await page.waitForTimeout(500);
    
    // Flip another card (doesn't matter if it matches)
    if (cardCount > 1) {
      const secondCard = memoryCards.nth(1);
      await secondCard.click();
      console.log('Clicked on second memory card');
      await page.waitForTimeout(1000);
    }
    
    // Check if any feedback is displayed using helper function
    await checkElementVisibility(page, '#1_5_pitches .feedback-container', 'Feedback message');
    
    // Wait for any card animations to complete
    await page.waitForTimeout(2000);
    
    // Return to main using helper function
    await returnToMain(page);
  });
});
