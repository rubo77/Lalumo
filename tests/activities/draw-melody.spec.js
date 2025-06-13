const { test, expect } = require('@playwright/test');
const { setupTest, navigateToActivity, returnToMain, checkElementVisibility } = require('../helpers/test-utils');

/**
 * Test suite for Draw a Melody (1_3) activity in Lalumo app
 * Tests navigation to the activity and basic functionality
 */
test.describe('Lalumo Draw a Melody Activity Tests', () => {
  // Set global timeout
  test.setTimeout(10000);

  test.beforeEach(async ({ page }) => {
    // Use the common setup function
    await setupTest(page);
  });

  test('Should navigate to Draw a Melody activity and perform basic interaction', async ({ page }) => {
    // Navigate to Draw a Melody activity using the helper
    const activityContainer = await navigateToActivity(page, '.draw-area', '1_3_pitches');
    
    // Verify the canvas is visible
    const drawingCanvas = page.locator('canvas.drawing-canvas');
    await expect(drawingCanvas).toBeVisible({ timeout: 2000 });
    console.log('Drawing canvas is visible');
    
    // Listen for melody to be played
    await page.waitForTimeout(1000);
    
    // Click the play button to hear the melody
    const playButton = page.locator('#1_3_pitches .play-btn');
    await expect(playButton).toBeVisible({ timeout: 2000 });
    await playButton.click();
    console.log('Clicked play button, melody should now play');
    
    // Wait for melody to finish playing
    await page.waitForTimeout(2000);
    
    // Try to draw on the canvas (simulate a simple drawing)
    const canvasBounds = await drawingCanvas.boundingBox();
    if (canvasBounds) {
      // Define starting position (top center of the canvas)
      const startX = canvasBounds.x + canvasBounds.width / 2;
      const startY = canvasBounds.y + canvasBounds.height * 0.25;
      
      // Draw a simple line down
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY + canvasBounds.height * 0.5, { steps: 10 });
      await page.mouse.up();
      console.log('Drew a simple line on the canvas');
    } else {
      console.log('Could not get canvas bounds for drawing');
    }
    
    // Wait for drawing to register
    await page.waitForTimeout(1000);
    
    // Click check button to check the drawing
    const checkButton = page.locator('#1_3_pitches .check-btn');
    await expect(checkButton).toBeVisible({ timeout: 2000 });
    await checkButton.click();
    console.log('Clicked check button to verify the drawing');
    
    // Wait for feedback
    await page.waitForTimeout(1000);
    
    // Check feedback is visible using helper function
    await checkElementVisibility(page, '#1_3_pitches .feedback-container', 'Feedback message');
    
    // Return to main using helper function
    await returnToMain(page);
  });
});
