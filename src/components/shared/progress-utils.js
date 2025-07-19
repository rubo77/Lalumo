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

/**
 * Unified reset function for all activities
 * Resets both in-memory progress and persists to localStorage
 * @param {Object} component - The Alpine component instance
 * @param {string} activityId - The activity ID (e.g., '1_4', '2_2', '2_5')
 * @param {string} [storageKey='lalumo_progress'] - localStorage key to use
 */
export function resetActivityProgress(component, activityId, storageKey = 'lalumo_progress') {
  console.log(`[PROGRESS_UTILS] Resetting ${activityId} progress...`, {
    currentProgress: component.progress[activityId] || 0
  });
  
  // Reset in-memory progress
  if (!component.progress) component.progress = {};
  component.progress[activityId] = 0;
  
  // Also reset in localStorage to persist the reset
  const progressData = localStorage.getItem(storageKey);
  let progress = {};
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
    } catch (error) {
      debugLog(['PROGRESS_UTILS', 'ERROR'], `Error parsing progress data: ${error.message}`);
    }
  }
  progress[activityId] = 0;
  localStorage.setItem(storageKey, JSON.stringify(progress));
  
  console.log(`[PROGRESS_UTILS] ${activityId} progress reset complete and persisted`);
}