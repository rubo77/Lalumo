/**
 * 2_1_chord_color_matching.js - Module for the "Match Colors to Chords" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Import Tone.js for audio processing
import Tone from 'tone';

// Import audio engine
import audioEngine from '../audio-engine.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testChordColorMatchingModuleImport() {
  debugLog('CHORDS', 'Chord Color Matching module successfully imported');
  return true;
}

/**
 * Generate a new color matching question
 * Plays a random chord and sets it as the current chord type
 * @param {Object} component - Reference to the Alpine.js component
 */
export function newColorMatchingQuestion(component) {
  try {
    // Verify component has the required methods
    if (typeof component.getRandomChordType !== 'function') {
      debugLog('CHORDS', 'Error: component.getRandomChordType is not a function');
      return;
    }
    
    if (typeof component.getRandomRootNote !== 'function') {
      debugLog('CHORDS', 'Error: component.getRandomRootNote is not a function');
      return;
    }
    
    if (typeof component.playChord !== 'function') {
      debugLog('CHORDS', 'Error: component.playChord is not a function');
      return;
    }
    
    const chordType = component.getRandomChordType();
    const rootNote = component.getRandomRootNote();
    
    // Verify we got valid values
    if (!chordType || !rootNote) {
      debugLog('CHORDS', `Error: Invalid chord type (${chordType}) or root note (${rootNote})`);
      return;
    }
    
    // Play the chord and update component state
    component.playChord(chordType, rootNote);
    component.currentChordType = chordType;
    component.totalQuestions++;
    
    debugLog('CHORDS', `New color matching question: ${chordType} chord with root ${rootNote}`);
  } catch (error) {
    debugLog('CHORDS', `Error in newColorMatchingQuestion: ${error.message}`);
  }
}

/**
 * Check if the selected color matches the current chord
 * @param {Object} component - Reference to the Alpine.js component
 * @param {string} selectedColor - The color selected by the user
 */
export function checkColorAnswer(component, selectedColor) {
  // Check if currentChordType is defined
  if (!component.currentChordType) {
    debugLog('CHORDS', 'No current chord type defined, generating new question');
    newColorMatchingQuestion(component);
    return;
  }
  
  // Make sure the chord type exists in the chords object
  if (!component.chords[component.currentChordType]) {
    debugLog('CHORDS', `Invalid chord type: ${component.currentChordType}, generating new question`);
    newColorMatchingQuestion(component);
    return;
  }
  
  const correctColor = component.chords[component.currentChordType].color;
  const isCorrect = selectedColor === correctColor;
  
  debugLog('CHORDS', `Color answer check: selected=${selectedColor}, correct=${correctColor}, result=${isCorrect}`);
  
  if (isCorrect) {
    component.correctAnswers++;
    component.feedbackMessage = 'Great job! That\'s the right color!';
  } else {
    component.feedbackMessage = 'Not quite! Let\'s try another one.';
  }
  
  component.showFeedback = true;
  setTimeout(() => {
    component.showFeedback = false;
    newColorMatchingQuestion(component);
  }, 2000);
}
