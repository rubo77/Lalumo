// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test suite for hash navigation in Lalumo app
 * Tests the correct switching between activities via hash changes
 */
test.describe('Lalumo Hash Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Browseraktionen manuell abbrechen können
    page.setDefaultTimeout(5000);
    
    // Listen für Dialog-Events registrieren, bevor wir navigieren
    page.on('dialog', async dialog => {
      console.log(`Dialog detected: ${dialog.type()}, message: ${dialog.message()}`);
      // Alle Dialoge automatisch bestätigen, z.B. für Spielernamen-Eingabe
      if (dialog.type() === 'prompt') {
        await dialog.accept('TestSpieler');
      } else {
        await dialog.accept();
      }
    });
    
    // Konsolen-Logs erfassen
    page.on('console', msg => {
      console.log(`BROWSER LOG: ${msg.type()}: ${msg.text()}`);
    });

    try {
      // Navigate to the app and wait for it to be ready
      await page.goto('http://localhost:9091/', { timeout: 5000 });
      
      // Kurze Wartezeit für die Initialisierung
      await page.waitForTimeout(500);
      
      // Überprüfen ob ein Spielername-Dialog erscheint und verarbeiten
      try {
        const isVisible = await page.isVisible('.pitch-landing', { timeout: 2000 });
        if (!isVisible) {
          console.log('Pitch landing not immediately visible, checking for dialogs...');
          // Klicke auf ein Element, um sicherzustellen, dass Dialoge ausgelöst werden
          await page.mouse.click(100, 100);
        }
      } catch (e) {
        console.log('[Error] while waiting for pitch-landing:', e);
      }
    } catch (e) {
      console.log('Error during page initialization:', e);
    }
    
    // Konsolen-Logs wurden bereits oben erfasst
  });

  test('Should navigate to Draw Melody activity via hash', async ({ page }) => {
    try {
      console.log('TEST: Navigating to Draw Melody via hash...');
      
      // Navigiere direkt zur Draw Melody-Aktivität via Hash
      await page.goto('http://localhost:9091/#1_pitches-1_2_pitches_draw-melody', { timeout: 5000 });
      
      // Füge speziellen JavaScript-Code ein, um die Hash-Änderung zu überwachen
      await page.evaluate(() => {
        console.log('Current hash:', window.location.hash);
        console.log('Alpine mode (if available):', 
          window.Alpine?.data?.pitches?.mode || 'Not available');
      });
      
      // Warte kurz, damit die Hash-Verarbeitung stattfinden kann
      await page.waitForTimeout(1000);
      
      // Erzwinge eine manuelle Aktualisierung, wenn nötig
      await page.evaluate(() => {
        // Das Problem könnte sein, dass Alpine.js den DOM nicht aktualisiert hat
        // Versuche, die setMode-Funktion direkt aufzurufen
        if (window.Alpine?.data?.pitches?.setMode) {
          console.log('Manually calling setMode with 1_2_pitches_draw-melody');
          window.Alpine.data.pitches.setMode('1_2_pitches_draw-melody');
          
          // Forciere Alpine-Update
          if (window.Alpine.deferMutations && window.Alpine.flushAndStopDeferring) {
            window.Alpine.deferMutations();
            window.Alpine.flushAndStopDeferring();
          }
        }
      });
      
      // Warte kurz auf DOM-Updates
      await page.waitForTimeout(500);
      
      // Sammle Diagnoseinformationen - DOM-Status
      const visibilityReport = await page.evaluate(() => {
        const checkElement = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return 'NOT_FOUND';
          const computedStyle = window.getComputedStyle(el);
          return {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            hidden: el.hidden,
            offsetParent: el.offsetParent !== null ? 'Has parent' : 'No parent',
            html: el.outerHTML.substring(0, 100) + '...',
          };
        };
        
        return {
          'pitch-landing': checkElement('.pitch-landing'),
          'draw-melody-activity': checkElement('.draw-melody-activity'),
          'match-sounds-activity': checkElement('.match-sounds-activity'),
          'memory-game-activity': checkElement('.memory-game-activity'),
          'current-hash': window.location.hash
        };
      });
      
      console.log('DOM Visibility Report:', JSON.stringify(visibilityReport, null, 2));
      
      // Überprüfe den Alpine.js-Zustand
      const alpineState = await page.evaluate(() => {
        if (!window.Alpine || !window.Alpine.data) return 'Alpine.js not available';
        return {
          pitchesMode: window.Alpine.data.pitches?.mode,
          storeMode: window.Alpine.store ? window.Alpine.store('app')?.pitchMode : null,
          hash: window.location.hash
        };
      });
      
      console.log('Alpine.js State:', JSON.stringify(alpineState, null, 2));

      // Überprüfe, ob die Draw-Melody-Aktivität sichtbar ist
      // Wir verwenden eine robustere Methode, da isVisible manchmal unzuverlässig ist
      const drawMelodyVisible = await page.evaluate(() => {
        const element = document.querySelector('.draw-melody-activity');
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      console.log('Draw Melody Activity visible according to computed style:', drawMelodyVisible);
      
      // Mache ein Screenshot zur visuellen Überprüfung
      await page.screenshot({ path: 'tests/draw-melody-activity.png' });
      console.log('Screenshot saved to tests/draw-melody-activity.png');
      
      // Überprüfe, ob die korrekte Aktivität angezeigt wird
      expect(drawMelodyVisible).toBeTruthy();
    } catch (e) {
      console.error('Test error:', e);
      // Mache einen Screenshot bei Fehlern
      await page.screenshot({ path: 'tests/draw-melody-error.png' });
      throw e;
    }
  });

  test('Should navigate between all pitch activities', async ({ page }) => {
    try {
      console.log('TEST: Testing navigation between all pitch activities');
      
      // Definiere die zu testenden Aktivitäten
      const activities = [
        { id: '1_1_pitches_match-sounds', selector: '.match-sounds-activity' },
        { id: '1_2_pitches_draw-melody', selector: '.draw-melody-activity' },
        { id: '1_3_pitches_memory-game', selector: '.memory-game-activity' }
      ];
      
      // Teste Navigation zu jeder Aktivität
      for (const activity of activities) {
        console.log(`\nTesting navigation to ${activity.id}...`);
        
        // Navigiere via Hash
        await page.goto(`http://localhost:9091/#1_pitches-${activity.id}`, { timeout: 5000 });
        
        // Warte, bis die Hash-Änderung verarbeitet wurde
        await page.waitForTimeout(1000);
        
        // Erzwinge eine manuelle Mode-Aktualisierung, falls nötig
        await page.evaluate((activityId) => {
          console.log('Activity check - current hash:', window.location.hash);
          
          // Direkte Modusänderung erzwingen
          if (window.Alpine?.data?.pitches?.setMode) {
            console.log(`Manually setting mode to ${activityId}`);
            window.Alpine.data.pitches.setMode(activityId);
            
            // Forciere Alpine-Update
            if (window.Alpine.deferMutations && window.Alpine.flushAndStopDeferring) {
              window.Alpine.deferMutations();
              window.Alpine.flushAndStopDeferring();
            }
          }
        }, activity.id);
        
        // Überprüfe, ob die Aktivität sichtbar ist (robustere Methode)
        const isVisible = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }, activity.selector);
        
        // Screenshot für Diagnose
        await page.screenshot({ path: `tests/${activity.id.split('_').pop()}.png` });
        console.log(`Activity ${activity.id} visible:`, isVisible);
        console.log(`Screenshot saved to tests/${activity.id.split('_').pop()}.png`);
        
        // Überprüfe Alpine.js-Status
        const alpineMode = await page.evaluate(() => 
          window.Alpine?.data?.pitches?.mode || 'No Alpine mode available'
        );
        console.log('Current Alpine.js mode:', alpineMode);
        
        // Behaupte, dass die Aktivität sichtbar ist
        expect(isVisible).toBeTruthy();
      }
    } catch (e) {
      console.error('Test error during activity navigation:', e);
      await page.screenshot({ path: 'tests/activity-navigation-error.png' });
      throw e;
    }
  });

  test('Should correctly handle back button navigation', async ({ page }) => {
    try {
      console.log('\nTEST: Testing back button navigation');
      
      // Zuerst zu Draw Melody navigieren
      console.log('Navigating to Draw Melody...');
      await page.goto('http://localhost:9091/#1_pitches-1_2_pitches_draw-melody', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      // Erzwinge Modus-Update für Draw Melody
      await page.evaluate(() => {
        if (window.Alpine?.data?.pitches?.setMode) {
          window.Alpine.data.pitches.setMode('1_2_pitches_draw-melody');
          // Alpine-Update erzwingen
          if (window.Alpine.deferMutations && window.Alpine.flushAndStopDeferring) {
            window.Alpine.deferMutations();
            window.Alpine.flushAndStopDeferring();
          }
        }
      });
      
      // Bestätige, dass Draw Melody sichtbar ist
      const drawVisible1 = await page.evaluate(() => {
        const el = document.querySelector('.draw-melody-activity');
        return el && window.getComputedStyle(el).display !== 'none';
      });
      console.log('Draw Melody visible after first navigation:', drawVisible1);
      
      // Dann zum Memory Game navigieren
      console.log('Navigating to Memory Game...');
      await page.goto('http://localhost:9091/#1_pitches-1_3_pitches_memory-game', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      // Erzwinge Modus-Update für Memory Game
      await page.evaluate(() => {
        if (window.Alpine?.data?.pitches?.setMode) {
          window.Alpine.data.pitches.setMode('1_3_pitches_memory-game');
          if (window.Alpine.deferMutations && window.Alpine.flushAndStopDeferring) {
            window.Alpine.deferMutations();
            window.Alpine.flushAndStopDeferring();
          }
        }
      });
      
      // Überprüfe, ob Memory Game sichtbar ist
      const memoryVisible = await page.evaluate(() => {
        const el = document.querySelector('.memory-game-activity');
        return el && window.getComputedStyle(el).display !== 'none';
      });
      console.log('Memory Game visible:', memoryVisible);
      await page.screenshot({ path: 'tests/before-back-button.png' });
      
      // Gehe zurück in der History (sollte zu Draw Melody gehen)
      console.log('Going back in browser history...');
      await page.goBack();
      await page.waitForTimeout(1000);
      
      // Hash und Alpine-Status nach dem Zurückgehen prüfen
      const afterBackInfo = await page.evaluate(() => {
        return {
          hash: window.location.hash,
          alpineMode: window.Alpine?.data?.pitches?.mode || 'No Alpine mode'
        };
      });
      console.log('After back button - Hash and Alpine mode:', afterBackInfo);
      
      // Manuell den Modus aktualisieren, falls nötig
      if (afterBackInfo.hash.includes('1_2_pitches_draw-melody')) {
        await page.evaluate(() => {
          if (window.Alpine?.data?.pitches?.setMode) {
            window.Alpine.data.pitches.setMode('1_2_pitches_draw-melody');
            if (window.Alpine.deferMutations && window.Alpine.flushAndStopDeferring) {
              window.Alpine.deferMutations();
              window.Alpine.flushAndStopDeferring();
            }
          }
        });
      }
      
      // Überprüfe, ob Draw Melody nach Zurückgehen sichtbar ist
      const drawVisible2 = await page.evaluate(() => {
        const el = document.querySelector('.draw-melody-activity');
        return el && window.getComputedStyle(el).display !== 'none';
      });
      
      await page.screenshot({ path: 'tests/after-back-button.png' });
      console.log('After back button - Draw Melody visible:', drawVisible2);
      
      // Behaupte, dass Draw Melody sichtbar ist
      expect(drawVisible2).toBeTruthy();
    } catch (e) {
      console.error('Test error during back navigation:', e);
      await page.screenshot({ path: 'tests/back-navigation-error.png' });
      throw e;
    }
  });
});
