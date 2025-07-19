/**
 * 1_3_draw_melody.js - Module for the "Draw a Melody" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

/**
 * Calculate level for Activity 1_3 (Draw Melody) based on progress
 * Replaces the old drawMelodyLevel variable with calculated level
 * @param {Object} component - The Alpine component instance
 * @returns {number} Current level (0-5)
 */
export function get_1_3_level(component) {
  const progress = component?.progress?.['1_3'] || 0;
  
  // Level progression: every 3 correct answers increases the level
  // Level 0: 0-2 correct (3 notes)
  // Level 1: 3-5 correct (4 notes)  
  // Level 2: 6-8 correct (5 notes)
  // Level 3: 9-11 correct (6 notes)
  // Level 4: 12-14 correct (7 notes)
  // Level 5: 15+ correct (8 notes)
  
  return Math.min(5, Math.floor(progress / 3));
}

// Export a test function for import tests
export function testDrawMelodyModuleImport() {
  console.log('Draw Melody module successfully imported');
  return true;
}

/**
 * Reset Draw Melody activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_3_DrawMelody_Progress(component) {
  console.log('RESET_DRAW_MELODY: Starting reset process', {
    currentProgress: component.progress['1_3'] || 0,
    challengeMode: component.melodyChallengeMode
  });
  
  // Reset progress to 0 (level will be calculated automatically)
  if (!component.progress) component.progress = {};
  component.progress['1_3'] = 0;
  
  // Reset component variables
  component.melodyChallengeMode = false;
  component.drawPath = [];
  component.previousDrawPath = [];
  component.referenceSequence = null;
  
  // Clear old localStorage keys
  localStorage.removeItem('lalumo_draw_melody_level');
  localStorage.removeItem('lalumo_draw_melody_success_counter');
  
  // Also persist the reset to localStorage using central progress object
  const progressData = localStorage.getItem('lalumo_progress');
  let progress = {};
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
    } catch (error) {
      console.error('Error parsing progress data:', error);
    }
  }
  progress['1_3'] = 0;
  localStorage.setItem('lalumo_progress', JSON.stringify(progress));
  
  // Clear drawing canvas if present
  if (component.clearDrawing) {
    component.clearDrawing();
  }
  
  console.log('RESET_DRAW_MELODY: Reset completed successfully');
}

// Make globally available for diagnosis
window.get_1_3_level = get_1_3_level;
window.reset_1_3_DrawMelody_Progress = reset_1_3_DrawMelody_Progress;
