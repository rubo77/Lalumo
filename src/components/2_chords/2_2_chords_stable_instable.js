/**
 * 2_2_chords_stable_instable.js - Module for the "Stable or Instable Chords" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';
import { preloadBackgroundImage } from '../shared/image-utils.js';
import { midiToNoteName, transposeNote, NOTE_NAMES } from '../shared/music-utils.js';

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
 * Resets the activity to free play mode when entered from navigation
 * Should be called when the activity is entered
 */
export function reset2_2ToFreePlayMode() {
  debugLog(['CHORDS_2_2_DEBUG', 'RESET'], 'Resetting to free play mode');
  
  // Reset to free play mode
  isFreeModeActive = true;
  
  // Re-initialize free play mode
  initializeFreePlayMode();
  
  debugLog(['CHORDS_2_2_DEBUG', 'RESET'], 'Reset complete, free play mode activated');
}


/**
 * Generates an unstable (dissonant) chord based on the current progress level
 * @param {number} progressLevel - Current progress level (0-5 for levels 1-6)
 * @returns {Array} Array of note names in Tone.js format
 */
export function generateInstableChord(progressLevel = 0) {
  // Base note that will be prominent in all chord types
  const root = 48; // C2 as a prominent low base note
  const baseNote = midiToNoteName(root);
  
  // Get current progress from localStorage if not provided
  if (progressLevel === undefined) {
    const progressData = localStorage.getItem('lalumo_chords_progress');
    if (progressData) {
      const progress = JSON.parse(progressData);
      progressLevel = progress['2_2_chords_stable_instable'] || 0;
    } else {
      progressLevel = 0;
    }
  }
  
  // Calculate the level (0-5) based on progress points
  const level = Math.min(5, Math.floor(progressLevel / STABLE_INSTABLE_LEVEL_STEP));
  
  debugLog(['CHORDS_2_2_DEBUG', 'LEVEL'], `Generating unstable chord for level ${level+1} (progress: ${progressLevel})`);
  
  // Different chord types based on level
  switch(level) {
    case 0: // Level 1: Clearly dissonant clusters
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root an octave up (C3)
        midiToNoteName(root + 13),  // Minor 2nd (C#3) - very dissonant
        midiToNoteName(root + 18),  // Tritone (F#3) - the "devil's interval"
        midiToNoteName(root + 24),  // Octave (C4)
        midiToNoteName(root + 25)   // Minor 2nd (C#4) - dissonant octave higher
      ];
      
    case 1: // Level 2: Altered dominants with dissonances
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 17),  // Augmented 5th (F3) - creates tension
        midiToNoteName(root + 21),  // Minor 7th (Bb3) - dominant quality
        midiToNoteName(root + 24),  // Octave (C4)
        midiToNoteName(root + 26),  // Flat 9th (D4) - dissonant against C
        midiToNoteName(root + 32)   // Augmented 5th (G#4) - clash with root
      ];
      
    case 2: // Level 3: Polytonal chords with conflicting base notes
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 13),  // C#3 - conflicting base note
        midiToNoteName(root + 16),  // E3 - suggesting C major
        midiToNoteName(root + 20),  // G#3 - suggesting C# major
        midiToNoteName(root + 24),  // C4 - reinforcing C
        midiToNoteName(root + 27),  // D#4 - reinforcing C#
        midiToNoteName(root + 30)   // F#4 - suggesting D dominant
      ];
      
    case 3: // Level 4: Atonal clusters with irregular spacing
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 15),  // Minor 3rd (Eb3)
        midiToNoteName(root + 16),  // Major 3rd (E3) - direct clash with minor 3rd
        midiToNoteName(root + 18),  // Tritone (F#3)
        midiToNoteName(root + 23),  // Major 7th (B3) - dissonant against root
        midiToNoteName(root + 25)   // Minor 9th (C#4) - dissonant against root
      ];
      
    case 4: // Level 5: Microtonal variations (approximated with standard tuning)
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 13),  // Minor 2nd (C#3) - approximating quarter-tone
        midiToNoteName(root + 18),  // Tritone (F#3) 
        midiToNoteName(root + 19),  // Perfect 5th (G3) - direct clash with tritone
        midiToNoteName(root + 23),  // Major 7th (B3) - tension against root
        midiToNoteName(root + 25)   // Minor 9th (C#4) - more dissonance
      ];
      
    case 5: // Level 6: Highly sophisticated dissonances
    default:
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 13),  // Minor 2nd (C#3)
        midiToNoteName(root + 18),  // Tritone (F#3)
        midiToNoteName(root + 23),  // Major 7th (B3)
        midiToNoteName(root + 25),  // Minor 9th (C#4)
        midiToNoteName(root + 29),  // Augmented 11th (F#4)
        midiToNoteName(root + 34)   // Augmented 13th (A#4) - extreme dissonance
      ];
  }
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
  
  // Always use level 1 chords for free play mode to make them easily distinguishable
  const stableChord = generateStableChord(0);  // Level 1 (simple stable chord)
  const instableChord = generateInstableChord(0);  // Level 1 (simple unstable chord)
  
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
      `playStableInstableChord called: isFreeModeActive=${isFreeModeActive}, isReplay=${isReplay}`);
    
    // If this is a replay request and we have a current chord, just replay it
    if (isReplay && currentChordType) {
      playCurrentChord();
      debugLog(['CHORDS_2_2_DEBUG', '2_2_REPLAY'], 
        `Replaying ${currentChordType} chord ` +
        `(transposed ${currentTransposeSemitones > 0 ? '+' : ''}${currentTransposeSemitones} semitones)`);
      return currentChordType;
    }
    
    // If free mode is active, keep it active but switch to game mode on play button
    // The play button should start the game
    if (isFreeModeActive) {
      isFreeModeActive = false;
      debugLog(['CHORDS_2_2_DEBUG', 'MODE'], `Switching from free play mode to game mode`);
    }
    
    // Get current progress level to generate appropriate difficulty
    let progressLevel = 0;
    if (component && component.progress) {
      progressLevel = component.progress['2_2_chords_stable_instable'] || 0;
    } else {
      // Try to get from localStorage if component not available
      const progressData = localStorage.getItem('lalumo_chords_progress');
      if (progressData) {
        const progress = JSON.parse(progressData);
        progressLevel = progress['2_2_chords_stable_instable'] || 0;
      }
    }
    
        // If this is a replay or we're in the middle of an attempt, keep the current chord
    if (isReplay || window.currentAttemptInProgress) {
      debugLog(['CHORDS_2_2_DEBUG', 'REPLAY'], 'Replaying current chord');
    } else {
      // Mark that we're starting a new attempt
      window.currentAttemptInProgress = true;
      
      // Store the previous chord for comparison
      const previousChordType = currentChordType;
      const previousChord = currentBaseChord ? [...currentBaseChord] : null;
      
      // Keep generating new chords until we get one that's different from the previous
      let attempts = 0;
      const maxAttempts = 10; // Safety net to prevent infinite loops
      
      do {
        // For game mode, randomly choose a chord type and generate it
        const isStable = Math.random() < 0.5;
        currentChordType = isStable ? 'stable' : 'instable';
        
        // Generate a new chord based on type and current progress level
        if (currentChordType === 'stable') {
          currentBaseChord = generateStableChord(progressLevel);
        } else {
          currentBaseChord = generateInstableChord(progressLevel);
        }
        
        attempts++;
        
        // If we've tried too many times, just keep the last chord to prevent infinite loops
        if (attempts >= maxAttempts) {
          debugLog(['CHORDS_2_2_DEBUG', 'DUPLICATE'], 'Max attempts reached, allowing potential duplicate chord');
          break;
        }
        
        // If this is the first chord, no need to check for duplicates
        if (!previousChord || !previousChordType) break;
        
        // If the chord type is different, we're good to go
        if (currentChordType !== previousChordType) break;
        
        // If the chord notes are different, we're good to go
        if (JSON.stringify(currentBaseChord) !== JSON.stringify(previousChord)) break;
        
        debugLog(['CHORDS_2_2_DEBUG', 'DUPLICATE'], 'Regenerating chord to avoid duplicate');
      } while (true);
    }
    
    // Apply random transposition (-6 to +6 semitones)
    // Higher levels get more extreme transpositions
    const level = Math.min(5, Math.floor(progressLevel / STABLE_INSTABLE_LEVEL_STEP));
    const transpositionRange = 3 + Math.floor(level * 0.8); // Level 1: ±3, Level 6: ±7
    currentTransposeSemitones = Math.floor(Math.random() * (transpositionRange*2+1)) - transpositionRange;
    
    // Apply transposition to the base chord
    currentChordFrequencies = currentBaseChord.map(note => 
      transposeNote(note, currentTransposeSemitones)
    );
    
    // Play the chord using the audio engine
    playCurrentChord();
    
    // Display level info in logs
    if (component && component.progress) {
      const progressLevel = component.progress['2_2_chords_stable_instable'] || 0;
      const level = Math.min(5, Math.floor(progressLevel / STABLE_INSTABLE_LEVEL_STEP));
      const level6Display = level + 1; // Convert to 1-based for display
      
      debugLog(['CHORDS_2_2_DEBUG', '2_2_PLAY'], 
        `Playing ${isReplay ? 'replayed ' : ''}${currentChordType} chord (Level ${level6Display}) ` +
        `(transposed ${currentTransposeSemitones > 0 ? '+' : ''}${currentTransposeSemitones} semitones)`);
    } else {
      debugLog(['CHORDS_2_2_DEBUG', '2_2_PLAY'], 
        `Playing ${isReplay ? 'replayed ' : ''}${currentChordType} chord ` +
        `(transposed ${currentTransposeSemitones > 0 ? '+' : ''}${currentTransposeSemitones} semitones)`);
    }
    
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
      audioEngine.playNote('success', 1, undefined, 0.5);
      
      // Clear any existing timeout to prevent multiple auto-plays
      if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
      }
      
      // Reset the attempt flag since we got it right
      window.currentAttemptInProgress = false;
      
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
      
      // We're already at the start of a level or exactly at a level threshold (10, 20, etc.)
      if (currentProgress === newProgress) {
        // Don't reduce progress if we're exactly at a level threshold (10, 20, 30, etc.)
        // Keep the current progress unchanged
        debugLog(['CHORDS_2_2_DEBUG', '2_2_RESET'], `Progress unchanged at level threshold: ${currentProgress}`);
      } 
      // We're past the start of a level, so reset to the start of this level
      else if (currentProgress > newProgress) {
        progress['2_2_chords_stable_instable'] = newProgress;
        debugLog(['CHORDS_2_2_DEBUG', '2_2_RESET'], `Progress reset to ${newProgress} (level ${currentLevel})`);
      } 
      // We're not at a level threshold and not past it (should never happen, but just in case)
      else {
        // Don't go below current level threshold
        progress['2_2_chords_stable_instable'] = newProgress;
        debugLog(['CHORDS_2_2_DEBUG', '2_2_RESET'], `Progress adjusted to level threshold: ${newProgress}`);
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
    // Get the base note and the rest of the chord
    const baseNote = currentChordFrequencies[0];
    const restOfChord = currentChordFrequencies.slice(1);
    
    // Debug to check that we have the base note
    debugLog(['CHORDS_2_2_DEBUG', 'PLAY_CHORD'], 
      `Playing chord: base note ${baseNote}, with ${restOfChord.length} additional notes`);
    
    // Play the base note with longer duration and higher volume
    // Format: playNote(noteName, duration, time, volume, instrument, options)
    audioEngine.playNote(baseNote, 2.5, undefined, 0.9, 'default', {
      type: 'sine',
      attack: 0.05,
      release: 2.0
    });
    
    // Play the rest of the chord simultaneously
    if (restOfChord.length > 0) {
      audioEngine.playChord(restOfChord, {
        duration: 2.0,
        volume: 0.5,  // Lower volume for the rest of the chord
        type: 'sine',
        attack: 0.1,
        release: 1.5
      });
    }
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
    
    // Dynamically select background image based on progress
    // Progress 0-9: image-1, 10-19: image-2, 20-29: image-3, etc.
    // Max image is 5
    
    // Calculate which image to use (integer division by 10, then add 1)
    // Minimum image index is 1, maximum is 6
    const imageIndex = Math.min(6, Math.max(1, Math.floor(progress / 10) + 1));
    
    // Use the JPG images with proper naming
    const backgroundImage = `./images/backgrounds/2_2_chords_stable_instable-${imageIndex}.jpg`;
    
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
 * Generates a stable (consonant) chord based on the current progress level
 * @param {number} progressLevel - Current progress level (0-5 for levels 1-6)
 * @returns {Array} Array of note names in Tone.js format (e.g., ['C4', 'E4', 'G4'])
 */
export function generateStableChord(progressLevel = 0) {
  // Base note that will be prominent in all chord types
  const root = 48; // C2 as a prominent low base note
  const baseNote = midiToNoteName(root);
  
  // Get current progress from localStorage if not provided
  if (progressLevel === undefined) {
    const progressData = localStorage.getItem('lalumo_chords_progress');
    if (progressData) {
      const progress = JSON.parse(progressData);
      progressLevel = progress['2_2_chords_stable_instable'] || 0;
    } else {
      progressLevel = 0;
    }
  }
  
  // Calculate the level (0-5) based on progress points
  const level = Math.min(5, Math.floor(progressLevel / STABLE_INSTABLE_LEVEL_STEP));
  
  debugLog(['CHORDS_2_2_DEBUG', 'LEVEL'], `Generating stable chord for level ${level+1} (progress: ${progressLevel})`);
  
  // Different chord types based on level
  switch(level) {
    case 0: // Level 1: Simple major/minor triads with perfect consonance
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root an octave up (C3)
        midiToNoteName(root + 16),  // Major 3rd (E3)
        midiToNoteName(root + 19),  // Perfect 5th (G3)
        midiToNoteName(root + 24),  // Octave (C4)
        midiToNoteName(root + 28)   // Major 3rd (E4)
      ];
      
    case 1: // Level 2: Add seventh chords (major 7th, dominant 7th)
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 16),  // Major 3rd (E3)
        midiToNoteName(root + 19),  // Perfect 5th (G3)
        midiToNoteName(root + 23),  // Major 7th (B3)
        midiToNoteName(root + 28),  // Major 3rd (E4)
        midiToNoteName(root + 31)   // Perfect 5th (G4)
      ];
      
    case 2: // Level 3: Extended harmonies (9th, 11th chords)
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 16),  // Major 3rd (E3)
        midiToNoteName(root + 19),  // Perfect 5th (G3)
        midiToNoteName(root + 23),  // Major 7th (B3)
        midiToNoteName(root + 26),  // 9th (D4)
        midiToNoteName(root + 33)   // 11th (F4)
      ];
      
    case 3: // Level 4: Jazz voicings with controlled dissonance
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 17),  // Augmented 3rd (F3) - creates tension but still works
        midiToNoteName(root + 19),  // Perfect 5th (G3)
        midiToNoteName(root + 23),  // Major 7th (B3)
        midiToNoteName(root + 26),  // 9th (D4)
        midiToNoteName(root + 29)   // Sharp 11 (F#4) - jazz flavor
      ];
      
    case 4: // Level 5: Impressionistic harmonies with color tones
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 16),  // Major 3rd (E3)
        midiToNoteName(root + 21),  // Flat 7th (Bb3) - creates impressionistic color
        midiToNoteName(root + 26),  // 9th (D4) 
        midiToNoteName(root + 30),  // #5 (G#4) - adds color
        midiToNoteName(root + 33)   // 11th (F4) - impressionistic sound
      ];
      
    case 5: // Level 6: Complex extended harmonies with subtle tensions
    default:
      return [
        baseNote,                   // Base note (C2)
        midiToNoteName(root + 12),  // Root (C3)
        midiToNoteName(root + 16),  // Major 3rd (E3)
        midiToNoteName(root + 19),  // Perfect 5th (G3)
        midiToNoteName(root + 23),  // Major 7th (B3) 
        midiToNoteName(root + 26),  // 9th (D4)
        midiToNoteName(root + 33),  // 11th (F4)
        midiToNoteName(root + 38)   // 13th (A4) - creates a complete extended harmony
      ];
  }
}

