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
    }
    
    // TODO: einfach einen unicode arrow im html nehmen
    // Update SVG to left arrow (only once)
    const svg = button.querySelector('svg path');
    if (svg && svg.getAttribute('d').includes('M10 20')) {
      svg.setAttribute('d', 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z');
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
