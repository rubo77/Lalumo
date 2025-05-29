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
      
      // Add a global event listener for the home button
      document.addEventListener('lalumo:go-home', () => {
        console.log('Home button pressed via custom event');
        this.setMode('main');
      });
      
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
     * Enhanced multi-touch long press handler
     * Allows long press to work with any finger, not just the first one
     */
    startMultiTouchLongPress(pattern, event) {
      // Clear any existing timer
      this.cancelLongPress();
      
      // No need to prevent default or stop propagation
      // This allows second finger touches to work
      
      // Log the long press start
      console.log('TOUCH: Starting multi-touch long press for pattern:', pattern);
      
      // Start the long press timer
      this.longPressTimer = setTimeout(() => {
        // Get the appropriate help text based on pattern and language
        const languageSetting = localStorage.getItem('lalumo_language') || 'english';
        const language = languageSetting === 'german' ? 'de' : 'en';
        
        // Define fallback text if no pattern text is found
        let helpText = '';
        
        // Define help texts for all patterns
        const helpTexts = {
          up: { en: 'Up', de: 'Hoch' },
          down: { en: 'Down', de: 'Runter' },
          wave: { en: 'Wavy', de: 'Wellen' },
          jump: { en: 'Random', de: 'Zufall' }
        };
        
        // Normalize pattern name (lowercase, remove spaces)
        const normalizedPattern = String(pattern).toLowerCase().trim();
        
        // Check if the pattern exists
        if (helpTexts[normalizedPattern]) {
          // If yes, get the corresponding text in the desired language or English as fallback
          helpText = helpTexts[normalizedPattern][language] || helpTexts[normalizedPattern]['en'];
        } else {
          // Fallback if pattern not found
          helpText = language === 'de' ? 'Melodie abspielen' : 'Play melody';
          console.warn(`Pattern '${pattern}' not defined in helpTexts. Using fallback text.`);
        }
        
        // Always set the message, even if fallback is used
        this.mascotMessage = helpText;
        console.log('TOUCH: Showing mascot message:', helpText);
        
        // Use TTS if available
        try {
          // Try native Android TTS first
          if (window.AndroidTTS) {
            window.AndroidTTS.speak(helpText);
            console.log('Using Android TTS');
          } 
          // Fallback to Web Speech API
          else if (window.speechSynthesis) {
            const speech = new SpeechSynthesisUtterance(helpText);
            speech.lang = language === 'de' ? 'de-DE' : 'en-US';
            window.speechSynthesis.speak(speech);
            console.log('Using Web Speech API');
          }
        } catch (error) {
          console.error('TTS error:', error);
        }
      }, this.longPressThreshold);
    },
    
    /**
     * Start a long press timer for showing help text
     * @param {string} pattern - The pattern being long-pressed
     */
    startLongPress(pattern, event) {
      // This function is kept for compatibility with mouse events
      // For touch events, we now use startMultiTouchLongPress
      
      this.cancelLongPress(); // Clear any existing timer
      
      // Debug log to see which pattern is passed
      console.log('Starting long press for pattern:', pattern, 'event type:', event ? event.type : 'none');
      
      this.longPressTimer = setTimeout(() => {
        // Get the appropriate help text based on pattern and language
        const languageSetting = localStorage.getItem('lalumo_language') || 'english';
        console.log('Current language setting:', languageSetting);
        
        // Konvertiere die Spracheinstellung zu Sprachcodes für die Hilfstexte
        const language = languageSetting === 'german' ? 'de' : 'en';
        
        // Definiere einen Fallback-Text, falls kein Pattern-Text gefunden wird
        let helpText = '';
        
        // Hilfstexte für alle Patterns definieren
        const helpTexts = {
          up: { en: 'Up', de: 'Hoch' },
          down: { en: 'Down', de: 'Runter' },
          wave: { en: 'Wavy', de: 'Wellen' },
          jump: { en: 'Random', de: 'Zufall' }
        };
        
        // Pattern-Namen normalisieren (Kleinbuchstaben, Leerzeichen entfernen)
        const normalizedPattern = String(pattern).toLowerCase().trim();
        
        // Prüfen, ob das Pattern existiert
        if (helpTexts[normalizedPattern]) {
          // Wenn ja, den entsprechenden Text in der gewünschten Sprache oder English als Fallback holen
          helpText = helpTexts[normalizedPattern][language] || helpTexts[normalizedPattern]['en'];
        } else {
          // Fallback, wenn das Pattern nicht gefunden wurde
          helpText = language === 'de' ? 'Melodie abspielen' : 'Play melody';
          console.warn(`Pattern '${pattern}' nicht in helpTexts definiert. Verwende Fallback-Text.`);
        }
        
        // Setze immer die Nachricht, auch wenn ein Fallback verwendet wird
        this.mascotMessage = helpText;
        console.log('Mascot message set to:', helpText);
        
        // TTS verwenden, wenn verfügbar
        try {
          // Native Android TTS zuerst versuchen
          if (window.AndroidTTS) {
            window.AndroidTTS.speak(helpText);
            console.log('Using Android TTS');
          } 
          // Fallback auf Web Speech API
          else if (window.speechSynthesis) {
            const speech = new SpeechSynthesisUtterance(helpText);
            speech.lang = language === 'de' ? 'de-DE' : 'en-US';
            window.speechSynthesis.speak(speech);
            console.log('Using Web Speech API');
          }
        } catch (error) {
          console.error('TTS error:', error);
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
      if (newMode === 'main') {
        // This is the landing page with clickable image, no additional setup needed
        console.log('Showing main selection screen with clickable image');
      } else if (newMode === 'listen') {
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
      // Einfacher Ansatz: Wähle einen Zufallswert zwischen 0 und 16
      const startIndex = Math.floor(Math.random() * 15); // 0-14
      
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
      // Verwende einen höheren Startindex, um sicherzustellen, dass genug Platz nach unten ist
      const startIndex = 11 + Math.floor(Math.random() * 10); // 11-20
      
      // Create a 5-note descending pattern from this starting position
      const pattern = [];
      
      // Log kompletten Tonbereich
      console.log('Available notes:', this.availableNotes.join(', '));
      console.log(`Starting down pattern at index ${startIndex}: ${this.availableNotes[startIndex]}`);
      
      for (let i = 0; i < 5; i++) {
        const noteIndex = Math.max(0, startIndex - i); // Stelle sicher, dass der Index nie negativ wird
        const note = this.availableNotes[noteIndex];
        pattern.push(note);
        console.log(`Down pattern note ${i+1}: Index ${noteIndex} -> ${note}`);
      }
      
      // Debug-Ausgabe der gesamten Melodie
      console.log('Down pattern complete:', pattern.join(', '));
      
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
    /**
     * Animiert ein Muster-Element (Rakete, Rutsche, usw.) während die Melodie abgespielt wird
     * Extrahiert, um Codeduplizierung zu vermeiden und an mehreren Stellen verwendbar zu sein
     * @param {string} elementType - Typ des zu animierenden Elements ('up', 'down', 'wave', 'jump')
     * @param {boolean} inMatchMode - Gibt an, ob die Animation im Match-Modus verwendet wird
     */
    /**
     * Spielt eine Sequenz von Noten mit Timing ab
     * @param {Array} noteArray - Array mit Noten, die abgespielt werden sollen
     * @param {number} index - Aktuelle Position im Array
     */
    playNoteSequence(noteArray, index) {
      if (index >= noteArray.length) {
        // Am Ende der Sequenz angekommen, Wiedergabe beenden
        this.isPlaying = false;
        this.currentAnimation = null;
        return;
      }
      
      // Audio-Wiedergabe verbessern, um Konflikte zu vermeiden
      // Aktuelle Note abspielen
      const note = noteArray[index];
      
      // Für Debug-Zwecke die abgespielte Note protokollieren
      console.log(`Playing note ${index+1}/${noteArray.length}: ${note}`);
      
      try {
        // Event-Verarbeitung durch klare ID verbessern
        const uniqueId = Date.now() + '-' + index;
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { 
            note: `pitch_${note.toLowerCase()}`,
            id: uniqueId, // Eindeutige ID zur Unterscheidung paralleler Events
            sequenceIndex: index // Position in der Sequenz
          }
        }));
      } catch (err) {
        console.error('Error playing note:', err);
      }
      
      // Etwas längere Pause zwischen den Noten für bessere Unterscheidbarkeit
      // Nächste Note mit Verzögerung abspielen
      setTimeout(() => {
        this.playNoteSequence(noteArray, index + 1);
      }, 750); // 750ms zwischen den Noten für klarere Trennung
    },
    
    /**
     * Animiert ein Muster-Element (Rakete, Rutsche, usw.) während die Melodie abgespielt wird
     * Extrahiert, um Codeduplizierung zu vermeiden und an mehreren Stellen verwendbar zu sein
     * @param {string} elementType - Typ des zu animierenden Elements ('up', 'down', 'wave', 'jump')
     */
    animatePatternElement(elementType) {
      console.log('ANIM: Animating element type:', elementType);
      
      // Animations-Klassen basierend auf dem Element-Typ
      const animationClasses = {
        up: 'animate-up',
        down: 'animate-down',
        wave: 'animate-wave',
        jump: 'animate-jump'
      };
      
      // Animationsklasse hinzufügen
      const elementClass = `.pitch-icon.${elementType}`;
      const elements = document.querySelectorAll(elementClass);
      
      // Also apply animation to the parent card (especially for Android)
      const cardClass = `.pitch-card:has(.pitch-icon.${elementType})`;
      const cards = document.querySelectorAll(cardClass);
      
      // If no elements found using traditional selector, try direct card selection
      if (elements.length === 0) {
        console.log('ANIM: No icon elements found, trying alternate selectors');
        const altCards = document.querySelectorAll(`.pitch-card`);
        altCards.forEach(card => {
          if (card.querySelector(`.${elementType}`) || 
              card.textContent.toLowerCase().includes(elementType.toLowerCase())) {
            console.log('ANIM: Found card via alternate selector');
            card.classList.add('active');
            setTimeout(() => card.classList.remove('active'), 2000);
          }
        });
      }
      
      // Apply animation to cards (for Android compatibility)
      cards.forEach(card => {
        console.log('ANIM: Animating card for', elementType);
        card.classList.add('active');
        
        // Enhanced animation for Android
        const isAndroid = /Android/.test(navigator.userAgent);
        if (isAndroid) {
          console.log('ANIM: Adding Android-specific animation');
          // Add more visible animation effect
          try {
            card.style.transition = 'all 0.5s ease';
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.8)';
            
            // Reset after animation
            setTimeout(() => {
              card.style.transform = '';
              card.style.boxShadow = '';
            }, 1800);
          } catch (err) {
            console.error('ANIM: Error applying Android animation:', err);
          }
        }
        
        setTimeout(() => {
          card.classList.remove('active');
        }, 2000);
      });
      
      // Apply original animation to icon elements
      elements.forEach(element => {
        console.log('ANIM: Animating icon for', elementType);
        // Alle bestehenden Animationsklassen entfernen
        element.classList.remove('animate-up', 'animate-down', 'animate-wave', 'animate-jump');
        // Passende Animationsklasse hinzufügen
        element.classList.add(animationClasses[elementType]);
        element.classList.add('active');
        
        // Animation nach kurzer Zeit wieder entfernen
        setTimeout(() => {
          element.classList.remove(animationClasses[elementType]);
          element.classList.remove('active');
        }, 2000); // Longer animation duration for better visibility
      });
    },
    
    /**
     * Global multi-touch registry to track all active touches
     */
    setupMultiTouchHandling() {
      if (this.multiTouchHandlingSetup) return;
      
      console.log('TOUCH: Setting up global multi-touch handling');
      
      // Track all touches globally
      this.activeTouches = {};
      
      // Create a global touch start handler
      document.addEventListener('touchstart', (e) => {
        // Don't prevent default globally - this would block all touches
        // Instead just track the touches
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          this.activeTouches[touch.identifier] = {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            target: touch.target,
            timestamp: Date.now()
          };
        }
        console.log(`TOUCH: ${Object.keys(this.activeTouches).length} active touches`);
      }, {passive: true});
      
      // Clean up touches when they end
      document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          delete this.activeTouches[touch.identifier];
        }
      }, {passive: true});
      
      // Also clean up on cancel
      document.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          delete this.activeTouches[touch.identifier];
        }
      }, {passive: true});
      
      this.multiTouchHandlingSetup = true;
    },
    
    /**
     * Handle touch start events with multi-touch support
     * Enhanced to allow second finger touches to work
     */
    handleTouchStart(pattern, event) {
      // Setup multi-touch handling if not done already
      this.setupMultiTouchHandling();
      
      // IMPORTANT: Don't prevent default or stop propagation here
      // This allows second finger touches to work
      
      console.log(`TOUCH: Touch on ${pattern} pattern, touches:`, event.touches.length);
      
      // Directly trigger the pattern playback regardless of how many touches
      if (!this.isPlaying) {
        console.log(`TOUCH: Playing ${pattern} from touch handler`);
        this.playSequence(pattern);
      }
      
      // Start long press (modified to handle multi-touch better)
      this.startMultiTouchLongPress(pattern, event);
    },
    
    /**
     * Play a sequence of notes based on the selected pattern
     * Completely rewritten for better Android Chrome support
     * @param {string} type - Type of pattern ('up', 'down', 'wave', 'jump')
     */
    playSequence(type) {
      // Enhanced logging for diagnosis
      console.log('AUDIO: Sequence play requested for type:', type, 'User Agent:', navigator.userAgent);
      
      // If already playing, stop the current sound first
      if (this.isPlaying) {
        this.stopCurrentSound();
      }
      
      // Start animation immediately regardless of audio status
      this.currentAnimation = type;
      this.isPlaying = true;
      
      // Get the card element and apply immediate visual feedback
      const cardSelector = `.pitch-card:has(.pitch-icon.${type})`;
      const card = document.querySelector(cardSelector);
      if (card) {
        // Add animation class
        card.classList.add('active');
        console.log('AUDIO: Added active class to card for animation');
      }
      
      // Set up variables for enhanced Android audio handling
      const isAndroid = /Android/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      const isAndroidChrome = isAndroid && isChrome;
      
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
        console.error('AUDIO: Invalid pattern type:', type);
        return; // Invalid type
      }
      
      // Store the pattern for reference and visualization
      this.currentSequence = pattern;
      const noteArray = [...pattern]; // Create a copy to be safe
      console.log('AUDIO: Will play sequence with notes:', noteArray.join(', '));
      
      // ALWAYS animate the pattern element for immediate visual feedback
      this.animatePatternElement(type);
      
      // For Android Chrome, ensure we have a good animation even if audio fails
      if (isAndroidChrome) {
        console.log('AUDIO: Android Chrome detected - applying enhanced handling');
        
        // Direct audio synthesis for Android Chrome
        this.playAndroidDirectAudio(noteArray, type);
        
        // Make sure animations persist long enough
        const animationDuration = noteArray.length * 600 + 500;
        setTimeout(() => {
          if (card) {
            card.classList.remove('active');
          }
          
          // Reset state after animation completes
          this.isPlaying = false;
          this.currentAnimation = null;
          console.log('AUDIO: Animation completed for Android');
        }, animationDuration);
        
        return; // Exit early, direct audio method will handle everything
      }
      
      // ======= STANDARD AUDIO PLAYBACK FOR NON-ANDROID DEVICES =======
      
      // Play notes with timing
      const playNote = (noteIndex) => {
        if (noteIndex >= noteArray.length) {
          return;  // Done with all notes
        }
        
        // Get the current note
        const note = noteArray[noteIndex];
        console.log(`AUDIO: Playing note ${note} (${noteIndex + 1}/${noteArray.length})`);
        
        // Try to play it through the app component
        try {
          window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
            detail: { 
              note: `pitch_${note.toLowerCase()}`,
              id: `sequence_${type}_${noteIndex}_${Date.now()}`
            }
          }));
          
          // Visual feedback for current note
          this.currentHighlightedNote = note.toLowerCase();
        } catch (err) {
          console.error('AUDIO: Error dispatching note event:', err);
        }
        
        // Schedule the next note and store the timeout ID
        this.soundTimeoutId = setTimeout(() => playNote(noteIndex + 1), 600);
      };
      
      // Start playing the sequence
      playNote(0);
      console.log('AUDIO: Started playing melody type:', type);
      
      // Reset animation and playing state after sequence completes
      const resetTimeoutId = setTimeout(() => {
        this.isPlaying = false;
        this.currentAnimation = null;
        this.soundTimeoutId = null;
        this.currentHighlightedNote = null;
        console.log('AUDIO: Finished playing melody, ready for next');
      }, noteArray.length * 600 + 300);
      
      // Store this timeout ID for cleanup
      this.resetTimeoutId = resetTimeoutId;
    },
    
    /**
     * Setup for the matching mode
     */
    setupMatchingMode(playSound = false, generateNew = true) {
      // Wenn generateNew = true, dann eine neue Melodie erstellen, ansonsten die aktuelle beibehalten
      if (generateNew) {
        // Prepare a random sequence and image choices
        const types = ['up', 'down', 'wave', 'jump'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.correctAnswer = randomType;
        
        // Generiere die passende Melodie für den ausgewählten Typ
        let pattern;
        if (randomType === 'up') {
          pattern = this.generateUpPattern();
        } else if (randomType === 'down') {
          pattern = this.generateDownPattern();
        } else if (randomType === 'wave') {
          pattern = this.generateWavyPattern();
        } else if (randomType === 'jump') {
          pattern = this.generateJumpyPattern();
        }
        
        // Speichere die generierte Melodie für späteres Wiederholen
        this.currentSequence = pattern;
        this.matchingPattern = pattern; // Speziell für den Match-Modus
      }
      
      // Only play the sound if explicitly requested
      if (playSound) {
        // Verwende die gespeicherte Melodie
        const pattern = this.matchingPattern || this.currentSequence;
        
        // Melodie abspielen ohne Animation des richtigen Elements
        this.isPlaying = true;
        
        // REMOVED: Animation of correct answer when play button is clicked
        // this.currentAnimation = this.correctAnswer;
        // this.animatePatternElement(this.correctAnswer);
        
        // Töne nacheinander abspielen
        const noteArray = [...pattern];
        this.playNoteSequence(noteArray, 0);
      }
    },
    
    /**
     * Check if the user selected the correct image
     * @param {string} selected - User's selection
     */
    checkMatch(selected) {
      // First stop any currently playing melody
      this.stopCurrentSound();
      
      // Die gewählte Animation anzeigen, unabhängig davon, ob richtig oder falsch
      this.animatePatternElement(selected);
      
      const isCorrect = selected === this.correctAnswer;
      
      this.showFeedback = true;
      this.feedback = isCorrect ? 
        'Great job! That\'s correct!' : 
        'Not quite. Let\'s try again!';
      
      // Trigger sound feedback
      window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
        detail: { note: isCorrect ? 'success' : 'try_again' }
      }));
      
      // Show appropriate animation based on result
      if (isCorrect) {
        // Create and show rainbow success animation
        const rainbow = document.createElement('div');
        rainbow.className = 'rainbow-success';
        document.body.appendChild(rainbow);
        
        // Remove rainbow element after animation completes
        setTimeout(() => {
          if (rainbow && rainbow.parentNode) {
            rainbow.parentNode.removeChild(rainbow);
          }
        }, 2500);
        
        // Update progress if correct
        this.progress.match += 1;
        
        // Save progress to localStorage
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
      } else {
        // Find the clicked element for potential error animation
        const clickedElement = document.querySelector(`.pitch-card .pitch-icon.${selected}`);
        
        if (clickedElement) {
          // Show shake animation on the clicked element
          clickedElement.classList.add('shake-error');
          setTimeout(() => {
            clickedElement.classList.remove('shake-error');
          }, 500);
        }
      }
      
      // Reset after showing feedback
      setTimeout(() => {
        this.showFeedback = false;
        
        // If correct answer, automatically progress to next melody after feedback
        if (isCorrect) {
          // Setup a new match automatically
          this.setupMatchingMode(true, true);
          console.log('Auto-progressed to next melody in match mode');
        }
        // Bei falscher Antwort wird keine neue Melodie generiert, damit der Spieler die gleiche Melodie noch einmal versuchen kann
      }, 2000);
    },
    
    /**
     * Stop any currently playing sound
     */
    stopCurrentSound() {
      // Cancel any pending timeouts
      if (this.soundTimeoutId) {
        clearTimeout(this.soundTimeoutId);
        this.soundTimeoutId = null;
      }
      
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
      
      // Stop animations and reset flags
      this.isPlaying = false;
      this.currentAnimation = null;
      
      // Remove active classes from all pitch cards
      const activeCards = document.querySelectorAll('.pitch-card.active');
      activeCards.forEach(card => card.classList.remove('active'));
      
      // Stop all active oscillators via global event
      window.dispatchEvent(new CustomEvent('lalumo:stopallsounds'));
      console.log('AUDIO: Stopped all sounds');
    },
    
    /**
     * Clear the current drawing and reset the canvas
     */
    clearDrawing() {
      // Reset path array
      this.drawPath = [];
      
      const canvas = document.querySelector('.drawing-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset any drawing state
        this.isDrawing = false;
        
        // Log for debugging
        console.log('Drawing cleared');
      } else {
        console.error('Could not find drawing canvas');
      }
    },
    
    /**
     * Direct audio synthesis for Android Chrome
     * Bypasses the standard event-based audio system
     * @param {Array} noteArray - Array of notes to play
     * @param {string} type - Type of pattern being played
     */
    playAndroidDirectAudio(noteArray, type) {
      console.log('AUDIO: Using direct Android audio synthesis for', noteArray.length, 'notes');
      
      // Create audio context specifically for this playback
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext({
          latencyHint: 'interactive',
          sampleRate: 44100
        });
        
        // Force resume the audio context immediately
        audioCtx.resume().then(() => {
          console.log('AUDIO: Android audio context resumed for direct playback');
          
          // Schedule all notes in advance
          this.scheduleAndroidNotes(audioCtx, noteArray, type);
        }).catch(err => {
          console.error('AUDIO: Failed to resume Android audio context:', err);
          
          // Even if audio fails, ensure animation plays correctly
          this.ensureAndroidAnimation(type, noteArray.length);
        });
      } catch (error) {
        console.error('AUDIO: Error creating Android audio context:', error);
        // Fall back to animation only
        this.ensureAndroidAnimation(type, noteArray.length);
      }
    },
    
    /**
     * Schedule all notes for direct Android audio playback
     */
    scheduleAndroidNotes(audioCtx, noteArray, type) {
      // Keep track of oscillators for cleanup
      const oscillators = [];
      
      // Schedule each note
      noteArray.forEach((note, index) => {
        // Calculate timing
        const startTime = audioCtx.currentTime + (index * 0.6); // 600ms per note
        
        // Create oscillator
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Get frequency from note name
        const frequency = this.getNoteFrequency(note);
        osc.frequency.value = frequency;
        osc.type = 'sine';
        
        // Configure gain (volume)
        gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.1); // 100ms attack
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.5); // 400ms release
        
        // Connect and schedule
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Start and stop
        osc.start(startTime);
        osc.stop(startTime + 0.6);
        
        // Keep track for cleanup
        oscillators.push(osc);
        
        // Log each note as it's scheduled
        console.log(`AUDIO: Scheduled Android note ${note} (${index + 1}/${noteArray.length}) at time ${startTime}`);
        
        // Schedule animation update for this note
        setTimeout(() => {
          // Highlight the current note in the UI
          this.currentHighlightedNote = note.toLowerCase();
          console.log(`AUDIO: Playing Android note ${note} (${index + 1}/${noteArray.length})`);
          
          // Refresh animation
          this.refreshAnimation(type);
        }, index * 600);
      });
      
      // Clean up after all notes are played
      const totalDuration = noteArray.length * 600 + 300;
      setTimeout(() => {
        // Stop any remaining oscillators
        oscillators.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {
            // Ignore errors from already stopped oscillators
          }
        });
        
        // Clean up context
        try {
          audioCtx.close();
        } catch (e) {
          console.error('AUDIO: Error closing Android audio context:', e);
        }
        
        console.log('AUDIO: Android direct audio playback completed');
      }, totalDuration);
    },
    
    /**
     * Get frequency for a note name
     */
    getNoteFrequency(noteName) {
      // Simple mapping for common notes (can be expanded)
      const noteFrequencies = {
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
        'C6': 1046.50
      };
      
      return noteFrequencies[noteName] || 440; // Default to A4 if note not found
    },
    
    /**
     * Ensure animation plays correctly on Android even if audio fails
     */
    ensureAndroidAnimation(type, noteCount) {
      console.log('AUDIO: Ensuring animation plays for Android pattern:', type);
      
      // Make sure animation is visible
      this.refreshAnimation(type);
      
      // Schedule animation updates to simulate note playing
      for (let i = 0; i < noteCount; i++) {
        setTimeout(() => {
          this.refreshAnimation(type);
        }, i * 600);
      }
    },
    
    /**
     * Refresh the animation for a pattern
     */
    refreshAnimation(type) {
      // Get all relevant elements
      const card = document.querySelector(`.pitch-card:has(.pitch-icon.${type})`);
      const icon = document.querySelector(`.pitch-icon.${type}`);
      
      if (card) {
        // Remove and re-add active class to trigger CSS animations
        card.classList.remove('active');
        setTimeout(() => card.classList.add('active'), 10);
      }
      
      if (icon) {
        // Apply a pulse effect
        icon.style.transform = 'scale(1.1)';
        setTimeout(() => {
          icon.style.transform = 'scale(1)';
        }, 300);
      }
    },
    
    setupDrawingMode() {
      this.drawPath = [];
    },
    
    /**
     * Handle start of drawing
     * @param {Event} e - Mouse/touch event
     */
    startDrawing(e) {
      e.preventDefault(); // Verhindert unbeabsichtigtes Verhalten auf Mobilgeräten
      
      // Reset path
      this.drawPath = [];
      
      // Hole den Canvas-Kontext zum Zeichnen
      const canvas = e.currentTarget;
      this.ctx = canvas.getContext('2d');
      
      // Setze Zeichenstil
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.strokeStyle = '#3498db'; // Blauer Strich
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      // Füge den ersten Punkt hinzu
      this.addPointToPath(e);
      
      // Beginne einen neuen Pfad
      this.ctx.beginPath();
      this.ctx.moveTo(this.drawPath[0].x, this.drawPath[0].y);
      
      // Speichere den Status, dass wir zeichnen
      this.isDrawing = true;
    },
    
    /**
     * Handle drawing movement
     * @param {Event} e - Mouse/touch event
     */
    draw(e) {
      e.preventDefault(); // Verhindert unbeabsichtigtes Verhalten auf Mobilgeräten
      
      if (!this.isDrawing || this.drawPath.length === 0) return;
      
      // Füge den aktuellen Punkt hinzu
      this.addPointToPath(e);
      
      // Zeichne den aktuellen Pfad
      const lastPoint = this.drawPath[this.drawPath.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
      this.ctx.stroke();
    },
    
    /**
     * Add a point to the drawing path
     * @param {Event} e - Mouse/touch event
     */
    addPointToPath(e) {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      
      // Behandle sowohl Touch- als auch Mausereignisse
      let clientX, clientY;
      
      if (e.type.startsWith('touch')) {
        // Touch-Event
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        // Maus-Event
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      // Berechne die Position relativ zum Canvas
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      this.drawPath.push({ x, y });
    },
    
    /**
     * End drawing and play the resulting melody
     */
    endDrawing(e) {
      if (e) {
        e.preventDefault(); // Verhindert unbeabsichtigtes Verhalten auf Mobilgeräten
      }
      
      // Zeichnung beenden
      this.isDrawing = false;
      
      if (this.drawPath.length === 0) return;
      
      // Zeichnen abschließen
      if (this.ctx) {
        this.ctx.closePath();
      }
      
      // Melodie aus der Zeichnung generieren und abspielen
      this.playDrawnMelody();
    },
    
    /**
     * Play a melody based on the drawn path
     */
    playDrawnMelody() {
      if (this.drawPath.length === 0) return;
      
      const canvas = document.querySelector('.drawing-canvas');
      const height = canvas.height;
      
      // Punkte aus dem Pfad samplen, um eine Melodie zu erzeugen
      const sampleSize = Math.min(8, this.drawPath.length);
      const step = Math.floor(this.drawPath.length / sampleSize);
      
      const sampledPoints = [];
      for (let i = 0; i < sampleSize; i++) {
        sampledPoints.push(this.drawPath[i * step]);
      }
      
      // Y-Positionen auf Noten abbilden (höhere Position = höherer Ton)
      const notes = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'];
      
      const sequence = sampledPoints.map(point => {
        // Y-Koordinate invertieren (0 ist oben im Canvas)
        const relativeHeight = 1 - (point.y / height);
        const noteIndex = Math.floor(relativeHeight * notes.length);
        return notes[Math.min(noteIndex, notes.length - 1)];
      });
      
      console.log('Playing drawn melody sequence:', sequence);
      
      // Visuelle Darstellung verbessern - farbige Punkte für gesampelte Stellen
      if (this.ctx) {
        sampledPoints.forEach((point, index) => {
          // Kreise an den gesampelten Punkten zeichnen
          this.ctx.fillStyle = '#e74c3c'; // Rote Punkte für die gesampelten Stellen
          this.ctx.beginPath();
          this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Optional: Notennamen dazuschreiben
          this.ctx.fillStyle = '#333';
          this.ctx.font = '10px Arial';
          this.ctx.fillText(sequence[index], point.x + 8, point.y - 8);
        });
      }
      
      // Sequenz mit korrektem Timing abspielen
      this.playDrawnNoteSequence(sequence.map(note => note.toLowerCase()), 0);
    },
    
    /**
     * Spielt eine Sequenz von Noten nacheinander ab
     * Diese Methode funktioniert zuverlässiger auf Android
     */
    playDrawnNoteSequence(notes, index = 0) {
      if (index >= notes.length) return;
      
      // Versuche zuerst native Android TTS (wenn verfügbar)
      const note = notes[index];
      const soundId = `pitch_${note}`;
      
      try {
        // Sound abspielen
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: soundId }
        }));
        
        console.log(`Playing note ${index + 1}/${notes.length}: ${note}`);
        
        // Nächste Note mit Verzögerung abspielen
        setTimeout(() => this.playDrawnNoteSequence(notes, index + 1), 300);
      } catch (error) {
        console.error('Error playing note in drawn melody:', error);
        // Trotz Fehler weitergehen
        setTimeout(() => this.playDrawnNoteSequence(notes, index + 1), 300);
      }
    },
    
    /**
     * Setup for the guessing mode
     * @param {boolean} playSound - Whether to play the melody
     * @param {boolean} generateNew - Whether to generate a new melody
     */
    setupGuessingMode(playSound = false, generateNew = true) {
      // Define possible sequence types and their expected next note direction
      const options = [
        { type: 'up', next: 'up', generator: this.generateUpPattern.bind(this) },
        { type: 'down', next: 'down', generator: this.generateDownPattern.bind(this) },
        { type: 'wave', next: 'up', generator: this.generateWavyPattern.bind(this) },
        { type: 'jump', next: 'down', generator: this.generateJumpyPattern.bind(this) }
      ];
      
      if (generateNew) {
        // Select a random pattern type
        const selected = options[Math.floor(Math.random() * options.length)];
        // Generate a sequence for the selected pattern type
        const fullSequence = selected.generator();
        // Only use the first 3 notes for the guessing game
        this.currentSequence = fullSequence.slice(0, 3);
        this.correctAnswer = selected.next;
        this.choices = ['up', 'down'];
      }
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
      
      // Find the clicked element for potential error animation
      const clickedElement = document.querySelector(`.guess-button[data-direction="${guess}"]`);
      
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
      
      // Show appropriate animation based on result
      if (isCorrect) {
        // Create and show rainbow success animation
        const rainbow = document.createElement('div');
        rainbow.className = 'rainbow-success';
        document.body.appendChild(rainbow);
        
        // Remove rainbow element after animation completes
        setTimeout(() => {
          if (rainbow && rainbow.parentNode) {
            rainbow.parentNode.removeChild(rainbow);
          }
        }, 2500);
      } else if (clickedElement) {
        // Show shake animation on the clicked element
        clickedElement.classList.add('shake-error');
        setTimeout(() => {
          clickedElement.classList.remove('shake-error');
        }, 500);
      }
      
      // Play the full sequence with the correct answer
      const playFull = (notes, index = 0) => {
        if (index >= notes.length) return;
        
        // Play current note
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: `pitch_${notes[index].toLowerCase()}` }
        }));
        
        // Schedule next note after a delay
        setTimeout(() => playFull(notes, index + 1), 600);
      };
      
      // Play the sequence
      playFull(fullSequence);
      
      // Play feedback sound
      window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
        detail: { note: isCorrect ? 'success' : 'try_again' }
      }));
      
      // Reset after feedback
      setTimeout(() => {
        this.showFeedback = false;
        
        if (isCorrect) {
          // Update progress tracking
          this.progress.guess += 1;
          localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
          
          // Generate a new sequence
          this.setupGuessingMode();
        } else {
          // Let them try again with the same sequence
          this.userSequence = [];
          // Call setupGuessingMode to replay the current sequence without generating a new one
          this.setupGuessingMode(true, false);
        }
      }, 2000);
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
     * @param {boolean} playSound - Whether to play the melody
     * @param {boolean} generateNew - Whether to generate a new melody
     */
    setupMemoryMode(playSound = false, generateNew = true) {
      // Use the specific C, D, E, G, A notes for the memory game (skipping F and H/B)
      const fixedNotes = ['C4', 'D4', 'E4', 'G4', 'A4'];
      
      // Initialize memory success count from localStorage or default to 0
      if (this.memorySuccessCount === undefined) {
        const savedLevel = localStorage.getItem('lalumo_memory_level');
        this.memorySuccessCount = savedLevel ? parseInt(savedLevel, 10) : 0;
      }
      
      if (generateNew) {
        this.currentSequence = [];
        // Determine sequence length based on success count
        let length;
        if (this.memorySuccessCount < 3) {
          length = 2; // First 3 successes: 2 notes
        } else if (this.memorySuccessCount < 6) {
          length = 3; // Next 3 successes: 3 notes
        } else if (this.memorySuccessCount < 11) {
          length = 4; // Next 5 successes: 4 notes
        } else if (this.memorySuccessCount < 16) {
          length = 5; // Next 5 successes: 5 notes
        } else {
          length = 6; // After 15 successes: 6 notes
        }
        
        console.log(`Memory game: Level ${this.memorySuccessCount + 1}, using ${length} notes`);
        
        // First note is fully random
        let lastNote = fixedNotes[Math.floor(Math.random() * fixedNotes.length)];
        this.currentSequence.push(lastNote);
        
        // Generate remaining notes ensuring no consecutive repetitions
        for (let i = 1; i < length; i++) {
          // Create a copy of fixedNotes without the last note used
          const availableNotes = fixedNotes.filter(note => note !== lastNote);
          
          // Select randomly from available notes
          lastNote = availableNotes[Math.floor(Math.random() * availableNotes.length)];
          this.currentSequence.push(lastNote);
        }
        
        this.userSequence = [];
      }
      
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
      
      // Get the current user input position
      const currentPosition = this.userSequence.length;
      
      // Check if the current note is correct before adding it
      const isCurrentNoteCorrect = note === this.currentSequence[currentPosition];
      
      // Add note to sequence
      this.userSequence.push(note);
      
      // Play the note using event
      window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
        detail: { note: `pitch_${note.toLowerCase()}` }
      }));
      
      // Remove highlighting after a short delay
      setTimeout(() => {
        this.currentHighlightedNote = null;
      }, 300);
      
      // If the note is incorrect, immediately give feedback
      if (!isCurrentNoteCorrect) {
        // Find the pressed key element for error animation
        const pressedKey = document.querySelector(`.piano-key[data-note='${note}']`);
        
        // Show shake animation on the pressed key
        if (pressedKey) {
          pressedKey.classList.add('shake-error');
          setTimeout(() => {
            pressedKey.classList.remove('shake-error');
          }, 500);
        }
        
        // Play error sound and show feedback
        window.dispatchEvent(new CustomEvent('lalumo:playnote', { 
          detail: { note: 'try_again' }
        }));
        
        this.showFeedback = true;
        this.feedback = 'Let\'s try again. Listen carefully!';
        
        // Reset after a delay
        setTimeout(() => {
          this.showFeedback = false;
          this.userSequence = [];
          this.playMemorySequence();
        }, 2000);
        
        return;
      }
      
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
      let lastPressedKey = null;
      
      // Find the last pressed key for potential error animation
      if (this.userSequence.length > 0) {
        lastPressedKey = document.querySelector(`.piano-key.${this.userSequence[this.userSequence.length-1].toLowerCase()}`);
      }
      
      // Check if sequence matches
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
      
      // Show appropriate animation based on result
      if (isCorrect) {
        // Create and show rainbow success animation
        const rainbow = document.createElement('div');
        rainbow.className = 'rainbow-success';
        document.body.appendChild(rainbow);
        
        // Remove rainbow element after animation completes
        setTimeout(() => {
          if (rainbow && rainbow.parentNode) {
            rainbow.parentNode.removeChild(rainbow);
          }
        }, 2000);
        
        // Increment and save memory game progress
        this.memorySuccessCount = (this.memorySuccessCount || 0) + 1;
        this.progress.memory = Math.max(this.memorySuccessCount, this.progress.memory || 0);
        localStorage.setItem('lalumo_memory_level', this.memorySuccessCount.toString());
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
      } else {
        // Show shake animation on the last pressed key if available
        if (lastPressedKey) {
          lastPressedKey.classList.add('shake-error');
          setTimeout(() => {
            lastPressedKey.classList.remove('shake-error');
          }, 500);
        }
      }
      
      // Reset after feedback
      setTimeout(() => {
        this.showFeedback = false;
        if (isCorrect) {
          // Play the new melody automatically after 2 seconds
          this.setupMemoryMode();
          
          // Play the new sequence automatically after another 2 seconds
          setTimeout(() => {
            this.playMemorySequence();
          }, 2000);
        } else {
          // Reset user sequence and replay the current sequence
          this.userSequence = [];
          this.playMemorySequence();
        }
      }, 2000);
    },

    /**
     * Play the current melody for the active mode (match, guess, memory)
     * This is called by the shared Play button in the UI
     */
    playCurrentMelody() {
      if (this.mode === 'match') {
        this.setupMatchingMode(true, false);
      } else if (this.mode === 'guess') {
        this.setupGuessingMode(true, false);
      } else if (this.mode === 'memory') {
        this.setupMemoryMode(true, false);
      }
    }
  };
}
