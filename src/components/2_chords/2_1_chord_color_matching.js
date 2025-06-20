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
 * Hilfsfunktion, um einen zufälligen Grundton zu generieren
 * @returns {string} Ein zufälliger Grundton (z.B. 'C4')
 */
function getRandomRootNote() {
  const rootNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
  return rootNotes[Math.floor(Math.random() * rootNotes.length)];
}

/**
 * Hilfsfunktion, um einen zufälligen Akkordtyp zu generieren
 * @returns {string} Ein zufälliger Akkordtyp (major, minor, etc.)
 */
function getRandomChordType() {
  const chordTypes = [
    'major',
    'minor',
    'diminished',
    'augmented',
    'major7',
    'minor7',
    'dominant7'
  ];
  return chordTypes[Math.floor(Math.random() * chordTypes.length)];
}

/**
 * Add Play Chord button to the DOM and initialize the first question
 * @param {Object} component - Reference to the Alpine.js component
 */
export function addPlayChordButton(component) {
  debugLog('CHORDS', '2_1_color_matching: addPlayChordButton() Adding play chord button handler');
  debugLog('CHORDS_2_1_DEBUG', `addPlayChordButton called with component mode=${component?.mode}`);
  
  // Always initialize first question immediately so currentChordType is always set
  newColorMatchingQuestion(component);
  
  // Finde den Container für die Color-Matching-Aktivität
  const colorMatchingContainer = document.querySelector('.color-matching-container');
  if (!colorMatchingContainer) {
    debugLog('CHORDS', 'Error: Could not find color-matching-container');
    return;
  }
  
  // Finde den Play-Button innerhalb des Containers
  const playButtonsInActivity = document.querySelectorAll('.play-button');
  let existingButton = null;
  
  // Durchsuche alle Play-Buttons und finde den, der zur Color-Matching-Aktivität gehört
  for (const button of playButtonsInActivity) {
    if (button.closest('.color-matching-container') || 
        button.closest('.chord-chapters-view[data-mode="2_1_chords_color-matching"]')) {
      existingButton = button;
      break;
    }
  }
  
  if (existingButton) {
    debugLog('CHORDS', 'Found existing play button in 2_1 color matching view, adding click handler');
    
    // Add click handler to the existing button
    existingButton.onclick = function() {
      debugLog('CHORDS', `Play Chord button clicked, currentChordType=${component.currentChordType}`);
      // Ensure we have a valid chord type
      if (!component.currentChordType) {
        debugLog('CHORDS', 'No current chord type, generating new question');
        newColorMatchingQuestion(component);
      }
      // Verwende die lokale getRandomRootNote Funktion
      component.playChord(component.currentChordType, getRandomRootNote());
    };
    
    return; // Exit after setting up the existing button
  }
  
  // If no button exists yet, create one
  
  // Find container
  const container = document.querySelector('.color-matching-container');
  if (!container) {
    debugLog('CHORDS', 'Error: Could not find color-matching-container');
    return;
  }
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'play-chord-button-container';
  
  // Create button
  const playButton = document.createElement('button');
  playButton.className = 'play-chord-button';
  playButton.innerText = 'Play Chord Again';
  
  // Add click handler with additional logging
  playButton.onclick = function() {
    debugLog('CHORDS', `Dynamic Play Chord button clicked, currentChordType=${component.currentChordType}`);
    // Ensure we have a valid chord type
    if (!component.currentChordType) {
      debugLog('CHORDS', 'No current chord type, generating new question');
      newColorMatchingQuestion(component);
    }
    // Verwende lokale getRandomRootNote Funktion
    component.playChord(component.currentChordType, getRandomRootNote());
  };
  
  // Add to DOM
  buttonContainer.appendChild(playButton);
  container.appendChild(buttonContainer);
  debugLog('CHORDS', 'Created and added new play chord button');
  
  // Create fixed button container for bottom of screen
  const fixedContainer = document.createElement('div');
  fixedContainer.id = 'play-chord-button-fixed-container';
  
  // Add fixed button
  fixedContainer.appendChild(playButton.cloneNode(true));
  fixedContainer.firstChild.onclick = playButton.onclick;
  document.body.appendChild(fixedContainer);
  
  debugLog('CHORDS', '2_1_color_matching: Added play chord button');
}

/**
 * Generate a new color matching question
 * Plays a random chord and sets it as the current chord type
 * @param {Object} component - Reference to the Alpine.js component
 */
export function newColorMatchingQuestion(component) {
  try {
    // Verify component has the required playChord method
    if (typeof component.playChord !== 'function') {
      debugLog('CHORDS', 'Error: component.playChord is not a function');
      return;
    }
    
    // Zufälligen Akkordtyp und Grundton generieren
    const chordType = getRandomChordType();
    const rootNote = getRandomRootNote();
    
    debugLog('CHORDS_2_1_DEBUG', `newColorMatchingQuestion: Generated chordType=${chordType}, rootNote=${rootNote}, component=${!!component}, caller=${new Error().stack.split('\n')[2]}`);
    
    if (!component) {
      debugLog('CHORDS_2_1_DEBUG', 'CRITICAL: Component is null in newColorMatchingQuestion');
      return;
    }
    
    // Erweitere das Debugging mit mehr Details über den component-Zustand
    debugLog('CHORDS_2_1_DEBUG', `newColorMatchingQuestion: BEFORE update - component details: mode=${component.mode}, currentComponent type=${typeof component}, props=${Object.keys(component).join(',')}`);
    
    // Set the currentChordType on the component so we can use it in the UI
    debugLog('CHORDS_2_1_DEBUG', `newColorMatchingQuestion: Setting component.currentChordType to ${chordType}`);
    component.currentChordType = chordType;
    component.currentRootNote = rootNote;
    component.totalQuestions++;
    
    debugLog('CHORDS_2_1_DEBUG', `newColorMatchingQuestion: AFTER update, component state: currentChordType=${component.currentChordType}, totalQuestions=${component.totalQuestions}`);
    
    // Direkter Test, ob der currentChordType tatsächlich gesetzt wurde
    if (!component.currentChordType) {
      debugLog('CHORDS_2_1_DEBUG', 'WARNING: component.currentChordType ist immer noch null nach Zuweisung! component Zone/Scope möglicherweise fehlerhaft.');
    }
    
    // Play the chord
    debugLog('CHORDS', `Playing new chord of type: ${chordType}`);
    component.playChord(chordType, rootNote, { duration: 2 });
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
  debugLog('CHORDS_2_1_DEBUG', `checkColorAnswer called with currentChordType=${component?.currentChordType}`);
  debugLog('CHORDS', `Checking color answer: Selected ${selectedColor} for chord type ${component.currentChordType}`);
  
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
  
  // Increment counters regardless of correct/incorrect
  component.totalQuestions++;
  
  if (isCorrect) {
    component.correctAnswers++;
    component.feedbackMessage = 'Great job! That\'s the right color!';
  } else {
    component.feedbackMessage = 'Not quite! Let\'s try another one.';
  }
  
  // Save progress to localStorage
  if (component.progress && component.mode) {
    component.progress[component.mode] = component.totalQuestions;
    localStorage.setItem('lalumo_chords_progress', JSON.stringify(component.progress));
    debugLog('CHORDS', `Saved progress for ${component.mode}: ${component.totalQuestions}`);
  }
  
  component.showFeedback = true;
  setTimeout(() => {
    component.showFeedback = false;
    newColorMatchingQuestion(component);
  }, 2000);
}

/* *************************************************** *
make variables global available, 
e.g. for diagnosis purposes to be used in the developer console
*******************************************************/
window.checkColorAnswer = checkColorAnswer;
window.newColorMatchingQuestion = newColorMatchingQuestion;
