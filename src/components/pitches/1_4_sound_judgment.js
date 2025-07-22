/**
 * 1_4_sound_judgment.js - Module for the "Sound Judgment" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Export a test function for import tests
export function testSoundJudgmentModuleImport() {
  console.log('Sound Judgment module successfully imported');
  return true;
}

/**
 * Calculate the current level for activity 1_4 based on progress count
 * Replaces the old soundJudgmentLevel variable with calculated level
 * @param {Object} component - The Alpine.js component
 * @returns {number} Current level (1-7)
 */
export function get_1_4_level(component) {
  const progress = component.progress['1_4'] || 0;
  return Math.min(Math.floor(progress / 7) + 1, 7);
}

/**
 * Reset Sound Judgment activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_4_SoundJudgment_Progress(component) {
  console.log('RESET_SOUND_JUDGMENT: Starting reset process', {
    currentLevel: get_1_4_level(component),
    correctStreak: component.soundJudgmentCorrectStreak,
    currentProgress: component.progress['1_4'] || 0
  });
  
  // Reset progress to 0 (level will be calculated automatically)
  if (!component.progress) component.progress = {};
  component.progress['1_4'] = 0;
  
  // Reset component variables
  component.soundJudgmentCorrectStreak = 0;
  component.melodyHasWrongNote = false;
  component.currentMelodyName = '';
  component.currentMelodyId = null;
  
  // Reset shuffled melody system for both modes
  component.shuffledMelodyKeysGame = [];
  component.currentShuffledIndexGame = 0;
  component.shuffledMelodyKeysFree = [];
  component.currentShuffledIndexFree = 0;
  // Keep legacy arrays for backward compatibility
  component.shuffledMelodyKeys = [];
  component.currentShuffledIndex = 0;
  debugLog(['RESET_SOUND_JUDGMENT', 'SHUFFLE'], 'Reset shuffled melody system for both free and game modes');
  
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
  
  console.log('RESET_SOUND_JUDGMENT: Reset completed successfully');
}

// Make globally available for diagnosis
window.reset_1_4_SoundJudgment_Progress = reset_1_4_SoundJudgment_Progress;
window.get_1_4_level = get_1_4_level;
