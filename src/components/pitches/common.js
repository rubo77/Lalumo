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
import { reset_2_5_ChordTypes_Progress } from '../2_chords/2_5_chord_characters.js';


// Exportiere eine Testfunktion für Import-Tests
export function testCommonModuleImport() {
  console.log('Common module successfully imported');
  return true;
}

/**
 * Get user-friendly activity names for different languages
 * @param {boolean} isGerman - Whether to return German names
 * @returns {Object} Object mapping activity modes to user-friendly names
 */
function getActivityNames(isGerman) {
  return {
    '1_1_pitches_high_or_low': isGerman ? 'Hoch oder Tief' : 'High or Low',
    '1_2_pitches_match-sounds': isGerman ? 'Klänge zuordnen' : 'Match Sounds',
    '1_3_pitches_draw-melody': isGerman ? 'Melodie zeichnen' : 'Draw Melody',
    '1_4_pitches_does-it-sound-right': isGerman ? 'Klingt das richtig?' : 'Does It Sound Right?',
    '1_5_pitches_memory-game': isGerman ? 'Memory-Spiel' : 'Memory Game',
    '2_1_chords_color-matching': isGerman ? 'Akkord-Farb Zuordnung' : 'Chord Color Matching',
    '2_2_chords_stable_unstable': isGerman ? 'Stabile/Instabile Akkorde' : 'Stable or Unstable Chords',
    '2_3_chords_chord-building': isGerman ? 'Akkord-Bau' : 'Chord Building',
    '2_4_chords_missing-note': isGerman ? 'Fehlende Noten' : 'Missing Note',
    '2_5_chords_characters': isGerman ? 'Akkord-Charaktere' : 'Chord Characters',
    '2_6_chords_harmony-gardens': isGerman ? 'Harmonie Garten' : 'Harmony Gardens'
  };
}

/**
 * Reset dispatcher - determines current activity and calls appropriate reset method
 * @param {string} currentMode - The current activity mode (optional - will use the unified store if not provided)
 */
export function resetCurrentActivity(currentMode) {
  // Auto-detect current mode using the unified store if no parameter is passed
  if (!currentMode && window.Alpine?.store) {
    // Get the current activity mode from the Alpine store
    const currentActivityMode = window.Alpine.store('currentActivityMode');
    
    if (currentActivityMode && currentActivityMode.component && currentActivityMode.mode) {
      currentMode = currentActivityMode.mode;
      console.log(`RESET_CURRENT: Using unified activity mode: ${currentActivityMode.component}.${currentMode}`);
    } else {
      console.log('RESET_CURRENT: No unified activity mode found, falling back to DOM detection');
      
      // Fallback: Check if any chord activity is currently visible
      const isChordActivityVisible = document.querySelector('.chord-activity[style*="display: block"]') !== null;
      
      if (isChordActivityVisible) {
        // A chord activity is visible, prioritize chordsComponent
        if (window.chordsComponent && window.chordsComponent.mode && window.chordsComponent.mode !== 'main') {
          currentMode = window.chordsComponent.mode;
          console.log('RESET_CURRENT: Auto-detected active mode from chords component:', currentMode);
        }
      } else {
        // No chord activity visible, check pitches component
        if (window.pitchesComponent && window.pitchesComponent.mode && window.pitchesComponent.mode !== 'main') {
          currentMode = window.pitchesComponent.mode;
          console.log('RESET_CURRENT: Auto-detected active mode from pitches component:', currentMode);
        }
      }
      
      // Last-resort fallback if DOM checking didn't work
      if (!currentMode) {
        if (window.pitchesComponent?.mode && window.pitchesComponent.mode !== 'main') {
          currentMode = window.pitchesComponent.mode;
          console.log('RESET_CURRENT: Fallback detected mode from pitches component:', currentMode);
        } else if (window.chordsComponent?.mode && window.chordsComponent.mode !== 'main') {
          currentMode = window.chordsComponent.mode;
          console.log('RESET_CURRENT: Fallback detected mode from chords component:', currentMode);
        }
      }
    }
  }
  
  console.log('RESET_CURRENT: Current mode detected:', currentMode);
  console.log('RESET_CURRENT: Mode type:', typeof currentMode);
  console.log('RESET_CURRENT: window.pitchesComponent available:', !!window.pitchesComponent);
  
  if (window.pitchesComponent) {
    console.log('RESET_CURRENT: Component mode:', window.pitchesComponent.mode);
    console.log('RESET_CURRENT: Component progress before reset:', window.pitchesComponent.progress);
  }
  
  const isGerman = document.documentElement.lang === 'de';
  
  // Use shared function to get activity names
  const activityNames = getActivityNames(isGerman);
  
  console.log('RESET_CURRENT: Available activity names:', Object.keys(activityNames));
  console.log('RESET_CURRENT: Mode match found for activity ' + currentMode + ':', activityNames[currentMode] ? 'YES' : 'NO');
  
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
    '1_5_pitches_memory-game': () => reset_1_5_MemoryGame_Progress(window.pitchesComponent),
    '2_5_chords_characters': () => reset_2_5_ChordTypes_Progress(window.pitchesComponent)
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
  
  // Use shared function to get activity names
  const activityNames = getActivityNames(isGerman);
  
  const activityName = activityNames[activityMode] || activityMode;
  const message = isGerman ? 
    `${activityName} Fortschritt zurückgesetzt! Starte neu in 3 Sekunden ...` : 
    `${activityName} progress reset! Reloading to apply ...`;
  
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
      window.location.reload();
    }, 300);
  }, 3000);
}

/**
 * Reset all pitch activities progress
 * @param {Object} component - The Alpine.js component instance
 */
export function resetAllProgress(component) {
  console.log('RESET_ALL: Starting global reset of all activities');
  
  // Show confirmation dialog
  const isGerman = document.documentElement.lang === 'de';
  const confirmMessage = isGerman ? 
    'ALLE Fortschritte in allen Aktivitäten zurücksetzen? Dies kann nicht rückgängig gemacht werden!' : 
    'Reset ALL progress in all activities? This cannot be undone!';
    
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
  reset_1_3_DrawMelody_Progress(window.pitchesComponent);
  
  console.log('RESET_ALL: Resetting Sound Judgment activity');
  reset_1_4_SoundJudgment_Progress(window.pitchesComponent);
  
  console.log('RESET_ALL: Resetting Memory Game activity');
  reset_1_5_MemoryGame_Progress(window.pitchesComponent);
  
  console.log('RESET_ALL: Resetting Chord Types activity');
  reset_2_5_ChordTypes_Progress(window.pitchesComponent);
  

  // Show global reset feedback
  const message = isGerman ? 
    'Alle Aktivitäten erfolgreich zurückgesetzt!' : 
    'All activities successfully reset!';
    
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
    window.scrollTo(0,0);
    window.location.reload();
  }, 3000);
}

// Make globally available for diagnosis and manual testing
window.resetCurrentActivity = resetCurrentActivity;
window.showResetFeedback = showResetFeedback;
window.resetAllProgress = resetAllProgress;
