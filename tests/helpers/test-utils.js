/**
 * Test utility functions for Lalumo app tests
 */

const { expect } = require('@playwright/test');

/**
 * Setup the test environment and navigate to the app
 * Handles common operations like username generation
 */
async function setupTest(page) {
  // Set reasonable timeout
  page.setDefaultTimeout(5000);
  
  // Handle dialogs (for username generation)
  page.on('dialog', async dialog => {
    console.log(`Dialog detected: ${dialog.type()}, message: ${dialog.message()}`);
    await dialog.accept('TestSpieler');
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
  await handleUsernameModal(page);
  
  // Ensure we're on the main screen
  await expect(page.locator('.pitch-landing')).toBeVisible({ timeout: 2000 });
  console.log('Initial setup complete, on main landing page');
}

/**
 * Handle the username modal if it appears
 */
async function handleUsernameModal(page) {
  // More reliable check for the username modal
  try {
    const usernameModal = page.locator('.modal-overlay');
    const isVisible = await usernameModal.isVisible({ timeout: 2000 });
    
    if (isVisible) {
      console.log('Username modal detected, clicking generate button...');
      
      // Use class selector instead of text content to avoid strict mode violation
      // We specifically select the primary button which should be the main generate button
      const primaryButton = page.locator('.modal-overlay .primary-button').first();
      if (await primaryButton.isVisible()) {
        console.log('Found primary button, clicking...');
        await primaryButton.click();
      } else {
        console.log('Primary button not found, trying alternative selector...');
        // Fallback to any button in the modal
        const anyButton = page.locator('.modal-overlay button').first();
        await anyButton.click();
      }
      await page.waitForTimeout(1000); // Wait longer for modal to close
      
      // Verify the modal was dismissed
      const modalStillVisible = await usernameModal.isVisible({ timeout: 1000 }).catch(() => false);
      if (modalStillVisible) {
        console.log('Username modal still visible, trying different approach...');
        // Try clicking dialog accept button if visible
        try {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        } catch (e) {
          console.log('Failed to press Enter:', e);
        }
        
        // If still visible, try clicking at center of modal
        if (await usernameModal.isVisible().catch(() => false)) {
          const modalBox = await usernameModal.boundingBox();
          if (modalBox) {
            await page.mouse.click(
              modalBox.x + modalBox.width / 2,
              modalBox.y + modalBox.height / 2
            );
          }
        }
      }
    } else {
      console.log('No username modal found, continuing...');
    }
  } catch (e) {
    console.log('Error handling username modal:', e);
  }
}

/**
 * Navigate to a specific activity
 */
async function navigateToActivity(page, activitySelector, activityContainerId) {
  // Click on the activity area
  console.log(`Navigating to ${activitySelector}...`);
  await page.locator(activitySelector).click();
  await page.waitForTimeout(500);
  
  // Verify we're on the right activity
  const activityContainer = page.locator(`#${activityContainerId}`);
  await expect(activityContainer).toBeVisible({ timeout: 2000 });
  console.log(`Successfully navigated to activity ${activityContainerId}`);
  
  return activityContainer;
}

/**
 * Return to main page from any activity
 */
async function returnToMain(page) {
  // Click home button to return to main
  const homeButton = page.locator('.back-to-main').first();
  console.log('Clicking home button...');
  await homeButton.click();
  await page.waitForTimeout(1000);
  
  // Verify we're back on the main page
  await expect(page.locator('.pitch-landing')).toBeVisible({ timeout: 2000 });
  console.log('Successfully returned to main landing page');
}

/**
 * Diagnose Alpine component state
 */
async function diagnoseAlpineComponent(page) {
  return await page.evaluate(() => {
    if (!window.Alpine) return { error: 'Alpine not found' };
    
    try {
      // Try to find the pitches component
      const pitchesData = window.Alpine.evaluate(document.querySelector('[x-data="pitches()"]'), 'mode');
      return {
        currentMode: pitchesData,
        alpineVersion: window.Alpine.version,
        hasSetModeFunction: typeof window.Alpine.evaluate(document.querySelector('[x-data="pitches()"]'), 'setMode') === 'function'
      };
    } catch (e) {
      return { error: e.toString() };
    }
  });
}

/**
 * Check if an element is visible and log the result
 */
async function checkElementVisibility(page, selector, description) {
  try {
    const element = page.locator(selector);
    const isVisible = await element.isVisible({ timeout: 1000 });
    console.log(`${description} is ${isVisible ? 'visible' : 'not visible'}`);
    return isVisible;
  } catch (e) {
    console.log(`Error checking visibility for ${description}:`, e);
    return false;
  }
}

module.exports = {
  setupTest,
  handleUsernameModal,
  navigateToActivity,
  returnToMain,
  diagnoseAlpineComponent,
  checkElementVisibility
};
