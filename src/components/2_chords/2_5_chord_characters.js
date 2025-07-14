/**
 * 2_5_chord_characters.js - Module for the "Chord Characters" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';
import { preloadBackgroundImage } from '../shared/image-utils.js';
import { getActivityProgress } from '../shared/progress-utils.js';

/**
 * Gets the chord buttons (diminished and augmented) from the DOM
 * @returns {Object} Object with diminishedBtn and augmentedBtn properties, or null if not found
 */
export function getChordButtons() {
  const diminishedBtn = document.getElementById('button_2_5_1_diminished');
  const augmentedBtn = document.getElementById('button_2_5_1_augmented');
  
  if (!diminishedBtn || !augmentedBtn) {
    return null;
  }
  
  return { diminishedBtn, augmentedBtn };
}

/**
 * Update chord buttons visibility based on user progress
 * Controls which chord type buttons are shown in 2_5_chords_characters activity
 * @param {Object} component - The Alpine component instance (optional)
 */
export function update2_5ButtonsVisibility(component) {
  // Get the current progress for chord characters activity
  const progressData = localStorage.getItem('lalumo_chords_progress');
  const progress = progressData ? 
    JSON.parse(progressData)['2_5_chords_characters'] || 0 : 
    component?.progress?.['2_5_chords_characters'] || 0;
  
  // Get chord buttons
  const chordButtons = getChordButtons();
  
  if (!chordButtons) {
    // Buttons not found in DOM yet, will try again when activity is shown
    debugLog('CHORDS', 'Chord buttons not found in DOM yet');
    return;
  }
  
  const { diminishedBtn, augmentedBtn } = chordButtons;
  
  // Apply visibility rules based on progress
  if (progress < 10) {
    // Progress < 10: Hide mysterious (diminished) and surprised (augmented)
    diminishedBtn.style.display = 'none';
    augmentedBtn.style.display = 'none';
    debugLog(['CHORDS', 'BUTTONS'], 'Progress < 10: Hiding mysterious and surprised buttons');
  } else if (progress < 20) {
    // Progress 10-19: hide mysterious octopus (diminished), show surprised squirrel (augmented)
    augmentedBtn.style.display = '';
    diminishedBtn.style.display = 'none';
    debugLog(['CHORDS', 'BUTTONS'], 'Progress 10-19: Showing surprised, hiding mysterious button');
  } else if (progress < 30) {
    // Progress 20-29: show all
    augmentedBtn.style.display = '';
    diminishedBtn.style.display = '';
    debugLog(['CHORDS', 'BUTTONS'], 'Progress 20-29: Showing all buttons');
  } else if (progress < 40) {
    // Progress 20-39: Show basic buttons, but hide squirrel and octopus (diminished and augmented)
    augmentedBtn.style.display = 'none';
    diminishedBtn.style.display = 'none';
    debugLog(['CHORDS', 'BUTTONS'], 'Progress 20-39: Hiding octopus and squirrel (transposition phase)');
  } else if (progress < 50) {
    // Progress 40-59: Show all buttons except octopus (diminished)
    augmentedBtn.style.display = '';
    diminishedBtn.style.display = 'none';
    debugLog(['CHORDS', 'BUTTONS'], 'Progress 40-59: Hiding octopus, showing squirrel');
  } else {
    // Progress >= 50: Show all buttons
    augmentedBtn.style.display = '';
    diminishedBtn.style.display = '';
    debugLog(['CHORDS', 'BUTTONS'], 'Progress >= 60: Showing all chord buttons and animals');
  }
}

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testChordCharactersModuleImport() {
  debugLog('CHORDS', 'Chord Characters module successfully imported');
  return true;
}

/**
 * Updates the background image based on progress in the character matching activity
 * @param {Object} component - The Alpine component instance
 */
export function update_2_5Background(component) {
  try {
    // Get progress from localStorage or component state
    const progress = getActivityProgress('2_5_chords_characters', component);
    

    
    // Determine background image based on progress
    let backgroundImage;
    
    // Background image changes based on progress thresholds
    if (progress <= 9) { // Initial background (no animals)
      backgroundImage = './images/backgrounds/2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg';
      
      // Preload next background when approaching transition point
      if (progress === 9) {
        preloadBackgroundImage('./images/backgrounds/2_5_chords_dog_cat_owl_squirrel_no_octopus.jpg');
      }
    } else if (progress <= 19) { // At 10+: squirrel appears
      backgroundImage = './images/backgrounds/2_5_chords_dog_cat_owl_squirrel_no_octopus.jpg';
      
      // Preload next background when approaching transition point
      if (progress === 19) {
        preloadBackgroundImage('./images/backgrounds/2_5_chords_dog_cat_owl_squirrel_octopus.jpg');
      }
    } else if (progress <= 29) { // At 20+: octopus appears
      backgroundImage = './images/backgrounds/2_5_chords_dog_cat_owl_squirrel_octopus.jpg';
      
      // Preload next background when approaching transition point
      if (progress === 29) {
        preloadBackgroundImage('./images/backgrounds/2_5_chords_dog_cat_owl_sleeping_squirrel_sleeping_octopus.jpg');
      }
    } else if (progress <= 39) { // At 30+: both squirrel and octopus sleeping
      backgroundImage = './images/backgrounds/2_5_chords_dog_cat_owl_sleeping_squirrel_sleeping_octopus.jpg';
      
      // Preload next background when approaching transition point
      if (progress === 39) {
        preloadBackgroundImage('./images/backgrounds/2_5_chords_dog_cat_owl_squirrel_octopus_sleeping.jpg');
      }
    } else if (progress <= 49) { // At 40+: squirrel awake, octopus still sleeping
      backgroundImage = './images/backgrounds/2_5_chords_dog_cat_owl_squirrel_octopus_sleeping.jpg';
      
      // Preload next background when approaching transition point
      if (progress === 49) {
        preloadBackgroundImage('./images/backgrounds/2_5_chords_dog_cat_owl_squirrel_octopus.jpg');
      }
    } else { // At 50+: everyone awake again
      backgroundImage = './images/backgrounds/2_5_chords_dog_cat_owl_squirrel_octopus.jpg';
    }
    
    // Update the background in the DOM
    const characterActivity = document.querySelector('[x-show="mode === \'2_5_chords_characters\'"]');
    if (characterActivity) {
      characterActivity.style.backgroundImage = `url(${backgroundImage})`;
      debugLog(['CHORDS', '2_5_BACKGROUND'], `Updated background based on progress (${progress}): ${backgroundImage}`);
    } else {
      debugLog(['CHORDS', 'ERROR'], 'Error updating background: div not found');
    }
  } catch (error) {
    debugLog(['CHORDS', 'ERROR'], `Error in update_2_5Background: ${error.message}`);
  }
}



/**
 * Reset progress for Chord Types activity (2_5)
 * Used by the resetCurrentActivity function
 */
export function reset_2_5_ChordTypes_Progress() {
  debugLog(['CHORDS', 'RESET'], 'Resetting 2_5_chords_characters progress...');
  
  // Get the chordsComponent from window global
  const chordsComponent = window.chordsComponent;
  if (!chordsComponent) {
    console.error('Cannot reset 2_5_chords_characters: chordsComponent not found');
    return;
  }
  
  // Get existing progress from localStorage
  let progressData = localStorage.getItem('lalumo_chords_progress');
  let progress = {};
  
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
      // Reset just the 2_5_chords_characters activity progress
      progress['2_5_chords_characters'] = 0;
    } catch (error) {
      debugLog(['CHORDS', 'ERROR'], `Error parsing progress data: ${error.message}`);
      progress = { '2_5_chords_characters': 0 };
    }
  } else {
    progress = { '2_5_chords_characters': 0 };
  }
  
  // Save updated progress back to localStorage
  localStorage.setItem('lalumo_chords_progress', JSON.stringify(progress));
  
  // Update component's in-memory state
  if (chordsComponent.progress) {
    chordsComponent.progress['2_5_chords_characters'] = 0;
  }
  
  // Update UI to reflect reset progress
  update_2_5Background(chordsComponent);
  if (typeof chordsComponent.update2_5ButtonsVisibility === 'function') {
    chordsComponent.update2_5ButtonsVisibility();
  }
  
  debugLog(['CHORDS', 'RESET'], '2_5_chords_characters progress reset complete');
}

