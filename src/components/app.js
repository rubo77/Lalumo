/**
 * Main application component
 */
import * as Tone from 'tone';

export function app() {
  return {
    active: 'pitches',
    synth: null,
    isInitialized: false,
    menuOpen: false,
    
    init() {
      // We'll initialize audio only on first user interaction
      // to comply with browser autoplay policies
      this.isInitialized = false;
      
      // Set up event listener for playing notes from other components
      window.addEventListener('musici:playnote', (event) => {
        if (event.detail && event.detail.note) {
          this.playSound(event.detail.note);
        }
      });
    },
    
    /**
     * Initialize the audio context - must be called on user interaction
     */
    async initAudio() {
      if (this.isInitialized) return;
      
      try {
        // Start the audio context on user gesture
        await Tone.start();
        console.log('Audio context started');
        
        // Create a polyphonic synth for playing notes
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        
        // Use simpler effects chain to avoid context connection issues
        // We'll wait until we know the context is ready
        this.isInitialized = true;
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    },
    
    /**
     * Play a sound by its identifier
     * @param {string} sound - The sound identifier
     */
    async playSound(sound) {
      try {
        // Initialize audio context if not already done
        if (!this.isInitialized) {
          await this.initAudio();
          // If still not initialized after attempt, show a message and return
          if (!this.isInitialized) {
            console.warn('Audio not initialized. Click anywhere to enable sound.');
            return;
          }
        }
        
        // Make sure the synth is created
        if (!this.synth) {
          this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        }
        
        // Parse the type of sound to play
        if (sound.startsWith('pitch_')) {
          // Handle pitch notes (e.g., 'pitch_c4')
          const note = sound.split('_')[1].toUpperCase();
          this.playNote(note);
        } else if (sound === 'success') {
          // Play success sound (ascending arpeggio)
          this.playSuccessSound();
        } else if (sound === 'try_again') {
          // Play try again sound (descending minor third)
          this.playTryAgainSound();
        } else if (sound.startsWith('tonecolor_')) {
          // Handle tone colors
          const color = sound.split('_')[1];
          this.playToneColor(color);
        } else {
          // Default sound if nothing else matches
          this.playNote('C4');
        }
      } catch (error) {
        console.error('Error playing sound:', error.message || error);
        // Try to recreate the audio context if there was an error
        this.isInitialized = false;
        this.synth = null;
      }
    },
    
    /**
     * Play a single note
     * @param {string} note - The note to play (e.g., 'C4')
     */
    playNote(note) {
      this.synth.triggerAttackRelease(note, '0.5s');
    },
    
    /**
     * Play a sequence of notes with timing
     * @param {Array} notes - Array of notes to play
     * @param {string} duration - Duration of each note
     * @param {number} interval - Time between notes in seconds
     */
    playSequence(notes, duration = '0.3s', interval = 0.4) {
      const now = Tone.now();
      notes.forEach((note, index) => {
        this.synth.triggerAttackRelease(note, duration, now + index * interval);
      });
    },
    
    /**
     * Play success sound (ascending major arpeggio)
     */
    playSuccessSound() {
      const notes = ['C4', 'E4', 'G4', 'C5'];
      this.playSequence(notes, '0.2s', 0.15);
    },
    
    /**
     * Play try again sound (descending minor third)
     */
    playTryAgainSound() {
      const notes = ['E4', 'C4'];
      this.playSequence(notes, '0.3s', 0.3);
    },
    
    /**
     * Play tone color sounds with different timbres
     * @param {string} color - The tone color to play
     */
    playToneColor(color) {
      // Create different synth settings based on the color
      let synthSettings = {};
      
      switch(color) {
        case 'warm':
          // Warm sound with soft attack
          synthSettings = {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
          };
          break;
          
        case 'cold':
          // Cold sound with metallic overtones
          synthSettings = {
            oscillator: { type: 'triangle8' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.7 }
          };
          break;
          
        case 'soft':
          // Soft pad-like sound
          synthSettings = {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.4, decay: 0.3, sustain: 0.7, release: 2 }
          };
          break;
          
        case 'sharp':
          // Sharp, percussive sound
          synthSettings = {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.3 }
          };
          break;
          
        default:
          // Default sound
          synthSettings = {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
          };
      }
      
      // Create a temporary synth with the specific timbre
      const tempSynth = new Tone.Synth(synthSettings).toDestination();
      
      // Play a chord or series of notes to demonstrate the timbre
      if (color === 'warm' || color === 'soft') {
        // Play a major chord for warm/soft
        tempSynth.triggerAttackRelease('E4', '1n');
      } else if (color === 'cold') {
        // Play a higher note for cold
        tempSynth.triggerAttackRelease('A4', '1n');
      } else {
        // Play a percussive note for sharp
        tempSynth.triggerAttackRelease('G4', '0.5n');
      }
    }
  };
}
