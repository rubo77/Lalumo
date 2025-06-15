const { test, expect } = require('@playwright/test');

/**
 * Test suite for home button functionality in Lalumo app
 * Tests if the home buttons correctly navigate back to the main view
 */
test.describe('Lalumo Home Button Navigation', () => {
  // Globales Timeout von 10 Sekunden setzen, damit Tests nicht hängen bleiben
  test.setTimeout(10000);
  test.beforeEach(async ({ page }) => {
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
    const usernameModal = page.locator('.modal-overlay');
    if (await usernameModal.isVisible()) {
      console.log('Username modal detected, clicking generate button...');
      await page.locator('.primary-button').click();
      await page.waitForTimeout(500);
    }
    
    // Ensure we're on the main screen
    await expect(page.locator('.pitch-landing')).toBeVisible({ timeout: 2000 });
    console.log('Initial setup complete, on main landing page');
  });

  // Diagnose-Funktion für Alpine.js-Komponenten
  async function diagnoseAlpineComponent(page) {
    return await page.evaluate(() => {
      if (!window.Alpine) return { error: 'Alpine not found' };
      
      try {
        // Versuche, die pitches-Komponente zu finden
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

  // Action-Funktion mit verbesserten Fehlerbehandlung für Home-Button
  async function clickHomeButtonWithRetry(page) {
    try {
      // Finde alle Home-Buttons
      const homeButtons = await page.locator('.back-to-main').all();
      console.log(`Found ${homeButtons.length} home buttons`);
      
      // Wenn normal klicken nicht funktioniert, versuche Alternativen
      await page.locator('.back-to-main').first().click({ timeout: 2000 });
      await page.waitForTimeout(500);
      
      // Alpine-Status nach Klick überprüfen
      const alpineState = await diagnoseAlpineComponent(page);
      console.log('Alpine state after click:', alpineState);
      
      // Wenn nicht zurück zur Hauptseite, versuche JS-Direktaufruf
      if (!await page.locator('.pitch-landing').isVisible({ timeout: 1000 })) {
        console.log('Home button click failed, trying direct JS call...');
        await page.evaluate(() => {
          if (window.Alpine) {
            const pitchesComponent = document.querySelector('[x-data="pitches()"]');
            if (pitchesComponent) {
              window.Alpine.evaluate(pitchesComponent, 'setMode("main")');
            }
          }
        });
      }
    } catch (e) {
      console.log('Error clicking home button:', e);
      // Letzte Chance: Direkter JS-Aufruf
      await page.evaluate(() => {
        if (window.Alpine) {
          try {
            const pitchesComponent = document.querySelector('[x-data="pitches()"]');
            if (pitchesComponent) {
              window.Alpine.evaluate(pitchesComponent, 'setMode("main")');
            }
          } catch (e) {
            console.error('Failed to set mode via JS:', e);
          }
        }
      });
    }
  }

  test('Should navigate to Match Sounds and back using home button', async ({ page }) => {
    // Navigate to Match Sounds activity
    await page.locator('.match-area').click();
    await page.waitForTimeout(500);
    
    // Verify we're on the Match Sounds activity
    const matchActivity = page.locator('.pitch-activity').filter({ has: page.locator('[x-show="mode === \'1_2_pitches_match-sounds\'"]') });
    await expect(matchActivity).toBeVisible({ timeout: 2000 });
    console.log('Successfully navigated to Match Sounds activity');
    
    // Click the home button
    const homeButton = page.locator('.back-to-main').first();
    console.log('Clicking home button...');
    await homeButton.click();
    await page.waitForTimeout(1000);
    
    // Verify we're back on the main page
    await expect(page.locator('.pitch-landing')).toBeVisible({ timeout: 2000 });
    console.log('Successfully returned to main landing page');
  });

  test('Should navigate to Draw Melody and back using home button', async ({ page }) => {
    // Navigate to Draw Melody activity
    await page.locator('.draw-area').click();
    await page.waitForTimeout(500);
    
    // Verify we're on the Draw Melody activity
    const drawActivity = page.locator('.pitch-activity').filter({ has: page.locator('canvas.drawing-canvas') });
    await expect(drawActivity).toBeVisible({ timeout: 2000 });
    console.log('Successfully navigated to Draw Melody activity');
    
    // Click the home button
    const homeButton = page.locator('.back-to-main').first();
    console.log('Clicking home button...');
    await homeButton.click();
    await page.waitForTimeout(1000);
    
    // Verify we're back on the main page
    await expect(page.locator('.pitch-landing')).toBeVisible({ timeout: 2000 });
    console.log('Successfully returned to main landing page');
  });

  test('Should navigate to Memory Game and back using home button', async ({ page }) => {
    // Navigate to Memory Game activity
    await page.locator('.memory-area').click();
    await page.waitForTimeout(500);
    
    // Verify we're on the Memory Game activity
    const memoryActivity = page.locator('.pitch-activity').filter({ has: page.locator('[x-show="mode === \'1_5_pitches_memory-game\'"]') });
    await expect(memoryActivity).toBeVisible({ timeout: 2000 });
    console.log('Successfully navigated to Memory Game activity');
    
    // Click the home button
    const homeButton = page.locator('.back-to-main').first();
    console.log('Clicking home button...');
    await homeButton.click();
    await page.waitForTimeout(1000);
    
    // Verify we're back on the main page
    await expect(page.locator('.pitch-landing')).toBeVisible({ timeout: 2000 });
    console.log('Successfully returned to main landing page');
  });
  
  // Helper function to diagnose DOM state if needed
  async function dumpDOMState(page, selector) {
    return await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'Element not found';
      
      // Check Alpine.js state if available
      let alpineState = 'No Alpine data';
      if (window._x && el._x) {
        try {
          alpineState = JSON.stringify(el._x.getUnobservedData());
        } catch (e) {
          alpineState = 'Error getting Alpine data: ' + e.message;
        }
      }
      
      return {
        visible: el.offsetParent !== null,
        classes: el.className,
        style: el.getAttribute('style'),
        alpine: alpineState
      };
    }, selector);
  }
});
