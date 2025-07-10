/**
 * 2_5_chord_characters.js - Module for the "Chord Characters" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

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
export function updateCharacterBackground(component) {
  try {
    // Get progress from localStorage or component state
    const progressData = localStorage.getItem('lalumo_chords_progress');
    const progress = progressData ? 
      JSON.parse(progressData)['2_5_chords_characters'] || 0 : 
      component?.progress?.['2_5_chords_characters'] || 0;
    
    // Preload function for smoother transitions
    const preloadBackgroundImage = (src) => {
      const img = new Image();
      img.src = src;
    };
    
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
    debugLog(['CHORDS', 'ERROR'], `Error in updateCharacterBackground: ${error.message}`);
  }
}

/**
 * Preloads a background image for smoother transitions
 * @param {string} imageUrl - The URL of the image to preload
 */
function preloadBackgroundImage(imageUrl) {
  const img = new Image();
  img.src = imageUrl;
  debugLog(['CHORDS', '2_5_BACKGROUND'], `Preloading background image: ${imageUrl}`);
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
  updateCharacterBackground(chordsComponent);
  if (typeof chordsComponent.updateChordButtonsVisibility === 'function') {
    chordsComponent.updateChordButtonsVisibility();
  }
  
  debugLog(['CHORDS', 'RESET'], '2_5_chords_characters progress reset complete');
}

