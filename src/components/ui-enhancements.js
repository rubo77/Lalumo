// UI enhancements for Lalumo
// 1. Auto-progression to next melody after success
// 2. Left arrow Home buttons that respect menu lock state

// Check for menu lock and update Home button visibility
function updateHomeButtonsVisibility() {
  // Try to get the Alpine.js app component first
  let menuLocked = false;
  
  try {
    // Find the app root element
    const appRoot = document.querySelector('[x-data="app()"]');
    if (appRoot && appRoot.__x) {
      // Get menuLocked from Alpine.js data
      menuLocked = appRoot.__x.getUnobservedData().menuLocked;
    } else {
      // Fallback to localStorage if Alpine.js state is not available
      menuLocked = localStorage.getItem('lalumo_menu_locked') === 'true';
    }
  } catch (error) {
    // Fallback to localStorage if there's an error
    menuLocked = localStorage.getItem('lalumo_menu_locked') === 'true';
    console.log('Error accessing Alpine data, falling back to localStorage', error);
  }

  // Find all Home buttons
  const homeButtons = document.querySelectorAll('.back-to-main');
  
  // Update buttons based on lock state
  homeButtons.forEach(button => {
    if (menuLocked) {
      button.style.visibility = 'hidden';
      button.disabled = true;
    } else {
      button.style.visibility = 'visible';
      button.disabled = false;
    }
    
    // Update SVG to left arrow (only once)
    const svg = button.querySelector('svg path');
    if (svg && svg.getAttribute('d').includes('M10 20')) {
      svg.setAttribute('d', 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z');
    }
  });
}

// Add functionality to auto-progress after successful completion
document.addEventListener('DOMContentLoaded', () => {
  // Regularly check menu lock state
  updateHomeButtonsVisibility();
  setInterval(updateHomeButtonsVisibility, 1000);
  // Add event listeners for success events
  document.addEventListener('click', function(event) {
    // Find the success events when user gets correct answer
    if (event.target.closest('.note-button, .drawing-pad, .melody-choice, .piano-key')) {
      // Get Alpine component instance
      setTimeout(() => {
        const feedbackElements = document.querySelectorAll('.feedback');
        feedbackElements.forEach(element => {
          // Check if feedback shows success
          if (element.textContent.includes('Great job') || element.textContent.includes('correct')) {
            // Auto-progress to next melody after 2 seconds
            setTimeout(() => {
              const pitchesElement = document.querySelector('[x-data="pitches()"]');
              if (pitchesElement && typeof pitchesElement.__x !== 'undefined') {
                const pitchesComponent = pitchesElement.__x.getUnobservedData();
                if (pitchesComponent && typeof pitchesComponent.loadNextMelody === 'function') {
                  pitchesComponent.loadNextMelody();
                  pitchesComponent.playCurrentMelody();
                }
              }
            }, 2000);
          }
        });
      }, 500); // Check shortly after click
    }
  });
  
  // Replace all Home buttons with left arrow icons
  setTimeout(() => {
    const homeButtons = document.querySelectorAll('.back-to-main');
    
    homeButtons.forEach(button => {
      // Modify the SVG to be a left arrow
      const svg = button.querySelector('svg path');
      if (svg) {
        svg.setAttribute('d', 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z');
      }
      
      // Instead of using setAttribute directly, we'll modify the HTML
      // to avoid issues with nested quotes
      if (button.outerHTML.includes('setMode')) {
        // Create a temporary element
        const tempDiv = document.createElement('div');
        // Set the inner HTML with our modified attributes
        tempDiv.innerHTML = button.outerHTML
          .replace(/(@click|x-on:click)="[^"]*"/g, '@click="!$root.menuLocked && setMode(\'main\')"')
          .replace(/(:class|x-bind:class)="[^"]*"/g, ':class="{\'disabled\': $root.menuLocked}"');
        
        // Replace the original button with our modified one
        if (tempDiv.firstChild) {
          button.parentNode.replaceChild(tempDiv.firstChild, button);
        }
      }
    });
  }, 500); // Wait for DOM to be fully processed
});
