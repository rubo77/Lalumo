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
      this.$root.playSound(`tonecolor_${sound}`);
    }
  };
}
