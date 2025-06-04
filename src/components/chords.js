/**
 * Chords component
 * Implements interactive chord learning experiences for children
 */
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
    initAudio() {
      if (this.audioContext) return;
      
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // Import debug utils
        import('../utils/debug').then(({ debugLog }) => {
          debugLog('CHORDS', 'Audio context initialized');
        });
      } catch (error) {
        console.error('Failed to create audio context:', error);
      }
    },
    
    /**
     * Play a chord based on type and root note
     * @param {string} chordType - The type of chord (major, minor, etc.)
     * @param {string} rootNote - The root note of the chord (e.g., 'C4')
     */
    playChord(chordType, rootNote = 'C4') {
      this.stopAllSounds();
      
      if (!this.audioContext) {
        this.initAudio();
        if (!this.audioContext) return; // Still not available
      }
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Get chord definition
      const chord = this.chords[chordType];
      if (!chord) {
        console.error(`Unknown chord type: ${chordType}`);
        return;
      }
      
      this.currentChordType = chordType;
      this.activeChord = [];
      
      // Get root note frequency
      const rootFreq = this.baseNotes[rootNote];
      if (!rootFreq) {
        console.error(`Unknown root note: ${rootNote}`);
        return;
      }
      
      // Play each note in the chord
      chord.intervals.forEach((interval, index) => {
        // Calculate frequency using equal temperament
        // Each semitone is the 12th root of 2 higher than the previous
        const freq = rootFreq * Math.pow(2, interval / 12);
        this.playNote(freq, index * 0.02); // Slight staggering for more natural sound
      });
      
      this.isPlaying = true;
      
      // Import debug utils
      import('../utils/debug').then(({ debugLog }) => {
        debugLog('CHORDS', `Playing ${chord.name} chord on ${rootNote}`);
      });
    },
    
    /**
     * Play a single note at the specified frequency
     * @param {number} frequency - The frequency in Hz
     * @param {number} delay - Delay before playing, in seconds
     */
    playNote(frequency, delay = 0) {
      if (!this.audioContext) return;
      
      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      // Apply envelope
      gainNode.gain.value = 0;
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Start oscillator
      oscillator.start(this.audioContext.currentTime + delay);
      
      // Ramp up gain
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + delay + 0.05);
      
      // Store oscillator
      const id = Date.now() + Math.random();
      this.oscillators[id] = { oscillator, gainNode };
      this.activeChord.push(id);
    },
    
    /**
     * Stop all currently playing sounds
     */
    stopAllSounds() {
      if (!this.audioContext) return;
      
      // Release all oscillators
      const currentTime = this.audioContext ? this.audioContext.currentTime : 0;
      
      Object.keys(this.oscillators).forEach(id => {
        const { oscillator, gainNode } = this.oscillators[id];
        
        // Fade out
        try {
          gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);
          setTimeout(() => {
            try {
              oscillator.stop();
              oscillator.disconnect();
              gainNode.disconnect();
              delete this.oscillators[id];
            } catch (e) { /* Ignore errors from already stopped oscillators */ }
          }, 200);
        } catch (e) { /* Ignore errors from already stopped oscillators */ }
      });
      
      this.isPlaying = false;
      this.activeChord = null;
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
      this.newColorMatchingQuestion();
    },
    
    newColorMatchingQuestion() {
      const chordType = this.getRandomChordType();
      const rootNote = this.getRandomRootNote();
      this.playChord(chordType, rootNote);
      this.currentChordType = chordType;
      this.totalQuestions++;
    },
    
    checkColorAnswer(selectedColor) {
      const correctColor = this.chords[this.currentChordType].color;
      const isCorrect = selectedColor === correctColor;
      
      if (isCorrect) {
        this.correctAnswers++;
        this.feedbackMessage = 'Great job! That\'s the right color!';
      } else {
        this.feedbackMessage = 'Not quite! Let\'s try another one.';
      }
      
      this.showFeedback = true;
      setTimeout(() => {
        this.showFeedback = false;
        this.newColorMatchingQuestion();
      }, 2000);
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
