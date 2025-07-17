/**
 * 1_4_sound_judgment.js - Module for the "Sound Judgment" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Export a test function for import tests
export function testSoundJudgmentModuleImport() {
  debugLog('SOUND_JUDGMENT', 'Sound Judgment module successfully imported');
  return true;
}

/**
 * Reset Sound Judgment activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_4_SoundJudgment_Progress(component) {
  debugLog('RESET_SOUND_JUDGMENT', 'Starting reset process', {
    currentLevel: component.soundJudgmentLevel,
    correctStreak: component.soundJudgmentCorrectStreak
  });
  
  // Reset component variables
  component.soundJudgmentLevel = 1;
  component.soundJudgmentCorrectStreak = 0;
  component.melodyHasWrongNote = false;
  component.currentMelodyName = '';
  component.currentMelodyId = null;
  
  // Clear localStorage
  localStorage.removeItem('lalumo_soundJudgmentLevel');
  localStorage.removeItem('lalumo_soundJudgmentStreak');
  
  // Update progress object
  component.progress['1_4_pitches_does-it-sound-right'] = 0;
  component.updateProgressPitches();
  
  // Update UI elements immediately if update method exists
  if (component.update_progress_display) {
    component.update_progress_display();
  }
  
  debugLog('RESET_SOUND_JUDGMENT', 'Reset completed successfully');
}

// Make globally available for diagnosis
window.reset_1_4_SoundJudgment_Progress = reset_1_4_SoundJudgment_Progress;
