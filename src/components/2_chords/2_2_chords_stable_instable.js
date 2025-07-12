/**
 * 2_2_chords_stable_instable.js - Module for the "Stable or Instable Chords" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Import audio engine
import audioEngine from '../audio-engine.js';

// Import feedback utilities
import { 
  showRainbowSuccess, 
  showBigRainbowSuccess, 
  showShakeError, 
  showCompleteSuccess, 
  showCompleteError 
} from '../shared/feedback.js';

// Current chord type (stable or instable) and frequencies
let currentChordType = null;
let currentChordFrequencies = [];

// Level progression step
const STABLE_INSTABLE_LEVEL_STEP = 10;

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testStableInstableModuleImport() {
  debugLog('CHORDS', 'Stable or Instable module successfully imported');
  return true;
}


/**
 * Generates an unstable (dissonant) chord with 6 notes
 * @returns {Array} Array of note frequencies
 */
export function generateInstableChord() {
  // Cluster of minor 2nds and tritones for maximum dissonance
  const root = 60; // Middle C
  return [
    midiToNoteName(root),           // Root (C4)
    midiToNoteName(root + 1),       // Minor 2nd (very dissonant) (C#4)
    midiToNoteName(root + 6),       // Tritone (the "devil's interval") (F#4)
    midiToNoteName(root + 7),       // Perfect 5th (but clashes with tritone) (G4)
    midiToNoteName(root + 8),       // Minor 6th (clashes with 5th) (G#4)
    midiToNoteName(root + 10)       // Major 7th (clashes with root) (B4)
  ];
}

/**
 * Plays either a stable or unstable chord
 * @param {Object} component - The Alpine component instance
 * @returns {string} The type of chord played ('stable' or 'instable')
 */
export function playStableInstableChord(component) {
  try {
    // Randomly choose between stable and unstable (50/50 chance)
    const chordType = Math.random() < 0.5 ? 'stable' : 'instable';
    
    // Store the current chord type for checking the answer
    currentChordType = chordType;
    
    // Generate the appropriate chord
    currentChordFrequencies = chordType === 'stable' 
      ? generateStableChord() 
      : generateInstableChord();
    
    // Play the chord using the audio engine
    audioEngine.playChord(currentChordFrequencies, {
      duration: 2.0,
      volume: -12,
      type: 'sine',
      attack: 0.1,
      release: 1.5
    });
    
    debugLog(['CHORDS_2_2_DEBUG', '2_2_PLAY'], `Playing ${chordType} chord`);
    return chordType;
  } catch (error) {
    debugLog(['CHORDS_2_2_DEBUG', 'ERROR'], `Error in playStableInstableChord: ${error.message}`);
    return null;
  }
}


// Make globally available for calls in alpine HTML-tags
window.playStableInstableChord = playStableInstableChord;

/**
 * Checks if the user's selection matches the current chord type
 * @param {string} selectedType - The type selected by the user ('stable' or 'instable')
 * @param {Object} component - The Alpine component instance
 * @returns {boolean} True if the selection is correct, false otherwise
 */
export function checkStableInstableMatch(selectedType, component) {
  try {
    if (!currentChordType) {
      debugLog(['CHORDS_2_2_DEBUG', 'WARNING'], 'No current chord type to check against');
      return false;
    }
    
    const isCorrect = selectedType === currentChordType;
    
    // Get current progress
    const progressData = localStorage.getItem('lalumo_chords_progress');
    const progress = progressData ? JSON.parse(progressData) : {};
    
    // Initialize progress for this activity if it doesn't exist
    if (!progress['2_2_chords_stable_instable']) {
      progress['2_2_chords_stable_instable'] = 0;
    }
    
    // Update progress if the answer is correct
    if (isCorrect) {
      // Increment progress
      progress['2_2_chords_stable_instable'] += 1;
      
      // Save updated progress
      localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
      
      // Update component's progress state
      if (component && component.progress) {
        component.progress['2_2_chords_stable_instable'] = progress['2_2_chords_stable_instable'];
      }
      
      // Show success feedback
      showRainbowSuccess();
      
      // For every 10 correct answers, show a bigger celebration
      if (progress['2_2_chords_stable_instable'] % 10 === 0) {
        showBigRainbowSuccess();
      }
      
      debugLog(['CHORDS_2_2_DEBUG', '2_2_MATCH'], `Correct! It was a ${currentChordType} chord. Progress: ${progress['2_2_chords_stable_instable']}`);
      
      // Play success sound
      audioEngine.playNote('success');
    } else {
      // Reset progress to the beginning of the current level
      const currentProgress = progress['2_2_chords_stable_instable'];
      const currentLevel = Math.floor(currentProgress / STABLE_INSTABLE_LEVEL_STEP);
      const newProgress = currentLevel * STABLE_INSTABLE_LEVEL_STEP;
      
      // Only reset if we're not already at the start of a level
      if (currentProgress > newProgress) {
        progress['2_2_chords_stable_instable'] = newProgress;
        debugLog(['CHORDS_2_2_DEBUG', '2_2_RESET'], `Progress reset to ${newProgress} (level ${currentLevel})`);
      } else {
        // Don't go below 0
        progress['2_2_chords_stable_instable'] = Math.max(0, currentProgress - 1);
      }
      
      debugLog(['CHORDS_2_2_DEBUG', '2_2_MATCH'], `Incorrect. It was a ${currentChordType} chord. Progress reset to ${progress['2_2_chords_stable_instable']}`);

      // Show error feedback
      showShakeError();
      audioEngine.playNote('try_again');
      
      // Replay the same chord after a delay
      if (currentChordFrequencies.length > 0) {
        setTimeout(() => {
          audioEngine.playChord(currentChordFrequencies, {
            duration: 2.0,
            volume: -12,
            type: 'sine',
            attack: 0.1,
            release: 1.5
          });
          debugLog(['CHORDS_2_2_DEBUG', '2_2_REPLAY'], `Replaying ${currentChordType} chord`);
        }, 1000);
      }
    }
    
    // Update the background based on progress
    updateStableInstableBackground(component);
    
    return isCorrect;
  } catch (error) {
    debugLog(['CHORDS_2_2_DEBUG', 'ERROR'], `Error in checkStableInstableMatch: ${error.message}`);
    return false;
  }
}

// Make checkStableInstableMatch globally available for calls in alpine HTML-tags
window.checkStableInstableMatch = checkStableInstableMatch;

/**
 * Updates the background image based on progress in the stable/instable chords activity
 * @param {Object} component - The Alpine component instance
 */
export function updateStableInstableBackground(component) {
  try {
    // Get progress from localStorage or component state
    const progressData = localStorage.getItem('lalumo_chords_progress');
    const progress = progressData ? 
      JSON.parse(progressData)['2_2_chords_stable_instable'] || 0 : 
      component?.progress?.['2_2_chords_stable_instable'] || 0;
    
    // Preload function for smoother transitions
    const preloadBackgroundImage = (src) => {
      const img = new Image();
      img.src = src;
    };
    
    // Background image changes based on progress thresholds
    let backgroundImage = './images/backgrounds/2_2_chords_stable_instable.png';
    
    // Add more background variations as needed based on progress
    if (progress >= 10 && progress < 20) {
      backgroundImage = './images/backgrounds/2_2_chords_stable_instable.png';
    } else if (progress >= 20) {
      backgroundImage = './images/backgrounds/2_2_chords_stable_instable.png';
    }
    
    // Update the background in the DOM
    const activityElement = document.querySelector('[x-show="mode === \'2_2_chords_stable_instable\'"]');
    if (activityElement) {
      activityElement.style.backgroundImage = `url(${backgroundImage})`;
      debugLog(['CHORDS_2_2_DEBUG', '2_2_BACKGROUND'], `Updated background based on progress (${progress}): ${backgroundImage}`);
    } else {
      debugLog(['CHORDS_2_2_DEBUG', 'ERROR'], 'Error updating background: div not found');
    }
  } catch (error) {
    debugLog(['CHORDS_2_2_DEBUG', 'ERROR'], `Error in updateStableInstableBackground: ${error.message}`);
  }
}

/**
 * Reset progress for Stable or Instable Chords activity (2_2)
 * Used by the resetCurrentActivity function
 */
export function reset_2_2_StableInstable_Progress() {
  debugLog(['CHORDS_2_2_DEBUG', 'RESET'], 'Resetting 2_2_chords_stable_instable progress...');
  
  // Get the chordsComponent from window global
  const chordsComponent = window.chordsComponent;
  if (!chordsComponent) {
    console.error('Cannot reset 2_2_chords_stable_instable: chordsComponent not found');
    return;
  }
  
  // Get existing progress from localStorage
  let progressData = localStorage.getItem('lalumo_chords_progress');
  let progress = {};
  
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
      // Reset just the 2_2_chords_stable_instable activity progress
      progress['2_2_chords_stable_instable'] = 0;
    } catch (error) {
      debugLog(['CHORDS_2_2_DEBUG', 'ERROR'], `Error parsing progress data: ${error.message}`);
      progress = { '2_2_chords_stable_instable': 0 };
    }
  } else {
    progress = { '2_2_chords_stable_instable': 0 };
  }
  
  // Save updated progress back to localStorage
  localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
  
  // Update component's in-memory state
  if (chordsComponent.progress) {
    chordsComponent.progress['2_2_chords_stable_instable'] = 0;
  }
  
  // Update UI to reflect reset progress
  updateStableInstableBackground(chordsComponent);
  
  debugLog(['CHORDS_2_2_DEBUG', 'RESET'], '2_2_chords_stable_instable progress reset complete');
}

/**
 * Converts a MIDI note number to a note name in the format 'C4', 'D#4', etc.
 * @param {number} midiNote - MIDI note number (e.g., 60 for middle C)
 * @returns {string} Note name in Tone.js format
 */
function midiToNoteName(midiNote) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = notes[midiNote % 12];
  return `${noteName}${octave}`;
}

/**
 * Generates a stable (consonant) chord with 6 notes
 * @returns {Array} Array of note names in Tone.js format (e.g., ['C4', 'E4', 'G4'])
 */
export function generateStableChord() {
  // Major 7th chord with added 9th and 13th for richness
  const root = 60; // Middle C (C4)
  return [
    midiToNoteName(root),           // Root (C4)
    midiToNoteName(root + 4),       // Major 3rd (E4)
    midiToNoteName(root + 7),       // Perfect 5th (G4)
    midiToNoteName(root + 11),      // Major 7th (B4)
    midiToNoteName(root + 14),      // 9th (D5)
    midiToNoteName(root + 21)       // 13th (A5)
  ];
}

