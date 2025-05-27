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
    currentHighlightedNote: null, // For highlighting piano keys during playback
    longPressTimer: null,
    longPressThreshold: 800, // milliseconds for long press
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
      // Set up text-to-speech if available - with better debugging
      this.speechSynthesis = null;
      this.ttsAvailable = false;
      this.usingNativeAndroidTTS = false;  // Flag für native Android TTS
      
      // Überprüfe zuerst, ob die native Android TTS-Brücke verfügbar ist
      this.checkAndroidNativeTTS();
      
      // Fallback: Verzögerte Initialisierung der Web-Sprachsynthese für bessere Kompatibilität
      this.initSpeechSynthesis();
      
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
     * Start a long press timer for showing help text
     * @param {string} pattern - The pattern being long-pressed
     */
    startLongPress(pattern) {
      this.cancelLongPress(); // Clear any existing timer
      
      this.longPressTimer = setTimeout(() => {
        // Get the appropriate help text based on pattern and language
        const language = localStorage.getItem('lalumo_language') || 'en';
        const helpTexts = {
          up: { en: 'Going Up', de: 'Hoch' },
          down: { en: 'Going Down', de: 'Runter' },
          wave: { en: 'Wavy Pattern', de: 'Wellenform' },
          jump: { en: 'Jumping Notes', de: 'Springende Noten' }
        };
        
        const helpText = helpTexts[pattern][language];
        this.mascotMessage = helpText;
        
        // Also read out the help text using TTS
        if (window.speechSynthesis) {
          const speech = new SpeechSynthesisUtterance(helpText);
          speech.lang = language === 'de' ? 'de-DE' : 'en-US';
          window.speechSynthesis.speak(speech);
        }
      }, this.longPressThreshold);
    },
    
    /**
     * Cancel the long press timer
     */
    cancelLongPress() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
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
     * Initialisiert die Sprachsynthese mit verbesserten Fallback-Mechanismen
     * für bessere Kompatibilität mit verschiedenen Browsern und WebViews
     */
    initSpeechSynthesis() {
      console.log('Initializing speech synthesis...');
      
      // Erste Prüfung mit sofortiger Initialisierung
      if (window.speechSynthesis) {
        console.log('Speech synthesis API found, initializing...');
        this.speechSynthesis = window.speechSynthesis;
        this.ttsAvailable = true;
        
        // Test mit einer stillen Sprachausgabe
        try {
          const testUtterance = new SpeechSynthesisUtterance('');
          testUtterance.volume = 0; // Silent test
          testUtterance.onend = () => console.log('Silent test utterance completed successfully');
          testUtterance.onerror = (err) => console.error('Test utterance failed:', err);
          this.speechSynthesis.speak(testUtterance);
          console.log('Initial speech test started');
        } catch (error) {
          console.error('Speech synthesis test failed:', error);
        }
      } else {
        console.log('Speech synthesis API not found on initial check');
      }
      
      // Verzögerte Initialisierung für Browser, die die API erst später laden
      setTimeout(() => {
        if (!this.ttsAvailable && window.speechSynthesis) {
          console.log('Speech synthesis API found on delayed check, initializing...');
          this.speechSynthesis = window.speechSynthesis;
          this.ttsAvailable = true;
          
          // Test mit einer stillen Sprachausgabe
          try {
            const testUtterance = new SpeechSynthesisUtterance('');
            testUtterance.volume = 0;
            this.speechSynthesis.speak(testUtterance);
            console.log('Delayed speech test started');
          } catch (error) {
            console.error('Delayed speech test failed:', error);
          }
        }
      }, 2000);
      
      // Finale Prüfung nach längerer Verzögerung
      setTimeout(() => {
        if (!this.ttsAvailable && window.speechSynthesis) {
          console.log('Speech synthesis API found on final check, initializing...');
          this.speechSynthesis = window.speechSynthesis;
          this.ttsAvailable = true;
        }
        
        if (this.ttsAvailable) {
          console.log('Speech synthesis is now available');
        } else {
          console.log('Speech synthesis is not available after multiple attempts');
        }
      }, 5000);
    },
    
    /**
     * Check if the native Android TTS bridge is available
     */
    checkAndroidNativeTTS() {
      console.log('Checking for native Android TTS bridge');
      
      // Setup callback for Android TTS ready event
      window.androidTTSReady = (isReady) => {
        console.log('Native Android TTS ready callback received:', isReady);
        this.usingNativeAndroidTTS = !!isReady;
        this.ttsAvailable = !!isReady;
        
        if (isReady) {
          console.log('Native Android TTS is ready to use');
        }
      };
      
      // Setup callback for Android TTS results
      window.androidTTSCallback = (result) => {
        console.log('Android TTS speech result:', result);
      };
      
      // Check if the native Android TTS bridge is available
      if (window.AndroidTTS) {
        console.log('Native Android TTS bridge detected');
        
        try {
          // Get TTS status for diagnostics
          if (typeof window.AndroidTTS.getTTSStatus === 'function') {
            const status = window.AndroidTTS.getTTSStatus();
            console.log('Android TTS Status:', status);
          }
          
          // Check if TTS is available through the bridge
          if (typeof window.AndroidTTS.isTTSAvailable === 'function') {
            const ttsAvailable = window.AndroidTTS.isTTSAvailable();
            console.log('Android TTS available:', ttsAvailable);
            this.usingNativeAndroidTTS = ttsAvailable;
            this.ttsAvailable = ttsAvailable;
          }
        } catch (error) {
          console.error('Error checking Android TTS availability:', error);
        }
      } else {
        console.log('Native Android TTS bridge not detected');
      }
    },
    
    /**
     * Show a mascot message and speak it if text-to-speech is available
     */
    showMascotMessage(message) {
      this.mascotMessage = message;
      console.log('Showing mascot message:', message, 'TTS available:', this.ttsAvailable, 'Using native TTS:', this.usingNativeAndroidTTS);
      
      // Check if we can use the native Android TTS bridge
      if (this.usingNativeAndroidTTS && window.AndroidTTS) {
        try {
          console.log('Using native Android TTS bridge to speak:', message);
          window.AndroidTTS.speak(message);
        } catch (error) {
          console.error('Error using native Android TTS:', error);
          this.tryWebSpeechAPI(message);
        }
      } else {
        // Fallback to Web Speech API
        this.tryWebSpeechAPI(message);
      }
    },
    
    /**
     * Try to use Web Speech API for speech synthesis
     */
    tryWebSpeechAPI(message) {
      console.log('Trying Web Speech API fallback');
      
      // Use text-to-speech if available
      if (this.ttsAvailable && this.speechSynthesis) {
        try {
          // Cancel any ongoing speech
          this.speechSynthesis.cancel();
          
          // Create a new utterance
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 0.9; // Slightly slower for children
          utterance.pitch = 1.2; // Slightly higher pitch for friendly sound
          
          // Detailed logging for better diagnostics
          utterance.onstart = () => console.log('Speech started for:', message);
          utterance.onend = () => console.log('Speech ended for:', message);
          utterance.onerror = (event) => console.error('Speech error:', event);
          
          // Speak the message
          console.log('Speaking message with Web Speech API');
          this.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error using speech synthesis:', error);
          console.log('Speech failed completely');
        }
      } else {
        console.log('Cannot speak message, no TTS method available');
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
      // If already playing, stop the current sound first
      if (this.isPlaying) {
        this.stopCurrentSound();
      }
      
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
        
        // Schedule the next note and store the timeout ID
        this.soundTimeoutId = setTimeout(() => playNote(noteIndex + 1), 600);
      };
      
      // Start playing the sequence
      playNote(0);
      console.log('Started playing melody type:', type);
      
      // Reset animation and playing state after sequence completes
      // Use the sequence length to calculate total duration
      const resetTimeoutId = setTimeout(() => {
        this.isPlaying = false;
        this.currentAnimation = null;
        this.soundTimeoutId = null;
        console.log('Ready for next melody');
      }, noteArray.length * 600 + 300);
      
      // Store this timeout ID as well so it can be cleared if needed
      this.resetTimeoutId = resetTimeoutId;
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
      // First stop any currently playing melody
      this.stopCurrentSound();
      
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
     * Stop any currently playing sound
     */
    stopCurrentSound() {
      // Clear any scheduled note playback
      window.dispatchEvent(new CustomEvent('lalumo:stopallsounds', {}));
      
      // Reset animation and playing state
      this.isPlaying = false;
      this.currentAnimation = null;
      
      // Cancel any scheduled timeouts for animations or sounds
      if (this.soundTimeoutId) {
        clearTimeout(this.soundTimeoutId);
        this.soundTimeoutId = null;
      }
      
      // Also clear the reset timeout
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
      
      console.log('Stopped current sound');
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
        if (index >= notes.length) {
          // Reset highlighting when done
          setTimeout(() => {
            this.currentHighlightedNote = null;
          }, 300);
          return;
        }
        
        // Highlight current note
        this.currentHighlightedNote = notes[index];
        
        // Play current note
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: `pitch_${notes[index].toLowerCase()}` }
        }));
        
        // Schedule next note
        setTimeout(() => playMemory(notes, index + 1), 600);
      };
      
      // Start playing
      playMemory(this.currentSequence);
    },
    
    /**
     * Add a note to the user's sequence
     * @param {string} note - The note to add
     */
    addToSequence(note) {
      // Highlight the key when pressed
      this.currentHighlightedNote = note;
      
      this.userSequence.push(note);
      
      // Play the note using event
      window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
        detail: { note: `pitch_${note.toLowerCase()}` }
      }));
      
      // Remove highlighting after a short delay
      setTimeout(() => {
        this.currentHighlightedNote = null;
      }, 300);
      
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
