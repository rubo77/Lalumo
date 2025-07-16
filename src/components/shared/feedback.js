/**
 * Shared Visual & Audio Feedback Utilities
 * 
 * Centralized feedback functions used across all chapters
 * Ensures consistent user experience and reduces code duplication
 */

/**
 * Show a mascot message and speak it if text-to-speech is available
 * @param {string} message - The message to display and speak
 * @param {string} activityId - Optional ID of the current activity to prevent duplicate messages
 * @param {number} delaySeconds - Delay in seconds before hiding the message (default: 2)
 * @param {Object} component - The Alpine.js component instance (optional)
 */
export function showMascotMessage(message, activityId = null, delaySeconds = 2, component = null) {
  // Check for empty message
  if (!message || message.trim() === '' || message === 'undefined' || message === 'null') {
    console.error('HELP_MESSAGE: showMascotMessage called with empty message', new Error().stack);
    return;
  }
  
  // Get the Alpine store
  const store = window.Alpine.store;
  
  // Check if help messages are enabled in user settings
  if (store && store.mascotSettings && !store.mascotSettings.showHelpMessages) {
    console.log('HELP_MESSAGE: Skipping help message - user has disabled help messages');
    return;
  }
  
  // Show the message using the global feedback store
  if (store && store.feedback) {
    store.feedback.feedbackMessage = message;
    store.feedback.showFeedback = true;
    
    // Auto-hide after delay if specified
    if (delaySeconds > 0) {
      setTimeout(() => {
        if (store && store.feedback) {
          store.feedback.showFeedback = false;
        }
      }, delaySeconds * 1000);
    }
  }
  
  // Log the message
  console.log(`HELP_MESSAGE: ${message}`);
  
  // If a component is provided and it has a speak method, use it
  if (component && typeof component.speak === 'function') {
    component.speak(message);
  } 
  // Otherwise use the global speech synthesis if available
  else if (window.speechSynthesis && store && store.mascotSettings && store.mascotSettings.enableSpeech) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = store.language || 'en';
    window.speechSynthesis.speak(utterance);
  }
}

// Initialize the feedback functionality when Alpine is ready
document.addEventListener('alpine:init', () => {
  // Initialize the feedback store if it doesn't exist
  if (!window.Alpine.store('feedback')) {
    window.Alpine.store('feedback', {
      showFeedback: false,
      feedbackMessage: ''
    });
  }
  
  // Make showMascotMessage available globally
  window.showMascotMessage = showMascotMessage;
});

/**
 * Show rainbow success animation
 * Creates a full-screen rainbow arc animation for successful completion
 */
export function showRainbowSuccess() {
  // Create and show rainbow success animation
  const rainbow = document.createElement('div');
  rainbow.className = 'rainbow-success';
  document.body.appendChild(rainbow);

  // Remove rainbow element after animation completes (3 seconds)
  setTimeout(() => {
    if (rainbow && rainbow.parentNode) {
      rainbow.parentNode.removeChild(rainbow);
    }
  }, 3000);
}

/**
 * Show big rainbow success animation for major achievements
 * Enhanced version for level completions and major milestones
 */
export function showBigRainbowSuccess() {
  const bigRainbow = document.createElement('div');
  bigRainbow.className = 'rainbow-success';
  bigRainbow.style.transform = 'scale(1.5)';
  bigRainbow.style.zIndex = '10000';
  document.body.appendChild(bigRainbow);

  // Remove big rainbow element after animation completes
  setTimeout(() => {
    if (bigRainbow && bigRainbow.parentNode) {
      bigRainbow.parentNode.removeChild(bigRainbow);
    }
  }, 3500);
}

/**
 * Show shake error animation on specific element
 * @param {HTMLElement} element - The element to shake
 */
export function showShakeError(element) {
  if (!element) return;
  
  element.classList.add('shake-error');
  
  // Remove shake class after animation completes (0.5 seconds)
  setTimeout(() => {
    element.classList.remove('shake-error');
  }, 500);
}

/**
 * Play success sound (ascending arpeggio)
 * Frequencies: C4, E4, G4, C5
 */
export function playSuccessSound() {
  // Use the global app instance to play the sound
  if (window.app && typeof window.app.playSuccessSound === 'function') {
    window.app.playSuccessSound();
  } else {
    console.warn('FEEDBACK_UTILITIES: App instance not available for success sound');
  }
}

/**
 * Play error sound (descending minor third)
 * Frequencies: E4, C4
 */
export function playErrorSound() {
  // Use the global app instance to play the sound
  if (window.app && typeof window.app.playErrorSound === 'function') {
    window.app.playErrorSound();
  } else {
    console.warn('FEEDBACK_UTILITIES: App instance not available for error sound');
  }
}

/**
 * Complete success feedback (visual + audio)
 * Combines rainbow animation and success sound
 */
export function showCompleteSuccess() {
  showRainbowSuccess();
  playSuccessSound();
}

/**
 * Complete big success feedback for major achievements
 * Combines big rainbow animation and success sound
 */
export function showCompleteBigSuccess() {
  showBigRainbowSuccess();
  playSuccessSound();
}

/**
 * Complete error feedback (visual + audio)
 * Combines shake animation and error sound
 * @param {HTMLElement} element - The element to shake
 */
export function showCompleteError(element) {
  showShakeError(element);
  playErrorSound();
}

/**
 * Utility function to get the last pressed element for error feedback
 * Searches for elements with common interaction classes
 * @returns {HTMLElement|null} The last interacted element or null
 */
export function getLastInteractedElement() {
  // Look for recently pressed/clicked elements with common classes
  const commonSelectors = [
    '.key.pressed',
    '.note-button.active', 
    '.sound-option.selected',
    '.choice-button.clicked'
  ];
  
  for (const selector of commonSelectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  
  return null;
}

/**
 * Smart error feedback that tries to find the relevant element
 * Falls back to body shake if no specific element found
 * @param {HTMLElement} [targetElement] - Specific element to shake (optional)
 */
export function showSmartError(targetElement = null) {
  const element = targetElement || getLastInteractedElement() || document.body;
  showShakeError(element);
  playErrorSound();
}

/**
 * Create and display a progress bar for activities
 * @param {Object} options - Configuration options for the progress bar
 * @param {string} options.appendToContainer - CSS selector for the container to append the progress bar to
 * @param {string} options.progressClass - CSS class name for the progress container
 * @param {number} options.currentCount - Current progress count (e.g., successful completions)
 * @param {number} options.totalCount - Total count needed for completion
 * @param {number} options.currentLevel - Current level number
 * @param {number} options.notesCount - Number of notes in current level (optional)
 * @param {boolean} options.barOnly - Whether to show only the progress bar (optional)
 * @param {string} options.activityName - Name of the activity for display text
 * @param {Object} options.positioning - Custom positioning styles
 * @returns {HTMLElement|null} The created progress container or null if container not found
 */
export function showActivityProgressBar(options) {
  const {
    appendToContainer,
    progressClass = 'activity-progress',
    currentCount = 0,
    totalCount = 10,
    currentLevel = 1,
    notesCount = null,
    barOnly = false,
    activityName = 'Activity',
    positioning = {
      position: 'absolute',
      bottom: '10px',
      left: '0',
      width: '100%'
    }
  } = options;

  // Remove existing progress display
  let existingProgress = document.querySelector(`.${progressClass}`);
  if (existingProgress) {
    existingProgress.remove();
  }

  // Find target container
  const targetContainer = document.querySelector(appendToContainer);
  if (!targetContainer) {
    console.warn(`PROGRESS_BAR: Container not found: ${appendToContainer}`);
    return null;
  }

  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.className = progressClass;
  
  // Apply positioning styles
  Object.assign(progressContainer.style, {
    textAlign: 'center',
    padding: '10px 0',
    ...positioning
  });

  // Create progress text only if not barOnly mode
  if (!barOnly) {
    const isGerman = document.documentElement.lang === 'de';
    const progressText = document.createElement('div');
    progressText.style.fontSize = '14px';
    progressText.style.marginBottom = '5px';
    
    // Build text content
    let textContent = '';
    if (notesCount) {
      textContent = isGerman 
        ? `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName} (${notesCount} Töne)`
        : `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName} (${notesCount} notes)`;
    } else {
      textContent = isGerman 
        ? `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName}`
        : `Level ${currentLevel}: ${currentCount}/${totalCount} ${activityName}`;
    }
    progressText.textContent = textContent;

    // Assemble components
    progressContainer.appendChild(progressText);
  }

  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.style.width = '80%';
  progressBar.style.margin = '0 auto';
  progressBar.style.height = '8px';
  progressBar.style.backgroundColor = '#e0e0e0';
  progressBar.style.borderRadius = '4px';
  progressBar.style.overflow = 'hidden';

  // Create progress fill
  const progressFill = document.createElement('div');
  progressFill.style.height = '100%';
  progressFill.style.width = `${(currentCount / totalCount) * 100}%`;
  progressFill.style.backgroundColor = '#4CAF50';
  progressFill.style.transition = 'width 0.3s ease-in-out';

  // Assemble components
  progressBar.appendChild(progressFill);
  progressContainer.appendChild(progressBar);

  // Add to target container
  if (targetContainer.parentNode) {
    targetContainer.parentNode.appendChild(progressContainer);
  } else {
    targetContainer.appendChild(progressContainer);
  }

  console.log(`PROGRESS_BAR: Created for ${activityName} - ${currentCount}/${totalCount}`);
  return progressContainer;
}

/**
 * Remove activity progress bar
 * @param {string} progressClass - CSS class name of the progress container to remove
 */
export function hideActivityProgressBar(progressClass = 'activity-progress') {
  const progressContainer = document.querySelector(`.${progressClass}`);
  if (progressContainer) {
    progressContainer.remove();
    console.log(`PROGRESS_BAR: Removed progress bar with class: ${progressClass}`);
  }
}
