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

/**
 * Reset High or Low activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_1_HighOrLow_Progress(component) {
  console.log('RESET_HIGH_OR_LOW: Starting reset process', {
    currentProgress: component.highOrLowProgress,
    gameStarted: component.gameStarted
  });
  
  // Reset component variables
  component.highOrLowProgress = 0;
  component.currentHighOrLowTone = null;
  component.highOrLowSecondTone = null;
  component.highOrLowPlayed = false;
  component.gameStarted = false;
  
  // Clear localStorage
  localStorage.removeItem('lalumo_progress_high_or_low');
  
  // Update progress object
  component.progress['1_1_pitches_high_or_low'] = 0;
  component.updateProgressPitches();
  
  console.log('RESET_HIGH_OR_LOW: Reset completed successfully');
}

/**
 * Setup for the High or Low activity
 * @activity 1_1_high_or_low
 */
export function setupHighOrLowMode_1_1(component) {
  // Initialize the high or low activity
  console.log('High or Low mode ready with progress:', component.highOrLowProgress);
  
  // Reset the current sequence so a new one will be generated on play
  component.currentHighOrLowSequence = null;
  
  // Reset game state - not started until the user explicitly clicks play
  component.gameStarted = false;
  console.log('High or Low game reset, gameStarted:', component.gameStarted);
  
  // Show intro message immediately when entering the activity
  component.showActivityIntroMessage('1_1_pitches_high_or_low');
}


/* *************************************************** *
make variables global available, 
e.g. for diagnosis purposes to be used in the developer console
*******************************************************/
window.currentHighOrLowStage = currentHighOrLowStage;
