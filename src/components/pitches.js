/**
 * Pitches component
 * Implements interactive pitch and melody learning for children
 */
export function pitches() {
  return {
    // State variables
    mode: 'listen', // listen, match, draw, guess, memory
    currentSequence: [],
    userSequence: [],
    currentAnimation: null,
    drawPath: [],
    correctAnswer: null,
    choices: [],
    feedback: '',
    showFeedback: false,
    mascotMessage: '',
    // Available notes for melodies
    availableNotes: [
      // C3 - B3 (Lower octave)
      'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
      // C4 - B4 (Middle octave)
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      // C5 - C6 (Upper octave)
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'
    ],
    // Progress tracking
    progress: {
      listen: 0,
      match: 0,
      draw: 0,
      guess: 0,
      memory: 0
    },
    
    /**
     * Initialize the component
     */
    init() {
      // Set up text-to-speech if available
      this.speechSynthesis = window.speechSynthesis;
      this.ttsAvailable = !!this.speechSynthesis;
      
      // Try to load saved progress from localStorage
      try {
        const savedProgress = localStorage.getItem('lalumo_progress');
        if (savedProgress) {
          this.progress = JSON.parse(savedProgress);
        }
      } catch (e) {
        console.log('Could not load saved progress');
      }
      
      // Listen for pitch mode changes from the menu
      window.addEventListener('set-pitch-mode', (e) => {
        console.log('Received pitch mode change event:', e.detail);
        this.setMode(e.detail);
      });
      
      // Set initial mode based on Alpine store
      if (this.$store.pitchMode) {
        this.mode = this.$store.pitchMode;
      } else {
        // Default to 'listen' and update the store
        this.$store.pitchMode = 'listen';
      }
      
      // Show welcome message with the mascot based on language preference
      setTimeout(() => {
        this.showContextMessage();
      }, 1000);
    },
    
    /**
     * Reset component state between mode changes
     */
    resetState() {
      // Reset state for clean mode switching
      this.currentAnimation = null;
      this.showFeedback = false;
      this.feedback = '';
      this.isPlaying = false;
      
      console.log('MODSWITCH: State reset completed');
    },
    
    /**
     * Set the current activity mode
     * @param {string} newMode - The mode to switch to
     */
    setMode(newMode) {
      console.log('MODSWITCH: Changing mode from', this.mode, 'to', newMode);
      this.mode = newMode;
      this.resetState();
      
      // Store the current mode in Alpine.js store for menu highlighting
      if (window.Alpine && window.Alpine.store) {
        window.Alpine.store('pitchMode', newMode);
      }
      
      // Setup the new mode without playing any sounds
      if (newMode === 'listen') {
        // For listen mode, just show instructions
      } else if (newMode === 'match') {
        this.setupMatchingMode(false); // Setup without playing sound
      } else if (newMode === 'draw') {
        this.setupDrawingMode(); // Drawing doesn't play sound by default
      } else if (newMode === 'guess') {
        this.setupGuessingMode(false); // Setup without playing sound
      } else if (newMode === 'memory') {
        this.setupMemoryMode(false); // Setup without playing sound
      }
      
      // Always show the mascot message for the current mode
      this.showContextMessage(); // Use our context-aware message function
      
      // Update progress tracking
      this.updateProgressGarden();
    },
    
    /**
     * Reset state variables for clean mode switching
     */
    resetState() {
      this.currentSequence = [];
      this.userSequence = [];
      this.drawPath = [];
      this.correctAnswer = null;
      this.choices = [];
      this.feedback = '';
      this.showFeedback = false;
    },
    
    /**
     * Show a mascot message that's context-aware based on current activity
     */
    showContextMessage() {
      let message = '';
      const language = localStorage.getItem('lalumo_language') || 'english';
      
      // Provide context-specific instructions based on current mode
      if (this.mode === 'listen') {
        message = language === 'german' ? 
          'Klicke auf jedes Bild, um zu hören, wie diese Melodie klingt!' : 
          'Click on each picture to hear what that melody sounds like!';
      } else if (this.mode === 'match') {
        message = language === 'german' ? 
          'Höre dir die Melodie an und tippe auf das passende Bild!' : 
          'Listen to the melody and tap the matching picture!';
      } else if (this.mode === 'draw') {
        message = language === 'german' ? 
          'Zeichne eine Linie mit deinem Finger oder der Maus, um eine Melodie zu erstellen!' : 
          'Draw a line with your finger or mouse to create a melody!';
      } else if (this.mode === 'guess') {
        message = language === 'german' ? 
          'Höre dir die Melodie an und rate, ob der nächste Ton höher oder tiefer ist!' : 
          'Listen to the melody and guess if the next note goes up or down!';
      } else if (this.mode === 'memory') {
        message = language === 'german' ? 
          'Höre dir die Melodie an und tippe dann auf die farbigen Knöpfe in der gleichen Reihenfolge!' : 
          'Listen to the melody, then tap the colored buttons in the same order!';
      }
      
      // Show the message using the existing function
      this.showMascotMessage(message);
    },
    
    /**
     * Show a mascot message and speak it if text-to-speech is available
     */
    showMascotMessage(message) {
      this.mascotMessage = message;
      
      // Use text-to-speech if available
      if (this.ttsAvailable) {
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9; // Slightly slower for children
        utterance.pitch = 1.2; // Slightly higher pitch for friendly sound
        
        // Speak the message
        this.speechSynthesis.speak(utterance);
      }
    },
    
    /**
     * Update the progress garden based on user's progress
     */
    updateProgressGarden() {
      // Calculate total progress (0-100%)
      const totalProgress = Object.values(this.progress).reduce((sum, val) => sum + val, 0) / 5;
      
      // Store progress in localStorage for persistence
      localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
    },
    
    /**
     * Setup for the listening mode
     */
    setupListeningMode() {
      // All patterns (up, down, wave, jump) will be generated on-demand when buttons are clicked
      console.log('Listening mode ready with', this.availableNotes.length, 'available notes');
    },
    
    /**
     * Generate an ascending melody starting from a random note
     * @returns {Array} The generated pattern
     */
    generateUpPattern() {
      // Pick a random starting position that allows room for 4 more notes going up
      const maxStartIndex = this.availableNotes.length - 5;
      const startIndex = Math.floor(Math.random() * maxStartIndex);
      
      // Create a 5-note ascending pattern from this starting position
      const pattern = [];
      for (let i = 0; i < 5; i++) {
        pattern.push(this.availableNotes[startIndex + i]);
      }
      
      return pattern;
    },
    
    /**
     * Generate a descending melody starting from a random note
     * @returns {Array} The generated pattern
     */
    generateDownPattern() {
      // Pick a random starting position that allows room for 4 more notes going down
      const minStartIndex = 4; // Need at least 4 notes below it
      const startIndex = minStartIndex + Math.floor(Math.random() * (this.availableNotes.length - minStartIndex));
      
      // Create a 5-note descending pattern from this starting position
      const pattern = [];
      for (let i = 0; i < 5; i++) {
        pattern.push(this.availableNotes[startIndex - i]);
      }
      
      return pattern;
    },
    
    /**
     * Generate a wavy pattern with only two alternating notes
     * @returns {Array} The generated pattern
     */
    generateWavyPattern() {
      // Pick a random starting note from the available range (avoid the highest notes)
      const randomStartIndex = Math.floor(Math.random() * (this.availableNotes.length - 5));
      const firstNote = this.availableNotes[randomStartIndex];
      
      // For the second note, pick one that's 1-3 steps away (up or down)
      let interval = Math.floor(Math.random() * 3) + 1; // 1-3 steps
      
      // Randomly decide if we go up or down for the second note
      if (Math.random() > 0.5) {
        interval = -interval;  // Go down instead of up
      }
      
      // Ensure we stay within bounds
      const secondNoteIndex = Math.max(0, Math.min(this.availableNotes.length - 1, randomStartIndex + interval));
      const secondNote = this.availableNotes[secondNoteIndex];
      
      // Create the pattern by alternating between the two notes (5 notes total)
      return [firstNote, secondNote, firstNote, secondNote, firstNote];
    },
    
    /**
     * Generate a random jumpy pattern with unpredictable jumps
     * @returns {Array} The generated pattern
     */
    generateJumpyPattern() {
      const pattern = [];
      let lastIndex = -1;
      
      // Create 5 random jumpy notes
      for (let i = 0; i < 5; i++) {
        let newIndex;
        
        // Make sure we don't get the same note twice in a row and ensure a big jump
        do {
          newIndex = Math.floor(Math.random() * this.availableNotes.length);
          
          // If not the first note, ensure it's at least 3 steps away from the previous note for bigger jumps
          if (lastIndex !== -1 && Math.abs(newIndex - lastIndex) < 3) {
            continue;
          }
          
          break;
        } while (true);
        
        pattern.push(this.availableNotes[newIndex]);
        lastIndex = newIndex;
      }
      
      return pattern;
    },
    
    /**
     * Play a specific melodic sequence
     */
    playSequence(type) {
      // Only one animation at a time
      if (this.isPlaying) return;
      
      this.currentAnimation = type;
      this.isPlaying = true;
      
      // Generate the requested pattern on demand - ensures fresh melodies each time
      let pattern;
      if (type === 'up') {
        pattern = this.generateUpPattern();
      } else if (type === 'down') {
        pattern = this.generateDownPattern();
      } else if (type === 'wave') {
        pattern = this.generateWavyPattern();
      } else if (type === 'jump') {
        pattern = this.generateJumpyPattern();
      } else {
        return; // Invalid type
      }
      
      // Store the pattern for reference and play each note in sequence
      this.currentSequence = pattern;
      const noteArray = [...pattern]; // Create a copy to be safe
      
      // Play notes with timing
      const playNote = (noteIndex) => {
        if (noteIndex >= noteArray.length) {
          return;  // Done with all notes
        }
        
        // Get the current note
        const note = noteArray[noteIndex];
        
        // Try to play it through the app component
        try {
          window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
            detail: { note: `pitch_${note.toLowerCase()}` }
          }));
        } catch (err) {
          console.error('Error playing note:', err);
        }
        
        // Schedule the next note
        setTimeout(() => playNote(noteIndex + 1), 600);
      };
      
      // Start playing the sequence
      playNote(0);
      console.log('Started playing melody type:', type);
      
      // Reset animation and playing state after sequence completes
      // Use the sequence length to calculate total duration
      setTimeout(() => {
        this.isPlaying = false;
        this.currentAnimation = null;
        console.log('Ready for next melody');
      }, noteArray.length * 600 + 300);
    },
    
    /**
     * Setup for the matching mode
     */
    setupMatchingMode(playSound = false) {
      // Prepare a random sequence and image choices
      const types = ['up', 'down', 'wave', 'jump'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      this.correctAnswer = randomType;
      
      // Only play the sound if explicitly requested
      if (playSound) {
        this.playSequence(randomType);
      }
    },
    
    /**
     * Check if the user selected the correct image
     * @param {string} selected - User's selection
     */
    checkMatch(selected) {
      const isCorrect = selected === this.correctAnswer;
      
      this.showFeedback = true;
      this.feedback = isCorrect ? 
        'Great job! That\'s correct!' : 
        'Not quite. Let\'s try again!';
      
      // Play feedback sound using the event system instead of direct method call
      window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
        detail: { note: isCorrect ? 'success' : 'try_again' }
      }));
      
      // Reset after feedback
      setTimeout(() => {
        this.showFeedback = false;
        if (isCorrect) {
          // Generate a new matching challenge
          this.setupMatchingMode();
        }
      }, 2000);
    },
    
    /**
     * Setup for the drawing mode
     */
    setupDrawingMode() {
      this.drawPath = [];
    },
    
    /**
     * Handle start of drawing
     * @param {Event} e - Mouse/touch event
     */
    startDrawing(e) {
      // Reset path
      this.drawPath = [];
      this.addPointToPath(e);
    },
    
    /**
     * Handle drawing movement
     * @param {Event} e - Mouse/touch event
     */
    draw(e) {
      if (this.drawPath.length === 0) return;
      this.addPointToPath(e);
    },
    
    /**
     * Add a point to the drawing path
     * @param {Event} e - Mouse/touch event
     */
    addPointToPath(e) {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.drawPath.push({ x, y });
    },
    
    /**
     * End drawing and play the resulting melody
     */
    endDrawing() {
      if (this.drawPath.length === 0) return;
      
      // Convert drawing to melody
      this.playDrawnMelody();
    },
    
    /**
     * Play a melody based on the drawn path
     */
    playDrawnMelody() {
      if (this.drawPath.length === 0) return;
      
      const canvas = document.querySelector('.drawing-canvas');
      const height = canvas.height;
      
      // Sample points from the path to create a melody
      const sampleSize = Math.min(8, this.drawPath.length);
      const step = Math.floor(this.drawPath.length / sampleSize);
      
      const sampledPoints = [];
      for (let i = 0; i < sampleSize; i++) {
        sampledPoints.push(this.drawPath[i * step]);
      }
      
      // Map y-positions to notes (higher position = higher pitch)
      const notes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
      
      const sequence = sampledPoints.map(point => {
        // Invert Y coordinate (0 is top in canvas)
        const relativeHeight = 1 - (point.y / height);
        const noteIndex = Math.floor(relativeHeight * notes.length);
        return notes[Math.min(noteIndex, notes.length - 1)];
      });
      
      // Play sequence with proper timing
      const playSequentially = (notes, index = 0) => {
        if (index >= notes.length) return;
        
        // Play current note
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: `pitch_${notes[index].toLowerCase()}` }
        }));
        
        // Schedule next note
        setTimeout(() => playSequentially(notes, index + 1), 300);
      };
      
      // Start playing
      playSequentially(sequence);
    },
    
    /**
     * Setup for the guessing mode
     */
    setupGuessingMode(playSound = false) {
      // Define possible sequence types and their expected next note direction
      const options = [
        { type: 'up', next: 'up', generator: this.generateUpPattern.bind(this) },
        { type: 'down', next: 'down', generator: this.generateDownPattern.bind(this) },
        { type: 'wave', next: 'up', generator: this.generateWavyPattern.bind(this) },
        { type: 'jump', next: 'down', generator: this.generateJumpyPattern.bind(this) }
      ];
      
      // Select a random pattern type
      const selected = options[Math.floor(Math.random() * options.length)];
      
      // Generate a sequence for the selected pattern type
      const fullSequence = selected.generator();
      
      // Only use the first 3 notes for the guessing game
      this.currentSequence = fullSequence.slice(0, 3);
      this.correctAnswer = selected.next;
      this.choices = ['up', 'down'];
      
      // Play the partial sequence
      const playPartial = (notes, index = 0) => {
        if (index >= notes.length) return;
        
        // Play current note
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: `pitch_${notes[index].toLowerCase()}` }
        }));
        
        // Schedule next note
        setTimeout(() => playPartial(notes, index + 1), 600);
      };
      
      // Only play sound if explicitly requested
      if (playSound) {
        playPartial(this.currentSequence);
      }
    },
    
    /**
     * Check the user's guess for the next note
     * @param {string} guess - User's guess (up or down)
     */
    checkGuess(guess) {
      const isCorrect = guess === this.correctAnswer;
      
      this.showFeedback = true;
      this.feedback = isCorrect ? 
        'Great job! You guessed it!' : 
        'Not quite. Let\'s try another one!';
      
      // Play the full sequence including the correct next note
      const fullSequence = [...this.currentSequence];
      if (this.correctAnswer === 'up') {
        fullSequence.push(this.getHigherNote(fullSequence[fullSequence.length - 1]));
      } else {
        fullSequence.push(this.getLowerNote(fullSequence[fullSequence.length - 1]));
      }
      
      // Play the full sequence with the correct answer
      const playFull = (notes, index = 0) => {
        if (index >= notes.length) return;
        
        // Play current note
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: `pitch_${notes[index].toLowerCase()}` }
        }));
        
        // Schedule next note
        setTimeout(() => playFull(notes, index + 1), 600);
      };
      
      // Start playing
      playFull(fullSequence);
      
      // Reset after feedback
      setTimeout(() => {
        this.showFeedback = false;
        this.setupGuessingMode(); // Generate a new guessing challenge
      }, 3000);
    },
    
    /**
     * Get a higher note than the provided note
     * @param {string} note - Current note
     * @returns {string} - Higher note
     */
    getHigherNote(note) {
      const index = this.availableNotes.indexOf(note);
      if (index === -1) return this.availableNotes[Math.floor(this.availableNotes.length / 2)]; // Return middle note if not found
      return index < this.availableNotes.length - 1 ? this.availableNotes[index + 1] : this.availableNotes[this.availableNotes.length - 1];
    },
    
    /**
     * Get a lower note than the provided note
     * @param {string} note - Current note
     * @returns {string} - Lower note
     */
    getLowerNote(note) {
      const index = this.availableNotes.indexOf(note);
      if (index === -1) return this.availableNotes[Math.floor(this.availableNotes.length / 2)]; // Return middle note if not found
      return index > 0 ? this.availableNotes[index - 1] : this.availableNotes[0];
    },
    
    /**
     * Setup for the memory mode
     */
    setupMemoryMode(playSound = false) {
      // Use the specific C, D, E, F, G notes for the memory game
      const fixedNotes = ['C4', 'D4', 'E4', 'F4', 'G4'];
      this.currentSequence = [];
      
      // Generate a random sequence of 3-5 notes
      const length = Math.floor(Math.random() * 3) + 3; // 3 to 5 notes
      for (let i = 0; i < length; i++) {
        this.currentSequence.push(fixedNotes[Math.floor(Math.random() * fixedNotes.length)]);
      }
      
      this.userSequence = [];
      
      // Play the sequence only if explicitly requested
      if (playSound) {
        this.playMemorySequence();
      }
    },
    
    /**
     * Play the memory sequence for the user
     */
    playMemorySequence() {
      // Play memory sequence with timing
      const playMemory = (notes, index = 0) => {
        if (index >= notes.length) return;
        
        // Play current note
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: `pitch_${notes[index].toLowerCase()}` }
        }));
        
        // Schedule next note
        setTimeout(() => playMemory(notes, index + 1), 700);
      };
      
      // Start playing
      playMemory(this.currentSequence);
    },
    
    /**
     * Add a note to the user's sequence attempt
     * @param {string} note - Note selected by user
     */
    addToSequence(note) {
      this.userSequence.push(note);
      
      // Play the note using event
      window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
        detail: { note: `pitch_${note.toLowerCase()}` }
      }));
      
      // Check if the sequence is complete
      if (this.userSequence.length === this.currentSequence.length) {
        this.checkMemorySequence();
      }
    },
    
    /**
     * Check if the user's sequence matches the original
     */
    checkMemorySequence() {
      let isCorrect = true;
      
      for (let i = 0; i < this.currentSequence.length; i++) {
        if (this.currentSequence[i] !== this.userSequence[i]) {
          isCorrect = false;
          break;
        }
      }
      
      this.showFeedback = true;
      this.feedback = isCorrect ? 
        'Amazing memory! You got it right!' : 
        'Let\'s try again. Listen carefully!';
      
      // Play feedback sound using the event system
      window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
        detail: { note: isCorrect ? 'success' : 'try_again' }
      }));
      
      // Reset after feedback
      setTimeout(() => {
        this.showFeedback = false;
        if (isCorrect) {
          // Generate a new memory challenge
          this.setupMemoryMode();
        } else {
          // Reset user sequence and replay the current sequence
          this.userSequence = [];
          this.playMemorySequence();
        }
      }, 2000);
    }
  };
}
