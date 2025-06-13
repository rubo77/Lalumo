/**
 * 1_1_high_or_low.js - Modul für die "High or Low" Aktivität
 */

// Importiere Debug-Utilities
import { debugLog } from '../../utils/debug.js';

// Debug-Log beim Laden des Moduls
console.log('HIGH_OR_LOW_MODULE: Module loaded');

/**
 * Bestimmt die aktuelle Schwierigkeitsstufe in der "High or Low"-Aktivität
 * basierend auf dem Fortschritt des Benutzers.
 * 
 * @param {Object} component - Die Alpine.js Komponente
 * @returns {number} - Die aktuelle Stufe (1-5)
 */
export function currentHighOrLowStage(component) {
  // Get the progress count (number of correct answers)
  const progress = component.highOrLowProgress || 0;
  
  // Stage 1: 0-9 correct answers (basic)
  // Stage 2: 10-19 correct answers (closer tones)
  // Stage 3: 20-29 correct answers (two tones)
  // Stage 4: 30-39 correct answers (even closer tones)
  // Stage 5: 40+ correct answers (ultimate challenge)
  
  if (progress >= 40) return 5;
  if (progress >= 30) return 4;
  if (progress >= 20) return 3;
  if (progress >= 10) return 2;
  return 1;
}

// Auch global verfügbar machen für Diagnose-Zwecke
window.currentHighOrLowStage = currentHighOrLowStage;

// Exportiere eine Testfunktion für Import-Tests
export function testHighOrLowModuleImport() {
  console.log('High or Low module successfully imported');
  return true;
}
