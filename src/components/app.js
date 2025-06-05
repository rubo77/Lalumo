/**
 * Main application component
 */
export function app() {
  return {
    active: 'pitches',
    menuOpen: false,
    menuLocked: false,  // Zustandsvariable für die Kindersicherung
    lockPressStartTime: null, // Timestamp für den Beginn des Entperrvorgangs
    username: null,
    editableUsername: '', // For the username edit input field
    showResetConfirm: false, // For the reset progress confirmation
    firstVisit: false,
    showUsernamePrompt: false,
    isAudioEnabled: false,
    audioContext: null,
    oscillators: {},
    exportedData: null,
    importData: '',
    preferredLanguage: 'english',
    
    /**
     * Mapping of chapters and activities to new ID format
     * Format: <chapter-id>_<chapter-name>_<activity-id>_<activity-name>
     */
    chapterActivityMap: {
      '1_pitches': {
        name: 'Pitches & Melodies',
        activities: {
          '1_1_pitches_listen': 'Listen to Melodies',
          '1_2_pitches_match-sounds': 'Match Sounds',
          '1_3_pitches_draw-melody': 'Draw a Melody',
          '1_4_pitches_does-it-sound-right': 'Does It Sound Right?',
          '1_5_pitches_memory-game': 'Memory Game'
        },
        // Mapping von alten zu neuen IDs
        legacyMapping: {
          'listen': '1_1_pitches_listen',
          'match': '1_2_pitches_match-sounds',
          'draw': '1_3_pitches_draw-melody',
          'guess': '1_4_pitches_does-it-sound-right',
          'memory': '1_5_pitches_memory-game'
        }
      },
      '2_chords': {
        name: 'Feeling Chords',
        activities: {
          '2_1_chords_color-matching': 'Chord Color Matching',
          '2_2_chords_mood-landscapes': 'Mood Landscapes',
          '2_3_chords_chord-building': 'Chord Building',
          '2_4_chords_missing-note': 'Missing Note',
          '2_5_chords_characters': 'Chord Characters',
          '2_6_chords_harmony-gardens': 'Harmony Gardens'
        },
        // Mapping von alten zu neuen IDs
        legacyMapping: {
          'color-matching': '2_1_chords_color-matching',
          'mood-landscapes': '2_2_chords_mood-landscapes',
          'chord-building': '2_3_chords_chord-building',
          'missing-note': '2_4_chords_missing-note',
          'character-matching': '2_5_chords_characters',
          'harmony-gardens': '2_6_chords_harmony-gardens'
        }
      },
      '3_timbres': {
        name: 'Discovering Timbres',
        activities: {
          // Aktivitäten für Timbres hier hinzufügen
        }
      },
      '4_rhythms': {
        name: 'Rhythms',
        activities: {
          // Aktivitäten für Rhythms hier hinzufügen
        }
      }
    },
    
    /**
     * Load and parse strings from Android XML files
     * This makes the strings.xml files the single source of truth
     */
    async loadStringsFromXML() {
      // Determine which language file to load
      const language = this.preferredLanguage === 'german' ? 'de' : 'en';
      const xmlPath = language === 'de' 
        ? '/android/app/src/main/res/values-de/strings.xml'
        : '/android/app/src/main/res/values/strings.xml';
      
      console.log(`Loading strings from: ${xmlPath}`);
      
      // Fetch the XML file
      const response = await fetch(xmlPath);
      if (!response.ok) {
        throw new Error(`Failed to load ${xmlPath}: ${response.status}`);
      }
      
      const xmlText = await response.text();
      
      // Parse the XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error: ' + parserError.textContent);
      }
      
      // Extract all string elements
      const stringElements = xmlDoc.querySelectorAll('string');
      const strings = {};
      
      stringElements.forEach(element => {
        const name = element.getAttribute('name');
        const value = element.textContent;
        if (name && value) {
          strings[name] = value;
        }
      });
      
      console.log(`Loaded ${Object.keys(strings).length} strings from XML`);
      return strings;
    },
    
    /**
     * Initialize all application strings from XML resources
     * This makes strings available globally via Alpine.store
     */
    async initStrings() {
      // Load strings directly from XML files
      const appStrings = await this.loadStringsFromXML();
      
      // Make strings available globally via Alpine store
      Alpine.store('strings', appStrings);
      
      // Import debug utils for logging
      import('../utils/debug').then(({ debugLog }) => {
        debugLog('APP', 'String resources loaded from XML');
      });
    },
    
    async init() {
      // We'll initialize audio only on first user interaction
      this.isAudioEnabled = false;
      
      // Initialize Alpine.js store immediately to prevent undefined errors
      window.Alpine.store('strings', {});
      window.Alpine.store('pitchMode', 'listen');
      
      // Load user data (including language) from localStorage
      this.loadUserData();
      
      // Now load strings with the correct language
      await this.initStrings();
      
      // Add event listener for custom sound events
      window.addEventListener('lalumo:play-sound', (event) => {
        if (event.detail && event.detail.sound) {
          this.playSound(event.detail.sound);
        }
      });
      
      // Detect if we're on Android
      const isAndroid = /Android/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      this.isAndroid = isAndroid;
      this.isAndroidChrome = isAndroid && isChrome;
      
      if (this.isAndroidChrome) {
        console.log('AUDIODEBUG: Android Chrome detected, using specialized audio handling');
        this.initAndroidAudio();
      }
      
      // Set up multiple event listeners for mobile audio unlocking
      ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(eventType => {
        document.documentElement.addEventListener(eventType, this.unlockAudio.bind(this), true);
      });
      
      // Additional global handler for any user interaction
      document.addEventListener('click', () => this.unlockAudio(), false);
      
      // Add specialized event for audio fixes
      document.addEventListener('lalumo:force-audio', () => {
        console.log('AUDIODEBUG: Received force-audio event');
        this.unlockAudio();
        if (this.isAndroidChrome) {
          this.initAndroidAudio();
        }
      }, false);
      
      // Check for existing username in localStorage
      this.loadUserData();
      
      // If no username exists, show prompt after a short delay
      if (!this.username) {
        this.firstVisit = true;
        setTimeout(() => {
          this.showUsernamePrompt = true;
        }, 2000);
      }
      
      // Tracking für Events zur Vermeidung von Duplikaten
      this.lastNoteEventId = null;
      this.lastNoteEventTime = 0;
      
      // Set up event listener for playing notes from other components
      window.addEventListener('lalumo:playnote', (event) => {
        if (event.detail && event.detail.note) {
          // Event-ID generieren, falls keine vorhanden
          const eventId = event.detail.id || `${event.detail.note}_${Date.now()}`;
          const currentTime = Date.now();
          
          // Doppelte Events verhindern: Ignoriere Events mit gleicher ID oder zu kurzen Abständen
          if (eventId === this.lastNoteEventId || (currentTime - this.lastNoteEventTime < 50)) {
            console.log(`Skipping duplicate event: ${event.detail.note}`);
            return;
          }
          
          // Event-Tracking aktualisieren
          this.lastNoteEventId = eventId;
          this.lastNoteEventTime = currentTime;
          
          // Verbesserte Protokollierung zur Fehlersuche
          console.log(`Playing sound: ${event.detail.note}${event.detail.sequenceIndex !== undefined ? ` (index: ${event.detail.sequenceIndex})` : ''}`);
          
          // Alle vorherigen Töne stoppen, um Überlappungen zu vermeiden
          if (this.currentToneTimeout) {
            clearTimeout(this.currentToneTimeout);
            this.currentToneTimeout = null;
          }
          
          // Try to unlock audio first in case this is the first interaction
          this.unlockAudio();
          
          // Ton mit kurzer Verzögerung abspielen, um sicherzustellen, dass vorherige Töne gestoppt wurden
          this.currentToneTimeout = setTimeout(() => {
            this.playSound(event.detail.note);
          }, 10);
        }
      });
      
      // Set up event listener for stopping all sounds
      window.addEventListener('lalumo:stopallsounds', () => {
        // We don't need to do anything with the audio context
        // The individual oscillators will be stopped in playTone
        // Just log that we received the stop request
        console.log('Received request to stop sounds');
      });
      
      // Special iOS audio check on page load
      this.checkIOSAudio();
    },
    
    /**
     * Load user data from localStorage
     */
    loadUserData() {
      try {
        // Load username from localStorage
        const savedUsername = localStorage.getItem('lalumo_username');
        if (savedUsername) {
          this.username = savedUsername;
          // Initialize the editable username field
          this.editableUsername = savedUsername;
          console.log('Progress loaded for user:', this.username);
        } else {
          this.firstVisit = true;
          this.showUsernamePrompt = true;
        }
        
        // Load language preference from localStorage
        const savedLanguage = localStorage.getItem('lalumo_language');
        if (savedLanguage) {
          this.preferredLanguage = savedLanguage;
        } else {
          // Default to English if not set
          localStorage.setItem('lalumo_language', 'english');
        }
        
        // Load menu lock state from localStorage
        const savedLockState = localStorage.getItem('lalumo_menu_locked');
        if (savedLockState) {
          this.menuLocked = (savedLockState === 'true');
          console.log('Menu lock state loaded:', this.menuLocked);
        }
      } catch (e) {
        console.log('Error loading user data', e);
      }
    },
    
    /**
     * Toggle the menu lock state (child safety feature)
     */
    toggleMenuLock() {
      this.menuLocked = !this.menuLocked;
      try {
        localStorage.setItem('lalumo_menu_locked', this.menuLocked);
        console.log('Menu lock state updated:', this.menuLocked);
      } catch (e) {
        console.log('Error saving menu lock state', e);
      }
    },
    
    /**
     * Alternative unlock method that uses a progress indicator
     */
    startLongPressUnlock() {
      if (!this.menuLocked) {
        // If not locked, simply lock it immediately
        this.toggleMenuLock();
        return;
      }
      
      // Variable to track the unlock progress
      this.unlockProgress = 0;
      this.unlockInterval = null;
      
      // Start the interval that will increment the progress
      this.unlockInterval = setInterval(() => {
        this.unlockProgress += 0.05; // Increment by 5% every 150ms
        
        // Update the visual indicator (will be implemented in HTML/CSS)
        document.documentElement.style.setProperty('--unlock-progress', this.unlockProgress);
        
        // Check if we've reached 100% (3 seconds)
        if (this.unlockProgress >= 1) {
          // Clear the interval
          clearInterval(this.unlockInterval);
          this.unlockInterval = null;
          
          // Unlock the menu
          this.toggleMenuLock();
          console.log('Menu unlocked after long press');
          
          // Reset progress
          this.unlockProgress = 0;
          document.documentElement.style.setProperty('--unlock-progress', 0);
        }
      }, 150);
    },
    
    /**
     * Cancel the unlock process if the user releases before completion
     */
    cancelLongPressUnlock() {
      if (this.unlockInterval) {
        clearInterval(this.unlockInterval);
        this.unlockInterval = null;
        this.unlockProgress = 0;
        document.documentElement.style.setProperty('--unlock-progress', 0);
        console.log('Unlock canceled');
      }
    },
    
    /**
     * Set the preferred language and save to localStorage
     */
    async setLanguage(language) {
      this.preferredLanguage = language;
      localStorage.setItem('lalumo_language', language);
      console.log('Language set to:', language);
      
      // Reload strings with new language
      await this.initStrings();
    },
    
    /**
     * Generate a random username for new users
     */
    generateUsername() {
      const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Creative', 'Curious', 'Eager', 'Friendly', 'Gentle', 'Kind'];
      const animals = ['Dolphin', 'Tiger', 'Eagle', 'Panda', 'Koala', 'Lion', 'Penguin', 'Rabbit', 'Fox', 'Butterfly'];
      
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      const randomNumber = Math.floor(Math.random() * 100);
      
      return `${randomAdjective}${randomAnimal}${randomNumber}`;
    },
    
    /**
     * Set the username and save it to localStorage
     */
    setUsername(useGenerated = true) {
      if (useGenerated) {
        this.username = this.generateUsername();
      }
      
      try {
        localStorage.setItem('lalumo_username', this.username);
        // Set the editable username field to match current username
        this.editableUsername = this.username;
      } catch (e) {
        console.log('Error saving username', e);
      }
      
      this.showUsernamePrompt = false;
    },
    
    /**
     * Save the custom username entered by the user
     */
    saveUsername() {
      // Check if the username is valid
      if (this.editableUsername && this.editableUsername.trim()) {
        this.username = this.editableUsername.trim();
        
        try {
          localStorage.setItem('lalumo_username', this.username);
        } catch (e) {
          console.log('Error saving custom username', e);
        }
      } else {
        // If empty, revert to current username
        this.editableUsername = this.username;
      }
    },
    
    /**
     * Reset all user progress data
     */
    resetProgress() {
      try {
        // Keep username and language preference
        const currentUsername = this.username;
        const currentLanguage = this.preferredLanguage;
        
        // Clear game progress
        localStorage.removeItem('lalumo_progress');
        localStorage.removeItem('lalumo_memory_level');
        localStorage.removeItem('lalumo_difficulty');
        
        // Reset in-memory progress too
        this.progress = { match: 0, guess: 0, memory: 0 };
        this.memorySuccessCount = 0;
        
        // Auch die In-Memory-Daten der pitches-Komponente zurücksetzen, falls vorhanden
        if (window.Alpine && window.Alpine.data && window.Alpine.data.pitches) {
          window.Alpine.data.pitches.progress = { listen: 0, match: 0, draw: 0, guess: 0, memory: 0 };
          window.Alpine.data.pitches.correctAnswersCount = 0;
          window.Alpine.data.pitches.unlockedPatterns = ['up', 'down'];
          window.Alpine.data.pitches.memorySuccessCount = 0;
          window.Alpine.data.pitches.mode = 'main'; // Setze Melody-Modus auf Start
        }
        
        // Restore username and language
        localStorage.setItem('lalumo_username', currentUsername);
        localStorage.setItem('lalumo_language', currentLanguage);
        
        // Hide confirmation dialog
        this.showResetConfirm = false;
        
        // Show feedback or refresh the page
        alert('Progress has been reset successfully');
        window.location.reload();
      } catch (e) {
        console.log('Error resetting progress', e);
      }
    },
    
    /**
     * Export the user's progress as a save game string
     */
    exportProgress() {
      try {
        // Collect all progress data
        const progressData = {
          username: this.username,
          lastSaved: new Date().toISOString(),
          pitchProgress: JSON.parse(localStorage.getItem('lalumo_progress') || '{}'),
          memoryGameLevel: parseInt(localStorage.getItem('lalumo_memory_level') || '0', 10),
          lastActivity: this.active
        };
        
        // Convert to JSON and encode for export
        const jsonString = JSON.stringify(progressData);
        const encoded = btoa(jsonString);
        
        // Set the exportedData property for display in the UI
        this.exportedData = encoded;
        
        console.log('Progress exported successfully with memory game data');
        return encoded;
      } catch (e) {
        console.log('Error exporting progress', e);
        return null;
      }
    },
    
    /**
     * Stoppt alle aktiven Oszillatoren, um Audio-Konflikte zu vermeiden
     */
    stopAllOscillators() {
      if (this.activeOscillators && this.activeOscillators.length > 0) {
        console.log(`Stopping ${this.activeOscillators.length} active oscillators`);
        
        // Stoppe alle aktiven Oszillatoren sofort
        this.activeOscillators.forEach(osc => {
          try {
            osc.stop(0); // Sofort stoppen
            osc.disconnect();
          } catch (e) {
            // Ignoriere Fehler von bereits gestoppten Oszillatoren
            console.log('Error stopping oscillator, may already be stopped');
          }
        });
        
        // Liste leeren
        this.activeOscillators = [];
      }
    },
    
    /**
     * Copy the exported progress code to the clipboard
     */
    copyToClipboard() {
      if (!this.exportedData) return;
      
      try {
        // Create a temporary textarea element to copy from
        const textarea = document.createElement('textarea');
        textarea.value = this.exportedData;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Show feedback
        console.log('Progress code copied to clipboard!');
        alert('Progress code copied to clipboard!');
      } catch (e) {
        console.error('Failed to copy to clipboard:', e);
      }
    },
    
    /**
     * Import progress from a save game string
     */
    importProgress() {
      if (!this.importData || this.importData.trim() === '') {
        alert('Please enter a progress code first!');
        return;
      }
      
      try {
        // Decode and parse the save code
        const jsonString = atob(this.importData);
        const progressData = JSON.parse(jsonString);
        
        // Validate the data
        if (!progressData || !progressData.username) {
          console.log('Invalid save code');
          return false;
        }
        
        // Restore the username
        this.username = progressData.username;
        localStorage.setItem('lalumo_username', this.username);
        
        // Restore pitch progress
        if (progressData.pitchProgress) {
          localStorage.setItem('lalumo_progress', progressData.pitchProgress);
        }
        
        // Restore last activity
        if (progressData.lastActivity) {
          this.active = progressData.lastActivity;
        }
        
        console.log('Imported progress for', this.username);
        return true;
      } catch (e) {
        console.log('Error importing progress', e);
        return false;
      }
    },
    
    /**
     * Unlock audio on mobile devices
     * This addresses both iOS and Android requirements for user interaction to enable audio
     */
    async unlockAudio() {
      // Import debug utils for consistent logging
      const { debugLog } = await import('../utils/debug');
      debugLog('AUDIO', 'Attempting to unlock audio...');
      
      if (this.isAudioEnabled && this.audioContext && this.audioContext.state === 'running') {
        debugLog('AUDIO', 'Audio already unlocked and running');
        return;
      }
      
      try {
        // Create audio context if it doesn't exist
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        // Import debug utils for consistent logging
        const { debugLog } = await import('../utils/debug');
        
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
          debugLog('AUDIO', `Created new AudioContext, state: ${this.audioContext.state}`);
        }
        
        // Resume the audio context (needed for both iOS and newer Android Chrome)
        if (this.audioContext.state === 'suspended') {
          debugLog('AUDIO', 'Resuming suspended audio context');
          this.audioContext.resume().then(() => {
            debugLog('AUDIO', `AudioContext resumed successfully, new state: ${this.audioContext.state}`);
          }).catch(err => {
            console.error('Failed to resume AudioContext:', err);
          });
        }
        
        // Create and play a silent buffer to unlock audio - critical for Chrome on Android
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        
        // Use try-catch specifically for the start call which can sometimes fail
        try {
          source.start(0);
          console.log('Started silent audio buffer');
        } catch (startError) {
          console.warn('Could not start audio buffer source:', startError);
        }
        
        // Mark audio as enabled
        this.isAudioEnabled = true;
        console.log('Audio unlock attempt complete, context state:', this.audioContext.state);
        
        // Check if we're on Android and Chrome
        const isAndroid = /Android/.test(navigator.userAgent);
        const isChrome = /Chrome/.test(navigator.userAgent);
        
        if (isAndroid && isChrome) {
          console.log('Android Chrome detected, applying special audio handling');
          // Additional audio setup specifically for Android Chrome
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.audioContext && this.audioContext.state === 'suspended') {
              this.audioContext.resume().then(() => {
                console.log('AudioContext resumed after visibility change');
              });
            }
          });
        }
        
        // Only remove listeners if we're confident audio is working
        if (this.audioContext.state === 'running') {
          ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(eventType => {
            document.documentElement.removeEventListener(eventType, this.unlockAudio.bind(this), true);
          });
        }
      } catch (error) {
        console.error('Failed to unlock audio:', error);
      }
    },
    
    /**
     * Initialize Web Audio API - simpler than Tone.js
     */
    initAudio() {
      // Now just call the unlock function since it handles everything
      this.unlockAudio();
      
      // For Android Chrome, use the specialized initialization
      if (this.isAndroidChrome) {
        this.initAndroidAudio();
      }
    },
    
    /**
     * Specialized audio initialization for Android Chrome
     * Addresses specific issues with audio playback on Android devices
     */
    async initAndroidAudio() {
      // Import debug utils for consistent logging
      const { debugLog } = await import('../utils/debug');
      debugLog('AUDIO', 'Initializing specialized Android audio handling');
      
      if (!this.audioContext) {
        try {
          // Create audio context with explicit options for Android
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          this.audioContext = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: 44100 // Standard sample rate that works well on most devices
          });
          debugLog('AUDIO', 'Created Android-optimized audio context');
        } catch (e) {
          console.error('Failed to create Android audio context:', e);
          return;
        }
      }
      
      // Force the audio context to resume
      if (this.audioContext.state === 'suspended') {
        // Create and play a very short beep to force audio activation
        try {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          
          // Configure a very quiet, short beep
          oscillator.type = 'sine';
          oscillator.frequency.value = 440; // A4 note
          gainNode.gain.value = 0.01; // Very quiet
          
          // Connect and start
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          
          // Play for just 10ms
          oscillator.start();
          oscillator.stop(this.audioContext.currentTime + 0.01);
          
          // Force resume in parallel
          this.audioContext.resume().then(() => {
            console.log('AUDIODEBUG: Android audio context resumed');
            this.isAudioEnabled = true;
          }).catch(err => {
            console.error('AUDIODEBUG: Failed to resume Android audio context:', err);
          });
          
          console.log('AUDIODEBUG: Android audio initialization completed');
        } catch (e) {
          console.error('AUDIODEBUG: Error during Android audio initialization:', e);
        }
      } else {
        console.log('AUDIODEBUG: Android audio context already running');
      }
    },
    
    /**
     * Play a sound - simplified approach
     */
    playSound(sound) {
      // Enhanced audio initialization for Android Chrome
      const isAndroid = /Android/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      
      if (isAndroid && isChrome) {
        console.log('AUDIODEBUG: Android Chrome detected in playSound:', sound);
      }
      
      if (!this.isAudioEnabled) {
        console.log('AUDIODEBUG: Audio not enabled, attempting to unlock');
        this.unlockAudio();
        if (!this.isAudioEnabled) {
          console.log('AUDIOTROUBLE: Still cannot enable audio. User may need to interact with the page first');
          // Try to get user attention with a visible message
          this.showMascotMessage('Tap anywhere on the screen to enable sound!');
          
          // On Android Chrome, try to force start the audio context anyway
          if (isAndroid && isChrome && this.audioContext) {
            console.log('AUDIODEBUG: Forcing audio context resume for Android Chrome');
            this.audioContext.resume().then(() => {
              console.log('AUDIODEBUG: Forced audio context resume successful');
              // Try to play the sound again after a short delay
              setTimeout(() => {
                this.isAudioEnabled = true;
                this.playSound(sound);
              }, 100);
            }).catch(err => {
              console.error('AUDIODEBUG: Failed to force audio context resume:', err);
            });
          }
          return;
        }
      }
      
      // Always try to resume suspended audio context for all browsers
      if (this.audioContext && this.audioContext.state === 'suspended') {
        console.log('AUDIOTROUBLE: Resuming suspended audio context');
        this.audioContext.resume().then(() => {
          console.log('AUDIODEBUG: Audio context resumed successfully in playSound');
        });
      }
      
      try {
        // Parse the sound identifier
        if (sound.startsWith('pitch_')) {
          // Extract the note name and play it
          const noteName = sound.split('_')[1].toUpperCase();
          this.playTone(this.getNoteFrequency(noteName), 0.5);
        } else if (sound === 'success') {
          // Play a simple success sound
          this.playSuccessSound();
        } else if (sound === 'try_again') {
          // Play a simple error sound
          this.playErrorSound();
        } else if (sound.startsWith('tonecolor_')) {
          // Play a tone color sound
          const color = sound.split('_')[1];
          this.playToneColor(color);
        } else if (sound.startsWith('rhythm_')) {
          // Play a rhythm beat sound
          const beatType = sound.split('_')[1];
          this.playRhythmBeat(beatType);
        } else if (sound.includes('_')) {
          // Format: instrument_note (e.g., piano_C4, guitar_A3)
          const [instrument, note] = sound.split('_');
          this.playInstrumentNote(instrument, note);
        }
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    },
    
    /**
     * Show a message from the mascot character
     * @param {string} message - The message to show
     */
    showMascotMessage(message) {
      // Dispatch event to the mascot component
      window.dispatchEvent(new CustomEvent('lalumo:mascot-message', {
        detail: { message }
      }));
    },
    
    /**
     * Play a rhythm beat sound
     * @param {string} type - The type of beat (high or low)
     */
    playRhythmBeat(type) {
      if (!this.audioContext) return;
      
      try {
        // Create oscillator and gain node
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Set properties based on beat type
        if (type === 'high') {
          // High click/tick sound
          oscillator.type = 'sine';
          oscillator.frequency.value = 1200;
        } else {
          // Low click/tick sound
          oscillator.type = 'triangle';
          oscillator.frequency.value = 800;
        }
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set volume
        gainNode.gain.value = 0.3;
        
        // Very short attack and release for percussion sounds
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        // Start and stop sound
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } catch (error) {
        console.error('Error playing rhythm beat:', error);
      }
    },
    
    /**
     * Play a specific note with a specific instrument
     * @param {string} instrument - The instrument to use
     * @param {string} note - The note to play
     */
    playInstrumentNote(instrument, note) {
      if (!this.audioContext) return;
      
      try {
        // Create oscillator and gain node
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Get frequency for the note
        let frequency = 440; // Default A4
        if (note.match(/^[A-G][#b]?[0-8]$/)) {
          frequency = this.getNoteFrequency(note);
        }
        
        // Set properties based on instrument
        switch(instrument) {
          case 'piano':
            oscillator.type = 'triangle';
            break;
          case 'guitar':
            oscillator.type = 'sawtooth';
            break;
          case 'synth':
            oscillator.type = 'square';
            break;
          case 'drums':
            // Special case - just play a percussion sound
            this.playRhythmBeat('high');
            return;
          default:
            oscillator.type = 'sine';
        }
        
        // Set frequency
        oscillator.frequency.value = frequency;
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set volume
        gainNode.gain.value = 0.5;
        
        // Sound envelope
        const now = this.audioContext.currentTime;
        const attackTime = instrument === 'piano' ? 0.02 : 0.1;
        const decayTime = instrument === 'piano' ? 1.5 : 0.8;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + decayTime);
        
        // Start and stop sound
        oscillator.start(now);
        oscillator.stop(now + decayTime + 0.1);
      } catch (error) {
        console.error(`Error playing ${instrument} note ${note}:`, error);
      }
    },
    
    /**
     * Check for iOS audio special handling
     */
    checkIOSAudio() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      if (isIOS) {
        console.log('AUDIOTROUBLE: iOS device detected, adding special audio handling');
        
        // Show a message after a short delay to get user to tap the screen
        setTimeout(() => {
          if (!this.isAudioEnabled) {
            this.showMascotMessage('Tap anywhere to enable sound! 🔊');
          }
        }, 2000);
        
        // Add a visible audio unlock button for iOS
        const audioUnlockDiv = document.createElement('div');
        audioUnlockDiv.style.position = 'fixed';
        audioUnlockDiv.style.bottom = '20px';
        audioUnlockDiv.style.right = '20px';
        audioUnlockDiv.style.backgroundColor = '#6c5ce7';
        audioUnlockDiv.style.color = 'white';
        audioUnlockDiv.style.padding = '10px 15px';
        audioUnlockDiv.style.borderRadius = '50px';
        audioUnlockDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        audioUnlockDiv.style.zIndex = '9999';
        audioUnlockDiv.style.display = this.isAudioEnabled ? 'none' : 'block';
        audioUnlockDiv.textContent = '🔊 Enable Sound';
        audioUnlockDiv.addEventListener('click', () => {
          this.unlockAudio();
          audioUnlockDiv.style.display = 'none';
        });
        document.body.appendChild(audioUnlockDiv);
      }
    },
    
    /**
     * Check if the device is an iPad
     * @returns {boolean} - True if the device is an iPad
     */
    isIPad() {
      return navigator.userAgent.match(/iPad/i) !== null;
    },
    
    /**
     * Play a tone with the given frequency and duration
     */
    playTone(frequency, duration = 0.5) {
      if (!this.audioContext) return;
      
      try {
        // Verbesserte Protokollierung für Audio-Debugging
        console.log(`Playing tone ${frequency}Hz for ${duration}s`);
        
        // Zuerst alle aktiven Oszillatoren stoppen - WICHTIG für saubere Wiedergabe
        this.stopAllOscillators();
        
        // Garantieren, dass wir eine leere Liste haben
        if (!this.activeOscillators) {
          this.activeOscillators = [];
        }
        
        // Sicherstellen, dass Timeout-Handles korrekt verwaltet werden
        if (this.currentToneTimeout) {
          clearTimeout(this.currentToneTimeout);
          this.currentToneTimeout = null;
        }
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Add to active oscillators list
        this.activeOscillators.push(oscillator);
        
        // Set properties
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.5;
        
        // Connect and start
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Start oscillator
        oscillator.start();
        
        // Schedule stop with smooth fade-out
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        oscillator.stop(this.audioContext.currentTime + duration + 0.1);
        
        // Clean up
        oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
          
          // Remove from active oscillators list
          if (this.activeOscillators) {
            const index = this.activeOscillators.indexOf(oscillator);
            if (index !== -1) {
              this.activeOscillators.splice(index, 1);
            }
          }
        };
      } catch (error) {
        console.error('Error playing tone:', error);
      }
    },
    
    /**
     * Play a sequence of tones
     */
    playToneSequence(frequencies, durations = [], interval = 0.3) {
      if (!this.audioContext) return;
      
      // Use default duration if not provided
      if (!durations.length) {
        durations = new Array(frequencies.length).fill(0.3);
      }
      
      // Play each tone with timing
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, durations[index] || 0.3);
        }, index * interval * 1000);
      });
    },
    
    /**
     * Play a success sound (ascending arpeggio)
     */
    playSuccessSound() {
      const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      this.playToneSequence(frequencies, [0.2, 0.2, 0.2, 0.3], 0.15);
    },
    
    /**
     * Play an error sound (descending minor third)
     */
    playErrorSound() {
      const frequencies = [329.63, 261.63]; // E4, C4
      this.playToneSequence(frequencies, [0.3, 0.5], 0.3);
    },
    
    /**
     * Play different tone colors
     */
    playToneColor(color) {
      if (!this.audioContext) return;
      
      try {
        // Create oscillator and gain node
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Set properties based on color
        switch(color) {
          case 'warm':
            oscillator.type = 'sine';
            oscillator.frequency.value = 329.63; // E4
            break;
          case 'cold':
            oscillator.type = 'triangle';
            oscillator.frequency.value = 440.00; // A4
            break;
          case 'soft':
            oscillator.type = 'sine';
            oscillator.frequency.value = 293.66; // D4
            break;
          case 'sharp':
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 392.00; // G4
            break;
          default:
            oscillator.type = 'sine';
            oscillator.frequency.value = 261.63; // C4
        }
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set volume
        gainNode.gain.value = 0.5;
        
        // Start sound
        oscillator.start();
        
        // Set envelope based on color
        const now = this.audioContext.currentTime;
        if (color === 'soft') {
          // Slow attack, long release
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.5, now + 0.4);
          gainNode.gain.linearRampToValueAtTime(0.001, now + 2);
          oscillator.stop(now + 2.1);
        } else if (color === 'sharp') {
          // Quick attack, quick release
          gainNode.gain.setValueAtTime(0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          oscillator.stop(now + 0.6);
        } else {
          // Default envelope
          gainNode.gain.setValueAtTime(0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1);
          oscillator.stop(now + 1.1);
        }
        
        // Clean up
        oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
        };
      } catch (error) {
        console.error('Error playing tone color:', error);
      }
    },
    
    /**
     * Get frequency for a note name
     */
    getNoteFrequency(noteName) {
      // Define base frequencies for common notes
      const noteFrequencies = {
        'C3': 130.81,
        'D3': 146.83,
        'E3': 164.81,
        'F3': 174.61,
        'G3': 196.00,
        'A3': 220.00,
        'B3': 246.94,
        'C4': 261.63, // Middle C
        'D4': 293.66,
        'E4': 329.63,
        'F4': 349.23,
        'G4': 392.00,
        'A4': 440.00, // A440 (concert pitch)
        'B4': 493.88,
        'C5': 523.25,
        'D5': 587.33,
        'E5': 659.25,
        'F5': 698.46,
        'G5': 783.99,
        'A5': 880.00,
        'B5': 987.77,
        'C6': 1046.50
      };
      
      // Return the frequency or generate it if not in our table
      if (noteFrequencies[noteName]) {
        return noteFrequencies[noteName];
      }
      
      // Log fehlende Note für Debugging
      console.log(`Note ${noteName} not found in frequency table, using mathematical calculation`);
      
      // Als Fallback: Berechne die Frequenz mathematisch
      try {
        // Parse the note name and octave (e.g., 'A5' -> 'A' and '5')
        const noteLetter = noteName.replace(/[0-9]/g, '');
        const octave = parseInt(noteName.match(/[0-9]/g)[0], 10);
        
        // Basisnote für die Berechnung (A4 = 440Hz)
        const baseFreq = 440.0; // A4
        
        // Semitone offsets from A4
        const offsets = { 'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2 };
        
        // Berechne Halbtonabstand zu A4
        const semitones = offsets[noteLetter] + (octave - 4) * 12;
        
        // Berechne Frequenz: f = f0 * 2^(n/12)
        return baseFreq * Math.pow(2, semitones / 12);
      } catch (e) {
        console.error(`Failed to calculate frequency for ${noteName}:`, e);
        return 440; // A4 als Fallback
      }
    }
  };
}
