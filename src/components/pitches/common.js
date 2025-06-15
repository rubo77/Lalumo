/**
 * common.js - Gemeinsame Funktionen für alle Pitch-Aktivitäten
 */

// Importiere Debug-Utilities
import { debugLog } from '../../utils/debug.js';

// Import all reset functions
import { resetHighOrLow } from './1_1_high_or_low.js';
import { resetMatchSounds } from './1_2_match_sounds.js';
import { resetDrawMelody } from './1_3_draw_melody.js';
import { resetSoundJudgment } from './1_4_sound_judgment.js';
import { resetMemoryGame } from './1_5_memory_game.js';

// Exportiere eine Testfunktion für Import-Tests
export function testCommonModuleImport() {
  console.log('Common module successfully imported');
  return true;
}

/**
 * Reset dispatcher - determines current activity and calls appropriate reset method
 * @param {Object} component - The Alpine.js component instance
 */
export function resetCurrentActivity(component) {
  const currentMode = component.mode;
  
  console.log('RESET_CURRENT: Attempting to reset current activity:', currentMode);
  
  // Show confirmation dialog
  const isGerman = document.documentElement.lang === 'de';
  const confirmMessage = isGerman ? 
    'Fortschritt für die aktuelle Aktivität zurücksetzen?' : 
    'Reset progress for current activity?';
    
  if (!confirm(confirmMessage)) {
    console.log('RESET_CURRENT: User cancelled reset');
    return;
  }
  
  // Map modes to reset methods
  const resetMethods = {
    '1_1_pitches_high_or_low': () => resetHighOrLow(component),
    '1_2_pitches_match-sounds': () => resetMatchSounds(component),
    '1_3_pitches_draw-melody': () => resetDrawMelody(component),
    '1_4_pitches_does-it-sound-right': () => resetSoundJudgment(component),
    '1_5_pitches_memory-game': () => resetMemoryGame(component)
  };
  
  const resetMethod = resetMethods[currentMode];
  if (resetMethod) {
    console.log('RESET_CURRENT: Executing reset for:', currentMode);
    resetMethod();
    showResetFeedback(currentMode);
  } else {
    console.log('RESET_CURRENT: No reset method found for mode:', currentMode);
  }
}

/**
 * Show reset confirmation feedback
 * @param {string} activityMode - The activity mode that was reset
 */
export function showResetFeedback(activityMode) {
  const isGerman = document.documentElement.lang === 'de';
  
  // Map activity modes to user-friendly names
  const activityNames = {
    '1_1_pitches_high_or_low': isGerman ? 'Hoch oder Tief' : 'High or Low',
    '1_2_pitches_match-sounds': isGerman ? 'Klänge zuordnen' : 'Match Sounds',
    '1_3_pitches_draw-melody': isGerman ? 'Melodie zeichnen' : 'Draw Melody',
    '1_4_pitches_does-it-sound-right': isGerman ? 'Klingt das richtig?' : 'Does It Sound Right?',
    '1_5_pitches_memory-game': isGerman ? 'Memory-Spiel' : 'Memory Game'
  };
  
  const activityName = activityNames[activityMode] || activityMode;
  const message = isGerman ? 
    `${activityName} Fortschritt zurückgesetzt!` : 
    `${activityName} progress reset!`;
  
  // Create or update feedback element
  let feedbackElement = document.querySelector('.reset-feedback');
  
  if (!feedbackElement) {
    feedbackElement = document.createElement('div');
    feedbackElement.className = 'reset-feedback';
    feedbackElement.style.cssText = `
      position: fixed; top: 20px; right: 20px; background-color: #4CAF50;
      color: white; padding: 12px 24px; border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 1000; font-size: 14px;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    document.body.appendChild(feedbackElement);
  }
  
  feedbackElement.textContent = message;
  feedbackElement.style.opacity = '1';
  
  // Hide the feedback after 3 seconds
  setTimeout(() => {
    feedbackElement.style.opacity = '0';
    setTimeout(() => {
      if (feedbackElement && feedbackElement.parentNode) {
        feedbackElement.parentNode.removeChild(feedbackElement);
      }
    }, 300);
  }, 3000);
}

/**
 * Reset all pitch activities progress
 * @param {Object} component - The Alpine.js component instance
 */
export function resetAllProgress(component) {
  console.log('RESET_ALL: Starting global reset of all pitch activities');
  
  // Show confirmation dialog
  const isGerman = document.documentElement.lang === 'de';
  const confirmMessage = isGerman ? 
    'ALLE Fortschritte in den Tonhöhen-Aktivitäten zurücksetzen? Dies kann nicht rückgängig gemacht werden!' : 
    'Reset ALL progress in pitch activities? This cannot be undone!';
    
  if (!confirm(confirmMessage)) {
    console.log('RESET_ALL: User cancelled global reset');
    return;
  }
  
  // Reset all activities
  console.log('RESET_ALL: Resetting High or Low activity');
  resetHighOrLow(component);
  
  console.log('RESET_ALL: Resetting Match Sounds activity');
  resetMatchSounds(component);
  
  console.log('RESET_ALL: Resetting Draw Melody activity');
  resetDrawMelody(component);
  
  console.log('RESET_ALL: Resetting Sound Judgment activity');
  resetSoundJudgment(component);
  
  console.log('RESET_ALL: Resetting Memory Game activity');
  resetMemoryGame(component);
  
  // Show global reset feedback
  const message = isGerman ? 
    'Alle Tonhöhen-Aktivitäten zurückgesetzt!' : 
    'All pitch activities reset!';
    
  showGlobalResetFeedback(message);
  
  console.log('RESET_ALL: Global reset completed successfully');
}

/**
 * Show global reset confirmation feedback
 * @param {string} message - The feedback message to display
 */
export function showGlobalResetFeedback(message) {
  // Create or update feedback element
  let feedbackElement = document.querySelector('.reset-feedback-global');
  
  if (!feedbackElement) {
    feedbackElement = document.createElement('div');
    feedbackElement.className = 'reset-feedback-global';
    feedbackElement.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background-color: #FF6B6B; color: white; padding: 16px 32px;
      border-radius: 8px; box-shadow: 0 6px 12px rgba(0,0,0,0.3);
      z-index: 1000; font-size: 16px; font-weight: bold;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    document.body.appendChild(feedbackElement);
  }
  
  feedbackElement.textContent = message;
  feedbackElement.style.opacity = '1';
  
  // Hide the feedback after 4 seconds (longer for global reset)
  setTimeout(() => {
    feedbackElement.style.opacity = '0';
    setTimeout(() => {
      if (feedbackElement && feedbackElement.parentNode) {
        feedbackElement.parentNode.removeChild(feedbackElement);
      }
    }, 300);
  }, 4000);
}

// Make globally available for diagnosis and manual testing
window.resetCurrentActivity = resetCurrentActivity;
window.showResetFeedback = showResetFeedback;
window.resetAllProgress = resetAllProgress;
