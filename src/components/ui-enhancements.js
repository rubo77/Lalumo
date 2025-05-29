// UI enhancements for Lalumo
// 1. Left arrow Home buttons that respect menu lock state
// 2. Debug helper functions

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
      
      // Ensure click handlers are properly attached
      button.style.pointerEvents = 'auto';
      button.style.cursor = 'pointer';
      
      // Add direct click handler as backup for mobile devices
      if (!button._hasClickHandler) {
        button.addEventListener('click', function(e) {
          // Prevent default to ensure the click is captured
          e.preventDefault();
          
          // Try to dispatch click to Alpine.js
          try {
            // Find the app component and call setMode directly
            const appRoot = document.querySelector('[x-data="app()"]');
            if (appRoot && appRoot.__x) {
              const pitchesEl = document.querySelector('[x-data="pitches()"]');
              if (pitchesEl && pitchesEl.__x) {
                pitchesEl.__x.$data.setMode('main');
                console.log('Back button clicked - setMode called directly');
              }
            }
          } catch (err) {
            console.error('Error handling home button click:', err);
          }
        });
        button._hasClickHandler = true;
      }
    }
  });
}

// Add functionality for home buttons and menu lock state
document.addEventListener('DOMContentLoaded', () => {
  // Regularly check menu lock state
  updateHomeButtonsVisibility();
  setInterval(updateHomeButtonsVisibility, 1000);
  
  // All home button logic is now handled by updateHomeButtonsVisibility function
});
