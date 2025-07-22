/**
 * 1_1_high_or_low.js - Modul für die "High or Low" Aktivität
 */

// Importiere Debug-Utilities
import { debugLog } from '../../utils/debug.js';

// Debug-Log beim Laden des Moduls
console.log('HIGH_OR_LOW_MODULE: Module loaded');

/**
 * Calculate level for Activity 1_1 (High or Low) based on progress
 * Replaces the old currentHighOrLowStage function
 * @param {Object} component - The Alpine component instance
 * @returns {number} Current level (1-5)
 */
export function get_1_1_level(component) {
  const progress = component?.progress?.['1_1'] || 0;
  
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
 * Bestimmt die aktuelle Schwierigkeitsstufe in der "High or Low"-Aktivität
 * basierend auf dem Fortschritt des Benutzers.
 * 
 * @param {Object} component - Die Alpine.js Komponente
 * @returns {number} - Die aktuelle Stufe (1-5)
 * @deprecated Use get_1_1_level instead for unified progress tracking
 */
export function currentHighOrLowStage(component) {
  // Use unified progress tracking
  return get_1_1_level(component);
}

/**
 * Reset High or Low activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_1_HighOrLow_Progress(component) {
  console.log('RESET_HIGH_OR_LOW: Starting reset process', {
    currentProgress: component.progress['1_1'] || 0,
    gameStarted: component.gameStarted
  });
  
  // Reset progress to 0 (level will be calculated automatically)
  if (!component.progress) component.progress = {};
  component.progress['1_1'] = 0;
  
  // Reset component variables
  component.currentHighOrLowTone = null;
  component.highOrLowSecondTone = null;
  component.highOrLowPlayed = false;
  component.gameStarted = false;
  
  // Reset persistent instrument selection
  component.currentHighOrLowInstrument = null;
  debugLog(['RESET_HIGH_OR_LOW', 'INSTRUMENT'], 'Reset persistent instrument selection');
  
  // Clear old localStorage keys
  localStorage.removeItem('lalumo_progress_high_or_low');
  
  // Also persist the reset to localStorage using central progress object
  const progressData = localStorage.getItem('lalumo_progress');
  let progress = {};
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
    } catch (error) {
      console.error('Error parsing progress data:', error);
    }
  }
  progress['1_1'] = 0;
  localStorage.setItem('lalumo_progress', JSON.stringify(progress));
  
  // Force UI update by triggering Alpine.js reactivity
  // This ensures the progress display and stage-dependent UI elements update correctly
  component.$nextTick(() => {
    // Force re-evaluation of level-dependent elements
    const event = new CustomEvent('high-or-low-reset', { 
      detail: { newProgress: 0, newStage: 1 } 
    });
    document.dispatchEvent(event);
    
    console.log('RESET_HIGH_OR_LOW: UI refresh triggered');
  });
  
  console.log('RESET_HIGH_OR_LOW: Reset completed successfully with UI refresh');
}

/**
 * Setup for the High or Low activity
 * @activity 1_1_high_or_low
 */
export function setupHighOrLowMode_1_1(component) {
  // Initialize the high or low activity
  console.log('High or Low mode ready with progress:', component.highOrLowProgress);
  
  // Pre-generate sequence to support early button presses
  const stage = get_1_1_level(component);
  component.generate1_1HighOrLowSequence(stage);
  debugLog(['HIGH_OR_LOW', 'SETUP'], `Pre-generated sequence for stage ${stage} to support early button presses`);
  
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
window.get_1_1_level = get_1_1_level;
window.reset_1_1_HighOrLow_Progress = reset_1_1_HighOrLow_Progress;
