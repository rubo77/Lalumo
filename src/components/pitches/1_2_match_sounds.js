/**
 * 1_2_match_sounds.js - Module for the "Up or Down" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Export a test function for import tests
export function testMatchSoundsModuleImport() {
  console.log('Up or Down module successfully imported');
  return true;
}

/**
 * Reset Up or Down activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_2_MatchSounds_Progress(component) {
  console.log('RESET_MATCH_SOUNDS: Starting reset process', {
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
  
  // Update progress object using unified progress key
  component.progress['1_2'] = 0;
  
  // Persist to localStorage using unified progress system
  try {
    const progressData = localStorage.getItem('lalumo_progress');
    let progress = progressData ? JSON.parse(progressData) : {};
    progress['1_2'] = 0;
    localStorage.setItem('lalumo_progress', JSON.stringify(progress));
  } catch (e) {
    console.warn('Could not update progress in localStorage', e);
  }
  
  component.updateProgressPitches();
  
  // Reset background if needed
  const matchSoundsContainer = document.getElementById('1_2_pitches');
  if (matchSoundsContainer) {
    const initialBackground = './images/backgrounds/pitches_action1_2_fox_owl.jpg';
    matchSoundsContainer.style.backgroundImage = `url('${initialBackground}')`;
    console.log('RESET_MATCH_SOUNDS: Reset background to initial state');
  }
  
  // Force UI update by triggering Alpine.js reactivity
  // This ensures the progress display and background refresh correctly
  component.$nextTick(() => {
    // Force re-evaluation of progress-dependent elements
    const event = new CustomEvent('match-sounds-reset', { 
      detail: { newProgress: 0, resetPatterns: ['up', 'down'] } 
    });
    document.dispatchEvent(event);
    
    console.log('RESET_MATCH_SOUNDS: UI refresh triggered');
  });
  
  console.log('RESET_MATCH_SOUNDS: Reset completed successfully');
}

// Make globally available for diagnosis
window.reset_1_2_MatchSounds_Progress = reset_1_2_MatchSounds_Progress;
