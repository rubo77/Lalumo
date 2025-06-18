/**
 * 2_3_chord_building.js - Module for the "Chord Building" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function testChordBuildingModuleImport() {
  debugLog('CHORDS', 'Chord Building module successfully imported');
  return true;
}

// Create a button to play the full chord
export function addPlayChordButton(context) {
  // First check if button already exists
  let playButton = document.getElementById('play-full-chord-button');
  
  // If button doesn't exist yet, create it
  if (!playButton) {
    // Find the container in different possible locations
    let container = document.querySelector('.chord-blocks') || 
                    document.querySelector('.chord-building-container') ||
                    document.querySelector('.chord-activity-container');
    
    if (container) {
      // Create a container for the button to style it separately
      const buttonContainer = document.createElement('div');
      buttonContainer.style.marginTop = '15px';
      buttonContainer.style.textAlign = 'center';
      buttonContainer.style.clear = 'both';
      buttonContainer.style.position = 'relative';
      buttonContainer.style.zIndex = '100'; // Ensure it's above other elements
      
      // Create the button itself
      playButton = document.createElement('button');
      playButton.id = 'play-full-chord-button';
      playButton.className = 'play-chord-button';
      playButton.textContent = 'Play Full Chord';
      playButton.style.padding = '8px 16px';
      playButton.style.fontSize = '16px';
      playButton.style.backgroundColor = '#4CAF50';
      playButton.style.color = 'white';
      playButton.style.border = 'none';
      playButton.style.borderRadius = '4px';
      playButton.style.cursor = 'pointer';
      
      // Add hover effect
      playButton.onmouseover = () => {
        playButton.style.backgroundColor = '#45a049';
      };
      playButton.onmouseout = () => {
        playButton.style.backgroundColor = '#4CAF50';
      };
      
      // Add click handler
      playButton.onclick = () => context.playBuiltChord();
      
      // Create a fixed container at the bottom of the screen
      const fixedContainer = document.createElement('div');
      fixedContainer.id = 'play-full-chord-button-container';
      
      // Add to DOM - both in the flow and fixed position
      buttonContainer.appendChild(playButton.cloneNode(true));
      container.parentNode.insertBefore(buttonContainer, container.nextSibling);
      
      // Add fixed button
      fixedContainer.appendChild(playButton);
      document.body.appendChild(fixedContainer);
      
      debugLog('CHORDS', '2_3_chord_building: Added play chord button');
    }
  }
}