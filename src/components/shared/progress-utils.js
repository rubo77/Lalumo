/**
 * Progress data loading utilities
 */

/**
 * Loads chords progress data from localStorage and parses it
 * @returns {Object} Parsed progress data or empty object if no data
 */
export function loadChordsProgress() {
  const progressData = localStorage.getItem('lalumo_chords_progress');
  return progressData ? JSON.parse(progressData) : {};
}

/**
 * Loads pitches progress data from localStorage and parses it
 * @returns {Object} Parsed progress data or empty object if no data
 */
export function loadPitchesProgress() {
  const progressData = localStorage.getItem('lalumo_progress');
  return progressData ? JSON.parse(progressData) : {};
}

/**
 * Gets progress for a specific activity
 * @param {string} activityKey - The key for the activity (e.g., '2_5_chords_characters')
 * @param {Object} [component] - Component with progress data as fallback
 * @returns {number} Progress value for the activity
 */
export function getActivityProgress(activityKey, component = null) {
  const progress = loadChordsProgress();
  return progress[activityKey] || component?.progress?.[activityKey] || 0;
}