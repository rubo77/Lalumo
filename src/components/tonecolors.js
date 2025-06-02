/**
 * Tone Colors component
 * Implements different sound timbres for children to explore
 */
export function tonecolors() {
  return {
    selected: null,
    
    /**
     * Initialize the component
     */
    init() {
      console.log('Tone Colors component initialized');
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
        console.log(`Dispatched sound event for: tonecolor_${sound}`);
      } catch (error) {
        console.error('Error dispatching sound event:', error);
      }
    }
  };
}
