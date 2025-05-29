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
     * Get a random chord type from available chords
     */
    getRandomChordType() {
      const chordTypes = Object.keys(this.chords);
      return chordTypes[Math.floor(Math.random() * chordTypes.length)];
    },
    
    /**
     * Get a random root note for chords
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
      this.playChord(chordType);
    },
    
    // Chord Building Activity Methods
    addNoteToChord(interval) {
      // Logic for adding notes to build chords
    },
    
    // Missing Note Activity Methods
    startMissingNoteActivity() {
      // Setup for the missing note activity
    },
    
    checkMissingNote(noteInterval) {
      // Check if the selected note completes the chord correctly
    },
    
    // Character Matching Activity Methods
    startCharacterMatching() {
      // Setup for matching characters to chord types
    },
    
    // Harmony Gardens Activity Methods
    plantChordInGarden(chordType) {
      // Add a chord to the garden composition
    }
  };
}
