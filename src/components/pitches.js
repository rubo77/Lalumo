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
    
    /**
     * Initialize the component
     */
    init() {
      console.log('Pitches component initialized');
      // Start with listening mode by default
      this.setMode('listen');
    },
    
    /**
     * Set the current activity mode
     * @param {string} newMode - The mode to switch to
     */
    setMode(newMode) {
      this.mode = newMode;
      this.resetState();
      
      // Set up the specific mode
      switch(newMode) {
        case 'listen':
          this.setupListeningMode();
          break;
        case 'match':
          this.setupMatchingMode();
          break;
        case 'draw':
          this.setupDrawingMode();
          break;
        case 'guess':
          this.setupGuessingMode();
          break;
        case 'memory':
          this.setupMemoryMode();
          break;
      }
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
     * Setup for the listening mode
     */
    setupListeningMode() {
      // Define melodic sequences for different movements
      this.melodies = {
        up: ['C4', 'D4', 'E4', 'F4', 'G4'],
        down: ['G4', 'F4', 'E4', 'D4', 'C4'],
        wave: ['C4', 'E4', 'D4', 'F4', 'E4'],
        jump: ['C4', 'G4', 'E4', 'A4', 'F4']
      };
    },
    
    /**
     * Play a melodic sequence
     * @param {string} type - Type of sequence (up, down, wave, jump)
     */
    playSequence(type) {
      if (!this.melodies || !this.melodies[type]) return;
      
      this.currentAnimation = type;
      this.currentSequence = this.melodies[type];
      
      // Play each note in sequence with proper timing
      const noteArray = [...this.currentSequence]; // Create a copy to be safe
      
      // Play notes with timing
      const playNote = (noteIndex) => {
        if (noteIndex >= noteArray.length) return;
        
        // Get the current note
        const note = noteArray[noteIndex];
        
        // Try to play it through the app component
        try {
          window.dispatchEvent(new CustomEvent('musici:playnote', { 
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
      
      // Reset animation after sequence completes
      setTimeout(() => {
        this.currentAnimation = null;
      }, this.currentSequence.length * 600 + 200);
    },
    
    /**
     * Setup for the matching mode
     */
    setupMatchingMode() {
      // Prepare a random sequence and image choices
      const types = ['up', 'down', 'wave', 'jump'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      this.correctAnswer = randomType;
      this.playSequence(randomType);
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
      
      // Play feedback sound
      this.$root.playSound(isCorrect ? 'success' : 'try_again');
      
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
        window.dispatchEvent(new CustomEvent('musici:playnote', { 
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
    setupGuessingMode() {
      const options = [
        { type: 'up', next: 'up' },
        { type: 'down', next: 'down' },
        { type: 'wave', next: 'up' },
        { type: 'jump', next: 'down' }
      ];
      
      const selected = options[Math.floor(Math.random() * options.length)];
      this.currentSequence = this.melodies[selected.type].slice(0, 3); // First 3 notes only
      this.correctAnswer = selected.next;
      this.choices = ['up', 'down'];
      
      // Play the partial sequence
      const playPartial = (notes, index = 0) => {
        if (index >= notes.length) return;
        
        // Play current note
        window.dispatchEvent(new CustomEvent('musici:playnote', { 
          detail: { note: `pitch_${notes[index].toLowerCase()}` }
        }));
        
        // Schedule next note
        setTimeout(() => playPartial(notes, index + 1), 600);
      };
      
      // Start playing
      playPartial(this.currentSequence);
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
        window.dispatchEvent(new CustomEvent('musici:playnote', { 
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
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      const index = notes.indexOf(note);
      return index < notes.length - 1 ? notes[index + 1] : notes[notes.length - 1];
    },
    
    /**
     * Get a lower note than the provided note
     * @param {string} note - Current note
     * @returns {string} - Lower note
     */
    getLowerNote(note) {
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      const index = notes.indexOf(note);
      return index > 0 ? notes[index - 1] : notes[0];
    },
    
    /**
     * Setup for the memory mode
     */
    setupMemoryMode() {
      // Generate a simple sequence for memory exercise
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4'];
      this.currentSequence = [];
      
      // Generate a random sequence of 3-5 notes
      const length = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < length; i++) {
        this.currentSequence.push(notes[Math.floor(Math.random() * notes.length)]);
      }
      
      this.userSequence = [];
      
      // Play the sequence for the user to remember
      this.playMemorySequence();
    },
    
    /**
     * Play the memory sequence for the user
     */
    playMemorySequence() {
      // Play memory sequence with timing
      const playMemory = (notes, index = 0) => {
        if (index >= notes.length) return;
        
        // Play current note
        window.dispatchEvent(new CustomEvent('musici:playnote', { 
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
      window.dispatchEvent(new CustomEvent('musici:playnote', { 
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
      
      // Play feedback sound
      this.$root.playSound(isCorrect ? 'success' : 'try_again');
      
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
