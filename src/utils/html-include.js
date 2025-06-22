/**
 * HTML Include Utility
 * Processes elements with data-include attributes to load content from HTML partials
 */

// Load HTML partials into DOM elements with data-include attribute
export function loadHtmlPartials() {
  const includes = document.querySelectorAll('[data-include]');
  
  // Process each include element
  includes.forEach(element => {
    let file = element.getAttribute('data-include');
    
    // Handle paths based on file structure reorganization
    if (!file.startsWith('/')) {
      // Check if this is a partial reference
      if (file.includes('partial') || file.includes('partials')) {
        // If it doesn't already include 'partials/' prefix, add it
        if (!file.startsWith('partials/')) {
          file = 'partials/' + file.replace(/^(\.\/)?(partials\/)?/g, '');
        }
      }
    }
    
    // Support for base path in production environments
    const basePath = document.querySelector('base')?.getAttribute('href') || '';
    const fullPath = basePath + file;
    
    console.log('Attempting to load HTML partial:', fullPath);
    
    // Make an AJAX request to fetch the partial
    fetch(fullPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error loading HTML partial: ${file}`);
        }
        return response.text();
      })
      .then(html => {
        // Insert the HTML content
        element.innerHTML = html;
        
        // Alpine.js needs to be notified if we're injecting components after initial load
        if (window.Alpine) {
          window.Alpine.initTree(element);
        }
      })
      .catch(error => {
        console.error('HTML partial loading error:', error);
        element.innerHTML = `<div class="error-message">Error loading content</div>`;
      });
  });
}
