/**
 * Shared Visual & Audio Feedback Utilities
 * 
 * Centralized feedback functions used across all chapters
 * Ensures consistent user experience and reduces code duplication
 */

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
  const elementToShake = targetElement || getLastInteractedElement() || document.body;
  showCompleteError(elementToShake);
}
