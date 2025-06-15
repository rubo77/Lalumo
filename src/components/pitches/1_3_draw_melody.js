/**
 * 1_3_draw_melody.js - Module for the "Draw a Melody" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

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
    currentLevel: component.drawMelodyLevel,
    successCounter: component.levelSuccessCounter,
    challengeMode: component.melodyChallengeMode
  });
  
  // Reset component variables
  component.drawMelodyLevel = 0;
  component.levelSuccessCounter = 0;
  component.melodyChallengeMode = false;
  component.drawPath = [];
  component.previousDrawPath = [];
  component.referenceSequence = null;
  
  // Clear localStorage
  localStorage.removeItem('lalumo_draw_melody_level');
  localStorage.removeItem('lalumo_draw_melody_success_counter');
  
  // Update progress object
  component.progress['1_3_pitches_draw-melody'] = 0;
  component.updateProgressPitches();
  
  // Clear drawing canvas if present
  if (component.clearDrawing) {
    component.clearDrawing();
  }
  
  console.log('RESET_DRAW_MELODY: Reset completed successfully');
}

// Make globally available for diagnosis
window.reset_1_3_DrawMelody_Progress = reset_1_3_DrawMelody_Progress;
