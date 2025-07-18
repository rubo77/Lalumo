/**
 * 1_5_memory_game.js - Module for the "Memory Game" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Export a test function for import tests
export function testMemoryGameModuleImport() {
  debugLog('MEMORY_GAME', 'Memory Game module successfully imported');
  return true;
}

/**
 * Reset Memory Game activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_5_MemoryGame_Progress(component) {
  debugLog('RESET_MEMORY_GAME', 'Starting reset process', {
    memorySuccessCount: component.memorySuccessCount
  });
  
  // Reset component variables
  component.memorySuccessCount = 0;
  component.currentSequence = [];
  component.userSequence = [];
  
  // Clear localStorage
  localStorage.removeItem('lalumo_memory_level');
  
  // Update progress object
  component.progress['1_5_pitches_memory-game'] = 0;
  component.updateProgressPitches();
  
  debugLog('RESET_MEMORY_GAME', 'Reset completed successfully');
}

// Make globally available for diagnosis
window.reset_1_5_MemoryGame_Progress = reset_1_5_MemoryGame_Progress;
