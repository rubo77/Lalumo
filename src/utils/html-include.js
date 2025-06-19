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
    
    // Make sure the path starts with '/' for absolute path from site root
    if (!file.startsWith('/')) {
      file = '/' + file.replace(/^\.\//g, '');
    }
    
    console.log('Attempting to load HTML partial:', file);
    
    // Make an AJAX request to fetch the partial
    fetch(file)
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
