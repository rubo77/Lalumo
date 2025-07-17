/**
 * 1_2_match_sounds.js - Module for the "Match Sounds" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Export a test function for import tests
export function testMatchSoundsModuleImport() {
  debugLog('MATCH_SOUNDS', 'Match Sounds module successfully imported');
  return true;
}

/**
 * Reset Match Sounds activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_2_MatchSounds_Progress(component) {
  debugLog('RESET_MATCH_SOUNDS', 'Starting reset process', {
    correctAnswersCount: component.correctAnswersCount,
    unlockedPatterns: component.unlockedPatterns
  });
  
  // Reset component variables
  component.correctAnswersCount = 0;
  component.unlockedPatterns = ['up', 'down']; // Reset to initial patterns
  component.currentSequence = [];
  component.userSequence = [];
  
  // Clear localStorage
  localStorage.removeItem('lalumo_progress_match');
  localStorage.removeItem('lalumo_difficulty');
  
  // Update progress object
  component.progress['1_2_pitches_match-sounds'] = 0;
  component.updateProgressPitches();
  
  // Reset background if needed
  const matchSoundsContainer = document.getElementById('1_2_pitches');
  if (matchSoundsContainer) {
    const initialBackground = './images/backgrounds/pitches_action1_2_fox_owl.jpg';
    matchSoundsContainer.style.backgroundImage = `url('${initialBackground}')`;
    debugLog('RESET_MATCH_SOUNDS', 'Reset background to initial state');
  }
  
  // Force UI update by triggering Alpine.js reactivity
  // This ensures the progress display and background refresh correctly
  component.$nextTick(() => {
    // Force re-evaluation of progress-dependent elements
    const event = new CustomEvent('match-sounds-reset', { 
      detail: { newProgress: 0, resetPatterns: ['up', 'down'] } 
    });
    document.dispatchEvent(event);
    
    debugLog('RESET_MATCH_SOUNDS', 'UI refresh triggered');
  });
  
  debugLog('RESET_MATCH_SOUNDS', 'Reset completed successfully');
}

// Make globally available for diagnosis
window.reset_1_2_MatchSounds_Progress = reset_1_2_MatchSounds_Progress;
