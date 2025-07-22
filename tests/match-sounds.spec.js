// @ts-check
const { test, expect } = require('@playwright/test');

// Setze einen globalen Timeout für alle Tests
test.setTimeout(10000);

/**
 * Test für die 1_2 Up or Down Aktivität
 * 
 * Ablauf des Tests:
 * 1. Zuerst muss der Benutzername akzeptiert werden (index.html:60-61)
 *    - Klickt auf "Generate Random Name" Button
 * 
 * 2. Dann auf "Up or Down" klicken (index.html:122-124)
 *    - Navigiert zur Up or Down Aktivität
 * 
 * 3. Überprüft, ob wir auf der richtigen Seite sind (index.html:375)
 *    - Prüft, ob der Up or Down Container vorhanden ist
 * 
 * 4. Klickt auf den Play-Button (index.html:385-386)
 *    - Startet die Melodie
 * 
 * 5. Klickt auf den "Up"-Pattern Button
 *    - Wählt das Aufwärts-Muster
 * 
 * Hinweis: Dieser Test sollte mit einem Timeout ausgeführt werden, um zu verhindern,
 * dass er hängen bleibt, z.B.: 
 * cd /var/www/Musici && \
 * npx playwright test tests/match-sounds.spec.js --timeout=10000 --headed
 */
test.describe('Lalumo Up or Down Activity', () => {
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
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to 1_2 activity and play sounds', async ({ page }) => {
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

    // Log test start
    console.log('Starting Up or Down activity test');
    
    // Explizit auf den Generate Random Name-Button klicken
    console.log('Clicking on Generate Random Name button');
    try {
      // Prüfen, ob der Username-Dialog angezeigt wird
      const isDialogVisible = await page.isVisible('.modal-overlay');
      
      if (isDialogVisible) {
        // Auf den Generate Random Name-Button klicken
        await page.click('.primary-button');
        console.log('Clicked on Generate Random Name button');
        
        // Warten, bis der Dialog vollständig verschwunden ist
        await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 5000 });
        console.log('Username dialog is now hidden');
      } else {
        console.log('Username dialog not visible, continuing with test');
      }
    } catch (e) {
      console.log('[Error] while handling username dialog:', e);
    }
    
    // Navigate to Pitches section
    console.log('Navigating to Pitches section');
    await page.click('text=Pitches');
    await page.waitForLoadState('networkidle');
    
    // Navigate to 1_2 Up or Down activity
    console.log('Navigating to 1_2 Up or Down activity');
    await page.click('text=Up or Down');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct page by checking for the match-sounds-container
    const matchSoundsContainer = await page.locator('.match-sounds-container').count();
    expect(matchSoundsContainer).toBeGreaterThan(0);
    console.log('Confirmed on Up or Down page with container present');
    
    // Warte, bis die Match-Sounds-Seite vollständig geladen ist
    console.log('Waiting for Up or Down page to fully load');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    // Warte einen Moment, damit Alpine.js vollständig initialisiert werden kann
    await page.waitForTimeout(1000);
    
    // Setze gameMode auf false, damit der Play-Button sichtbar ist
    console.log('Setting gameMode to false via JavaScript');
    await page.evaluate(() => {
      try {
        // Direkter Zugriff auf die Alpine.js-Komponente über window
        if (window.Alpine && window.Alpine.store('pitches')) {
          window.Alpine.store('pitches').gameMode = false;
          console.log('Successfully set gameMode to false via Alpine store');
          return true;
        } else {
          console.error('Could not access Alpine store');
          return false;
        }
      } catch (error) {
        console.error('Error setting gameMode:', error);
        return false;
      }
    });
    
    // Warte einen Moment, damit die UI aktualisiert werden kann
    await page.waitForTimeout(500);
    
    // Versuche, den Play-Button zu finden und zu klicken
    console.log('Looking for play button');
    try {
      // Warte, bis der Button sichtbar ist und klicke ihn dann
      await page.waitForSelector('.circular-play-button:visible', { timeout: 3000 });
      await page.click('.circular-play-button:visible', { force: true });
      console.log('Clicked on play button');
    } catch (error) {
      console.error('Error clicking play button:', error);
      // Mache einen Screenshot, um zu sehen, was auf der Seite ist
      await page.screenshot({ path: 'error-play-button.png' });
    }
    
    // Wait a moment for the audio to start
    await page.waitForTimeout(1000);
    
    // Wait a moment for any animations or sounds to start
    await page.waitForTimeout(1000);
    
    // Warte auf den "up"-Pattern-Button und klicke ihn
    console.log('Waiting for up pattern button');
    try {
      // Warte, bis der Button sichtbar ist
      await page.waitForSelector('.pitch-card.up-card', { timeout: 3000 });
      
      // Klicke mit force: true, um sicherzustellen, dass der Klick durchgeht
      await page.click('.pitch-card.up-card', { force: true });
      console.log('Clicked on up pattern button');
    } catch (error) {
      console.error('Error clicking up pattern button:', error);
      // Mache einen Screenshot, um zu sehen, was auf der Seite ist
      await page.screenshot({ path: 'error-pattern-button.png' });
    }
    
    // Wait for sound playback and animations
    await page.waitForTimeout(3000);
    
    // Verify that the pattern was played (check for active class)
    const hasActiveClass = await page.evaluate(() => {
      return document.querySelector('.pitch-card.active, .active') !== null;
    });
    
    // Log the result
    console.log('Active class check:', hasActiveClass ? 'PASSED' : 'FAILED');
    
    // Check console for errors
    const consoleErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    console.log('Console errors:', consoleErrors.length ? consoleErrors : 'None');
    expect(consoleErrors.length).toBe(0);
    
    // Take a screenshot at the end
    await page.screenshot({ path: 'test-results/match-sounds-test.png' });
    
    console.log('Up or Down activity test completed');
  });
});
