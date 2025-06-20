/**
 * ui-helpers.js - Gemeinsame UI-Hilfsfunktionen für alle Aktivitäten
 * Diese Datei enthält UI-Hilfsfunktionen, die in mehreren Aktivitäten verwendet werden können
 */

// Importiere Debug-Utilities
import { debugLog } from '../../utils/debug.js';

/**
 * Aktualisiert eine Fortschrittsanzeige im UI oder erstellt eine neue, falls nicht vorhanden
 * @param {Object} options - Optionen für die Fortschrittsanzeige
 * @param {string} options.selector - CSS-Selektor für das Container-Element (z.B. '.sound-judgment-level')
 * @param {string} options.containerSelector - CSS-Selektor für den übergeordneten Container (z.B. '[id="1_4_pitches"]')
 * @param {string} options.className - CSS-Klasse für das anzuzeigende Element (z.B. 'sound-judgment-level progress-display')
 * @param {string|Function} options.content - Anzuzeigender Inhalt oder Funktion, die den Inhalt zurückgibt
 * @param {Function} options.onUpdate - Optional: Callback-Funktion, die nach dem Update aufgerufen wird
 */
export function update_progress_display(options) {
  // Standardwerte
  const defaults = {
    selector: '.progress-display',
    containerSelector: '.activity-container',
    className: 'progress-display',
    content: '',
    onUpdate: null
  };

  // Optionen mit Standardwerten zusammenführen
  const settings = { ...defaults, ...options };
  
  // Finde das Anzeigeelement im DOM
  const displayElement = document.querySelector(settings.selector);
  
  // Wenn kein Element vorhanden ist, erstellen wir eines
  if (!displayElement) {
    // Erstelle neues Element für die Anzeige
    const newElement = document.createElement('div');
    newElement.className = settings.className;
    
    // Füge es zum Activity-Container hinzu
    const activityContainer = document.querySelector(settings.containerSelector);
    if (activityContainer) {
      // Füge es als letztes Element ein
      activityContainer.appendChild(newElement);
      debugLog('UI', `Progress display added to ${settings.containerSelector}`);
    } else {
      console.error(`UI: Could not find activity container with selector ${settings.containerSelector}`);
      return;
    }
  }

  // Aktualisiere den Inhalt aller Elemente mit diesem Selektor
  document.querySelectorAll(settings.selector).forEach(el => {
    if (typeof settings.content === 'function') {
      el.textContent = settings.content();
    } else {
      el.textContent = settings.content;
    }
  });
  
  // Rufe den onUpdate-Callback auf, falls vorhanden
  if (typeof settings.onUpdate === 'function') {
    settings.onUpdate();
  }
}

// Exportiere eine Testfunktion für Import-Tests
export function testUiHelpersModuleImport() {
  console.log('UI Helpers module successfully imported');
  return true;
}
