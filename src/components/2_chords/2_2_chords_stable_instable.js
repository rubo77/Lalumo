/**
 * 2_2_chords_stable_instable.js - Module for the "Stable or Instable Chords" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testStableInstableModuleImport() {
  debugLog('CHORDS', 'Stable or Instable module successfully imported');
  return true;
}

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
    // Start with a neutral background that changes as the user progresses
    let backgroundImage = './images/backgrounds/2_2_chords_neutral.jpg';
    
    // Add more background variations as needed based on progress
    if (progress >= 10 && progress < 20) {
      backgroundImage = './images/backgrounds/2_2_chords_level1.jpg';
    } else if (progress >= 20) {
      backgroundImage = './images/backgrounds/2_2_chords_level2.jpg';
    }
    
    // Update the background in the DOM
    const activityElement = document.querySelector('[x-show="mode === \'2_2_chords_stable_instable\'"]');
    if (activityElement) {
      activityElement.style.backgroundImage = `url(${backgroundImage})`;
      debugLog(['CHORDS', '2_2_BACKGROUND'], `Updated background based on progress (${progress}): ${backgroundImage}`);
    } else {
      debugLog(['CHORDS', 'ERROR'], 'Error updating background: div not found');
    }
  } catch (error) {
    debugLog(['CHORDS', 'ERROR'], `Error in updateStableInstableBackground: ${error.message}`);
  }
}

/**
 * Reset progress for Stable or Instable Chords activity (2_2)
 * Used by the resetCurrentActivity function
 */
export function reset_2_2_StableInstable_Progress() {
  debugLog(['CHORDS', 'RESET'], 'Resetting 2_2_chords_stable_instable progress...');
  
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
      debugLog(['CHORDS', 'ERROR'], `Error parsing progress data: ${error.message}`);
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
  
  debugLog(['CHORDS', 'RESET'], '2_2_chords_stable_instable progress reset complete');
}

/**
 * Generates a stable (consonant) chord with 6 notes
 * @returns {Array} Array of note frequencies
 */
export function generateStableChord() {
  // Major 7th chord with added 9th and 13th for richness
  const root = 60; // Middle C
  return [
    root,           // Root
    root + 4,       // Major 3rd
    root + 7,       // Perfect 5th
    root + 11,      // Major 7th
    root + 14,      // 9th (octave + 2nd)
    root + 21       // 13th (2 octaves + 6th)
  ];
}

/**
 * Generates an unstable (dissonant) chord with 6 notes
 * @returns {Array} Array of note frequencies
 */
export function generateUnstableChord() {
  // Cluster of minor 2nds and tritones for maximum dissonance
  const root = 60; // Middle C
  return [
    root,           // Root
    root + 1,       // Minor 2nd (very dissonant)
    root + 6,       // Tritone (the "devil's interval")
    root + 7,       // Perfect 5th (but clashes with tritone)
    root + 8,       // Minor 6th (clashes with 5th)
    root + 10       // Major 7th (clashes with root)
  ];
}
