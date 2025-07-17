/**
 * Tone Colors component
 * Implements different sound timbres for children to explore
 */

import { debugLog } from '../utils/debug';

export function tonecolors() {
  return {
    selected: null,
    
    /**
     * Initialize the component
     */
    init() {
      debugLog('TONECOLORS', 'Tone Colors component initialized');
    },
    
    /**
     * Pick a sound and play it
     * @param {string} sound - The sound identifier
     */
    pick(sound) {
      this.selected = sound;
      // Make sure to use tonecolor_ prefix for the app component to recognize
      try {
        // Dispatch a custom event that the app component will listen for
        window.dispatchEvent(new CustomEvent('lalumo:play-sound', {
          detail: { sound: `tonecolor_${sound}` }
        }));
        debugLog('TONECOLORS', `Dispatched sound event for: tonecolor_${sound}`);
      } catch (error) {
        debugLog(['TONECOLORS', 'ERROR'], `Error dispatching sound event: ${error.message || error}`);
      }
    }
  };
}
