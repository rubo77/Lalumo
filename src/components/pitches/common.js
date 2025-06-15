/**
 * common.js - Gemeinsame Funktionen für alle Pitch-Aktivitäten
 */

// Importiere Debug-Utilities
import { debugLog } from '../../utils/debug.js';

// Import all reset functions
import { reset_1_1_HighOrLow_Progress } from './1_1_high_or_low.js';
import { reset_1_2_MatchSounds_Progress } from './1_2_match_sounds.js';
import { reset_1_3_DrawMelody_Progress } from './1_3_draw_melody.js';
import { reset_1_4_SoundJudgment_Progress } from './1_4_sound_judgment.js';
import { reset_1_5_MemoryGame_Progress } from './1_5_memory_game.js';

// Exportiere eine Testfunktion für Import-Tests
export function testCommonModuleImport() {
  console.log('Common module successfully imported');
  return true;
}

/**
 * Reset dispatcher - determines current activity and calls appropriate reset method
 * @param {string} currentMode - The current activity mode
 */
export function resetCurrentActivity(currentMode) {
  console.log('RESET_CURRENT: Current mode detected:', currentMode);
  console.log('RESET_CURRENT: Mode type:', typeof currentMode);
  console.log('RESET_CURRENT: window.pitchesComponent available:', !!window.pitchesComponent);
  
  if (window.pitchesComponent) {
    console.log('RESET_CURRENT: Component mode:', window.pitchesComponent.mode);
    console.log('RESET_CURRENT: Component progress before reset:', window.pitchesComponent.progress);
  }
  
  const isGerman = document.documentElement.lang === 'de';
  
  // Map activity modes to user-friendly names
  const activityNames = {
    '1_1_pitches_high_or_low': isGerman ? 'Hoch oder Tief' : 'High or Low',
    '1_2_pitches_match-sounds': isGerman ? 'Klänge zuordnen' : 'Match Sounds',
    '1_3_pitches_draw-melody': isGerman ? 'Melodie zeichnen' : 'Draw Melody',
    '1_4_pitches_does-it-sound-right': isGerman ? 'Klingt das richtig?' : 'Does It Sound Right?',
    '1_5_pitches_memory-game': isGerman ? 'Memory-Spiel' : 'Memory Game'
  };
  
  console.log('RESET_CURRENT: Available activity names:', Object.keys(activityNames));
  console.log('RESET_CURRENT: Mode match found:', activityNames[currentMode] ? 'YES' : 'NO');
  
  const activityName = activityNames[currentMode];
  
  if (!activityName) {
    console.log('RESET_CURRENT: No matching activity name found for mode:', currentMode);
    console.log('RESET_CURRENT: Using fallback generic message');
    const fallbackMessage = isGerman ? 
      'Keine passende Aktivität gefunden. Trotzdem zurücksetzen?' : 
      'No matching activity found. Reset anyway?';
    if (!confirm(fallbackMessage)) {
      return;
    }
  } else {
    // Show confirmation dialog with specific activity name
    const confirmMessage = isGerman ? 
      `Fortschritt für "${activityName}" zurücksetzen?` : 
      `Reset progress for "${activityName}"?`;
      
    if (!confirm(confirmMessage)) {
      console.log('RESET_CURRENT: User cancelled reset');
      return;
    }
  }
  
  // Map modes to reset methods
  const resetMethods = {
    '1_1_pitches_high_or_low': () => reset_1_1_HighOrLow_Progress(window.pitchesComponent),
    '1_2_pitches_match-sounds': () => reset_1_2_MatchSounds_Progress(window.pitchesComponent),
    '1_3_pitches_draw-melody': () => reset_1_3_DrawMelody_Progress(window.pitchesComponent),
    '1_4_pitches_does-it-sound-right': () => reset_1_4_SoundJudgment_Progress(window.pitchesComponent),
    '1_5_pitches_memory-game': () => reset_1_5_MemoryGame_Progress(window.pitchesComponent)
  };
  
  const resetMethod = resetMethods[currentMode];
  if (resetMethod) {
    console.log('RESET_CURRENT: Found reset method for:', currentMode);
    
    // Safety check for window.pitchesComponent
    if (!window.pitchesComponent) {
      console.error('RESET_CURRENT: window.pitchesComponent not available! Cannot reset component state.');
      console.log('RESET_CURRENT: Available methods on window:', Object.keys(window).filter(k => k.includes('pitches')));
      
      const message = isGerman ? 
        'Fehler: Komponente nicht verfügbar. Bitte laden Sie die Seite neu.' : 
        'Error: Component not available. Please reload the page.';
      alert(message);
      return;
    }
    
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
    `${activityName} Fortschritt erfolgreich zurückgesetzt!` : 
    `${activityName} progress successfully reset!`;
  
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
  reset_1_1_HighOrLow_Progress(window.pitchesComponent);
  
  console.log('RESET_ALL: Resetting Match Sounds activity');
  reset_1_2_MatchSounds_Progress(window.pitchesComponent);
  
  console.log('RESET_ALL: Resetting Draw Melody activity');
  resetDrawMelody(window.pitchesComponent);
  
  console.log('RESET_ALL: Resetting Sound Judgment activity');
  resetSoundJudgment(window.pitchesComponent);
  
  console.log('RESET_ALL: Resetting Memory Game activity');
  resetMemoryGame(window.pitchesComponent);
  
  // Show global reset feedback
  const message = isGerman ? 
    'Alle Tonhöhen-Aktivitäten erfolgreich zurückgesetzt!' : 
    'All pitch activities successfully reset!';
    
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
