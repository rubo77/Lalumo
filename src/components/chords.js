/**
 * Chords component
 * Implements interactive chord learning experiences for children
 */

// Export specific functions from each module
// Common Module
export { testCommonModuleImport } from './2_chords/common.js';

// Chord Color Matching Module
export { 
  testChordColorMatchingModuleImport,
  newColorMatchingQuestion,
  checkColorAnswer
} from './2_chords/2_1_chord_color_matching.js';

// Chord Mood Landscapes Module
export { testChordMoodLandscapesModuleImport } from './2_chords/2_2_chord_mood_landscapes.js';

// Chord Building Module
export { testChordBuildingModuleImport } from './2_chords/2_3_chord_building.js';

// Missing Note Module
export { testMissingNoteModuleImport } from './2_chords/2_4_missing_note.js';

// Chord Characters Module
export { testChordCharactersModuleImport } from './2_chords/2_5_chord_characters.js';

// Import debug utilities
import { debugLog } from '../utils/debug.js';

// Import test functions from the modules
import {
  testCommonModuleImport,
  testChordColorMatchingModuleImport,
  testChordMoodLandscapesModuleImport,
  testChordBuildingModuleImport,
  testMissingNoteModuleImport,
  testChordCharactersModuleImport,
  // Import actual functions for color matching activity
  newColorMatchingQuestion,
  checkColorAnswer
} from './2_chords/index.js';
export function chords() {
  return {
    // Current activity mode
    mode: 'main',
    
    // Audio context and active oscillators
    audioContext: null,
    oscillators: {},
    activeChord: null,
    isPlaying: false,
    
    // Chord sequence for harmony gardens
    chordSequence: [],
    selectedSlotIndex: null,
    missingInterval: null,
    
    // Chord definitions
    chords: {
      major: { intervals: [0, 4, 7], name: 'Major', color: '#FFD700', mood: 'happy', character: 'sunny' },
      minor: { intervals: [0, 3, 7], name: 'Minor', color: '#4682B4', mood: 'sad', character: 'cloudy' },
      diminished: { intervals: [0, 3, 6], name: 'Diminished', color: '#800080', mood: 'mysterious', character: 'foggy' },
      augmented: { intervals: [0, 4, 8], name: 'Augmented', color: '#FF4500', mood: 'tense', character: 'stormy' },
      sus4: { intervals: [0, 5, 7], name: 'Suspended 4th', color: '#32CD32', mood: 'floating', character: 'windy' },
      sus2: { intervals: [0, 2, 7], name: 'Suspended 2nd', color: '#00BFFF', mood: 'open', character: 'airy' },
      dominant7: { intervals: [0, 4, 7, 10], name: 'Dominant 7th', color: '#FF6347', mood: 'bluesy', character: 'jazzy' },
      major7: { intervals: [0, 4, 7, 11], name: 'Major 7th', color: '#DDA0DD', mood: 'dreamy', character: 'starry' }
    },
    
    // Base notes for chord building
    baseNotes: {
      'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
      'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
      'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88
    },
    
    // Current state for activities
    currentChordType: null,
    selectedColors: [],
    correctAnswers: 0,
    totalQuestions: 0,
    feedbackMessage: '',
    showFeedback: false,
    
    /**
     * Initialize the component
     */
    init() {
      // Import debug utils
      import('../utils/debug').then(({ debugLog }) => {
        debugLog('CHORDS', 'Chords component initialized');
      });
      
      // Set up audio context when user interacts
      document.addEventListener('click', this.initAudio.bind(this), { once: true });
      document.addEventListener('touchstart', this.initAudio.bind(this), { once: true });
      
      // Listen for global events
      window.addEventListener('lalumo:stopallsounds', this.stopAllSounds.bind(this));
      
      // Listen for chord mode changes
      document.addEventListener('set-chord-mode', (event) => {
        const mode = event.detail || 'main';
        this.mode = mode;
        console.log('Chord mode changed to:', mode);
      });
      
      // Setup navigation elements after DOM is fully loaded
      document.addEventListener('DOMContentLoaded', () => {
        this.setupNavigation();
      });
    },
    
    /**
     * Initialize audio context on user interaction
     */
    /**
     * Initialize the central audio engine for chord playback
     */
    async initAudio() {
      try {
        // Import debug utils for consistent logging
        const { debugLog } = await import('../utils/debug');
        
        // Import and initialize the central audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        
        if (!audioEngine._isInitialized) {
          debugLog('CHORDS', 'Initializing central audio engine for chord playback');
          await audioEngine.initialize();
          debugLog('CHORDS', 'Central audio engine initialized for chord playback');
        } else {
          debugLog('CHORDS', 'Audio engine already initialized');
        }
        
        // Set audioContext reference for legacy compatibility
        this.audioContext = true; // Just a flag since we don't need the actual context anymore
      } catch (error) {
        console.error('Failed to initialize audio for chords:', error);
      }
    },
    
    /**
     * Play a chord based on type and root note
     * @param {string} chordType - The type of chord (major, minor, etc.)
     * @param {string} rootNote - The root note of the chord (e.g., 'C4')
     */
    async playChord(chordType, rootNote = 'C4') {
      this.stopAllSounds();
      
      try {
        // Import debug utils for logging
        const { debugLog } = await import('../utils/debug');
        
        // Get and initialize audioEngine if needed
        const audioEngine = (await import('./audio-engine.js')).default;
        if (!audioEngine._isInitialized) {
          await this.initAudio();
        }
        
        // Get chord definition
        const chord = this.chords[chordType];
        if (!chord) {
          console.error(`Unknown chord type: ${chordType}`);
          return;
        }
        
        debugLog('CHORDS', `Playing ${chordType} chord with root ${rootNote}`);
      } catch (error) {
        console.error('Error preparing chord playback:', error);
        return;
      }
      
      this.currentChordType = chordType;
      this.activeChord = [];
      
      try {
        // Get the audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        const { debugLog } = await import('../utils/debug');
        
        // Get root note frequency and validate
        const rootFreq = this.baseNotes[rootNote];
        if (!rootFreq) {
          console.error(`Unknown root note: ${rootNote}`);
          return;
        }
        
        // Convert chord intervals to actual notes for the audio engine
        const noteNames = [];
        
        // Parse the root note to get the letter and octave
        const rootMatch = rootNote.match(/([A-G][#b]?)([0-9])/);
        if (!rootMatch) {
          console.error(`Cannot parse root note format: ${rootNote}`);
          return;
        }
        
        const rootLetter = rootMatch[1];
        const octave = parseInt(rootMatch[2]);
        
        // Define all notes in chromatic order for calculating intervals
        const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Find root note index in chromatic scale
        let rootIndex = chromaticScale.indexOf(rootLetter);
        if (rootIndex === -1) {
          // Try with equivalent enharmonic spelling (e.g., Bb = A#)
          if (rootLetter === 'Bb') rootIndex = chromaticScale.indexOf('A#');
          else if (rootLetter === 'Eb') rootIndex = chromaticScale.indexOf('D#');
          // Add other equivalents as needed
          
          if (rootIndex === -1) {
            console.error(`Cannot find note ${rootLetter} in chromatic scale`);
            return;
          }
        }
        
        // Calculate all note names in the chord based on intervals
        chord.intervals.forEach((interval) => {
          // Calculate the note within the chromatic scale
          const noteIndex = (rootIndex + interval) % 12;
          let noteOctave = octave + Math.floor((rootIndex + interval) / 12);
          
          // Create the full note name (e.g., 'C4')
          const noteName = `${chromaticScale[noteIndex]}${noteOctave}`;
          noteNames.push(noteName);
        });
        
        debugLog('CHORDS', `Playing chord notes: ${noteNames.join(', ')}`);
        
        // Play all notes together as a chord with the audio engine
        audioEngine.playChord(noteNames, { duration: 2 });
        
        this.isPlaying = true;
        debugLog('CHORDS', `Playing ${chord.name} chord on ${rootNote} using central audio engine`);
      } catch (error) {
        console.error('Error playing chord:', error);
      }
    },
    
    /**
     * Play a single note at the specified frequency using the central audio engine
     * @param {number} frequency - The frequency in Hz
     * @param {number} delay - Delay before playing, in seconds
     */
    async playNote(frequency, delay = 0) {
      try {
        // Import the central audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        
        if (!audioEngine._isInitialized) {
          await this.initAudio();
        }
        
        // Convert frequency to closest note name
        // A4 = 440Hz, and each semitone is the 12th root of 2 higher
        const a4 = 440;
        const semitoneOffset = 12 * Math.log2(frequency / a4);
        const semitoneRounded = Math.round(semitoneOffset);
        
        // A4 is note 69 in MIDI standard
        const midiNoteNumber = 69 + semitoneRounded;
        
        // Convert MIDI note to note name
        // MIDI notes: C-1 = 0, C0 = 12, C1 = 24, ... C4 = 60, A4 = 69
        const octave = Math.floor((midiNoteNumber - 12) / 12);
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = noteNames[midiNoteNumber % 12];
        const fullNoteName = `${noteName}${octave}`;
        
        // Schedule note with delay
        setTimeout(() => {
          audioEngine.playNote(fullNoteName, 1.0); // Standard duration of 1 second
        }, delay * 1000); // Convert delay to milliseconds
        
        // Store for tracking (still useful for UI updates)
        const id = Date.now() + Math.random();
        this.activeChord.push(id);
        return id;
      } catch (error) {
        console.error('Error playing note:', error);
        return null;
      }
    },
    
    /**
     * Stop all currently playing sounds using the central audio engine
     */
    async stopAllSounds() {
      try {
        // Import the central audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        
        if (!audioEngine._isInitialized) {
          console.warn('Audio engine not initialized, cannot stop sounds');
          return;
        }
        
        // Use the audio engine's stopAll method
        audioEngine.stopAll();
        
        // Reset active chord tracking
        this.activeChord = [];
        this.isPlaying = false;
        
        // Import debug utils
        const { debugLog } = await import('../utils/debug');
        debugLog('CHORDS', 'Stopped all sounds using central audio engine');
      } catch (error) {
        console.error('Error stopping sounds:', error);
      }
    },
    
    /**
     * Switch to a specific activity mode
     * @param {string} mode - The activity mode to set
     */
    setMode(mode) {
      this.stopAllSounds();
      this.mode = mode;
      this.resetActivity();
      
      // Update Alpine store
      if (window.Alpine?.store) {
        window.Alpine.store('chordMode', mode);
      }
      
      // Import debug utils
      import('../utils/debug').then(({ debugLog }) => {
        debugLog('CHORDS', `Switched to ${mode} mode`);
      });
    },
    
    /**
     * Reset the current activity state
     */
    resetActivity() {
      this.currentChordType = null;
      this.selectedColors = [];
      this.correctAnswers = 0;
      this.totalQuestions = 0;
      this.feedbackMessage = '';
      this.showFeedback = false;
    },
    
    /**
     * Setup all navigation elements to respect menu locking and ensure accessibility
     */
    setupNavigation() {
      // Make all navigation buttons in chord activities accessible
      const navButtons = document.querySelectorAll('button.back-to-main');
      
      navButtons.forEach(button => {
        // Update click event to respect menu lock status
        const originalClick = button.getAttribute('x-on:click') || button.getAttribute('@click');
        if (originalClick && !originalClick.includes('$root.menuLocked')) {
          // Add menu lock check to button click handler - avoid string concatenation
          if (originalClick.includes('$root.active')) {
            button.setAttribute('x-on:click', '!$root.menuLocked && ($root.active = "main")');
          } else {
            button.setAttribute('x-on:click', '!$root.menuLocked');
          }
          button.setAttribute(':class', '{ disabled: $root.menuLocked }');
          
          // Add ARIA attributes for accessibility
          if (!button.hasAttribute('aria-label')) {
            button.setAttribute('aria-label', 'Back to main menu');
          }
        }
        
        // Ensure buttons have appropriate role
        if (!button.hasAttribute('role')) {
          button.setAttribute('role', 'button');
        }
      });
      
      // Import debug utils
      import('../utils/debug').then(({ debugLog }) => {
        debugLog('CHORDS', 'Navigation elements configured');
      });
    },
    
    /**
     * Get a random chord type from available chords
     * @returns {string} A random chord type
     */
    getRandomChordType() {
      const chordTypes = Object.keys(this.chords);
      return chordTypes[Math.floor(Math.random() * chordTypes.length)];
    },
    
    /**
     * Get a random root note for chords
     * @returns {string} A random root note
     */
    getRandomRootNote() {
      const rootNotes = Object.keys(this.baseNotes);
      return rootNotes[Math.floor(Math.random() * rootNotes.length)];
    },
    
    // Color Matching Activity Methods
    startColorMatching() {
      this.resetActivity();
      // Use the imported function with 'this' as the component reference
      newColorMatchingQuestion(this);
      
      // Log that we're using the modular function
      debugLog('CHORDS', 'Started color matching activity using modular function');
    },
    
    // These functions are now imported from the module
    // Wrapper functions to maintain compatibility with existing code
    newColorMatchingQuestion() {
      newColorMatchingQuestion(this);
    },
    
    checkColorAnswer(selectedColor) {
      checkColorAnswer(this, selectedColor);
    },
    
    // Mood Landscapes Activity Methods
    updateLandscape(chordType) {
      // This would update the visual landscape based on chord type
      const landscapeImage = document.getElementById('landscape-image');
      if (landscapeImage) {
        // Map chord types to landscape images
        const landscapes = {
          major: './images/landscapes/sunny-field.jpg',
          minor: './images/landscapes/rainy-forest.jpg',
          diminished: './images/landscapes/misty-mountains.jpg',
          augmented: './images/landscapes/lightning-storm.jpg',
          sus4: './images/landscapes/windy-plains.jpg',
          sus2: './images/landscapes/meadow.jpg'
        };
        
        landscapeImage.src = landscapes[chordType] || landscapes.major;
      }
    },
    
    // Chord Building Activity Methods
    addNoteToChord(interval) {
      if (!this.audioContext) {
        this.initAudio();
        if (!this.audioContext) return;
      }
      
      // Add a visual block for this note
      const blocksContainer = document.querySelector('.chord-blocks');
      if (blocksContainer) {
        const block = document.createElement('div');
        block.className = 'chord-block';
        block.textContent = this.getNoteName(interval);
        block.style.backgroundColor = this.getNoteColor(interval);
        blocksContainer.appendChild(block);
      }
      
      // Play just this note
      const rootFreq = this.baseNotes['C4'];
      const freq = rootFreq * Math.pow(2, interval / 12);
      this.playNote(freq);
      
      // Store the current built chord
      if (!this.builtChordIntervals) this.builtChordIntervals = [];
      this.builtChordIntervals.push(interval);
      
      // Check if a recognized chord has been built
      this.checkBuiltChord();
    },
    
    getNoteName(interval) {
      const noteNames = {
        0: 'Root',
        2: 'Major 2nd',
        3: 'Minor 3rd',
        4: 'Major 3rd',
        5: 'Perfect 4th',
        6: 'Diminished 5th',
        7: 'Perfect 5th',
        8: 'Augmented 5th',
        9: 'Major 6th',
        10: 'Minor 7th',
        11: 'Major 7th'
      };
      return noteNames[interval] || `Interval ${interval}`;
    },
    
    getNoteColor(interval) {
      // Map intervals to colors
      const colors = {
        0: '#FF6347',  // Root - Tomato
        3: '#4682B4',  // Minor 3rd - Steel Blue
        4: '#FFD700',  // Major 3rd - Gold
        6: '#800080',  // Diminished 5th - Purple
        7: '#32CD32',  // Perfect 5th - Lime Green
        8: '#FF4500'   // Augmented 5th - Orange Red
      };
      return colors[interval] || '#CCCCCC';
    },
    
    checkBuiltChord() {
      if (!this.builtChordIntervals || this.builtChordIntervals.length < 3) return;
      
      // Sort intervals to normalize the chord
      const sortedIntervals = [...this.builtChordIntervals].sort((a, b) => a - b);
      
      // Check against known chord types
      let recognizedChord = null;
      Object.entries(this.chords).forEach(([type, chord]) => {
        if (JSON.stringify(sortedIntervals) === JSON.stringify(chord.intervals)) {
          recognizedChord = type;
        }
      });
      
      if (recognizedChord) {
        this.showFeedback = true;
        this.feedbackMessage = `You built a ${this.chords[recognizedChord].name} chord!`;
        setTimeout(() => this.showFeedback = false, 3000);
      }
    },
    
    // Missing Note Activity Methods
    playIncompleteChord() {
      this.stopAllSounds();
      
      if (!this.audioContext) {
        this.initAudio();
        if (!this.audioContext) return;
      }
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Select a random chord type if none is set
      if (!this.currentChordType) {
        const chordTypes = ['major', 'minor', 'diminished', 'augmented'];
        this.currentChordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
      }
      
      // Get the chord definition
      const chord = this.chords[this.currentChordType];
      
      // Choose a note to remove (not the root)
      const availableIntervals = chord.intervals.slice(1); // Skip root note
      this.missingInterval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
      
      // Root note frequency
      const rootFreq = this.baseNotes['C4'];
      
      // Play incomplete chord (all notes except the missing one)
      chord.intervals.forEach(interval => {
        if (interval !== this.missingInterval) {
          const freq = rootFreq * Math.pow(2, interval / 12);
          this.playNote(freq);
        }
      });
      
      // Import debug utils to log the missing interval
      import('../utils/debug').then(({ debugLog }) => {
        debugLog('CHORDS', `Missing interval: ${this.missingInterval}`);
      });
    },
    
    checkMissingNote(noteInterval) {
      if (!this.missingInterval) {
        this.playIncompleteChord(); // Initialize if not yet done
        return;
      }
      
      const isCorrect = noteInterval === this.missingInterval;
      
      this.showFeedback = true;
      if (isCorrect) {
        this.feedbackMessage = this.$store.strings.success_message || 'Great job! That\'s correct!';
        this.correctAnswers++;
        
        // Play the complete chord
        setTimeout(() => {
          this.playChord(this.currentChordType);
        }, 500);
        
        // Set up a new chord after a delay
        setTimeout(() => {
          this.currentChordType = null; // Reset for next question
          this.showFeedback = false;
          this.playIncompleteChord();
        }, 2000);
      } else {
        this.feedbackMessage = this.$store.strings.error_message || 'Not quite right. Try again!';
        
        // Hide feedback after delay
        setTimeout(() => {
          this.showFeedback = false;
        }, 1500);
      }
      
      this.totalQuestions++;
    },
    
    // Character Matching Activity Methods
    playCurrentChord() {
      if (!this.currentChordType) {
        // Random chord if none selected yet
        const chordTypes = ['major', 'minor', 'diminished', 'augmented'];
        this.currentChordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
      }
      
      this.playChord(this.currentChordType);
    },
    
    checkCharacterMatch(selectedChordType) {
      // Initialize if needed
      if (!this.currentChordType) {
        this.playCurrentChord(); // This will set a random chord
        return; // Don't process the selection yet
      }
      
      const isCorrect = selectedChordType === this.currentChordType;
      
      this.showFeedback = true;
      if (isCorrect) {
        this.feedbackMessage = this.$store.strings.success_message || 'Great job! That\'s correct!';
        this.correctAnswers++;
        
        // Set up a new chord after a delay
        setTimeout(() => {
          const chordTypes = ['major', 'minor', 'diminished', 'augmented'];
          this.currentChordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
          this.showFeedback = false;
        }, 1500);
      } else {
        this.feedbackMessage = this.$store.strings.error_message || 'Not quite right. Try again!';
        
        // Hide feedback after delay
        setTimeout(() => {
          this.showFeedback = false;
        }, 1500);
      }
      
      this.totalQuestions++;
    },
    
    // Harmony Gardens Activity Methods
    selectChordSlot(index) {
      this.selectedSlotIndex = index;
      
      // Highlight the selected slot
      const slots = document.querySelectorAll('.chord-slot');
      slots.forEach((slot, i) => {
        if (i === index) {
          slot.classList.add('selected');
        } else {
          slot.classList.remove('selected');
        }
      });
    },
    
    plantChordInGarden(chordType) {
      if (this.selectedSlotIndex === null) {
        // No slot selected yet
        this.showFeedback = true;
        this.feedbackMessage = this.$store.strings.select_slot_first || 'Please select a slot first';
        setTimeout(() => this.showFeedback = false, 2000);
        return;
      }
      
      // Add the chord to the sequence
      const slots = document.querySelectorAll('.chord-slot');
      if (slots[this.selectedSlotIndex]) {
        // Update visual content
        const placeholder = slots[this.selectedSlotIndex].querySelector('.chord-placeholder');
        if (placeholder) {
          placeholder.textContent = this.chords[chordType].name;
          placeholder.style.backgroundColor = this.chords[chordType].color;
        }
        
        // Store in sequence
        if (!this.chordSequence) this.chordSequence = [];
        this.chordSequence[this.selectedSlotIndex] = chordType;
        
        // Play the chord
        this.playChord(chordType);
        
        // Update garden with a plant element based on chord type
        this.addPlantToGarden(chordType);
      }
    },
    
    addPlantToGarden(chordType) {
      const garden = document.querySelector('.garden-canvas');
      if (!garden) return;
      
      const plantEmojis = {
        major: '🌻', // sunflower
        minor: '🌷', // tulip
        diminished: '🌵', // cactus
        augmented: '🌺', // hibiscus
        sus4: '🍀', // four leaf clover
        sus2: '🌱', // seedling
        dominant7: '🌴', // palm tree
        major7: '🌸'  // cherry blossom
      };
      
      // Create plant element
      const plant = document.createElement('div');
      plant.className = 'garden-plant';
      plant.textContent = plantEmojis[chordType] || '🌿';
      
      // Position randomly in the garden
      plant.style.left = `${20 + Math.random() * 60}%`;
      plant.style.top = `${20 + Math.random() * 60}%`;
      plant.style.fontSize = `${24 + Math.random() * 12}px`;
      
      // Add to the garden
      garden.appendChild(plant);
    },
    
    playChordSequence() {
      if (!this.chordSequence || !this.chordSequence.filter(chord => chord).length) {
        this.showFeedback = true;
        this.feedbackMessage = this.$store.strings.no_chords_in_sequence || 'Add some chords to your sequence first';
        setTimeout(() => this.showFeedback = false, 2000);
        return;
      }
      
      // Stop any playing sounds
      this.stopAllSounds();
      
      // Filter out undefined entries
      const sequence = this.chordSequence.filter(chord => chord);
      
      // Play each chord in sequence with a delay between them
      let delay = 0;
      sequence.forEach(chordType => {
        setTimeout(() => {
          this.playChord(chordType);
        }, delay);
        delay += 1000; // 1 second between chords
      });
    }
  };
}
