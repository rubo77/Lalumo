/**
 * 1_5_memory_game.js - Module for the "Memory Game" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

/**
 * Calculate level for Activity 1_5 (Memory Game) based on progress
 * Replaces the old memorySuccessCount variable with calculated level
 * @param {Object} component - The Alpine component instance
 * @returns {number} Current progress count (used directly as sequence length logic)
 */
export function get_1_5_level(component) {
  // For memory game, we use progress directly as success count
  // No need for separate levels - progress count determines sequence length
  return component?.progress?.['1_5'] || 0;
}

// Export a test function for import tests
export function testMemoryGameModuleImport() {
  console.log('Memory Game module successfully imported');
  return true;
}

/**
 * Reset Memory Game activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_5_MemoryGame_Progress(component) {
  console.log('RESET_MEMORY_GAME: Starting reset process', {
    currentProgress: component.progress['1_5'] || 0
  });
  
  // Reset progress to 0 (level will be calculated automatically)
  if (!component.progress) component.progress = {};
  component.progress['1_5'] = 0;
  
  // Reset component variables
  component.currentSequence = [];
  component.userSequence = [];
  
  // Clear old localStorage keys
  localStorage.removeItem('lalumo_memory_level');
  
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
  progress['1_5'] = 0;
  localStorage.setItem('lalumo_progress', JSON.stringify(progress));
  
  console.log('RESET_MEMORY_GAME: Reset completed successfully');
}

// Make globally available for diagnosis
window.get_1_5_level = get_1_5_level;
window.reset_1_5_MemoryGame_Progress = reset_1_5_MemoryGame_Progress;
