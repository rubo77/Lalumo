// This script adds two features:
// 1. Updates all Home buttons to use left arrow and respect menu lock
// 2. Adds auto-progression to next melody after success

document.addEventListener('DOMContentLoaded', () => {
  // 1. Update all Home buttons to use left arrow icon and respect menu lock
  const homeButtons = document.querySelectorAll('.back-to-main');
  
  homeButtons.forEach(button => {
    // Replace the icon with a left arrow
    const svg = button.querySelector('svg');
    if (svg) {
      const path = svg.querySelector('path');
      if (path) {
        path.setAttribute('d', 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z');
      }
    }
    
    // Update the click event to respect menu lock
    const originalClick = button.getAttribute('@click');
    if (originalClick && originalClick.includes('setMode')) {
      // Avoid string concatenation to prevent invalid character errors
      if (originalClick.includes('active')) {
        button.setAttribute('x-on:click', '!$root.menuLocked && ($root.active = "main")');
      } else {
        button.setAttribute('x-on:click', '!$root.menuLocked');
      }
      button.setAttribute(':class', '{ disabled: $root.menuLocked }');
    }
  });
  
  // 2. Add event listener for successful melodie completion to auto-progress
  document.addEventListener('lalumo:success', (e) => {
    // Wait 2 seconds after success then move to next melody
    setTimeout(() => {
      const mode = e.detail?.mode;
      if (['listen', 'match', 'guess', 'memory'].includes(mode)) {
        // Find the active pitch component
        const pitchComponent = Alpine.data.pitches;
        if (pitchComponent) {
          pitchComponent.loadNextMelody();
          pitchComponent.playCurrentMelody();
        }
      }
    }, 2000);
  });
});
