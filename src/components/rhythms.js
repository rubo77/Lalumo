/**
 * Rhythms component
 * Implements rhythm-based activities for music education
 */
export function rhythms() {
  return {
    mode: 'main', // main, tap, match, create, dance
    currentPattern: [],
    userPattern: [],
    isPlaying: false,
    difficultyLevel: 1,
    tempo: 120, // BPM
    metronomeInterval: null,
    
    /**
     * Initialize the component
     */
    init() {
      console.log('Rhythms component initialized');
      this.setupNavigation();
    },
    
    /**
     * Configure navigation buttons to respect menu lock and add accessibility attributes
     */
    setupNavigation() {
      const navButtons = document.querySelectorAll('button.back-to-main');
      navButtons.forEach(button => {
        const originalClick = button.getAttribute('x-on:click') || button.getAttribute('@click');
        if (originalClick && !originalClick.includes('$root.menuLocked')) {
          // Add menu lock check to button click handler - avoid string concatenation
          if (originalClick.includes('$root.active')) {
            button.setAttribute('x-on:click', '!$root.menuLocked && ($root.active = "main")');
          } else {
            button.setAttribute('x-on:click', '!$root.menuLocked');
          }
          button.setAttribute(':class', '{ disabled: $root.menuLocked }');
          if (!button.hasAttribute('aria-label')) {
            button.setAttribute('aria-label', 'Back to main menu');
          }
        }
        if (!button.hasAttribute('role')) {
          button.setAttribute('role', 'button');
        }
      });
    },
    
    /**
     * Set the current activity mode
     * @param {string} newMode - The new mode to set
     */
    setMode(newMode) {
      // If menu is locked, don't allow mode change
      if (this.$root && this.$root.menuLocked) {
        console.log('Menu is locked, cannot change mode');
        return;
      }
      
      this.stopAllAudio();
      this.mode = newMode;
      
      if (newMode === 'tap') {
        this.setupTapActivity();
      } else if (newMode === 'match') {
        this.setupMatchActivity();
      } else if (newMode === 'create') {
        this.setupCreateActivity();
      } else if (newMode === 'dance') {
        this.setupDanceActivity();
      }
      
      console.log(`Rhythm mode set to: ${newMode}`);
    },
    
    /**
     * Setup the tap rhythm activity
     */
    setupTapActivity() {
      this.generatePattern();
      this.startMetronome();
    },
    
    /**
     * Setup the match rhythm pattern activity
     */
    setupMatchActivity() {
      this.currentPattern = [];
      this.userPattern = [];
      this.generatePattern();
    },
    
    /**
     * Setup the create rhythm activity
     */
    setupCreateActivity() {
      this.currentPattern = [];
      this.userPattern = [];
    },
    
    /**
     * Setup the dance along activity
     */
    setupDanceActivity() {
      // Various dance rhythms would be implemented here
    },
    
    /**
     * Generate a rhythm pattern based on difficulty level
     */
    generatePattern() {
      const patternLength = 4 + this.difficultyLevel;
      this.currentPattern = [];
      
      for (let i = 0; i < patternLength; i++) {
        // Simple pattern generation - can be enhanced with more complex patterns
        this.currentPattern.push(Math.random() > 0.3);
      }
      
      console.log('Generated rhythm pattern:', this.currentPattern);
    },
    
    /**
     * Start the metronome at the current tempo
     */
    startMetronome() {
      if (this.metronomeInterval) {
        clearInterval(this.metronomeInterval);
      }
      
      const beatDuration = 60000 / this.tempo; // Convert BPM to milliseconds
      let beat = 0;
      
      this.isPlaying = true;
      this.metronomeInterval = setInterval(() => {
        if (this.currentPattern[beat % this.currentPattern.length]) {
          this.playBeat(beat % 4 === 0 ? 'high' : 'low');
        }
        beat++;
      }, beatDuration);
    },
    
    /**
     * Stop the metronome
     */
    stopMetronome() {
      if (this.metronomeInterval) {
        clearInterval(this.metronomeInterval);
        this.metronomeInterval = null;
      }
      this.isPlaying = false;
    },
    
    /**
     * Play a rhythm beat sound
     * @param {string} type - The type of beat (high or low)
     */
    playBeat(type = 'high') {
      try {
        // Dispatch custom sound event for the app component to handle
        window.dispatchEvent(new CustomEvent('lalumo:play-sound', {
          detail: { sound: `rhythm_${type}` }
        }));
      } catch (error) {
        console.error('Error playing rhythm beat:', error);
      }
    },
    
    /**
     * Record a user tap in the pattern
     */
    recordTap() {
      this.userPattern.push(Date.now());
      this.playBeat('high');
    },
    
    /**
     * Compare user pattern with the target pattern
     * @returns {number} Score as percentage of accuracy
     */
    comparePatterns() {
      // This would implement rhythm pattern comparison logic
      // For now, return a placeholder score
      return Math.floor(Math.random() * 40) + 60; // Score between 60-100
    },
    
    /**
     * Stop all audio and reset timers
     */
    stopAllAudio() {
      this.stopMetronome();
    }
  };
}
