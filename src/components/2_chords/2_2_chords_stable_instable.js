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

// Current chord state
let currentChordType = null;
let currentBaseChord = [];      // Store the base chord (before transposition)
let currentChordFrequencies = []; // Store the transposed chord
let currentTransposeSemitones = 0; // Current transposition in semitones
let autoPlayTimeout = null;     // Store the auto-play timeout reference
let isFreeModeActive = true;    // Track if we're in free play mode
let isInitialized = false;      // Track if the module has been initialized
let freePlayChords = [];        // Store the pre-generated chords for free play mode

// Level progression step
const STABLE_INSTABLE_LEVEL_STEP = 10;

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testStableInstableModuleImport() {
  debugLog('CHORDS', 'Stable or Instable module successfully imported');
  
  // Initialize free play mode immediately when the module is imported
  if (!isInitialized) {
    initializeFreePlayMode();
    isInitialized = true;
    debugLog(['CHORDS_2_2_DEBUG', 'INIT'], 'Activity initialized with free play mode ready');
  }
  
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
/**
 * Initializes free play mode by generating random stable/instable chords for each button
 * This happens automatically when the module is loaded
 */
function initializeFreePlayMode() {
  freePlayChords = [];
  isFreeModeActive = true;
  
  // Generate one stable and one instable chord for the buttons
  const stableChord = generateStableChord();
  const instableChord = generateInstableChord();
  
  // Randomly assign to buttons (50/50 which is which)
  if (Math.random() < 0.5) {
    freePlayChords.push({ type: 'stable', chord: stableChord });
    freePlayChords.push({ type: 'instable', chord: instableChord });
  } else {
    freePlayChords.push({ type: 'instable', chord: instableChord });
    freePlayChords.push({ type: 'stable', chord: stableChord });
  }
  
  debugLog(['CHORDS_2_2_DEBUG', 'FREE_PLAY'], 'Initialized free play mode with chords:', freePlayChords);
}

/**
 * Plays the appropriate chord based on current mode
 * @param {Object} component - The Alpine component instance 
 * @param {boolean} isReplay - If true, replay the current chord; if false, generate a new one
 * @returns {Array|string} - In free play mode, returns the chord types; otherwise the current chord type
 */
export function playStableInstableChord(component, isReplay = false) {
  try {
    // Make sure we're initialized
    if (!isInitialized) {
      initializeFreePlayMode();
      isInitialized = true;
    }
    
    debugLog(['CHORDS_2_2_DEBUG', 'PLAY'], 
      `Play button pressed with isReplay=${isReplay}, isFreeModeActive=${isFreeModeActive}`);
    
    // The play button transitions from free mode to game mode
    if (isFreeModeActive) {
      // Switch from free play to game mode
      isFreeModeActive = false;
      debugLog(['CHORDS_2_2_DEBUG', 'MODE_CHANGE'], 'Switching from FREE PLAY to GAME MODE');
      
      // Generate a new random chord (not from free play)
      // Randomly choose between stable and unstable (50/50 chance)
      currentChordType = Math.random() < 0.5 ? 'stable' : 'instable';
      
      // Generate the appropriate chord
      currentBaseChord = currentChordType === 'stable' 
        ? generateStableChord() 
        : generateInstableChord();
      
      // Apply random transposition between -6 and +6 semitones
      currentTransposeSemitones = Math.floor(Math.random() * 13) - 6; // -6 to +6
      
      debugLog(['CHORDS_2_2_DEBUG', 'GAME_MODE'], 
        `First game chord: ${currentChordType} with transposition ${currentTransposeSemitones}`);
    } else {
      // Already in game mode
      if (isReplay) {
        // For replay, use the existing chord and transposition
        debugLog(['CHORDS_2_2_DEBUG', 'REPLAY'], 
          `Replaying ${currentChordType} chord with transposition ${currentTransposeSemitones}`);
        
        // Note: No need to regenerate the chord or transposition, just play the current one
      } else {
        // This is a new chord request in game mode
        // Randomly choose between stable and unstable (50/50 chance)
        currentChordType = Math.random() < 0.5 ? 'stable' : 'instable';
        
        // Generate the appropriate chord
        currentBaseChord = currentChordType === 'stable' 
          ? generateStableChord() 
          : generateInstableChord();
        
        // Apply random transposition between -6 and +6 semitones
        currentTransposeSemitones = Math.floor(Math.random() * 13) - 6; // -6 to +6
        
        debugLog(['CHORDS_2_2_DEBUG', 'NEW_CHORD'], 
          `Generated new ${currentChordType} chord with transposition ${currentTransposeSemitones}`);
      }
    }
    
    // Apply transposition to the base chord
    currentChordFrequencies = currentBaseChord.map(note => 
      transposeNote(note, currentTransposeSemitones)
    );
    
    // Play the chord using the audio engine
    playCurrentChord();
    
    debugLog(['CHORDS_2_2_DEBUG', '2_2_PLAY'], 
      `Playing ${isReplay ? 'replayed ' : ''}${currentChordType} chord ` +
      `(transposed ${currentTransposeSemitones > 0 ? '+' : ''}${currentTransposeSemitones} semitones)`
    );
    
    return currentChordType;
  } catch (error) {
    debugLog(['CHORDS_2_2_DEBUG', 'ERROR'], `Error in playStableInstableChord: ${error.message}`);
    return null;
  }
}


// Make functions globally available for calls in alpine HTML-tags
window.playStableInstableChord = playStableInstableChord;
window.checkStableInstableMatch = checkStableInstableMatch;

/**
 * Handles the user's selection in free play mode
 * @param {number} buttonIndex - The index of the button that was clicked (0 or 1)
 * @param {Object} component - The Alpine component instance
 */
function handleFreePlaySelection(buttonIndex, component) {
  if (buttonIndex < 0 || buttonIndex >= freePlayChords.length) {
    debugLog(['CHORDS_2_2_DEBUG', 'ERROR'], `Invalid button index: ${buttonIndex}`);
    return;
  }
  
  const selectedChord = freePlayChords[buttonIndex];
  
  debugLog(['CHORDS_2_2_DEBUG', 'FREE_PLAY'], 
    `Free play selection: ${selectedChord.type} chord (button ${buttonIndex + 1})`);
  
  // Set the current chord type and base chord
  currentChordType = selectedChord.type;
  currentBaseChord = [...selectedChord.chord];
  
  // Apply random transposition between -6 and +6 semitones
  currentTransposeSemitones = Math.floor(Math.random() * 13) - 6; // -6 to +6
  
  // Apply transposition to the base chord
  currentChordFrequencies = currentBaseChord.map(note => 
    transposeNote(note, currentTransposeSemitones)
  );
  
  // Play the chord
  playCurrentChord();
  
  debugLog(['CHORDS_2_2_DEBUG', 'FREE_PLAY'], 
    `Playing ${currentChordType} chord in free play mode, ` +
    `transposed ${currentTransposeSemitones > 0 ? '+' : ''}${currentTransposeSemitones} semitones`
  );
  
  // Update the background
  updateStableInstableBackground(component);
}

/**
 * Checks if the user's selection matches the current chord type
 * @param {string} selectedType - The type selected by the user ('stable' or 'instable')
 * @param {Object} component - The Alpine component instance
 * @returns {boolean} True if the selection is correct, false otherwise
 */
export function checkStableInstableMatch(selectedType, component) {
  try {
    // Make sure we're initialized
    if (!isInitialized) {
      initializeFreePlayMode();
      isInitialized = true;
    }
    
    // Handle free play mode
    if (isFreeModeActive) {
      debugLog(['CHORDS_2_2_DEBUG', 'FREE_PLAY'], `Button clicked in free play mode: ${selectedType}`);
      
      // Find which button was clicked (0 for stable, 1 for instable or vice versa)
      const buttonIndex = freePlayChords.findIndex(chord => chord.type === selectedType);
      if (buttonIndex !== -1) {
        handleFreePlaySelection(buttonIndex, component);
        return true; // In free play mode, any selection is "correct"
      }
      return false;
    }
    
    // Game mode (after play button is pressed)
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
    
    debugLog(['CHORDS_2_2_DEBUG', '2_2_PROGRESS'], 
      `Current progress before check: ${progress['2_2_chords_stable_instable']}, ` +
      `Selection: ${selectedType}, Actual: ${currentChordType}`);
    
    
    // Update progress if the answer is correct
    if (isCorrect) {
      // Increment progress
      progress['2_2_chords_stable_instable'] += 1;
      
      // Save updated progress
      localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
      
      // Update component's progress state
      if (component && component.progress) {
        component.progress['2_2_chords_stable_instable'] = progress['2_2_chords_stable_instable'];
        debugLog(['CHORDS_2_2_DEBUG', '2_2_PROGRESS'], 
          `Progress updated after correct answer: ${progress['2_2_chords_stable_instable']}`);
      } else {
        debugLog(['CHORDS_2_2_DEBUG', '2_2_PROGRESS', 'ERROR'], 
          'Component or component.progress not available, progress UI may not update');
      }
      
      // Show success feedback
      showRainbowSuccess();
      
      // For every 10 correct answers, show a bigger celebration
      if (progress['2_2_chords_stable_instable'] % 10 === 0) {
        showBigRainbowSuccess();
      }
      
      debugLog(['CHORDS_2_2_DEBUG', '2_2_MATCH'], `Correct! It was a ${currentChordType} chord. Progress: ${progress['2_2_chords_stable_instable']}`);
      
      // Play success sound and schedule next chord
      audioEngine.playNote('success');
      
      // Clear any existing timeout to prevent multiple auto-plays
      if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
      }
      
      // Schedule next chord after 2 seconds
      autoPlayTimeout = setTimeout(() => {
        // Reset transposition for a new chord
        currentTransposeSemitones = 0;
        // Trigger a new chord with a small delay to ensure audio context is ready
        setTimeout(() => {
          playStableInstableChord(component);
        }, 100);
      }, 2000);
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
      
      // Save updated progress to localStorage
      localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
      
      // Update component's progress state
      if (component && component.progress) {
        component.progress['2_2_chords_stable_instable'] = progress['2_2_chords_stable_instable'];
        // Trigger Alpine.js update
        component.$nextTick();
        debugLog(['CHORDS_2_2_DEBUG', '2_2_PROGRESS'], 
          `Progress updated after incorrect answer: ${progress['2_2_chords_stable_instable']}`);
      } else {
        debugLog(['CHORDS_2_2_DEBUG', '2_2_PROGRESS', 'ERROR'], 
          'Component or component.progress not available, progress UI may not update');
      }
      
      // Show error feedback
      showShakeError();
      audioEngine.playNote('try_again');
      
      // Replay the same chord after a delay (with same transposition)
      if (currentBaseChord.length > 0) {
        setTimeout(() => {
          // Replay the current chord with the same transposition
          currentChordFrequencies = currentBaseChord.map(note => 
            transposeNote(note, currentTransposeSemitones)
          );
          playCurrentChord();
          debugLog(['CHORDS_2_2_DEBUG', '2_2_REPLAY'], 
            `Replaying ${currentChordType} chord ` +
            `(transposed ${currentTransposeSemitones > 0 ? '+' : ''}${currentTransposeSemitones} semitones)`
          );
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

/**
 * Plays the currently stored chord with the current transposition
 */
function playCurrentChord() {
  if (currentChordFrequencies.length > 0) {
    audioEngine.playChord(currentChordFrequencies, {
      duration: 2.0,
      volume: -12,
      type: 'sine',
      attack: 0.1,
      release: 1.5
    });
  } else {
    debugLog(['CHORDS_2_2_DEBUG', 'WARNING'], 'No chord frequencies to play');
  }
}

// Make functions globally available for calls in alpine HTML-tags
window.checkStableInstableMatch = checkStableInstableMatch;
window.playStableInstableChord = playStableInstableChord;

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
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}`;
}

/**
 * Transposes a note by the specified number of semitones
 * @param {string} note - The note to transpose (e.g., 'C4')
 * @param {number} semitones - Number of semitones to transpose (can be positive or negative)
 * @returns {string} Transposed note
 */
function transposeNote(note, semitones) {
  if (semitones === 0) return note;
  
  // Parse the note name and octave
  const noteMatch = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!noteMatch) return note; // Return original if format is invalid
  
  const [, noteName, octave] = noteMatch;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Find the index of the note in the chromatic scale
  let noteIndex = noteNames.indexOf(noteName);
  if (noteIndex === -1) return note; // Return original if note name is invalid
  
  // Calculate new note index and octave
  let newNoteIndex = (noteIndex + semitones) % 12;
  if (newNoteIndex < 0) newNoteIndex += 12;
  
  const octaveOffset = Math.floor((noteIndex + semitones) / 12);
  const newOctave = parseInt(octave, 10) + octaveOffset;
  
  return `${noteNames[newNoteIndex]}${newOctave}`;
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

