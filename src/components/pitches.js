/**
 * Pitches component
 * Implements interactive pitch and melody learning for children
 */

// Importiere die zentrale Audio-Engine für alle Audiofunktionen
import audioEngine from './audio-engine.js';
// Import direct Tone.js piano sampler (one global instance for all piano sound)
import { playToneNote, isToneJsReady } from '../utils/toneJsSampler';

// Importiere Debug-Utilities
import { debugLog } from '../utils/debug.js';

// Import shared feedback utilities
import { 
  showRainbowSuccess, 
  showBigRainbowSuccess, 
  showShakeError, 
  showCompleteSuccess, 
  showCompleteBigSuccess, 
  showCompleteError,
  showActivityProgressBar,
  hideActivityProgressBar
} from '../components/shared/feedback.js';

// Import shared UI helpers
import { update_progress_display as sharedUpdateProgressDisplay } from '../components/shared/ui-helpers.js';


// Import shared utilities
import { testCommonModuleImport, resetCurrentActivity, resetAllProgress, showResetFeedback } 
  from './pitches/common.js';
import { extractAnimalName } from './shared/ui-helpers.js';

import { setupHighOrLowMode_1_1, reset_1_1_HighOrLow_Progress, currentHighOrLowStage } 
  from "./pitches/1_1_high_or_low.js";
import { testMatchSoundsModuleImport, reset_1_2_MatchSounds_Progress } 
  from "./pitches/1_2_match_sounds.js";
import { testDrawMelodyModuleImport, reset_1_3_DrawMelody_Progress } 
  from "./pitches/1_3_draw_melody.js";
import { testSoundJudgmentModuleImport, reset_1_4_SoundJudgment_Progress } 
  from "./pitches/1_4_sound_judgment.js";
import { testMemoryGameModuleImport, reset_1_5_MemoryGame_Progress } 
  from "./pitches/1_5_memory_game.js";

// Importiere High or Low Funktionen direkt aus dem Modul

export function pitches() {
  return {
    /**
     * Initialize the component - called by Alpine.js x-init
     * Initialisiert die Audio-Engine und registriert die Komponente global
     */
    
    // State variables
    mode: '1_1_pitches_high_or_low', // default mode, 1_1_pitches_high_or_low, it could be one of 1_2_pitches_match-sounds, 1_3_pitches_draw, 1_4_pitches_does-it-sound-right or 1_5_pitches_memory
    currentSequence: [],
    userSequence: [],
    currentAnimation: null,
    drawPath: [],
    previousDrawPath: [], // Store the previous drawing path
    correctAnswer: null,
    melodyHasWrongNote: false, // For 'does-it-sound-right' activity - whether current melody has wrong note
    currentMelodyName: '', // Display name of currently playing melody
    choices: [],
    feedback: '',
    showFeedback: false, // Controls visibility of the unified feedback message
    feedbackMessage: '', // The message to show in the unified feedback system
    helpMessage: '',
    showMascot: false,
    melodyTimeouts: [], // Array für Timeout-IDs der Melodiesequenzen
    mascotSettings: {
      showHelpMessages: true,     // Whether to show help messages
      disableTTS: true,          // Whether to disable TTS for mascot messages
      seenActivityMessages: {},   // Track which activities have shown the message
    },
    currentHighlightedNote: null, // For highlighting piano keys during playback
    longPressTimer: null,
    longPressThreshold: 800, // milliseconds for long press
    lastSelectedPatternType: null, // Speichert den letzten ausgewählten Pattern-Typ
    consecutivePatternCount: 0,    // Zählt, wie oft das gleiche Pattern hintereinander ausgewählt wurde
    showMemoryHighlighting: false, // Whether to show highlighting in memory game
    
    // Progress tracking
    progress: {
      '1_1_pitches_high_or_low': 0,
      match: 0,
      draw: 0,
      'does-it-sound-right': 0,
      memory: 0
    },
    
    // ************ for 1.1 *****************
    // High or Low activity state variables
    highOrLowProgress: 0, // Number of correct answers in High or Low activity - initialized properly in afterInit
    currentHighOrLowTone: null, // Current tone type (high/low)
    highOrLowSecondTone: null, // For comparison stages
    highOrLowPlayed: false, // Whether the tone has been played
    highOrLowFeedbackTimer: null, // Timer for hiding feedback
    gameStarted: false, // Whether the game has been started
    
    // Progressive difficulty tracking
    correctAnswersCount: 0,
    unlockedPatterns: ['up', 'down'], // Start with only up and down
    
    // ************ for 1.3 *****************
    // Draw melody activity progression
    drawMelodyLevel: 0, // User level in draw melody activity (determines number of notes)
    
    // ************ for 1.4 *****************
    // Does It Sound Right activity progression
    soundJudgmentLevel: 1, // User level in Does It Sound Right activity (determines difficulty)
    
    // ************ for 1.5 *****************
    // Arrays für die zufälligen Tierbilder
    goodAnimalImages: [
      '/images/1_5_pitches_good_bird_notes.png',
      '/images/1_5_pitches_good_bird.png',
      '/images/1_5_pitches_good_cat.png',
      '/images/1_5_pitches_good_deer.png',
      '/images/1_5_pitches_good_dog.png',
      '/images/1_5_pitches_good_hedgehog.png',
      '/images/1_5_pitches_good_pig.png',
      '/images/1_5_pitches_good_ladybug.png',
      '/images/1_5_pitches_good_sheep.png',
    ],
    badAnimalImages: [
      '/images/1_5_pitches_bad_bug.png',
      '/images/1_5_pitches_bad_crab.png',
      '/images/1_5_pitches_bad_cat.png',
      '/images/1_5_pitches_bad_crow.png',
      '/images/1_5_pitches_bad_rabbit.png',
      '/images/1_5_pitches_bad_snake.png'
    ],
    currentGoodAnimalImage: null,
    currentBadAnimalImage: null,
    gameMode: false, // For match and memory modes - false = free play, true = game mode
    memoryFreePlay: false, // Track if memory is in free play mode

    // ************ for 1.2 *****************
    // Available notes for melodies
    availableNotes: [
      // C3 - B3 (Lower octave)
      'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
      // C4 - B4 (Middle octave)
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      // C5 - C6 (Upper octave)
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'
    ],
    
    // ************ for 1.3 *****************
    // Well-known melodies for the "Does It Sound Right?" activity
    knownMelodies: {
      'twinkle': {
        en: 'Twinkle, Twinkle, Little Star',
        de: 'Funkel, funkel, kleiner Stern',
        quarterNoteDuration: 500, // Standardlänge für eine Viertelnote in ms
        notes: [
          'C', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4:h', // h = halbe Note (doppelte Länge)
          'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4:h'  // Standard-Viertelnoten, außer markierte
        ]
      },
      'jingle': {
        en: 'Jingle Bells',
        de: 'Jingle Bells',
        quarterNoteDuration: 450, // Etwas schneller für Jingle Bells
        notes: ['E', 'E4', 'E4:h', 'E4', 'E4', 'E4:h', 'E4', 'G4', 'C4', 'D4', 'E4:h']
      },
      'happy': { // höher
        en: 'Happy Birthday',
        de: 'Alles Gute zum Geburtstag',
        quarterNoteDuration: 600, // Normale Geschwindigkeit für Geburtstagslied
        notes: ['G3:e', 'G3:e', 'A3:q', 'G3:q', 'C4:q', 'B3:h', 'G3:e', 'G3:e', 'A3:q', 'G3:q', 'D4:q', 'C4:h']
      },
      'happy-birthday': { // tiefer
        en: 'Happy Birthday To You',
        de: 'Zum Geburtstag viel Glück',
        quarterNoteDuration: 600,
        notes: [
          'C:e', 'C4:e', // Happy
          'D4:q', 'C4:q', 'F4:q', 'E4:h', // Birthday to you
          'C4:e', 'C4:e', 'D4:q', 'C4:q', 'G4:q', 'F4:h' // Happy Birthday to you
        ]
      },
      'frere-jacques': {
        en: 'Brother John (Frère Jacques)',
        de: 'Bruder Jakob',
        quarterNoteDuration: 500,
        notes: [
          'C', 'D4', 'E4', 'C4', // Frère Jacques, Frère Jacques
          'C4', 'D4', 'E4', 'C4', // Dormez-vous? Dormez-vous?
          'E4', 'F4', 'G4:h', // Sonnez les matines
          'E4', 'F4', 'G4:h'  // Sonnez les matines
        ]
      },
      'are-you-sleeping': {
        en: 'Are You Sleeping?',
        de: 'Schlaf, Kindlein, schlaf',
        quarterNoteDuration: 550,
        notes: [
          'E:h', 'D4', 'D4', 'C4:H',
          'G3', 'E', 'E', 'D4', 'D4', 'C4:h',
        ]
      },
      'little-hans': { // Hänschen klein
        en: 'Little Hans',
        de: 'Hänschen klein',
        quarterNoteDuration: 550,
        notes: [
          'G', 'E4', 'E4:h', 'F4', 'D4', 'D4:h',
          // cdefggg
          'C4', 'D4', 'E4', 'F4', 'G4', 'G4', 'G4:h'          
        ]
      },
      // de=Alle meine Entchen /  en=All My Little Ducklings
      'all-my-little-ducklings': {
        en: 'All My Little Ducklings',
        de: 'Alle meine Entchen',
        quarterNoteDuration: 550,
        notes: [
          // cdefg:hg:haaaag:h
          'C', 'D4', 'E4', 'F4', 'G4:h', 'G4:h', 'A', 'A', 'A', 'A', 'G:h'
        ]
      },

      // TODO:
      // Hey ho spann den wagen an
      // 'bunny-foo': {
      //   en: 'Bunny Foo',
      //   de: 'Häschen Hüpf',
      //   quarterNoteDuration: 550,
      //   notes: [
      //     'G', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4:h', // Häschen in der Grube
      //     'G4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4:h', // sass und weinte
      //     'F4', 'F4', 'F4', 'F4', 'E4', 'E4', 'E4:h', // Armes Häschen bist du krank
      //     'F4', 'F4', 'F4', 'F4', 'E4', 'E4', 'E4:h'  // dass du nicht mehr hüpfen kannst
      //   ]
      // },
      // Old McDonald Had a Farm
      'old-mcdonald': {
        en: 'Old McDonald Had a Farm',
        de: 'Old MacDonald hat ne Farm',
        quarterNoteDuration: 500,
        notes: [
          // 'FFCCDDC:hAAGGF:h', // Old McDonald had a farm
          'F', 'F4', 'C4', 'C4', 'D4', 'D4', 'C4:h', 'A4', 'A4', 'G4', 'G4', 'F4:h'
        ]
      }
    },
    // **************************************

    async initializeAudioEngine() {
	      try {
	        await audioEngine.initialize();
	        debugLog("PITCHES_INIT", "Audio engine successfully initialized");
	      } catch (error) {
	        console.error("PITCHES_INIT: Error initializing audio engine", error);
	      }
    },
    
      /**
       * Initialize the component
       * @activity common
       * @used-by all activities
       */
      init() {
        
        // Register this component globally immediately
        console.log("PITCHES_INIT: Registering pitches component globally");
        window.pitchesComponent = this;
        console.log("PITCHES_INIT: Registration completed. window.pitchesComponent is now:", !!window.pitchesComponent);
        console.log("PITCHES_INIT: Component mode after registration:", this.mode);
        
        // Initialize audio engine asynchronously
        this.initializeAudioEngine();
      
        // Set up text-to-speech if available - with better debugging
        this.speechSynthesis = null;
        this.ttsAvailable = false;
        this.usingNativeAndroidTTS = false;  // Flag für native Android TTS
        
        // Überprüfe zuerst, ob die native Android TTS-Brücke verfügbar ist
        this.checkAndroidNativeTTS();
        
        // Fallback: Verzögerte Initialisierung der Web-Sprachsynthese für bessere Kompatibilität
        this.initSpeechSynthesis();
        
        // Load mascot message settings from localStorage
        try {
          const savedMascotSettings = localStorage.getItem('lalumo_mascot_settings');
          if (savedMascotSettings) {
            const loadedSettings = JSON.parse(savedMascotSettings);
            // Merge loaded settings with defaults to ensure new flags are set
            this.mascotSettings = {
              ...this.mascotSettings,  // Default values
              ...loadedSettings        // Saved values override defaults
            };
            // Reset seenActivityMessages on every app start
            this.$store.mascotSettings.seenActivityMessages = {};
            console.log('Loaded mascot settings and reset seen messages:', this.mascotSettings);
          }
          // Always save back to localStorage to persist any new default flags
          localStorage.setItem('lalumo_mascot_settings', JSON.stringify(this.mascotSettings));
        } catch (error) {
          console.error('Error loading mascot settings:', error);
          // Keep default settings
        }
        
        // Try to load saved progress from localStorage
        try {
          const savedProgress = localStorage.getItem('lalumo_progress');
          if (savedProgress) {
            this.progress = JSON.parse(savedProgress);
            
            // Ensure all activity progress fields exist with the new ID format
            if (!this.progress['1_1_pitches_high_or_low']) this.progress['1_1_pitches_high_or_low'] = 0;
            if (!this.progress['1_2_pitches_match-sounds']) this.progress['1_2_pitches_match-sounds'] = 0;
            if (!this.progress['1_3_pitches_draw-melody']) this.progress['1_3_pitches_draw-melody'] = 0;
            if (!this.progress['1_4_pitches_does-it-sound-right']) this.progress['1_4_pitches_does-it-sound-right'] = 0;
            if (!this.progress['1_5_pitches_memory-game']) this.progress['1_5_pitches_memory-game'] = 0;
            
            console.log('Loaded progress data with new IDs:', this.progress);
            
            // Initialize highOrLowProgress from saved data
            this.highOrLowProgress = this.progress['1_1_pitches_high_or_low'] || 0;
            console.log('Initialized highOrLowProgress from localStorage:', this.highOrLowProgress);
          } else {
            // Initialize with empty progress object using new IDs
            this.progress = {
              '1_1_pitches_high_or_low': 0,
              '1_2_pitches_match-sounds': 0,
              '1_3_pitches_draw-melody': 0,
              '1_4_pitches_does-it-sound-right': 0,
              '1_5_pitches_memory-game': 0
            };
          }
          
          // Load progressive difficulty data
          const savedDifficulty = localStorage.getItem('lalumo_difficulty');
          if (savedDifficulty) {
            const difficultyData = JSON.parse(savedDifficulty);
            this.correctAnswersCount = difficultyData.correctAnswersCount || 0;
            this.unlockedPatterns = difficultyData.unlockedPatterns || ['up', 'down'];
          }
        } catch (e) {
          console.log('Could not load saved progress');
        }
        
        // Listen for pitch mode changes from the menu
        // Listen for the unified activity mode event
        window.addEventListener('set-activity-mode', (event) => {
          const { component, mode } = event.detail;
          
          // Only handle the event if it's for the pitches component
          if (component === 'pitches') {
            console.log('Received unified activity mode event for pitches:', mode);
            this.setMode(mode);
            
            // Update the unified activity mode in the Alpine store
            if (window.Alpine?.store) {
              window.Alpine.store('currentActivityMode', { component: 'pitches', mode });
            }
          }
        });
        
      // Set initial mode based on Alpine store
      if (this.$store.pitchMode) {
        this.mode = this.$store.pitchMode;
      } else {
        // Default to '1_1_pitches_high_or_low' and update the store
        this.$store.pitchMode = '1_1_pitches_high_or_low';
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
     * Reset the component state between mode changes
     * @activity common
     * @used-by all activities
     */
    resetState() {
      // Reset state for clean mode switching
      this.currentAnimation = null;
      this.showFeedback = false;
      this.feedback = '';
      this.isPlaying = false;
      
      console.log('MODSWITCH: State reset completed');
      
      this.currentSequence = [];
      this.userSequence = [];
      this.drawPath = [];
      this.correctAnswer = null;
      this.choices = [];
      this.gameMode = false;
      this.memoryFreePlay = false;
    },
    
    /**
     * Enhanced multi-touch long press handler
     * Allows long press to work with any finger, not just the first one
     * @activity common
     * @used-by NOWHERE
     * @todo implement multi touch long press catch, to use the last touch as normal press
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
          helpText = Alpine.store('app').getStringResource('play_melody', 'Play melody', 'Melodie abspielen');
          console.warn(`Pattern '${pattern}' not defined in helpTexts. Using fallback text.`);
        }
        
        // Always set the message, even if fallback is used
        this.helpMessage = helpText;
        // Use debug logging instead of direct console.log
        import('../utils/debug').then(({ debugLog }) => {
          debugLog('TOUCH', `Showing mascot message: ${helpText}`);
        });
        
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
     * @activity common
     * @used-by navigation
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
        
        // Convert the language setting to language codes for the help texts
        const language = languageSetting === 'german' ? 'de' : 'en';
        
        // Define a fallback text if no pattern text is found
        let helpText = '';
        
        // Define help texts for all patterns
        const helpTexts = {
          up: { en: 'Up', de: 'Hoch' },
          down: { en: 'Down', de: 'Runter' },
          wave: { en: 'Wavy', de: 'Wellen' },
          jump: { en: 'Random', de: 'Zufall' }
        };
        
        // Normalize pattern names (lowercase, remove spaces)
        const normalizedPattern = String(pattern).toLowerCase().trim();
        
        // Check if the pattern exists
        if (helpTexts[normalizedPattern]) {
          // If yes, get the corresponding text in the desired language or English as fallback
          helpText = helpTexts[normalizedPattern][language] || helpTexts[normalizedPattern]['en'];
        } else {
          // Fallback if the pattern was not found
          helpText = language === 'de' ? 'Klick' : 'Click';
          console.warn(`Pattern '${pattern}' not defined in helpTexts. Using fallback text.`);
        }
        
        // Always set the message, even if a fallback is used
        this.helpMessage = helpText;
        console.log('Mascot message set to:', helpText);
        
        // Use TTS if available
        try {
          // Try native Android TTS first
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
     * @activity common
     * @used-by startLongPress, startMultiTouchLongPress
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
     * @activity common
     * @used-by all activities
     */
    setMode(newMode) {
      console.log('MODSWITCH: Changing mode from', this.mode, 'to', newMode);
  
      // Clear any existing mascot timers and hide message when switching activities
      if (this.mascotShowTimer) {
        clearTimeout(this.mascotShowTimer);
        this.mascotShowTimer = null;
        console.log("MASCOT_CLEAR: Cleared show timer on mode switch");
      }
      if (this.mascotHideTimer) {
        clearTimeout(this.mascotHideTimer);
        this.mascotHideTimer = null;
        console.log("MASCOT_CLEAR: Cleared hide timer on mode switch");
      }
      // Hide any currently visible mascot message
      this.showMascot = false;
      console.log("MASCOT_CLEAR: Hidden mascot on mode switch to:", newMode);
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
      } 
      // New ID format handlers
      else if (newMode === '1_1_pitches_high_or_low') {
        // For high or low mode, initialize the highOrLowProgress from saved progress
        this.highOrLowProgress = this.progress['1_1_pitches_high_or_low'] || 0;
        console.log('High or Low mode activated with progress:', this.highOrLowProgress);
        // Load current stage based on progress
        setupHighOrLowMode_1_1(this);
      } else if (newMode === '1_2_pitches_match-sounds') {
        this.gameMode = false; // Start in free play mode
        this.setupMatchingMode_1_2(false); // Setup without playing sound
      } else if (newMode === '1_3_pitches_draw-melody') {
        this.setupDrawingMode_1_3(); // Drawing doesn't play sound by default
      } else if (newMode === '1_4_pitches_does-it-sound-right') {
        // Always generate a melody but don't play it yet (user will press play button)
        this.setupSoundHighOrLowMode_1_4(false); // Setup without auto-playing sound
      } else if (newMode === '1_5_pitches_memory-game') {
        this.gameMode = false; // Start in free play mode
        this.memoryFreePlay = true; // Enable free play
        this.setupMemoryMode_1_5(false); // Setup without playing sound
      }
      
      // Always show the mascot message for the current mode
      this.showContextMessage(); // Use our context-aware message function
      
      // Update progress tracking
      this.updateProgressPitches();
    },
    
    /**
     * Update the progress in localStorage based on user's progress
     * @activity common
     * @used-by all activities
     */
    updateProgressPitches() {
      // Get progress values from the new activity IDs
      const progressValues = [
        this.progress['1_1_pitches_high_or_low'] || 0,
        this.progress['1_2_pitches_match-sounds'] || 0,
        this.progress['1_3_pitches_draw-melody'] || 0,
        this.progress['1_4_pitches_does-it-sound-right'] || 0,
        this.progress['1_5_pitches_memory-game'] || 0
      ];
      
      // Calculate total progress (0-100%)
      const totalProgress = progressValues.reduce((sum, val) => sum + val, 0) / 5;
      console.log('Total progress updated:', totalProgress, 'Progress values:', progressValues);
      
      // Store progress in localStorage for persistence
      localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
    },
    
    /** ****************************************************
     * unused Functions
     ******************************************************** */

    
    /** *****************************************************
     * 1_1 High or Low Activity
     ******************************************************** */
    
    // ++++++++++ progress of migration to new structure


    /**
     * Determines the current difficulty stage for the High or Low activity
     * based on the number of correct answers.
     * @returns {number} The current stage (1-5)
     */
    // currentHighOrLowStage wurde in das Modul 1_1_high_or_low.js verschoben
    


    // ++++++++++ after here: TODO: migrate to new structure

    /**
     * Generates a tone (or pair of tones) for the High or Low activity
     * based on the current difficulty stage
     * @activity 1_1_high_or_low
     */
    generateHighOrLowTone() {
      const stage = currentHighOrLowStage(this);
      console.log('Generating High or Low tone for stage:', stage);
      
      // Define tone ranges for different stages (according to CONCEPT.md)
      // Fixed: High tones should be C6–B6 as specified in CONCEPT.md
      const lowTones = {
        1: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4'], // Stage 1: Basic low tones C4-F4
        2: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'], // Stage 2: Expanded low tones
        3: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'], // Stage 3: Same as stage 2
        4: ['F#4', 'G4', 'G#4', 'A4'], // Stage 4: Higher low tones
        5: ['G#4', 'A4', 'A#4', 'B4']  // Stage 5: Highest low tones
      };
      
      const highTones = {
        1: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6'], // Stage 1: Basic high tones C6-B6
        2: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6'], // Stage 2: High tones C6-B6
        3: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6'], // Stage 3: High tones C6-B6
        4: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6'], // Stage 4: Reduced high tones
        5: ['C6', 'C#6', 'D6', 'D#6']  // Stage 5: Further reduced high tones
      };
      
      // Don't play the same tone twice in a row
      let newTone;
      do {
        // Randomly choose high or low
        newTone = Math.random() < 0.5 ? 'high' : 'low';
      } while (newTone === this.currentHighOrLowTone && stage < 3);
      
      this.currentHighOrLowTone = newTone;
      console.log('Selected tone type:', newTone);
      
      // For stages 3 and above, we need two tones with the second one being higher or lower
      if (stage >= 3) {
        // For two-tone stages, we'll decide if the second tone is higher or lower than the first
        this.highOrLowSecondTone = Math.random() < 0.5 ? 'higher' : 'lower';
        console.log('Second tone will be:', this.highOrLowSecondTone);
      } else {
        this.highOrLowSecondTone = null;
      }
      
      // Reset the played flag
      this.highOrLowPlayed = false;
    },
    
    /**
     * Save progress for the High or Low activity to localStorage
     * @activity 1_1_high_or_low
     */
    saveProgress_1_1() {
      try {
        // Make sure highOrLowProgress is synced to the progress object before saving
        this.progress['1_1_pitches_high_or_low'] = this.highOrLowProgress;
        
        // Save the progress object to localStorage
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
        console.log('Progress saved successfully:', this.progress);
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    },
    
    /**
     * Returns appropriate tone arrays for a given stage
     * @param {number} stage - The current activity stage
     * @returns {Object} Object containing lowTones and highTones arrays for the stage
     * @activity 1_1_high_or_low
     */
    getTonesForStage(stage) {
      // Define tone ranges for different stages (according to CONCEPT.md)
      // Fixed: Low tones should be C4–B4 as specified in CONCEPT.md, not C3–B3
      const lowTones = {
        1: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4'],
        2: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'],
        3: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'],
        4: ['D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
        5: ['E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']
      };
      
      // Fixed: High tones should be C6–B6 as specified in CONCEPT.md
      const highTones = {
        1: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6'],
        2: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6'],
        3: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6'],
        4: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6'],
        5: ['C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6']
      };
      
      // Get appropriate tone arrays based on current stage
      return {
        lowTones: lowTones[stage] || lowTones[1],
        highTones: highTones[stage] || highTones[1]
      };
    },
    
    /**
     * Get a random tone for a specific pitch type (high or low) and stage
     * @param {string} type - 'high' or 'low'
     * @param {number} stage - The current activity stage
     * @returns {string} A random tone of the specified type
     * @activity 1_1_high_or_low
     */
    getRandomTone1_1(type, stage) {
      // Initialize tracking variables if they don't exist
      if (this.previousExactTone === undefined) {
        this.previousExactTone = null;
      }
      
      const tones = this.getTonesForStage(stage);
      const toneArray = type === 'high' ? tones.highTones : tones.lowTones;
      
      debugLog('[1_1_RANDOM]', `Selecting tone from ${type} range. Previous tone: ${this.previousExactTone || 'none'}`); 
      
      // If we have very few tones and previous tone exists, make sure we avoid repeating it
      if (toneArray.length > 1 && this.previousExactTone) {
        // Filter out the previous tone to avoid repetition
        const availableTones = toneArray.filter(tone => tone !== this.previousExactTone);
        const randomTone = availableTones[Math.floor(Math.random() * availableTones.length)];
        debugLog('[1_1_RANDOM]', `Selected non-repeating tone: ${randomTone}`); 
        return randomTone;
      }
      
      // If only one tone available or no previous tone, use standard random selection
      const randomTone = toneArray[Math.floor(Math.random() * toneArray.length)];
      debugLog('[1_1_RANDOM]', `Selected tone: ${randomTone} from ${toneArray.length} options`);
      return randomTone;
    },
    
    /**
     * Generates a High or Low tone sequence based on the current stage
     * @param {number} stage - The current activity stage
     * @activity 1_1_high_or_low
     */
    generate1_1HighOrLowSequence(stage) {
      console.log('Generating new high or low tone sequence for stage:', stage);
      
      // Initialize tracking variables if they don't exist
      if (!this.lastHighLowSequence) {
        this.lastHighLowSequence = null;
      }
      if (this.previousToneRange === undefined) {
        this.previousToneRange = null;
      }
      if (this.consecutiveSameRangeCount === undefined) {
        this.consecutiveSameRangeCount = 0;
      }
      
      // Log current state before selection
      debugLog('[1_1_RANDOM]', `Before selection: count=${this.consecutiveSameRangeCount}, prevRange=${this.previousToneRange || 'none'}, prevTone=${this.previousExactTone || 'none'}`);
      
      // Check if we need to force a switch due to consecutive same range limits
      let forcedRangeSwitch = false;
      let preferredRange = null;
      
      if (this.consecutiveSameRangeCount >= 3 && this.previousToneRange) {
        forcedRangeSwitch = true;
        preferredRange = this.previousToneRange === 'high' ? 'low' : 'high';
        debugLog('[1_1_RANDOM]', `ERZWUNGEN: Wechsel zu entgegengesetztem Bereich (${preferredRange}). Limit erreicht.`);
      }
      
      // Get random tones using the helper function
      const randomLowTone = this.getRandomTone1_1('low', stage);
      const randomHighTone = this.getRandomTone1_1('high', stage);
      
      if (stage >= 3) {
        // For two-tone stages, create a sequence with two tones
        // First tone is always C5 as specified in CONCEPT.md
        // TODO: unless progress > 3, then it can be +-6 halftones
        const firstTone = 'C5';
        
        let secondTone, useHighTone, isHigher;
        let attempts = 0;
        const maxAttempts = 10; // Prevent infinite loop
        
        // Keep generating until we get a valid puzzle that's not a repeat
        do {
          // Get a random tone with range enforcement if needed
          if (forcedRangeSwitch) {
            useHighTone = preferredRange === 'high';
          } else {
            useHighTone = Math.random() < 0.5;
          }
          secondTone = useHighTone ? randomHighTone : randomLowTone;
          
          // Ensure second tone is never the same as first tone
          if (secondTone === firstTone) {
            continue;
          }
          
          // Determine if second tone is higher or lower
          const secondToneOctave = parseInt(secondTone.match(/\d+/)[0], 10);
          const secondToneNote = secondTone.replace(/\d+/, '');
          const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const firstToneNoteIndex = noteOrder.indexOf('C');
          const secondToneNoteIndex = noteOrder.indexOf(secondToneNote);
          
          if (secondToneOctave > 5) {
            isHigher = true;
          } else if (secondToneOctave < 5) {
            isHigher = false;
          } else {
            // Same octave, compare note positions
            isHigher = secondToneNoteIndex > firstToneNoteIndex;
          }
          
          // Check if this is different from the last puzzle
          const expectedAnswer = isHigher ? 'high' : 'low';
          const isSameAsPrevious = this.lastHighLowSequence && 
                                this.lastHighLowSequence.secondTone === secondTone && 
                                this.lastHighLowSequence.expectedAnswer === expectedAnswer;
                                
          // Exit if we have a different puzzle or we've tried too many times
          if (!isSameAsPrevious || ++attempts >= maxAttempts) {
            break;
          }
          
        } while (true);
        
        // Log if we had to make multiple attempts
        if (attempts > 0) {
          console.log(`Generated different puzzle after ${attempts} attempts`);
        }
        
        // We've already calculated isHigher in the loop above
        // Just need to set the feedback and store the sequence
        
        this.highOrLowSecondTone = isHigher ? 'higher' : 'lower';
        console.log(`Second tone ${secondTone} is ${this.highOrLowSecondTone} than first tone ${firstTone}`);
        
        // Store the sequence with correct comparison information
        const expectedAnswer = isHigher ? 'high' : 'low';
        this.currentHighOrLowSequence = { 
          firstTone, 
          secondTone, 
          expectedAnswer 
        };
        
        // Store this sequence as the last one to avoid repetition in next round
        this.lastHighLowSequence = {
          firstTone,
          secondTone,
          expectedAnswer
        };
        
        // Update tracking variables for range repetition constraint
        const currentToneRange = isHigher ? 'high' : 'low';
        
        // Update consecutive same range counter
        if (this.previousToneRange === currentToneRange) {
          this.consecutiveSameRangeCount++;
        } else {
          this.consecutiveSameRangeCount = 1;
        }
        
        // Store current values for next comparison
        this.previousToneRange = currentToneRange;
        this.previousExactTone = secondTone;
        
        debugLog('[1_1_RANDOM]', `After selection: count=${this.consecutiveSameRangeCount}, range=${currentToneRange}, tone=${secondTone}`);
        console.log('HIGH_LOW: Saved current puzzle for repetition check in next round');
      } else {
        // For single tone stages, randomly choose high or low with consecutive limit constraint
        let currentToneRange;
        
        if (forcedRangeSwitch) {
          currentToneRange = preferredRange;
        } else {
          currentToneRange = Math.random() < 0.5 ? 'high' : 'low';
        }
        
        this.currentHighOrLowTone = currentToneRange;
        
        // Choose the appropriate tone based on high/low choice
        const toneToPlay = this.currentHighOrLowTone === 'high' ? randomHighTone : randomLowTone;
        
        // Store the single tone and the expected answer
        this.currentHighOrLowSequence = { toneToPlay, expectedAnswer: this.currentHighOrLowTone };
        
        // Update tracking variables for range repetition constraint
        if (this.previousToneRange === currentToneRange) {
          this.consecutiveSameRangeCount++;
        } else {
          this.consecutiveSameRangeCount = 1;
        }
        
        // Store current values for next comparison
        this.previousToneRange = currentToneRange;
        this.previousExactTone = toneToPlay;
        
        debugLog('[1_1_RANDOM]', `After selection (single tone): count=${this.consecutiveSameRangeCount}, range=${currentToneRange}, tone=${toneToPlay}`);
        console.log('Generated tone sequence with expected answer:', this.currentHighOrLowTone);
      }
    },
    
    /**
     * Plays a tone or sequence of tones for the High or Low activity
     * Called when the play button is clicked
     * @activity 1_1_high_or_low
     */
    async playHighOrLowTone() {
      if (this.isPlaying) return; // Prevent multiple plays
      
      this.isPlaying = true;
      this.gameStarted = true; // Mark the game as explicitly started
      const stage = currentHighOrLowStage(this);
      console.log('Playing High or Low tone for stage:', stage, 'gameStarted:', this.gameStarted);
      
      try {
        // First, ensure the audio engine is initialized
        await audioEngine.initialize();
        
        // Only generate new tones if not already stored or if explicitly requested
        if (!this.currentHighOrLowSequence) {
          this.generate1_1HighOrLowSequence(stage);
        }
        
        // For two-tone stages (3 and above)
        if (stage >= 3) {
          // Play the stored sequence of two tones
          const { firstTone, secondTone, expectedAnswer } = this.currentHighOrLowSequence;
          
          // Make sure highOrLowSecondTone is synchronized with the stored sequence
          this.highOrLowSecondTone = expectedAnswer === 'high' ? 'higher' : 'lower';
          console.log('Playing first tone:', firstTone, 'followed by', this.highOrLowSecondTone, 'tone:', secondTone, 'with expected answer:', expectedAnswer);
          
          // Play the first tone and await it
          await this.playTone(firstTone, 800); // Longer duration for first tone
          
          // Then play the second tone after a short pause
          setTimeout(async () => {
            await this.playTone(secondTone, 800);
            
            setTimeout(() => {
              this.isPlaying = false;
              this.highOrLowPlayed = true;
            }, 900);
          }, 1000);  
        } else {
          // For single tone stages, play the stored tone
          const { toneToPlay } = this.currentHighOrLowSequence;
          console.log('Playing single tone:', toneToPlay);
          
          // Play the tone and await it
          await this.playTone(toneToPlay, 800); // Longer duration for single tone
          
          setTimeout(() => {
            this.isPlaying = false;
            this.highOrLowPlayed = true;
          }, 900);
        }
      } catch (error) {
        console.error('Error in playHighOrLowTone:', error);
        this.isPlaying = false;
      }
    },
    
    /**
     * Checks the user's answer for the High or Low activity
     * @param {string} answer - The user's answer ('high' or 'low')
     * @activity 1_1_high_or_low
     */
    checkHighOrLowAnswer(answer) {
      if (this.isPlaying) {
        // If a tone is currently playing, ignore the answer
        return;
      }
      
      // If the game hasn't been explicitly started (by clicking the play button)
      if (!this.gameStarted) {
        console.log('Button pressed without starting the game, playing a tone matching the button');
        
        // Determine the current stage based on progress
        const stage = currentHighOrLowStage(this);
        
        // Get a random tone matching the pressed button (low or high)
        const randomTone = this.getRandomTone1_1(answer, stage);
        
        console.log(`Playing random ${answer} tone (button ${answer === 'low' ? 'left' : 'right'}):`, randomTone);
        
        // Play the random tone without checking the answer
        audioEngine.playNote(randomTone.toLowerCase(), 0.3);
        
        return; // Important: exit without checking the answer
      }
      
      // If the game is started but the tone hasn't been played yet, play the sequence first
      if (!this.highOrLowPlayed) {
        // Play a tone first, then check the answer
        this.playHighOrLowTone().then(() => {
          // After the tone has finished playing, check the answer
          this.checkHighOrLowAnswer(answer);
        });
        return;
      }
      
      const stage = currentHighOrLowStage(this);
      console.log('Checking High or Low answer:', answer, 'for stage:', stage);
      
      let isCorrect = false;
      let correctHiOrLowAnswer = '';
      
      // Different logic based on stage
      if (stage >= 3) {
        // Guard against null sequence which can happen when clicking rapidly
        if (!this.currentHighOrLowSequence) {
          console.warn('No current sequence available. Ignoring this answer.');
          return;
        }
        
        // For two-tone stages, check if the user correctly identified if the second tone was higher or lower
        const expectedAnswer = this.currentHighOrLowSequence.expectedAnswer;
        isCorrect = answer === expectedAnswer;
        
        correctHiOrLowAnswer = expectedAnswer;
        console.log('Checking answer:', answer, 'against expected:', expectedAnswer, 'isCorrect:', isCorrect);
      } else {
        // Guard against null sequence which can happen when clicking rapidly
        if (!this.currentHighOrLowSequence) {
          console.warn('No current sequence available. Ignoring this answer.');
          return;
        }
        
        // For single tone stages, use the stored expected answer for consistency
        const expectedAnswer = this.currentHighOrLowSequence?.expectedAnswer || this.currentHighOrLowTone;
        isCorrect = answer === expectedAnswer;
        correctHiOrLowAnswer = expectedAnswer;
        console.log('Checking answer:', answer, 'against expected:', expectedAnswer);
      }
      
      // Handle feedback
      if (isCorrect) {
        // Correct answer: increment progress
        this.highOrLowProgress = (this.highOrLowProgress || 0) + 1;
        
        // Update stored progress
        this.progress['1_1_pitches_high_or_low'] = this.highOrLowProgress;
        this.saveProgress_1_1();
        console.log('Updated progress in localStorage:', this.highOrLowProgress);
        
        // Play success sound
        audioEngine.playNote('success', 1, undefined, 0.4);
        console.log('AUDIO: Playing success feedback sound with audio engine');
        
        // Create and show rainbow success animation
        
        // Auto play next tone after 2 seconds
        setTimeout(() => {
          this.playHighOrLowTone();
        }, 2000);
        showRainbowSuccess();
        
        // Clear the current sequence so a new one will be generated next time
      // Use setTimeout to avoid issues with rapid clicking
      setTimeout(() => {
        this.currentHighOrLowSequence = null;
      }, 100);
        
        // Check if we've reached a new stage
        const newStage = currentHighOrLowStage(this);
        const previousStage = stage;
        
        if (newStage > previousStage) {
          // We've reached a new stage
          let stageMessage = '';
          
          switch(newStage) {
            case 2:
              stageMessage = this.$store.strings?.high_low_stage2_unlocked || ':celebration: Stage 2 reached! The tones are now closer together!';
              break;
            case 3:
              stageMessage = this.$store.strings?.high_low_stage3_unlocked || '🎵 Stage 3 reached! You now hear two tones in sequence!';
              break;
            case 4:
              stageMessage = this.$store.strings?.high_low_stage4_unlocked || '🚀 Stage 4 reached! The tones are even closer together!';
              break;
            case 5:
              stageMessage = this.$store.strings?.high_low_stage5_unlocked || '🏆 Master level reached! Ultimate challenge unlocked!';
              break;
          }
          
          // Show stage progression message
          this.feedback = stageMessage;
        } else {
          // Regular correct answer feedback
          if (stage >= 3) {
            // For comparison stages
            this.feedback = (this.$store.strings?.high_or_low_correct_comparison || 'Correct! The second tone was {0}!')
              .replace('{0}', correctHiOrLowAnswer === 'high' ? 
                (this.$store.strings?.high_choice || 'higher') : 
                (this.$store.strings?.low_choice || 'lower'));
          } else {
            // For single tone stages
            this.feedback = (this.$store.strings?.high_or_low_correct_single || 'Correct! The tone was {0}!')
              .replace('{0}', correctHiOrLowAnswer === 'high' ? 
                (this.$store.strings?.high_choice || 'high') : 
                (this.$store.strings?.low_choice || 'low'));
          }
        }
      } else {
        // Wrong answer
        // Play error sound
        audioEngine.playNote('try_again', 1.0);
        console.log('AUDIO: Playing try_again feedback sound with audio engine');
        
        // play tone again after 2 seconds
        setTimeout(() => {
          this.playHighOrLowTone();
        }, 2000);

        if (stage >= 3) {
          // For comparison stages
          this.feedback = (this.$store.strings?.high_or_low_wrong_comparison || 'Try again. The second tone was {0}.')
            .replace('{0}', correctHiOrLowAnswer === 'high' ? 
              (this.$store.strings?.high_choice || 'higher') : 
              (this.$store.strings?.low_choice || 'lower'));
        } else {
          // For single tone stages
          this.feedback = (this.$store.strings?.high_or_low_wrong_single || 'Try again. The tone was {0}.')
            .replace('{0}', correctHiOrLowAnswer === 'high' ? 
              (this.$store.strings?.high_choice || 'high') : 
              (this.$store.strings?.low_choice || 'low'));
        }
      }
      
      // Show feedback
      this.showFeedback = true;
      
      // Clear any existing timer
      if (this.highOrLowFeedbackTimer) {
        clearTimeout(this.highOrLowFeedbackTimer);
      }
      
      // Hide feedback after a delay
      this.highOrLowFeedbackTimer = setTimeout(() => {
        this.showFeedback = false;
        
        // Generate a new tone after feedback is hidden
        this.generateHighOrLowTone();
      }, 2000);
    },
    
    /**
     * Play a tone using the central audio engine
     * @param {string} note - Note name (e.g., 'C4', 'D#3')
     * @param {number} duration - Duration in milliseconds
     * @activity 1_1_high_or_low
     */
    async playTone(note, duration = 800) {
      try {
        console.log(`Playing tone ${note} for ${duration}ms`);
        
        // Make sure audio engine is initialized
        await audioEngine.initialize();
        
        // Convert duration from milliseconds to seconds for Tone.js
        const durationSeconds = duration / 1000;
        
        // Play the note with the central audio engine
        audioEngine.playNote(note, durationSeconds);
        
        return true;
      } catch (error) {
        console.error('Error playing tone:', error);
        return false;
      }
    },
    

    /**
     * Play a melody for the current activity
     * This is a generic melody player used by multiple activities
     * 
     * @activity common
     * @used_by 1_2_match_sounds
     * @used_by 1_4_pitches_does-it-sound-right
     * @used_by 1_5_pitches_memory-game
     * @param {boolean} generateNew - Whether to generate a new melody (true) or replay the current one (false)
     */
    playMelody(generateNew = true) {
      console.log(`AUDIO: playMelody called with generateNew=${generateNew}, mode=${this.mode}`);
      
      // Based on the current activity mode, handle appropriately
      if (this.mode === '1_4_pitches_does-it-sound-right') {
        // For Sound Judgment activity
        if (!this.gameMode) {
          console.log('SOUND JUDGMENT: In practice mode, need to start game');
          this.startSoundJudgmentGame();
          return; // startSoundJudgmentGame will handle playing the melody
        }
      }
      
      // We're in game mode now, continue with normal melody playback
      
      // Stoppe zuerst alle aktuellen Sounds, um Überlagerungen zu vermeiden
      this.stopCurrentSound();
      
      // Hide any previous feedback
      this.showFeedback = false;
      
      // Aktualisiere UI-Status: Buttons deaktivieren während der Wiedergabe
      document.querySelectorAll('.play-button').forEach(btn => {
        btn.classList.add('playing');
        btn.disabled = true;
      });
      
      // Kurze Pause einfügen, um sicherzustellen, dass vorherige Sounds gestoppt wurden
      setTimeout(() => {
        // Generate a new melody if requested
        if (generateNew) {
          // Select new random animal images only when generating a new melody
          // This ensures the animals only change when the user answers correctly or enters the activity
          this.selectRandomAnimalImages();
          if (!this.generateSoundHighOrLowMelody()) {
            console.error('AUDIO_ERROR: Failed to generate sound judgment melody');
            
            // UI-Status zurücksetzen
            document.querySelectorAll('.play-button').forEach(btn => {
              btn.classList.remove('playing');
              btn.disabled = false;
            });
            return;
          }
          
          console.log('AUDIO: Generated new melody with ID:', this.currentMelodyId);
          // Play the newly generated melody with the melody ID
          this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
        } 
        // Play the existing melody if we're not generating a new one
        else if (this.currentSequence && this.currentSequence.length > 0) {
          console.log('AUDIO: Replaying existing melody with ID:', this.currentMelodyId);
          this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
        } 
        // Handle case where there's no melody to play
        else {
          console.error('AUDIO_ERROR: No sequence to play for sound judgment activity');
          
          // Try to generate a melody as fallback
          if (this.generateSoundHighOrLowMelody()) {
            this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
          } else {
            // Reset UI if we can't play anything
            document.querySelectorAll('.play-button').forEach(btn => {
              btn.classList.remove('playing');
              btn.disabled = false;
            });
          }
        }
        
        // Aktualisiere Melodie-Name in der UI
        document.querySelectorAll('.sound-status').forEach(el => {
          el.textContent = this.currentMelodyName || 'Melodie wird abgespielt...';
        });
      }, 50); // Kurze Verzögerung, um sicherzustellen, dass stopCurrentSound vollständig ausgeführt wurde
    },
    

    /**
     * Generate an ascending melody starting from a random note
     * @activity 1_1_high_or_low
     * @returns {Array} The generated pattern
     */
    generateUpPattern() {
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
     * @activity 1_1_high_or_low
     * @returns {Array} The generated pattern
     */
    generateDownPattern() {
      // Use a higher start index to ensure there's enough room to go down
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
      
      // Debug output of the complete melody
      console.log('Down pattern complete:', pattern.join(', '));
      
      return pattern;
    },
    
    /**
     * Generate a wavy pattern with only two alternating notes
     * @activity 1_1_high_or_low
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
    
 





    /** *****************************************************
     * 1_2 Match Sounds Activity
     ******************************************************** */
    
    /**
     * Setup for the matching mode
     * @activity 1_2_match_sounds
     */
    setupMatchingMode_1_2(playSound = false, generateNew = true) {
      this.animationInProgress = false;
      this.showActivityIntroMessage('match');
      this.updateMatchingBackground(); // Update background based on progress
      this.updateMatchSoundsPitchCardLayout(); // Aktualisiere Pitch-Card-Layout basierend auf Freischaltungsstatus
      
      // If not in game mode, allow free exploration of all patterns
      if (!this.gameMode) {
        // In free play mode, do nothing special - user can click any pattern
        return;
      }
      
      // Game mode: use only unlocked patterns
      if (generateNew) {
        // Only use unlocked patterns for the game
        // Check if pattern was forced (e.g., after unlock) before random selection
        const availableTypes = this.unlockedPatterns;
        let selectedType;
        if ((this.currentProgress == 10 || this.currentProgress == 20) && this.correctAnswer && availableTypes.includes(this.correctAnswer)) {
          // Use forced pattern (newly unlocked wave/jump)
          selectedType = this.correctAnswer;
          console.log('PATTERN_FORCE_DEBUG: Using forced pattern:', selectedType);
          
          // Reset consecutive counter for forced patterns
          if (selectedType !== this.lastSelectedPatternType) {
            this.consecutivePatternCount = 1;
            this.lastSelectedPatternType = selectedType;
          }
        } else {
          // Random selection from available patterns, but avoid more than 3 of the same type in a row
          let attempts = 0;
          const maxAttempts = 10; // Prevent infinite loop
          
          do {
            selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            attempts++;
            
            // If we've tried too many times or have different patterns, break the loop
            if (attempts >= maxAttempts || selectedType !== this.lastSelectedPatternType || this.consecutivePatternCount < 3) {
              break;
            }
          } while (selectedType === this.lastSelectedPatternType && this.consecutivePatternCount >= 3);
          
          // Update pattern tracking
          if (selectedType === this.lastSelectedPatternType) {
            this.consecutivePatternCount++;
          } else {
            this.consecutivePatternCount = 1;
            this.lastSelectedPatternType = selectedType;
          }
          
          this.correctAnswer = selectedType;
        }
        
        // Generate the appropriate melody for the selected type
        let pattern;
        if (selectedType === 'up') {
          pattern = this.generateUpPattern();
        } else if (selectedType === 'down') {
          pattern = this.generateDownPattern();
        } else if (selectedType === 'wave') {
          pattern = this.generateWavyPattern();
        } else if (selectedType === 'jump') {
          pattern = this.generateJumpyPattern();
        }
        
        // Store the generated melody for later replay
        this.currentSequence = pattern;
        this.matchingPattern = pattern; // Specifically for match mode
        
        console.log(`Pattern selected: ${this.correctAnswer}, consecutive count: ${this.consecutivePatternCount}`);
      }
      
      // Only play the sound if explicitly requested
      if (playSound) {
        // Use the stored melody
        const pattern = this.matchingPattern || this.currentSequence;
        
        // Play melody without animating the correct answer element
        this.isPlaying = true;
        
        // Play notes in sequence
        const noteArray = [...pattern];
        this.playNoteSequence(noteArray, 0);
      }
    },
    
    /**
     * Check if the user selected the correct image
     * @param {string} selected - User's selection
     * @activity 1_2_match_sounds
     */
    checkMatch(selected) {
      // First stop any currently playing melody
      this.stopCurrentSound();
      
      // Show the selected animation
      this.animatePatternElement(selected);
      
      // In free play mode, just play the selected pattern
      if (!this.gameMode) {
        // Just play the selected pattern and provide minimal feedback
        this.activity1_2_matchSoundsPlaySequence(selected);
        return;
      }
      
      // Game mode: check if answer is correct
      const isCorrect = selected === this.correctAnswer;
      
      // Use global feedback store for messages
      if (isCorrect) {
        Alpine.store('feedback').showMessage(this.$store.strings?.match_sounds_correct || 'Great job! That\'s correct!');
      } else {
        Alpine.store('feedback').showMessage(this.$store.strings?.match_sounds_incorrect || 'Not quite. Let\'s try again!');
      }
      
      // Trigger sound feedback using the central audio engine
      audioEngine.playNote(isCorrect ? 'success' : 'try_again', 1.0);
      console.log(`AUDIO: Playing ${isCorrect ? 'success' : 'try_again'} feedback sound using audio engine`);
      
      // Show appropriate animation based on result
      if (isCorrect) {
        // Track the correct answer for progressive difficulty
        this.correctAnswersCount++;
        this.saveDifficultyProgress();
        this.checkPatternUnlocks();
        
        // Create and show rainbow success animation
        showRainbowSuccess();
        
        // Update progress with new ID format only
        if (!this.progress['1_2_pitches_match-sounds']) {
          this.progress['1_2_pitches_match-sounds'] = 0;
        }
        // Increment progress counter
        this.progress['1_2_pitches_match-sounds'] += 1;
        const currentProgress = this.progress['1_2_pitches_match-sounds'];
        // Synchronize currentProgress property with the actual progress value
        this.currentProgress = currentProgress;
        
        console.log('PROGRESS_SYNC: Updated match progress:', currentProgress, 'currentProgress synced:', this.currentProgress);
        
        // Important thresholds for background changes
        if (currentProgress === 10 || currentProgress === 20) {
          console.log(`Milestone reached: ${currentProgress} correct answers - updating background`);
        }
        
        // Update background based on new progress level
        this.updateMatchingBackground();
        
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
          this.setupMatchingMode_1_2(true, true);
          console.log('Auto-progressed to next melody in match mode');
        }
        // For wrong answers, don't generate new melody so user can try the same one again
      }, 2000);
    },

    /**
     * Save difficulty progress to localStorage
     * @activity 1_2_match_sounds
     */
    saveDifficultyProgress() {
      try {
        const difficultyData = {
          correctAnswersCount: this.correctAnswersCount,
          unlockedPatterns: this.unlockedPatterns
        };
        localStorage.setItem('lalumo_difficulty', JSON.stringify(difficultyData));
      } catch (e) {
        console.log('Could not save difficulty progress');
      }
    },
    
    /**
     * Check if new patterns should be unlocked based on correct answers
     * @activity 1_2_match_sounds
     */
    checkPatternUnlocks() {
      let unlocked = false;
      
      // Unlock wave pattern at 10 correct answers
      if (this.correctAnswersCount >= 10 && !this.unlockedPatterns.includes('wave')) {
        this.unlockedPatterns.push('wave');
        this.correctAnswer = 'wave'; // PATTERN_FORCE_DEBUG: Force wave pattern next
        
        unlocked = true;
        const message = window.Alpine?.store('strings')?.mascot_wave_unlocked || 'Great! You unlocked wavy melodies! :wave:';
        this.showMascotMessage(message);
      }
      
      // Unlock jump pattern at 20 correct answers  
      if (this.correctAnswersCount >= 20 && !this.unlockedPatterns.includes('jump')) {
        this.unlockedPatterns.push('jump');
        this.correctAnswer = 'jump'; // PATTERN_FORCE_DEBUG: Force jump pattern next
        
        unlocked = true;
        const message = window.Alpine?.store('strings')?.mascot_jump_unlocked || 'Amazing! You unlocked random jump melodies! :frog:';
        this.showMascotMessage(message);
      }
      
      // Wenn ein neues Pattern freigeschaltet wurde und wir im Match-Sounds-Modus sind,
      // aktualisieren wir das Layout der Pitch-Cards
      if (unlocked && this.mode === '1_2_pitches_match-sounds') {
        console.log('Pattern unlocked, updating Match Sounds layout');
        this.updateMatchSoundsPitchCardLayout();
      }
      
      if (unlocked) {
        this.saveDifficultyProgress();
      }
    },

    /**
     * Generate a random jumpy pattern with unpredictable jumps
     * @activity 1_2_match_sounds
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
     * Shows context-specific messages based on current activity and stage
     * Displays instructions and guidance to the user via the mascot
     * @activity common
     * @used-by all activities
     */
    showContextMessage() {
      let message = '';
      const language = localStorage.getItem('lalumo_language') || 'english';
      
      // Provide context-specific instructions based on current mode
      if (this.mode === '1_1_pitches_high_or_low') {
        // For the High or Low activity, show different instructions based on the current stage
        const stage = currentHighOrLowStage(this);
        console.log('Showing context message for High or Low stage:', stage);
        
        // Get the appropriate message based on stage and language
        if (this.$store.strings) {
          // high_or_low_intro_stage1, high_or_low_intro_stage2, high_or_low_intro_stage3, high_or_low_intro_stage4, high_or_low_intro_stage5
          const stageKey = `high_or_low_intro_stage${stage}`;
          message = this.$store.strings[stageKey];
        }
        
        // TODO: no Fallbacks if string is not found
        // add this to strings.xml
        if (!message) {
          switch(stage) {
            case 1:
            case 2:
              // Single tone stages
              message = language === 'german' ? 
                'Höre den Ton! Ist er hoch oder tief? Drücke ▶️ um das Spiel zu starten!' : 
                'Listen to the tone! Is it high or low? Press ▶️ for the game!';
              break;
            case 3:
            case 4:
            case 5:
              // Two-tone comparison stages
              message = language === 'german' ? 
                'Höre beide Töne! Ist der zweite Ton höher oder tiefer?' : 
                'Listen to both tones! Is the second one higher or lower?';
              break;
          }
        }
      } else if (this.mode === '1_2_pitches_match-sounds') {
        // TODO: use match_sounds_practice from strings.xml
        if (!this.gameMode) {
          message = language === 'german' ? 
            'Klicke auf die Bilder zum Üben. Drücke ▶️ um das Spiel zu starten!' : 
            'Click on pictures to practice. Press ▶️ to start the game!';
        } else {
          message = language === 'german' ? 
            'Höre zu und wähle das richtige Bild!' : 
            'Listen and choose the right picture!';
        }
      } else if (this.mode === '1_4_pitches_does-it-sound-right') {
        message = language === 'german' ? 
          'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?' : 
          'Listen to the melody! Does it sound right? Or is there a wrong note?';
      } else if (this.mode === '1_5_pitches_memory-game') {
        if (this.memoryFreePlay) {
          message = language === 'german' ? 
            'Drücke frei auf die Tasten zum Üben. Drücke ▶️ um das Spiel zu starten!' : 
            'Press keys freely to practice. Press ▶️ to start the game!';
        } else {
          message = language === 'german' ? 
            'Höre dir die Melodie an und tippe dann auf die farbigen Tasten in der gleichen Reihenfolge!' : 
            'Listen to the melody, then tap the colored keys in the same order!';
        }
      } else if (this.mode === '2_5_chords_characters') {
        message = language === 'german' ? 
          'Jede Chordart hat ihre eigene Persönlichkeit! Höre dir die Chordart an und wähle das passende Bild!' : 
          'Each chord type has its own personality! Listen to the chord and match it to the right character!';
      }
      
      // Show the message using the existing function
      if (message) {
        this.showMascotMessage(message, this.mode, 0.5);
      }
    },
    
    /**
     * Initialize speech synthesis for voice feedback
     * @activity common
     * @used-by all activities
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
     * @activity common
     * @used-by all activities
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
     * Hide mascot message and save preference to not show help messages
     * @activity common
     * @used-by all activities
     */
    hideAndSaveMascotPreference() {
      // Hide the mascot message
      this.showMascot = false;
      
      // Update settings to not show help messages
      this.$store.mascotSettings.showHelpMessages = false;
      
      // Save the settings to localStorage
      try {
        localStorage.setItem('lalumo_mascot_settings', JSON.stringify(this.mascotSettings));
        console.log('Saved mascot settings, help messages disabled');
      } catch (error) {
        console.error('Error saving mascot settings:', error);
      }
    },
    
    /**
     * Toggles the display of help messages and saves the preference
     * @param {boolean} show - Whether to show or hide help messages
     * @return {boolean} The new help messages setting
     */
    toggleHelpMessages(show = null) {
      // If no value provided, toggle the current value
      if (show === null) {
        this.$store.mascotSettings.showHelpMessages = !this.$store.mascotSettings.showHelpMessages;
      } else {
        this.$store.mascotSettings.showHelpMessages = show;
      }
      
      // When enabling, clear the history of seen messages to allow them to appear again
      if (this.$store.mascotSettings.showHelpMessages) {
        this.$store.mascotSettings.seenActivityMessages = {};
      }
      
      // Save settings to localStorage
      try {
        localStorage.setItem('lalumo_mascot_settings', JSON.stringify(this.mascotSettings));
        console.log(`Help messages ${this.$store.mascotSettings.showHelpMessages ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error saving mascot settings:', error);
      }
      
      return this.$store.mascotSettings.showHelpMessages;
    },
    
    /**
      * Show a help message and speak it if text-to-speech is available
      * @param {string} message - The message to display and speak
      * @param {string} activityId - Optional ID of the current activity to prevent duplicate messages
      */
    showMascotMessage(message, activityId = null, delaySeconds = 2) {

      // check if message is empty, and if so, show a log entry error with traceback:
      if (!message || message.trim() === '' || message === 'undefined' || message === 'null') {
        console.error('showMascotMessage called with empty message', new Error().stack);
        return;
      }
      
      // Check if we should show help messages based on user settings
      if (!this.$store.mascotSettings.showHelpMessages) {
        console.log('Skipping help message - user has disabled help messages');
        return;
      }
      
      // Check if we've already shown a message for this activity
      if (activityId && this.$store.mascotSettings.seenActivityMessages[activityId]) {
        console.log(`Skipping help message for ${activityId} - already shown once`);
        return;
      }
      
      // Mark this activity as having shown a message
      if (activityId) {
        this.$store.mascotSettings.seenActivityMessages[activityId] = true;
        // Save settings
        try {
          localStorage.setItem('lalumo_mascot_settings', JSON.stringify(this.mascotSettings));
        } catch (error) {
          console.error('Error saving help message settings:', error);
        }
      }
      
      // Clear any existing feedback timers
      if (this.feedbackTimer) {
        clearTimeout(this.feedbackTimer);
        this.feedbackTimer = null;
      }
      
      // Store message in helpMessage variable
      this.helpMessage = message;
      
      // Display message in the unified feedback system using global store
      Alpine.store('feedback').feedbackMessage = message;
      Alpine.store('feedback').showFeedback = true;
      
      console.log(`HELP_MESSAGE: Showing after ${delaySeconds}s delay:`, message);
      
      // Auto-hide after 10 seconds with ease transition
      this.feedbackTimer = setTimeout(() => {
        Alpine.store('feedback').showFeedback = false;
        console.log("HELP_MESSAGE: Auto-hiding after 10s");
      }, 10000);
      
      console.log('HELP_MESSAGE: Showing help message:', message, 'TTS available:', this.ttsAvailable, 'Using native TTS:', this.usingNativeAndroidTTS);
      
      // Check TTS settings before attempting speech
      console.log('HELP_TTS: TTS disabled:', this.$store.mascotSettings.disableTTS);
      if (!this.$store.mascotSettings.disableTTS) {
        // Check if we can use the native Android TTS bridge
        if (this.usingNativeAndroidTTS && window.AndroidTTS) {
          try {
            console.log('HELP_TTS: Using native Android TTS bridge to speak:', message);
            window.AndroidTTS.speak(message);
          } catch (error) {
            console.error('HELP_TTS: Error using native Android TTS:', error);
            this.tryWebSpeechAPI(message);
          }
        } else {
          // Fallback to Web Speech API
          this.tryWebSpeechAPI(message);
        }
      } else {
        console.log('HELP_TTS: TTS disabled, skipping speech for:', message);
      }
    },
    
    /**
     * Shows the appropriate introduction message for an activity
     * @param {string} activityMode - The identifier of the activity
     */
    showActivityIntroMessage(activityMode) {
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Define all intro messages for different activities
      const introMessages = {
        '1_1_pitches_high_or_low': {
          'en': 'Listen to the Note and choose if it is of a high or low pitch!',
          'de': 'Höre dir die Note an und wähle, ob sie hoch oder tief ist!'
        },
        '1_2_pitches_match-sounds': {
          'en': 'Listen to the Melody and choose if it is ascending or descending!',
          'de': 'Höre dir die Melodie an und wähle, ob sie auf- oder absteigend ist!'
        },
        '1_3_pitches_draw': {
          'en': 'Draw and listen – your line becomes music!',
          'de': 'Male und hör zu – deine Linie wird zu Musik!'
        },
        '1_4_pitches_does-it-sound-right': {
          'en': 'Listen to the melody! Does it sound right? Or is there a wrong note?',
          'de': 'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?'
        },
        '1_5_pitches_memory': {
          'en': 'Listen carefully and remember the melody! Can you play it back?',
          'de': 'Höre genau hin und merke dir die Melodie! Kannst du sie nachspielen?'
        },
      };
      
      // Find the right message for the activity and language
      const messages = introMessages[activityMode] || introMessages['1_1_pitches_high_or_low'];
      const message = messages[language] || messages['en'];
      
      // Show the message with activity ID to prevent duplication
      // Generate a unique ID for this activity using the current mode
      const activityId = '1_' + this.mode;
      this.showMascotMessage(message, activityId);
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
     * Spielt eine Sequenz von Noten mit Timing ab - verwendet die zentrale Audio-Engine
     * @param {Array} noteArray - Array mit Noten, die abgespielt werden sollen
     * @param {number} index - Aktuelle Position im Array
     */
    playNoteSequence(noteArray, index) {
      console.log(`DEBUG: playNoteSequence called with index ${index}/${noteArray.length}`);
      
      if (index >= noteArray.length) {
        // Am Ende der Sequenz angekommen, Wiedergabe beenden
        console.log('DEBUG: End of note sequence reached, stopping playback');
        this.isPlaying = false;
        this.currentAnimation = null;
        return;
      }
      
      // Audio-Wiedergabe über die zentrale Audio-Engine
      // Aktuelle Note abspielen
      const note = noteArray[index];
      
      // Für Debug-Zwecke die abgespielte Note protokollieren
      console.log(`Playing note ${index+1}/${noteArray.length}: ${note}`);
      
      try {
        // Direkt über die Audio-Engine abspielen anstatt Events zu verwenden
        audioEngine.playNote(note, 0.75);
      } catch (err) {
        console.error('Error playing note:', err);
      }
      
      // Etwas längere Pause zwischen den Noten für bessere Unterscheidbarkeit
      // Nächste Note mit Verzögerung abspielen
      console.log('DEBUG: Scheduling next note with 750ms delay');
      const timeoutId = setTimeout(() => {
        console.log(`DEBUG: Executing scheduled playback of next note ${index + 1}`);
        
        // Timeout aus Liste entfernen, sobald er ausgeführt wurde
        const timeoutIndex = this.melodyTimeouts.indexOf(timeoutId);
        if (timeoutIndex !== -1) {
          this.melodyTimeouts.splice(timeoutIndex, 1);
          console.log(`DEBUG: Removed executed timeout from melodyTimeouts, ${this.melodyTimeouts.length} remaining`);
        }
        
        this.playNoteSequence(noteArray, index + 1);
      }, 750); // 750ms zwischen den Noten für klarere Trennung
      
      // Timeout-ID im Array speichern, damit es bei stopCurrentSound gelöscht werden kann
      this.melodyTimeouts.push(timeoutId);
      console.log(`DEBUG: Added timeout ID ${timeoutId} to melodyTimeouts, now tracking ${this.melodyTimeouts.length} timeouts`);
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
      
      // Define card class selector based on element type
      const cardClass = `.pitch-card:has(.pitch-icon.${elementType}), .pitch-card.${elementType}`;
      console.log('ANIM: Using card selector:', cardClass);
      
      // Apply animation to cards (for Android compatibility)
      const cards = document.querySelectorAll(cardClass);
      cards.forEach(card => {
        console.log('ANIM: Animating card for', elementType);
        card.classList.add('active');
        
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
        this.activity1_2_matchSoundsPlaySequence(pattern);
      }
      
      // Start long press (modified to handle multi-touch better)
      this.startMultiTouchLongPress(pattern, event);
    },
    
    /**
     * Common function to play any audio sequence - core audio playback logic
     * @param {Array} noteArray - Array of notes to play, can include duration modifiers (e.g. 'C4:h')
     * @param {string} context - logmessage Context identifier ('up', 'down', 'wave', 'jump', 'sound-judgment', etc.)
     * @param {Object} options - Optional configuration parameters
     * @param {Function} options.onComplete - Function to call when sequence completes
     * @param {Function} options.prepareNote - Function to transform note before playing (e.g. add 'pitch_' prefix)
        console.log(`AUDIO: Playback cancelled for '${sequenceContext}'`);
      };
    },
    
    /**
     * Play a sequence of notes based on the selected pattern
     * @param {string} type - Type of pattern ('up', 'down', 'wave', 'jump')
     * @activity 1_2_match_sounds
     */
    activity1_2_matchSoundsPlaySequence(type) {
      // Enhanced logging for diagnosis
      console.log('AUDIO: Sequence play requested for type:', type);
      
      // Always stop any currently playing sound first
      this.stopCurrentSound();
      
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
      
      // ALWAYS animate the pattern element for immediate visual feedback
      this.animatePatternElement(type);
      
      // Verwende die bewährte Methode zum Abspielen der Töne
      const noteArray = [...pattern]; // Kopie erstellen, um die originale Sequence nicht zu verändern
      
      // Play notes in sequence
      this.playNoteSequence(noteArray, 0);
      
      // Cleanup after pattern finishes playing
      const totalDuration = noteArray.length * 750 + 100; // 750ms pro Note + ein wenig extra
      setTimeout(() => {
        this.currentAnimation = null;
        this.currentHighlightedNote = null;
        
        // Remove active class from card
        if (card) {
          card.classList.remove('active');
        }
        
        console.log('AUDIO: Pattern animation and playback complete');
      }, totalDuration);
    },
    
    /**
     * Stop any currently playing sound
     */
    /**
     * Stops all currently playing sounds and resets UI state
     * This is a critical method for preventing sound overlap issues
     * @activity common
     * @used_by all activities
     */
    stopCurrentSound() {
      console.log('AUDIO: stopCurrentSound called in pitches.js');
      
      // WICHTIG: Zuerst alle Flags zurücksetzen vor dem Löschen der Timeouts,
      // damit keine neuen Timeouts erstellt werden können während des Stoppvorgangs
      this.isPlaying = false;
      
      // Cancel any pending timeouts in this component
      if (this.soundTimeoutId) {
        console.log('AUDIO: Clearing soundTimeoutId:', this.soundTimeoutId);
        clearTimeout(this.soundTimeoutId);
        this.soundTimeoutId = null;
      }
      
      if (this.resetTimeoutId) {
        console.log('AUDIO: Clearing resetTimeoutId:', this.resetTimeoutId);
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
      
      // Stop melody playback timeouts - besonders wichtig für die Sound-HighOrLow-Aktivität
      if (this.melodyTimeouts && this.melodyTimeouts.length > 0) {
        console.log(`AUDIO: Clearing ${this.melodyTimeouts.length} melody timeouts`);
        this.melodyTimeouts.forEach(timeoutId => {
          try {
            clearTimeout(timeoutId);
          } catch (e) {
            console.error('AUDIO_ERROR: Failed to clear timeout:', e);
          }
        });
        // Array vollständig zurücksetzen
        this.melodyTimeouts = [];
      }
      
      // Reset animation state
      this.currentAnimation = null;
      
      // Remove active classes from all pitch cards
      const activeCards = document.querySelectorAll('.pitch-card.active');
      console.log('AUDIO: Removing active class from', activeCards.length, 'pitch cards');
      activeCards.forEach(card => card.classList.remove('active'));
      
      // Aktualisiere UI-Status
      document.querySelectorAll('.play-button').forEach(btn => {
        btn.classList.remove('playing');
        btn.disabled = false;
      });
      
      // Status-Anzeige zurücksetzen
      document.querySelectorAll('.sound-status').forEach(el => {
        el.textContent = '';
      });
      
      // Stop all active audio directly via the central audio engine
      // Dies ist der wichtigste Schritt, um alle Töne sofort zu beenden
      try {
        audioEngine.stopAll();
        console.log('AUDIO: Stopped all sounds using central audio engine');
      } catch (e) {
        console.error('AUDIO_ERROR: Failed to stop audio engine:', e);
      }
    },
    
    /**
     * Clear the current drawing and reset the canvas
     * @activity 1_3_draw_melody
     */
    clearDrawing() {
      // Save current path before clearing
      this.previousDrawPath = [...this.drawPath];
      
      // Reset path array
      this.drawPath = [];
      
      const canvas = document.querySelector('.drawing-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw guide lines in challenge mode
        this.drawNoteGuideLines();
        
        // Reset any drawing state
        this.isDrawing = false;
        
        // Log for debugging
        console.log('Drawing cleared');
      } else {
        console.error('Could not find drawing canvas');
      }
    },

    /**
     * Draw subtle guide lines showing note positions (challenge mode only)
     */
    drawNoteGuideLines() {
      if (!this.melodyChallengeMode) return; // Only in challenge mode
      
      const canvas = document.querySelector('.drawing-canvas');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const height = canvas.height;
      const width = canvas.width;
      
      // 12 notes total
      const noteCount = 12;
      
      // Draw subtle horizontal lines for each note position
      ctx.strokeStyle = 'rgba(200, 180, 140, 0.3)';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < noteCount; i++) {
        const y = (i + 0.5) * (height / noteCount); // Center line in each note zone
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      console.log('GUIDE_LINES: Drew note guide lines in challenge mode');
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
     * Set up the drawing mode for melody drawing activity
     * @activity 1_3_draw_melody
     */
    setupDrawingMode_1_3() {
      this.drawPath = [];
      this.isDrawing = false;
      
      // Load saved level and success counter values from localStorage
      try {
        const savedLevel = localStorage.getItem('lalumo_draw_melody_level');
        if (savedLevel !== null) {
          this.drawMelodyLevel = parseInt(savedLevel, 10);
          console.log('MELODY_SETUP: Loaded saved level:', this.drawMelodyLevel);
        } else if (this.drawMelodyLevel === undefined) {
          // If no level is saved and none has been set yet
          this.drawMelodyLevel = 0;
          console.log('MELODY_SETUP: Initialized default level to 0');
        }
        
        const savedCounter = localStorage.getItem('lalumo_draw_melody_success_counter');
        if (savedCounter !== null) {
          this.levelSuccessCounter = parseInt(savedCounter, 10);
          console.log('MELODY_SETUP: Loaded saved success counter:', this.levelSuccessCounter);
        } else if (this.levelSuccessCounter === undefined) {
          // If no counter is saved and none has been set yet
          this.levelSuccessCounter = 0;
          console.log('MELODY_SETUP: Initialized default success counter to 0');
        }
      } catch (e) {
        console.warn('MELODY_SETUP: Error loading saved level data', e);
        // Fallback to default values
        if (this.drawMelodyLevel === undefined) this.drawMelodyLevel = 0;
        if (this.levelSuccessCounter === undefined) this.levelSuccessCounter = 0;
      }
      
      // Not in challenge mode by default
      this.melodyChallengeMode = false;
      this.stopReferencePlayback(); this.referenceSequence = null;
      
      // If saved progress exists, automatically activate challenge mode
      if (this.drawMelodyLevel > 0 || this.levelSuccessCounter > 0) {
        console.log('MELODY_SETUP: Activating challenge mode due to existing progress');
        this.melodyChallengeMode = true;
        // Generate a reference melody when we are in challenge mode
        this.generateReferenceSequence_1_3();
      }
      
      // Show intro message when entering the activity
      this.showActivityIntroMessage('draw');
      
      // Clear any existing drawing when switching to this mode
      this.clearDrawing();
      
      // Create challenge toggle if not already present
      if (!document.querySelector('.challenge-toggle')) {
        const challengeToggle = document.createElement('div');
        challengeToggle.className = 'challenge-toggle';
        
        // Get current language
        const isGerman = document.documentElement.lang === 'de';
        
        // Create transparent buttons with accessibility attributes but no text
        challengeToggle.innerHTML = `
          <button id="challenge-button" onclick="blur()"
            class="draw-melody-button"
            title="${this.$store.strings.challenge_mode_activate}" 
            alt="${this.$store.strings.challenge_mode}_a11y">
          </button>
          <button id="new-melody-button" onclick="blur()" 
            class="draw-melody-button"
            title="${this.$store.strings.generate_melody}" 
            alt="${this.$store.strings.new_melody}_a11y">
          </button>
        `;
        
        // Add the toggle to the activity-container container
        const pitchActivity = document.querySelector('.activity-container[x-show="mode === \'1_3_pitches_draw-melody\'"]');
        if (pitchActivity) {
          pitchActivity.appendChild(challengeToggle);
          
          // Position the buttons 200px from the top with direct inline styles
          challengeToggle.style.position = 'absolute';
          challengeToggle.style.top = '84px';
          challengeToggle.style.left = '0';
          challengeToggle.style.right = '0';
        } else {
          // Fallback wenn das Element noch nicht existiert
          console.error('Could not find activity-container element for drawing mode');
          document.body.appendChild(challengeToggle);
        }
        
        // Create the transparent clear button without text, draw-melody-button
        const clearButton = document.createElement('button');
        clearButton.className = 'clear-drawing-button draw-melody-button';
        clearButton.title = isGerman ? 'Zeichnung löschen' : 'Clear drawing';
        clearButton.setAttribute('alt', `${isGerman ? 'Löschen' : 'Clear'}_a11y`);
        clearButton.setAttribute('aria-label', isGerman ? 'Zeichnung löschen' : 'Clear drawing');
        const canvas = document.querySelector('.drawing-canvas');
        canvas.parentNode.appendChild(clearButton);
        
        // Event-Listener hinzufügen
        document.getElementById('challenge-button').addEventListener('click', () => {
          this.toggleMelodyChallenge();
        });
        
        document.getElementById('new-melody-button').addEventListener('click', () => {
          if (this.melodyChallengeMode) {
            this.generateReferenceSequence_1_3();
            this.updateDrawingModeUI();
          }
        });
        
        // Löschen-Button Event-Handler
        document.querySelector('.clear-drawing-button').addEventListener('click', () => {
          this.clearDrawing();
          
          // Im Challenge-Modus, spiele die Referenzmelodie erneut ab
          if (this.melodyChallengeMode && this.referenceSequence) {
            setTimeout(() => this.playReferenceSequence(), 300);
          }
        });
      }
    },
    
    /**
     * Schaltet den Melodie-Challenge-Modus ein oder aus
     * @activity 1_3_draw_melody
     */
    toggleMelodyChallenge() {
      this.melodyChallengeMode = !this.melodyChallengeMode;
      
      if (this.melodyChallengeMode) {
        // Generiere eine Referenzmelodie für den Challenge-Modus
        this.generateReferenceSequence_1_3();
      } else {
        // Lösche die Referenzmelodie im freien Modus
        this.stopReferencePlayback(); this.referenceSequence = null;
      }
      
      // Aktualisiere die UI
      this.updateDrawingModeUI();
    },
    
    /**
     * Aktualisiert die UI für den Zeichenmodus mit der Referenzmelodie
     * @activity 1_3_draw_melody
     */
    updateDrawingModeUI() {
      // Entferne bestehende Referenzmelodie-Anzeige
      let referenceContainer = document.querySelector('.reference-melody');
      if (referenceContainer) {
        referenceContainer.remove();
      }
      
      // Update the challenge toggle buttons based on the current mode
      const challengeButton = document.getElementById('challenge-button');
      const newMelodyButton = document.getElementById('new-melody-button');
      
      if (challengeButton) {
        const isGerman = document.documentElement.lang === 'de';
        
        // Style the challenge mode button based on current mode
        if (this.melodyChallengeMode) {
          challengeButton.classList.add('active');
          challengeButton.title = isGerman ? 'Wechsel zwischen Melodie-Challenge-Modus und freien Zeichnen-Modus' : 'Toggle free drawing mode';
          
          // Show the new melody button when in challenge mode
          newMelodyButton.style.display = 'block';
          
          // Stelle sicher, dass eine gültige Referenzmelodie existiert
          if (!this.referenceSequence) {
            console.log('MELODY_UI: Generating reference sequence as it was null');
            this.generateReferenceSequence_1_3();
          }
          
          // Die visuelle Darstellung der Referenzmelodie wird später in dieser Funktion erzeugt,
          // wenn this.melodyChallengeMode && this.referenceSequence true sind
        } else {
          challengeButton.classList.remove('active');
          newMelodyButton.style.display = 'none';
        }
      }
      
      // Erstelle Fortschrittsanzeige, wenn im Challenge-Modus
      if (this.melodyChallengeMode) {
        // Initialisiere den Erfolgs-Zähler, falls nicht vorhanden
        if (this.levelSuccessCounter === undefined) {
          this.levelSuccessCounter = 0;
        }
        
        // Use shared progress bar utility
        const isGerman = document.documentElement.lang === "de";
        const activityName = isGerman ? "Melodien" : "melodies";
        const currentLevel = this.drawMelodyLevel + 3; // Level + 3 = Anzahl der Noten
        
        showActivityProgressBar({
          appendToContainer: ".drawing-container",
          progressClass: "melody-progress",
          currentCount: this.levelSuccessCounter,
          totalCount: 3,
          currentLevel: this.drawMelodyLevel + 1,
          notesCount: currentLevel,
          activityName: activityName,
          positioning: {
            position: "fixed",
            bottom: "16px",
            width: "min(100%, 477px)",
            left: "max(-11px, min(20%, -477px + 94vw))"
          }
        });
      }
      
      // Wenn wir im Challenge-Modus sind und eine Referenzmelodie haben
      if (this.melodyChallengeMode && this.referenceSequence) {
        // Erstelle Container für die Referenzmelodie
        referenceContainer = document.createElement('div');
        referenceContainer.className = 'reference-melody';
        
        // Add cursor pointer and title to indicate it's clickable
        referenceContainer.style.cursor = 'pointer';
        const isGerman = document.documentElement.lang === 'de';
        referenceContainer.title = isGerman ? 'Klicken, um die Melodie abzuspielen' : 'Click to replay melody';
        
        // Add visual feedback styles for hover and click
        referenceContainer.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
        
        // Add hover effect using mouse events
        referenceContainer.addEventListener('mouseenter', function() {
          this.style.transform = 'scale(1.02)';
          this.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
        });
        
        referenceContainer.addEventListener('mouseleave', function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = 'none';
        });
        
        // Add active/click effect
        referenceContainer.addEventListener('mousedown', function() {
          this.style.transform = 'scale(0.98)';
        });
        
        referenceContainer.addEventListener('mouseup', function() {
          this.style.transform = 'scale(1.02)';
        });
        
        // Add event listener to replay the melody on click
        // Store a reference to the component instance to ensure correct context
        const self = this;
        referenceContainer.addEventListener('click', function() {
          console.log('Reference melody box clicked!');
          self.playReferenceSequence();
        });
        
        // Erstelle visuelle Darstellung der Referenzmelodie
        // Verwende den gleichen Notenbereich wie im Canvas (höhere Oktave)
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
        
        this.referenceSequence.forEach(note => {
          const noteElement = document.createElement('div');
          noteElement.className = 'reference-note';
          
          // Positioniere die Note entsprechend ihrer Höhe
          const noteIndex = notes.indexOf(note);
          const heightPercentage = noteIndex / (notes.length - 1);
          
          // Y-Position umkehren - höhere Noten haben niedrigere Y-Werte
          noteElement.style.transform = `translateY(${(1 - heightPercentage) * 80}px)`;
          referenceContainer.appendChild(noteElement);
        });
        
        // Füge die Referenzmelodie vor dem Canvas ein
        const container = document.querySelector('.drawing-container');
        container.parentNode.insertBefore(referenceContainer, container);
        
        // Spiele die Referenzmelodie ab
        this.playReferenceSequence();
      }
      
      // Draw or clear guide lines based on mode
      this.drawNoteGuideLines();
    },
    
    /**
     * Generiert eine zufällige Referenzmelodie für den Challenge-Modus
     * mit einer Länge basierend auf dem aktuellen Level des Benutzers
     * @activity 1_3_draw_melody
     */
    generateReferenceSequence_1_3() {
      // Verwende den gleichen Notenbereich wie im Canvas (höhere Oktave) für konsistente Melodievergleiche
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
      
      // Bestimme die Melodielänge basierend auf dem Benutzerlevel
      // Start mit 3 Noten, maximal 8 Noten
      const minNotes = 3;
      const maxNotes = 8;
      
      // Berechne die Anzahl der Noten basierend auf dem Level
      // Höheres Level = mehr Noten (bis zum Maximum)
      let sequenceLength = minNotes + this.drawMelodyLevel;
      sequenceLength = Math.min(sequenceLength, maxNotes); // Auf maximal 8 Noten begrenzen
      
      console.log(`Generating melody with ${sequenceLength} notes (user level: ${this.drawMelodyLevel})`);
      
      // Generiere eine zufällige Melodie mit einer einfachen musikalischen Struktur
      this.referenceSequence = [];
      
      // Wähle einen zufälligen Startton
      let lastIndex = Math.floor(Math.random() * (notes.length - 4)) + 2; // Beginne in der Mitte des Bereichs
      this.referenceSequence.push(notes[lastIndex]);
      
      // Generiere den Rest der Sequenz mit sinnvollen Schritten
      for (let i = 1; i < sequenceLength; i++) {
        // Entscheide zufällig über die Richtung und Größe des nächsten Schritts
        const step = Math.floor(Math.random() * 5) - 2; // -2 bis +2 Schritte
        
        // Berechne den neuen Index und halte ihn im gültigen Bereich
        lastIndex = Math.max(0, Math.min(notes.length - 1, lastIndex + step));
        
        this.referenceSequence.push(notes[lastIndex]);
      }
      
      console.log('Generated reference melody:', this.referenceSequence);
      return this.referenceSequence;
    },
    
    /**
     * Stop any running reference playback
     * @activity 1_3_draw_melody
     */
    stopReferencePlayback() {
      if (this.referencePlaybackTimeouts) {
        this.referencePlaybackTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.referencePlaybackTimeouts = [];
        console.log("[REFERENCE_SEQ_DEBUG] Stopped all reference playback timeouts");
      }
    },
    
    /**
     * Spielt die Referenzmelodie ab
     * @activity 1_3_draw_melody
     */
    playReferenceSequence() {
      // Erzeuge eine Referenzmelodie, falls keine existiert
      if (!this.referenceSequence || this.referenceSequence.length === 0) {
        console.log('MELODY_PLAY: No reference sequence found, generating one');
        this.generateReferenceSequence_1_3();
        
        // Wenn immer noch keine Sequenz existiert, breche ab
        if (!this.referenceSequence || this.referenceSequence.length === 0) {
          console.error('MELODY_PLAY: Failed to generate reference sequence');
          return;
        }
      }
      
      console.log('MELODY_PLAY: Playing reference melody:', this.referenceSequence);
      if (!this.referenceSequence || !Array.isArray(this.referenceSequence) || this.referenceSequence.length === 0) {
        console.warn("REFERENCE_SEQ_DEBUG: referenceSequence is null/empty, aborting playReferenceSequence", this.referenceSequence);
        return;
      }
      
      // Sequentielles Abspielen der Noten
      
      // Draw guide lines in challenge mode after clearing
      this.drawNoteGuideLines();
      // Store timeout IDs to allow cancellation
      this.referencePlaybackTimeouts = this.referencePlaybackTimeouts || [];
      
      const playNote = (index) => {
        // Check if referenceSequence still exists and is valid
        if (!this.referenceSequence || index >= this.referenceSequence.length) {
          console.log(`[REFERENCE_SEQ_DEBUG] Playback stopped: referenceSequence=${!!this.referenceSequence}, index=${index}`);
          return;
        }
        
        const note = this.referenceSequence[index];
        audioEngine.playNote(note.toLowerCase(), 0.3);
        
        // Hervorhebung der aktuell gespielten Note
        const noteElements = document.querySelectorAll('.reference-note');
        if (noteElements[index]) {
          noteElements[index].classList.add('playing');
          setTimeout(() => noteElements[index].classList.remove('playing'), 300);
        }
        
        // Nächste Note mit Verzögerung abspielen - store timeout ID
        const timeoutId = setTimeout(() => playNote(index + 1), 500);
        this.referencePlaybackTimeouts.push(timeoutId);
      };
      
      // Starte das Abspielen mit der ersten Note
      playNote(0);
    },
    
    /**
     * Handle start of drawing
     * @param {Event} e - Mouse/touch event
     */
    startDrawing(e) {
      e.preventDefault(); // Verhindert unbeabsichtigtes Verhalten auf Mobilgeräten
      
      // Hole den Canvas-Kontext zum Zeichnen
      const canvas = e.currentTarget;
      this.canvas = canvas; // Store canvas reference for use in other methods
      this.ctx = canvas.getContext('2d');
      
      // Clear the canvas
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the previous path with semi-transparency if it exists
      if (this.previousDrawPath && this.previousDrawPath.length > 0) {
        this.ctx.save(); // Save the current context state
        
        // Set semi-transparent style for previous path
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)'; // Semi-transparent blue
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw the previous path
        this.ctx.beginPath();
        const firstPoint = this.previousDrawPath[0];
        this.ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let i = 1; i < this.previousDrawPath.length; i++) {
          const point = this.previousDrawPath[i];
          this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
        this.ctx.restore(); // Restore the context to its original state
      }
      
      // Reset current path
      this.drawPath = [];
      
      // Set style for new drawing
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
      
      // Berechne die Position relativ zum Canvas und berücksichtige das Skalierungsverhältnis
      // Dies korrigiert das Problem mit verschobenen Strichen auf Android
      const scaleX = canvas.width / canvas.offsetWidth;
      const scaleY = canvas.height / canvas.offsetHeight;
      
      let x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      
      // Wenn im Challenge-Modus, erlaube nur Bewegungen von links nach rechts
      if (this.melodyChallengeMode && this.drawPath.length > 0) {
        const lastPoint = this.drawPath[this.drawPath.length - 1];
        // Wenn der neue x-Wert kleiner ist als der vorherige, behalte den vorherigen x-Wert bei plus 0.1
        if (x < lastPoint.x) {
          x = lastPoint.x + 0.1;
        }
      }
      
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
      
      // Save the current drawing path for the next drawing session
      this.previousDrawPath = [...this.drawPath];
      
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
      const minNotes = 3;
      const maxNotes = 8;
      
      let sampleSize;
      
      // Im Nicht-Spiel-Modus: Anzahl der Noten basierend auf der Länge der Linie bestimmen
      if (!this.melodyChallengeMode) {
        // Berechnung der Länge der gezeichneten Linie (vereinfacht durch Anzahl der Punkte)
        const pathLength = this.drawPath.length;
        
        // Free draw mode: up to 32 notes, challenge mode: up to 8 notes
        const maxNotesForMode = 32;
        const notesBasedOnLength = Math.max(minNotes, Math.floor(pathLength / 16));
        sampleSize = Math.min(notesBasedOnLength, maxNotesForMode);
        console.log(`MELODY_NOTES: Using ${sampleSize} notes based on path length ${pathLength} in free mode`);
      } 
      // Im Spiel-Modus: Anzahl der Noten basierend auf dem Level
      else {
        const currentMelodyLength = minNotes + this.drawMelodyLevel;
        sampleSize = Math.min(Math.min(maxNotes, currentMelodyLength), this.drawPath.length);
        console.log(`MELODY_NOTES: Using ${sampleSize} notes based on level ${this.drawMelodyLevel} in challenge mode`);
      }
      
      var sampledPoints = [];
      
      // Immer den ersten Punkt nehmen
      sampledPoints.push(this.drawPath[0]);
      
      // Für Melodien mit mehr als 2 Noten, die mittleren Punkte verteilen
      if (sampleSize > 2) {
        // Wir verteilen die mittleren Punkte zwischen dem ersten und letzten Punkt
        // Wir nehmen sampleSize - 2 innere Punkte (da der erste und letzte Punkt fixiert sind)
        const innerPoints = sampleSize - 2;
        
        // Berechne das Intervall für die inneren Punkte
        // Wir nutzen nicht die volle Länge, sondern lassen etwas Platz am Ende
        const availableLength = this.drawPath.length * 0.85;
        const step = Math.floor(availableLength / (innerPoints + 1));
        
        for (let i = 1; i <= innerPoints; i++) {
          const index = Math.min(i * step, this.drawPath.length - 2);
          sampledPoints.push(this.drawPath[index]);
          console.log('DRAW_PATH_DEBUG: index=', index, 'drawPath.length=', this.drawPath.length, 'point=', this.drawPath[index]);
        }
      }
      
      // Immer den letzten Punkt nehmen
      
      // Filter out undefined points to prevent runtime errors
      sampledPoints = sampledPoints.filter(point => point && point.x !== undefined && point.y !== undefined);
      console.log('DRAW_PATH_DEBUG: sampledPoints after filter:', sampledPoints.length, 'points');
      sampledPoints.push(this.drawPath[this.drawPath.length - 1]);
      
      // Y-Positionen auf Noten abbilden (höhere Position = höherer Ton)
      // Entferne die unterste Oktave aus dem Bereich
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
      
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
      
      // Compare with reference melody if in challenge mode
      if (this.melodyChallengeMode && this.referenceSequence) {
        this.compareWithReferenceSequence_1_3(sequence);
      }
    },
    
    /**
     * Spielt eine Sequenz von Noten nacheinander ab
     * Verwendet die zentrale Audio-Engine für konsistente Audiowiedergabe auf allen Plattformen
     */
    playDrawnNoteSequence(notes, index = 0) {
      if (index >= notes.length) return;
      
      const note = notes[index];
      
      try {
        // Sound über die zentrale Audio-Engine abspielen
        audioEngine.playNote(note, 0.3);
        
        console.log(`Playing note ${index + 1}/${notes.length}: ${note}`);
        
        // Wenn wir im Challenge-Modus sind, hervorheben der entsprechenden Note in der Referenzmelodie
        // Highlight corresponding note in reference melody box when in challenge mode
        if (this.melodyChallengeMode && this.referenceSequence) {
          // Finde die entsprechende Note in der Referenzmelodie
          const noteUpper = note.toUpperCase();
          const noteIndex = this.referenceSequence.indexOf(noteUpper);
          
          // Wenn die Note in der Referenzmelodie vorkommt, hervorheben
          if (noteIndex !== -1) {
            console.log(`MELODY_HIGHLIGHT: Highlighting note ${noteUpper} at index ${noteIndex}`);
            const noteElements = document.querySelectorAll('.reference-note');
            
            if (noteElements && noteElements[noteIndex]) {
              // Kurz aufleuchten lassen
              noteElements[noteIndex].classList.add('playing');
              setTimeout(() => {
                try {
                  noteElements[noteIndex].classList.remove('playing');
                } catch(e) {
                  console.error('MELODY_HIGHLIGHT_ERROR: Error removing highlight:', e);
                }
              }, 300);
            }
          }
        }
        
        // Nächste Note mit Verzögerung abspielen
        setTimeout(() => this.playDrawnNoteSequence(notes, index + 1), 300);
      } catch (error) {
        console.error('Error playing note in drawn melody:', error);
        // Trotz Fehler weitergehen
        setTimeout(() => this.playDrawnNoteSequence(notes, index + 1), 300);
      }
    },
    
    /**
     * Compares the user's drawn melody with the reference melody
     * and adjusts the user's level based on success
     * @param {Array} drawnSequence - The sequence of notes from the user's drawing
     * @activity 1_3_draw_melody
     */
    compareWithReferenceSequence_1_3(drawnSequence) {
      // Cannot compare if there's no reference
      if (!this.referenceSequence || this.referenceSequence.length === 0) return;
      
      // Get the number of notes to compare (use the shorter of the two sequences)
      const compareLength = Math.min(drawnSequence.length, this.referenceSequence.length);
      
      if (compareLength === 0) return;
      
      // Count how many notes match between the sequences
      let matchCount = 0;
      for (let i = 0; i < compareLength; i++) {
        if (drawnSequence[i].toUpperCase() === this.referenceSequence[i].toUpperCase()) {
          matchCount++;
        }
      }
      
      // Calculate the match percentage
      const matchPercentage = (matchCount / compareLength) * 100;
      console.log(`Melody match: ${matchCount}/${compareLength} notes (${matchPercentage.toFixed(1)}%)`);
      
      // Provide feedback based on match percentage
      let feedback = '';
      const isGerman = document.documentElement.lang === 'de';
      let perfectMatch = matchPercentage === 100;
      
      // Initialize success counter if not already initialized
      if (this.levelSuccessCounter === undefined) {
        // Try to load from localStorage first
        try {
          const savedCounter = localStorage.getItem('lalumo_draw_melody_success_counter');
          if (savedCounter !== null) {
            this.levelSuccessCounter = parseInt(savedCounter, 10);
            console.log('MELODY_PROGRESSION: Loaded success counter from localStorage:', this.levelSuccessCounter);
          } else {
            this.levelSuccessCounter = 0;
            console.log('MELODY_PROGRESSION: Initialized success counter to 0');
          }
        } catch (e) {
          this.levelSuccessCounter = 0;
          console.warn('Could not load success counter from localStorage', e);
        }
      }
      
      // Update the progress in the central progress object
      // Convert level and success counter to a percentage value (0-100)
      // Level 0 with 0 successful melodies = 0%, Level 5 with 10 successful melodies = 100%
      const maxLevel = 5;
      const melodiesPerLevel = 10;
      const totalProgress = Math.min(100, Math.round((this.drawMelodyLevel * melodiesPerLevel + this.levelSuccessCounter) / 
                                                   (maxLevel * melodiesPerLevel + 1) * 100));
      
      // Update the central progress object
      this.progress['1_3_pitches_draw-melody'] = totalProgress;
      console.log(`MELODY_PROGRESS: Updated central progress to ${totalProgress}% for draw-melody activity`);
      
      // Save to localStorage
      try {
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
      } catch (e) {
        console.warn('Could not update central progress in localStorage', e);
      }
      
      // Create feedback message
      if (matchPercentage >= 80) {
        // Great match - count towards level increase
        
        // Increase success counter
        this.levelSuccessCounter++;
        console.log(`MELODY_PROGRESSION: Success count: ${this.levelSuccessCounter}/3 for level ${this.drawMelodyLevel}`);
        
        // Save success counter to localStorage
        try {
          localStorage.setItem('lalumo_draw_melody_success_counter', this.levelSuccessCounter);
        } catch (e) {
          console.warn('Could not save success counter to localStorage', e);
        }
        
        // If counter reaches 10, increase level if not at max
        if (this.levelSuccessCounter >= 3 && this.drawMelodyLevel < 5) { // Max level is 5 (gives 8 notes)
          this.drawMelodyLevel++;
          this.levelSuccessCounter = 0; // Reset counter for next level
          console.log(`MELODY_PROGRESSION: User level increased to ${this.drawMelodyLevel}`);
          
          // Save level to localStorage for persistence
          try {
            localStorage.setItem('lalumo_draw_melody_level', this.drawMelodyLevel);
            localStorage.setItem('lalumo_draw_melody_success_counter', 0); // Reset counter in storage
          } catch (e) {
            console.warn('Could not save draw melody level to localStorage', e);
          }
          
          // TODO: move translation to strings.xml
          feedback = isGerman ? 
            `Super! Du hast 10 Melodien erfolgreich gespielt! Jetzt versuche längere Melodien mit ${this.drawMelodyLevel + 3} Tönen.` : 
            `Great job! You've successfully played 10 melodies! Now try longer melodies with ${this.drawMelodyLevel + 3} notes.`;
          
          // Show rainbow effect for perfect match
          if (perfectMatch) {
            // Create and show rainbow success animation
            showRainbowSuccess();
          }
        } else {
          // TODO: move translation to strings.xml
          feedback = isGerman ? 
            'Fantastisch! Du hast alle Melodien gemeistert!' : 
            'Amazing! You\'ve mastered all the melodies!';
          
          // TODO: play sound and rainbow exact after the painted melody is played (in case it is a longer melody)
          setTimeout(() => {
            // Play success sound
            audioEngine.playNote('success');
            debugLog('AUDIO', '[1_3] Playing success feedback sound with audio engine. level: ' + this.levelSuccessCounter);
            
            // Always show rainbow for mastering all levels
            showRainbowSuccess();
          }, 2000);
        }
        
        // Visual feedback
        this.showSuccessFeedback();
      } else if (matchPercentage >= 50) {
          // TODO: move translation to strings.xml
        // Good attempt
        feedback = isGerman ? 
          'Fast! Versuche es noch einmal.' : 
          'Almost there! Try again.';
      } else {
          // TODO: move translation to strings.xml
        // Poor match
        feedback = isGerman ? 
          'Versuche, der Melodie genauer zu folgen.' : 
          'Try to follow the melody more closely.';
      }
      
      // Display feedback to the user
      this.showFeedbackMessage(feedback, 3000);
      
      // Generate a new reference melody only if the match was perfect (100%)
      setTimeout(() => {
        if (this.melodyChallengeMode) {
          // Only generate a new melody if it was a perfect match
          if (perfectMatch) {
            console.log('MELODY_CHALLENGE: Perfect match - generating new melody');
            this.generateReferenceSequence_1_3();
          } else {
            console.log('MELODY_CHALLENGE: Same melody continues - not a perfect match yet');
          }
          
          // Always update the UI to refresh the reference melody display
          this.updateDrawingModeUI();
        }
      }, 3500);
    },
    
    /**
     * Display feedback to the user
     * @param {string} message - The feedback message
     * @param {number} duration - How long to show the message (ms)
     */
    showFeedbackMessage(message, duration = 2000) {
      // Create or update feedback element
      let feedbackElement = document.querySelector('.melody-feedback');
      
      if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.className = 'melody-feedback';
        const container = document.querySelector('.drawing-container');
        if (container) {
          container.parentNode.insertBefore(feedbackElement, container.nextSibling);
        }
      }
      
      feedbackElement.textContent = message;
      feedbackElement.style.opacity = '1';
      
      // Hide the feedback after the specified duration
      setTimeout(() => {
        feedbackElement.style.opacity = '0';
      }, duration);
    },
    
    /**
     * Show a visual success effect
     */
    showSuccessFeedback() {
      // Add a brief animation to the canvas container
      const container = document.querySelector('.drawing-container');
      if (container) {
        container.classList.add('success-pulse');
        setTimeout(() => {
          container.classList.remove('success-pulse');
        }, 1000);
      }
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
    
    
    /** *****************************************************
     * 1_5 Memory Game Activity
     ******************************************************** */
    
    /**
     * Setup for the memory mode
     * @param {boolean} playSound - Whether to play the melody
     * @param {boolean} generateNew - Whether to generate a new melody
     * @activity 1_5_memory_game
     
     */
    setupMemoryMode_1_5(playSound = false, generateNew = true) {
      // Use the specific C, D, E, G, A notes for the memory game (skipping F and H/B)
      const fixedNotes = ['C4', 'D4', 'E4', 'G4', 'A4'];
      
      // Initialize memory success count from localStorage or default to 0
      if (this.memorySuccessCount === undefined) {
        const savedLevel = localStorage.getItem('lalumo_memory_level');
        this.memorySuccessCount = savedLevel ? parseInt(savedLevel, 10) : 0;
      }
      
      if (generateNew) {
        // Bei jeder neuen Sequenz auch neue Tierbilder anzeigen
        console.log('ANIMALS: Selecting new animals for memory game');
        this.selectRandomAnimalImages();
        
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
     * @activity 1_5_memory_game
     */
    playMemorySequence() {
      debugLog("PIANO_DIRECT", "Starting memory sequence playback with", this.currentSequence.length, 'notes');
      debugLog("PIANO_DIRECT", "Visual highlighting is", this.showMemoryHighlighting ? 'enabled' : 'disabled');
      
      // Zuerst alle vorherigen Sounds stoppen (wichtig für sauberen Reset)
      this.stopCurrentSound();
      
      // Clear all existing timeouts to prevent overlap issues
      this.clearAllMelodyTimeouts();
      
      // Ensure we have a sequence to play
      if (!this.currentSequence || this.currentSequence.length === 0) {
        debugLog("PIANO_DIRECT", "No sequence to play");
        return;
      }
      
      // Play each note in the sequence with delays
      for (let i = 0; i < this.currentSequence.length; i++) {
        const note = this.currentSequence[i];
        const isLastNote = i === this.currentSequence.length - 1;
        
        // Schedule this note with proper delay
        const playTimeoutId = setTimeout(() => {
          // Only highlight current note if highlighting is enabled
          if (this.showMemoryHighlighting) {
            this.currentHighlightedNote = note;
            console.log(`MEMORY_GAME: Playing note ${i+1}/${this.currentSequence.length}: ${note} (with highlighting)`);
          } else {
            console.log(`MEMORY_GAME: Playing note ${i+1}/${this.currentSequence.length}: ${note} (sound only)`);
          }
          
          // DIRECT TONE.JS: Use global sampler directly for memory game sequence
          // This bypasses the audio engine completely for more reliable playback
          debugLog("PIANO_DIRECT", `Memory game sequence: playing ${note}`);
          
          const noteUpperCase = note.toUpperCase();
          
          // Play with direct Tone.js approach if ready
          if (isToneJsReady()) {
            // Use slightly higher velocity (1.0) for sequence notes
            playToneNote(noteUpperCase, 0.8, 1.0);
          } else {
            debugLog("PIANO_DIRECT", `Skipping note ${noteUpperCase} - sampler not ready`);
          }
          
          // Remove this timeout from tracking once executed
          const timeoutIndex = this.melodyTimeouts.indexOf(playTimeoutId);
          if (timeoutIndex !== -1) {
            this.melodyTimeouts.splice(timeoutIndex, 1);
          }
          
          // If this is the last note, schedule the final cleanup
          if (isLastNote) {
            debugLog("PIANO_DIRECT", "Last note played, scheduling highlight cleanup");
            
            const cleanupTimeoutId = setTimeout(() => {
              this.currentHighlightedNote = null;
              debugLog("PIANO_DIRECT", "Memory sequence complete, highlighting cleared");
              
              // Remove from tracking
              const idx = this.melodyTimeouts.indexOf(cleanupTimeoutId);
              if (idx !== -1) {
                this.melodyTimeouts.splice(idx, 1);
              }
            }, 300);
            
            this.melodyTimeouts.push(cleanupTimeoutId);
          }
        }, i * 600); // 600ms between notes
        
        // Track this timeout
        this.melodyTimeouts.push(playTimeoutId);
      }
    },
    
    /**
     * Helper method to clear all pending melody timeouts
     * @activity 1_5_memory_game
     */
    clearAllMelodyTimeouts() {
      if (this.melodyTimeouts && this.melodyTimeouts.length > 0) {
        console.log(`MEMORY_GAME: Clearing ${this.melodyTimeouts.length} pending timeouts`);
        this.melodyTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.melodyTimeouts = [];
      }
    },
    
    /**
     * Add a note to the user's sequence
     * @param {string} note - The note to add
     * @activity 1_5_memory_game
     * @used_by index (piano-keyboard)
     */
    addToSequence(note) {
      // Stop any currently playing melody first
      this.stopCurrentSound();
      
      // Highlight the key when pressed
      this.currentHighlightedNote = note;
      
      // Play the note using direct Tone.js for memory game free play
      debugLog("PIANO_DIRECT", `Memory game free play: ${note}`);
      const noteUpperCase = note.toUpperCase();
      
      // Play with direct Tone.js approach if ready
      if (isToneJsReady()) {
        playToneNote(noteUpperCase, 0.8, 0.9);
      } else {
        debugLog("PIANO_DIRECT", `Skipping note ${noteUpperCase} - sampler not ready`);
      }
      
      // Remove highlighting after a short delay
      setTimeout(() => {
        this.currentHighlightedNote = null;
      }, 300);
      
      // In free play mode, just play the note and return
      if (this.memoryFreePlay || !this.gameMode) {
        return;
      }
      
      // Game mode: check for correctness
      // Get the current user input position
      const currentPosition = this.userSequence.length;
      
      // Check if the current note is correct before adding it
      const isCurrentNoteCorrect = note === this.currentSequence[currentPosition];
      
      // Add note to sequence
      this.userSequence.push(note);
      
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
        
        // Play error sound using the central audio engine
        audioEngine.playNote('try_again', 1.0);
        
        this.showFeedback = true;
        this.feedback = (this.$store.strings?.memory_incorrect || 'Let\'s try again. Listen carefully!');
        
        // Enable highlighting for the next playback after an error
        this.showMemoryHighlighting = true;
        debugLog("PIANO_DIRECT", "Error detected, enabling highlighting for next playback");
        
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
        // Allow the last note to fully play before checking the sequence
        debugLog("PIANO_DIRECT", "Last note played, waiting before checking sequence");
        setTimeout(() => {
          this.checkMemorySequence();
        }, 500); // Wait 500ms to let the last note play
      }
    },
    
    /**
     * Check if the user's sequence matches the original
     * @activity 1_5_memory_game
     */
    checkMemorySequence() {
      // First stop any currently playing melody
      this.stopCurrentSound();
      
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
        (this.$store.strings?.memory_correct || 'Amazing memory! You got it right!') : 
        (this.$store.strings?.memory_incorrect || 'Let\'s try again. Listen carefully!');
      
      // Play feedback sound using the central audio engine
      if (isCorrect) {
        // Add 1 second delay before playing success sound
        setTimeout(() => {
          audioEngine.playNote('success', 1, undefined, 0.3);
          console.log('AUDIO: Playing success feedback sound with audio engine after 1s delay');
        }, 1000);
      } else {
        // Play error sound immediately
        audioEngine.playNote('try_again', 1.0);
        console.log('AUDIO: Playing try_again feedback sound with audio engine');
      }
      
      // Show appropriate animation based on result
      if (isCorrect) {
        // Create and show rainbow success animation
        showRainbowSuccess();
        
        // Increment and save memory game progress
        this.memorySuccessCount = (this.memorySuccessCount || 0) + 1;
        
        // Update progress with new activity ID only
        if (!this.progress['1_5_pitches_memory-game']) {
          this.progress['1_5_pitches_memory-game'] = 0;
        }
        
        // Reset to sound-only mode for the next sequence
        this.showMemoryHighlighting = false;
        debugLog("PIANO_DIRECT", "Success! Disabling highlighting for next sequence");
        
        // Store the maximum success count as the progress value
        this.progress['1_5_pitches_memory-game'] = Math.max(this.memorySuccessCount, this.progress['1_5_pitches_memory-game'] || 0);
        
        console.log('Updated memory progress:', this.progress['1_5_pitches_memory-game']);
        
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
          this.setupMemoryMode_1_5();
          
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
     * Play the current melody for the active mode (match, sound judgment, memory)
     * This is called by the shared Play button in the UI
     * @activity common
     * @used_by 1_2_match_sounds
     * @used_by 1_4_pitches_does-it-sound-right
     * @used_by 1_5_pitches_memory-game
     */
    playCurrentMelody() {
      // activity IDs
      if (this.mode === '1_2_pitches_match-sounds') {
        if (!this.gameMode) {
          this.startMatchGame(); // Start game mode from free play
        } else {
          this.setupMatchingMode_1_2(true, false); // Replay current melody in game mode
        }
      } else if (this.mode === '1_4_pitches_does-it-sound-right') {
        // Pass false to indicate we want to replay the current melody, not generate a new one
        this.playMelody(false);
      } else if (this.mode === '1_5_pitches_memory-game') {
        if (!this.gameMode) {
          // Neue Tiere beim Start des Memory-Spiels anzeigen
          console.log('ANIMALS: Selecting new animals for starting memory game');
          this.selectRandomAnimalImages();
          this.startMemoryGame(); // Start game mode from free play
        } else {
          // Replay sollte keine neuen Tiere anzeigen, nur bei neuen Spielen/Sequenzen
          this.playMemorySequence(); // Just replay current sequence in game mode
        }
      }
    },
    
    /**
     * Setup for the "Does It Sound Right?" activity
     * @param {boolean} playSound - Whether to play a melody right away
     */
    /**
     * Selects random animal images from the available arrays
     * Updates currentGoodAnimalImage and currentBadAnimalImage
     */
    selectRandomAnimalImages() {
      console.log('ANIMALS: Selecting random animal images');
      
      // Initialisiere lastGoodAnimal und lastBadAnimal, falls sie nicht existieren
      if (!this.lastGoodAnimal) this.lastGoodAnimal = null;
      if (!this.lastBadAnimal) this.lastBadAnimal = null;
      
      // Pick a random good animal image that's different from the last one
      let goodIndex;
      do {
        goodIndex = Math.floor(Math.random() * this.goodAnimalImages.length);
      } while (
        this.goodAnimalImages.length > 1 && 
        this.goodAnimalImages[goodIndex] === this.lastGoodAnimal
      );
      
      // Speichere das vorherige Tier und setze das neue
      this.lastGoodAnimal = this.goodAnimalImages[goodIndex];
      this.currentGoodAnimalImage = this.goodAnimalImages[goodIndex];
      
      // Pick a random bad animal image that's different from the last one
      let badIndex;
      do {
        badIndex = Math.floor(Math.random() * this.badAnimalImages.length);
      } while (
        this.badAnimalImages.length > 1 &&
        this.badAnimalImages[badIndex] === this.lastBadAnimal
      );
      
      // Speichere das vorherige Tier und setze das neue
      this.lastBadAnimal = this.badAnimalImages[badIndex];
      this.currentBadAnimalImage = this.badAnimalImages[badIndex];
      
      console.log('ANIMALS: Selected', this.currentGoodAnimalImage, this.currentBadAnimalImage);
      
      // Update the image sources in the DOM
      this.updateAnimalImages();
    },
    
    /**
     * Updates the DOM with the current animal images
     */
    updateAnimalImages() {
      console.log('ANIMALS: Updating animal images in DOM with ' + this.currentGoodAnimalImage + ' and ' + this.currentBadAnimalImage);
      // Find the image elements
      const goodAnimalImg = document.querySelector('.pitch-card.animal-card.happy .animal-icon img');
      const badAnimalImg = document.querySelector('.pitch-card.animal-card.unhappy .animal-icon img');
      
      // Update the sources if the elements exist
      if (goodAnimalImg && this.currentGoodAnimalImage) {
        goodAnimalImg.src = this.currentGoodAnimalImage;
        // Extract animal name from filename for better accessibility
        const goodAnimalName = extractAnimalName(this.currentGoodAnimalImage);
        goodAnimalImg.alt = `Happy ${goodAnimalName}`;
        console.log('ANIMALS: Updated good animal image in DOM with ' + goodAnimalName);
      } else {
        console.log('ANIMALS: Good animal button or image not found in DOM');
      }
      
      if (badAnimalImg && this.currentBadAnimalImage) {
        badAnimalImg.src = this.currentBadAnimalImage;
        // Extract animal name from filename for better accessibility
        const badAnimalName = extractAnimalName(this.currentBadAnimalImage);
        badAnimalImg.alt = `Unhappy ${badAnimalName}`;
        console.log('ANIMALS: Updated bad animal image in DOM with ' + badAnimalName);
      } else {
        console.log('ANIMALS: Bad animal button or image not found in DOM');
      }
    },
    
    /**
     * Setup for the "Does It Sound Right?" activity
     * Now includes practice mode and game mode separation
     * @param {boolean} playSound - Whether to play a melody right away
     */
    setupSoundHighOrLowMode_1_4(playSound = false) {
      console.log('Setting up Sound HighOrLow mode in practice mode');
      
      // Initialize in practice mode
      this.gameMode = false;
      
      // Reset state variables specific to this activity
      this.melodyHasWrongNote = false;
      this.currentMelodyName = '';
  
      // Clear any existing melody name display immediately
      document.querySelectorAll('.sound-status').forEach(el => {
        el.textContent = 'Generiere neue Melodie...';
      });
      this.currentMelodyId = null;
      this.showFeedback = false;
      this.feedback = '';
      this.correctAnswer = null;
      this.soundJudgmentCorrectStreak = 0; // Neue Variable für die aktuelle Erfolgsserie
      
      // Select random animal images for this round
      this.selectRandomAnimalImages();
      
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Show an introductory message
      const introMessage = language === 'de' 
        ? 'Drücke auf Play, um eine Melodie zu hören. Klingt sie richtig? Oder ist da ein falscher Ton?'
        : 'Press play to hear a melody. Does it sound right? Or is there a wrong note?';
      
      // Track activity usage and initialize level from preferences if available
      if (!this.progress['1_4_pitches_does-it-sound-right']) {
        this.progress['1_4_pitches_does-it-sound-right'] = 0;
      }
      
      // Lade den Level aus dem localStorage, falls vorhanden
      const savedLevel = parseInt(localStorage.getItem('lalumo_soundJudgmentLevel'));
      if (!isNaN(savedLevel) && savedLevel >= 1 && savedLevel <= 7) {
        this.soundJudgmentLevel = savedLevel;
        console.log(`SOUND JUDGMENT: Loaded level ${this.soundJudgmentLevel} from preferences`);
      } else if (!this.soundJudgmentLevel || this.soundJudgmentLevel < 1) {
        // Fallback: Setze Level auf 1, wenn nichts gespeichert ist
        this.soundJudgmentLevel = 1;
      }
      
      // Show mascot message first (moved from playback completion)
      this.showMascotMessage(introMessage);
      
      // Generate a melody in preparation for game mode
      this.generateSoundHighOrLowMelody();
      
      // In practice mode, we don't automatically play the melody
      if (playSound && this.gameMode) {
        this.playMelodySequence(this.currentSequence, 'sound-judgment', this.currentMelodyId);
      }
    },
    
    /**
     * Start the "Does It Sound Right?" game mode from practice mode
     * This transitions from showing just the play button to the full game UI
     * 
     * @param {string} instrument - Optional instrument to use in practice mode ('violin', 'flute', 'tuba')
     */
    startSoundJudgmentGame(instrument = null) {
      console.log(`SOUND JUDGMENT: Starting game mode from practice mode with instrument: ${instrument || 'default'}`);
      
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';

      if (instrument) {
        // Practice mode with specific instrument - don't transition to game mode yet
        this.currentInstrument = instrument;
        
        // Show a message about which instrument is playing
        // let instrumentMessage = '';
        
        // if (language === 'de') {
        //   if (instrument === 'violin') {
        //     instrumentMessage = 'Höre die Melodie auf der Geige!';
        //   } else if (instrument === 'flute') {
        //     instrumentMessage = 'Höre die Melodie auf der Flöte!';
        //   } else if (instrument === 'doublebass') {
        //     instrumentMessage = 'Höre die Melodie auf dem Kontrabass!';
        //   }
        // } else {
        //   if (instrument === 'violin') {
        //     instrumentMessage = 'Listen to the melody on the violin!';
        //   } else if (instrument === 'flute') {
        //     instrumentMessage = 'Listen to the melody on the flute!';
        //   } else if (instrument === 'doublebass') {
        //     instrumentMessage = 'Listen to the melody on the double bass!';
        //   }
        // }
        
        // // Show the instrument-specific message
        // this.showMascotMessage(instrumentMessage);
        
        // Generate a melody without wrong notes for practice mode
        this.generatePracticeMelody();
        
        // Play the melody with the selected instrument
        this.playPracticeMelody(instrument);
      } else {
        // Standard game mode transition
        // Set game mode to true to show the game interface
        this.gameMode = true;
        
        // Reset any selected instrument
        this.currentInstrument = null;
        
        // Show an introductory message for game mode
        const gameMessage = language === 'de' 
          ? 'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?'
          : 'Listen to the melody! Does it sound right? Or is there a wrong note?';
        
        // Show the game mode message
        this.showMascotMessage(gameMessage);
        
        // Update the progress display now that we're in game mode
        this.update_progress_display();
        
        // Play the first melody immediately when entering game mode
        this.playMelody(true);
      }
    },
    
    /**
     * Generate a practice melody without wrong notes
     */
    generatePracticeMelody() {
      console.log('SOUND JUDGMENT: Generating practice melody without wrong notes');
      
      // Generate a melody without wrong notes for practice mode
      // Similar to generateSoundHighOrLowMelody but without wrong notes
      
      // Get a random melody from our known melodies
      const availableMelodyIds = Object.keys(this.knownMelodies);
      const randomIndex = Math.floor(Math.random() * availableMelodyIds.length);
      const selectedMelodyId = availableMelodyIds[randomIndex];
      
      console.log(`SOUND JUDGMENT PRACTICE: Selected melody ${selectedMelodyId}`);
      
      // Get the notes for this melody
      const melodyNotes = this.knownMelodies[selectedMelodyId].notes;
      
      // Store the melody ID and name for feedback
      this.currentMelodyId = selectedMelodyId;
      this.currentMelodyName = this.knownMelodies[selectedMelodyId].name;
      
      // Use the notes directly - no wrong notes in practice mode
      this.currentSequence = [...melodyNotes];
      this.melodyHasWrongNote = false; // Always correct in practice mode
      
      return true;
    },
    
    /**
     * Play a melody in practice mode with the selected instrument
     * @param {string} instrument - The instrument to use ('violin', 'flute', 'tuba')
     */
    playPracticeMelody(instrument) {
      console.log(`SOUND JUDGMENT: Playing practice melody with instrument: ${instrument}`);
      
      // Stop any currently playing sounds
      this.stopCurrentSound();
      
      // Disable all instrument buttons during playback
      document.querySelectorAll('.instrument-button').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
      });
      
      // Play the melody with the selected instrument
      // We pass the instrument to playMelodySequence
      this.playMelodySequence(this.currentSequence, 'practice', this.currentMelodyId, { instrument });
      
      // Re-enable the buttons after playback completes
      setTimeout(() => {
        document.querySelectorAll('.instrument-button').forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('disabled');
        });
      }, this.currentSequence.length * 700 + 500); // Approximate melody duration
    },

    /**
     * Aktualisiert die Anzeige des aktuellen Levels in der UI
     * @activity common
     * @used-by 1_1_high_or_low.js
     * @used-by 1_4_sound_judgment.js
     */
    update_progress_display() {
      // Verwende die gemeinsame Hilfsfunktion aus ui-helpers.js
      const levelDescriptions = {
        1: 'Level 1: 2 falsche Noten, keine Pause',
        2: 'Level 2: 2 falsche Noten, mit Pausen',
        3: 'Level 3: 1 falsche Note, keine Pause',
        4: 'Level 4: 1 falsche Note, mit Pausen',
        5: 'Level 5: 1 falsche Note, max. 3 Halbtöne Abstand',
        6: 'Level 6: 1 falsche Note, max. 2 Halbtöne Abstand',
        7: 'Level 7: 1 falsche Note, max. 1 Halbton Abstand'
      };
      
      const levelText = levelDescriptions[this.soundJudgmentLevel] || `Level ${this.soundJudgmentLevel}`;
      const streakInfo = this.soundJudgmentCorrectStreak > 0 ? ` (${this.soundJudgmentCorrectStreak}/3)` : '';
      
      // Rufe die gemeinsame Hilfsfunktion auf
      sharedUpdateProgressDisplay({
        selector: '.sound-judgment-level',
        containerSelector: '[id="1_4_pitches"]',
        className: 'sound-judgment-level progress-display',
        content: levelText + streakInfo,
        onUpdate: () => {
          // Add visual progress bar using reusable function
          const progressbarDescription = "";
          
          showActivityProgressBar({
            appendToContainer: "#feedback_message_1_4_pitches",
            progressClass: "sound-judgment-progress",
            currentCount: this.soundJudgmentCorrectStreak || 0,
            totalCount: 3,
            currentLevel: this.soundJudgmentLevel || 1,
            notesCount: null,
            barOnly: true,
            activityName: progressbarDescription,
            positioning: {
              position: "fixed",
              bottom: "16px",
              width: "min(100%, 477px)",
              left: "max(-11px, min(20%, calc(-477px + 94vw)))"
            }
          });
        }
      });
    },
    
    /**
     * Generates a melody for the "Does It Sound Right?" activity without playing it
     * This separates the melody generation logic from playback
     * Implements progressive difficulty levels:
     * - Level 1: Es gibt 2 falsche Noten, keine Pause als Fehler
     * - Level 2: Es gibt 2 falsche Noten, Pause kann auch der Fehler sein
     * - Level 3: Es gibt nur eine falsche Note, keine Pause als Fehler
     * - Level 4: Es gibt nur eine falsche Note, Pause kann auch der Fehler sein
     * - Level 5: Es gibt nur eine falsche Note, Pause möglich, Fehler max. 3 Halbtöne
     * - Level 6: Es gibt nur eine falsche Note, Pause möglich, Fehler max. 2 Halbtöne
     * - Level 7: Es gibt nur eine falsche Note, Pause möglich, Fehler max. 1 Halbton
     */
    generateSoundHighOrLowMelody() {
      // Get all melody keys
      const melodyKeys = Object.keys(this.knownMelodies);
      if (melodyKeys.length === 0) {
        console.error('No melodies available for sound HighOrLow activity');
        return false;
      }
      
      // Stellsicherheit für Level-System
      if (!this.soundJudgmentLevel || this.soundJudgmentLevel < 1) {
        this.soundJudgmentLevel = 1;
      } else if (this.soundJudgmentLevel > 7) {
        this.soundJudgmentLevel = 7;
      }
      
      // Setze die Schwierigkeitsparameter abhängig vom Level
      const difficulty = {
        numberOfWrongNotes: this.soundJudgmentLevel <= 2 ? 2 : 1,
        allowPauseModification: this.soundJudgmentLevel % 2 === 0, // Gerade Levels erlauben Pausen als Fehler
        maxSemitoneDistance: this.soundJudgmentLevel >= 5 ? 9 - this.soundJudgmentLevel : 100 // Level 5: 3, Level 6: 2, Level 7: 1
      };
      
      console.log(`SOUND JUDGMENT: Currently at level ${this.soundJudgmentLevel}`, difficulty);
        
      // Randomly decide if the melody should have a wrong note (50% chance)
      this.melodyHasWrongNote = Math.random() < 0.5;
      
      // Wähle eine Melodie aus, die nicht dieselbe wie die vorherige ist
      let randomMelodyKey;
      let attempts = 0;
      const maxAttempts = 10; // Sicherheitsgrenze, um unendliche Schleifen zu vermeiden
      
      do {
        randomMelodyKey = melodyKeys[Math.floor(Math.random() * melodyKeys.length)];
        attempts++;
      } while (randomMelodyKey === this.currentMelodyId && melodyKeys.length > 1 && attempts < maxAttempts);
      
      if (randomMelodyKey === this.currentMelodyId && melodyKeys.length > 1) {
        console.warn('Couldn\'t find a different melody after max attempts, using a different one anyway');
        // Explizit eine andere Melodie wählen
        const currentIndex = melodyKeys.indexOf(this.currentMelodyId);
        randomMelodyKey = melodyKeys[(currentIndex + 1) % melodyKeys.length];
      }
      
      const selectedMelody = this.knownMelodies[randomMelodyKey];
      
      // Store the melody ID for later reference
      this.currentMelodyId = randomMelodyKey;
      
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Set the melody name in the appropriate language
      this.currentMelodyName = selectedMelody[language] || selectedMelody.en;
      console.log(`MELODY_NAME_DEBUG: Set currentMelodyName to "${this.currentMelodyName}" for melody ID "${randomMelodyKey}"`);
      
      // Update UI immediately after setting melody name
      document.querySelectorAll('.sound-status').forEach(el => {
        el.textContent = this.currentMelodyName;
      });
      
      // Create a copy of the melody notes
      let melodyToPlay = [...selectedMelody.notes];
      
      // If the melody should have wrong notes, modify it
      if (this.melodyHasWrongNote) {
        // Make a copy of the original melody
        const modifiedMelody = [...melodyToPlay];
        
        // Bei höheren Levels wird nur 1 Note falsch, bei niedrigeren 2
        const wrongNotePositions = [];
        
        // Sammle mögliche Positionen (nicht erste oder letzte Note)
        const possiblePositions = [];
        for (let i = 1; i < modifiedMelody.length - 1; i++) {
          possiblePositions.push(i);
        }
        
        // Wähle eine oder zwei Positionen aus, je nach Schwierigkeitsstufe
        for (let i = 0; i < difficulty.numberOfWrongNotes; i++) {
          if (possiblePositions.length === 0) break;
          
          const randomIndex = Math.floor(Math.random() * possiblePositions.length);
          wrongNotePositions.push(possiblePositions[randomIndex]);
          possiblePositions.splice(randomIndex, 1); // Entfernt diese Position aus den möglichen
        }
        
        // Modifiziere die Noten an den gewählten Positionen
        for (const noteToModifyIndex of wrongNotePositions) {
          // Extract the note to modify
          const noteToModify = modifiedMelody[noteToModifyIndex];
          
          // Check if we might replace with a pause
          const usePause = difficulty.allowPauseModification && Math.random() < 0.3; // 30% Chance für Pause wenn erlaubt
          
          if (usePause) {
            // Replace with a pause of the same duration
            if (noteToModify.includes(':')) {
              const [, modifier] = noteToModify.split(':');
              modifiedMelody[noteToModifyIndex] = 'r:' + modifier; // 'r' ist die Notation für Pause
            } else {
              modifiedMelody[noteToModifyIndex] = 'r'; // Einfache Pause ohne Modifier
            }
            
            console.log(`Modified melody at position ${noteToModifyIndex}: ${noteToModify} -> pause`);
          } else {
            // Modify the note by changing its pitch
            // Handle notes with duration modifiers, e.g., 'C4:h'
            let noteLetter, noteOctave, durationModifier = '';
            
            if (noteToModify.includes(':')) {
              const [notePart, modifier] = noteToModify.split(':');
              noteLetter = notePart.substring(0, 1);
              noteOctave = notePart.substring(1);
              durationModifier = ':' + modifier; // Save duration modifier to reapply later
            } else {
              noteLetter = noteToModify.substring(0, 1);
              noteOctave = noteToModify.substring(1);
            }
            
            // Possible note letters
            const possibleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            
            // Get the index of the current note
            const currentNoteIndex = possibleNotes.indexOf(noteLetter);
            
            // Generate a wrong note that's different from the original
            let wrongNoteIndex;
            let shift;
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
              if (difficulty.maxSemitoneDistance < 100) {
                // Für höhere Levels mit eingeschränktem Halbtonabstand
                // Shift zwischen -maxDistance und +maxDistance, aber nicht 0
                do {
                  shift = Math.floor(Math.random() * (2 * difficulty.maxSemitoneDistance + 1)) - difficulty.maxSemitoneDistance;
                } while (shift === 0);
              } else {
                // Für niedrigere Levels: Standard-Verhalten (wie bisher)
                // Random shift zwischen -2 und +2 semitones, aber nicht 0
                do {
                  shift = Math.floor(Math.random() * 5) - 2;
                } while (shift === 0);
              }
              
              wrongNoteIndex = (currentNoteIndex + shift + possibleNotes.length) % possibleNotes.length;
              attempts++;
            } while (wrongNoteIndex === currentNoteIndex && attempts < maxAttempts);
            
            // Create the wrong note, preserving any duration modifier
            const wrongNote = possibleNotes[wrongNoteIndex] + noteOctave + durationModifier;
            modifiedMelody[noteToModifyIndex] = wrongNote;
            
            console.log(`Modified melody at position ${noteToModifyIndex}: ${noteToModify} -> ${wrongNote} (shift: ${shift})`);
          }
        }
        
        // Set the modified melody as the current sequence
        melodyToPlay = modifiedMelody;
      }
      
      // Set the current sequence for playback
      this.currentSequence = melodyToPlay;
      
      // Set the correct answer based on whether the melody has a wrong note
      // If melody has wrong note, correctAnswer=false (meaning user should say it sounds wrong)
      this.correctAnswer = !this.melodyHasWrongNote;
      
      console.log('Generated sound judgment melody:', {
        name: this.currentMelodyName,
        level: this.soundJudgmentLevel,
        hasWrongNote: this.melodyHasWrongNote,
        sequence: this.currentSequence
      });
      
      return true;
    },

    /**
     * Plays a melody sequence for the "Does It Sound Right?" activity
     * Uses the shared playAudioSequence function for consistent audio behavior
     * @param {Array} notes - Array of notes to play, can include duration modifiers (e.g. 'C4:h')
     * @param {string} context - The context in which this melody is played
     * @param {string} melodyId - Optional ID of the melody being played (to get quarterNoteDuration)
     * @returns {Function} Cleanup function
     */
    playAudioSequence(notes, sequenceContext = 'general', options = {}) {
      if (!notes || notes.length === 0) {
        console.warn(`AUDIO: Attempted to play empty sequence for '${sequenceContext}'`);
        return () => {}; // Return empty cleanup function
      }
      
      // If already playing, stop the previous sound
      if (this.isPlaying) {
        this.stopCurrentSound();
      }
      
      this.isPlaying = true;
      this.currentSequenceContext = sequenceContext;
      
      // Default callback when complete
      const onComplete = options.onComplete || function() {};
      
      // Merge default options with provided options
      const mergedOptions = {
        ...{
          tempo: 120,
          loop: false,
          highlightKeys: false,
          transpose: 0,
        },
        ...options
      };
      
      // For sequence playback, we need to know the base quarter note duration
      // This helps us calculate the actual duration for modified notes like half notes, eighth notes, etc.
      const baseQuarterNoteDuration = options.noteDuration || 600; // Default 600ms for a quarter note
      
      // Create a clone of the notes array to avoid modifying the original
      const noteArray = [...notes];
      
      // Set up options for the central audio engine
      const audioEngineOptions = {
        tempo: mergedOptions.tempo,
        noteDuration: baseQuarterNoteDuration / 1000, // Convert from ms to seconds for the audio engine
        onNoteStart: (note, time, index) => {
          // Handle note highlighting or animations if needed
          if (mergedOptions.highlightKeys && this.highlightPianoKey) {
            this.highlightPianoKey(note);
          }
          
          // Log the note playback for debugging
          console.log(`AUDIO: Playing note ${index + 1}/${noteArray.length}: ${note} in context ${sequenceContext}`);
        },
        onSequenceEnd: () => {
          // Sequence playback completed
          this.isPlaying = false;
          console.log(`AUDIO: Sequence complete for '${sequenceContext}', resetting state`);
          
          // Call the completion handler
          onComplete();
        }
      };
      
      // Play the sequence using the central audio engine
      console.log(`AUDIO: Starting sequence playback for '${sequenceContext}' with audio engine`);
      const sequenceController = audioEngine.playNoteSequence(noteArray, audioEngineOptions);
      
      // Return a cleanup function that can be called to cancel the sequence
      return () => {
        console.log(`AUDIO: Externally canceling sequence for ${sequenceContext}`);
        sequenceController.stop();
        this.isPlaying = false;
      };
    },
    
    playMelodySequence(notes, context = 'sound-judgment', melodyId = null, options = {}) {
      console.log(`AUDIO: Playing melody sequence for '${context}' with ${notes.length} notes`);
      
      // If already playing, stop the current sound
      if (this.isPlaying) {
        console.log(`AUDIO: Cancelling previous playback before starting new melody`);
        this.stopCurrentSound();
      }
      
      this.isPlaying = true;
      
      // Validate all notes before attempting to play
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (!note || typeof note !== 'string') {
          // FATAL ERROR: invalid note detected
          console.error(`AUDIO_ERROR: Invalid note detected at position ${i}: "${note}". Cannot play melody.`);
          this.isPlaying = false;
          return () => {}; // Return empty cleanup function
        }
        
        // For notes with modifiers (e.g. 'C4:h'), validate the base note part
        if (note.includes(':')) {
          const basePitch = note.split(':')[0];
          // Skip validation for rests
          if (!basePitch.startsWith('r')) {
            // Erlaubt einzelne Notennamen (A-G) ohne Lage - diese werden später mit Lage 4 ergänzt
            const validSingleNote = /^[A-Ga-g]$/.test(basePitch);
            // Normale Validierung für andere Noten (müssen Lage haben, z.B. C4)
            const validWithOctave = basePitch.length >= 2;
            
            if (!validSingleNote && !validWithOctave) {
              console.error(`AUDIO_ERROR: Invalid modified note at position ${i}: "${note}". Base pitch "${basePitch}" is invalid.`);
              this.isPlaying = false;
              return () => {};
            }
          }
        }
      }
      
      // Create a safe copy of the notes
      const noteArray = [...notes];
      
      // Store the sequence
      this.currentSequence = noteArray;
      
      // Determine the base quarter note duration
      let baseQuarterNoteDuration = 700; // Default
      
      // If we have a melodyId, try to get the specific quarterNoteDuration for this melody
      if (melodyId && this.knownMelodies[melodyId] && this.knownMelodies[melodyId].quarterNoteDuration) {
        baseQuarterNoteDuration = this.knownMelodies[melodyId].quarterNoteDuration;
        console.log(`AUDIO: Using melody-specific quarter note duration: ${baseQuarterNoteDuration}ms for ${melodyId}`);
	  } else {
	    console.log(`DURATION_DEBUG: Using default quarter note duration ${baseQuarterNoteDuration}ms - no melody-specific duration found for melodyId: ${melodyId}`);
	  }
	  
	  // Log the melody definition for debugging
	  if (melodyId && this.knownMelodies[melodyId]) {
	    console.log(`DURATION_DEBUG: Melody "${melodyId}" definition:`, {
	      quarterNoteDuration: this.knownMelodies[melodyId].quarterNoteDuration,
	      notes: this.knownMelodies[melodyId].notes
	    });
      }
      
      /**
       * Notenformat-Dokumentation:
       * 
       * Notennamen & Lagen:
       * - Notennamen: C, D, E, F, G, A, B (H wird als B interpretiert)
       * - Lageangabe: Zahl nach dem Notennamen, z.B. C4 (mittleres C)
       * - Ohne Lagenangabe wird standardmäßig Lage 4 angenommen, z.B. A = A4
       * 
       * Notenlängen werden durch Doppelpunkt + Modifikator angegeben:
       * - :w = Ganze Note (4 × Viertelnote)
       * - :h = Halbe Note (2 × Viertelnote)
       * - :q = Viertelnote (Standard, kann weggelassen werden)
       * - :e = Achtelnote (1/2 × Viertelnote)
       * - :s = Sechzehntelnote (1/4 × Viertelnote)
       * 
       * Beispiele: 
       * - C4   = Mittleres C als Viertelnote
       * - D:h  = D in Lage 4 als halbe Note
       * - E5:e = E in Lage 5 als Achtelnote
       * - G:s  = G in Lage 4 als Sechzehntelnote
       * - A3:w = A in Lage 3 als ganze Note
       */
      
      // Prepare notes array with duration information
      // Process each note to separate note name and duration modifier
      const processedNotes = noteArray.map(note => {
        // Default is quarter note duration
        let duration = baseQuarterNoteDuration;
        let noteName = note;
        let durationModifier = null;
        
        // Zuerst prüfen, ob es eine reine Note ohne Lage ist, und falls ja, Standardlage 4 hinzufügen
        if (typeof note === 'string') {
          // Check if a duration modifier exists
          if (note.includes(':')) {
            const [basePart, modifier] = note.split(':');
            // Check if the base part is just a letter without octave
            if (/^[A-Ga-g]$/.test(basePart)) {
              const withOctave = basePart + '4';
              noteName = withOctave + ':' + modifier;
              console.log(`AUDIO: Note with duration but without octave, adding default octave 4: ${note} → ${noteName}`);
            }
          } 
          // Check for note without duration and without octave
          else if (/^[A-Ga-g]$/.test(note)) {
            noteName = note + '4';
            console.log(`AUDIO: Note without octave, adding default octave 4: ${note} → ${noteName}`);
          }
        }
        
        // Jetzt Dauer verarbeiten, falls vorhanden
        if (typeof noteName === 'string' && noteName.includes(':')) {
          const [name, modifier] = noteName.split(':');
          noteName = name;
          durationModifier = modifier;
          
          // Calculate actual duration based on modifier
          switch(durationModifier) {
            case 'W': // whole note, punctuated :W
              duration = baseQuarterNoteDuration * 6;
              break;
            case 'w': // whole note :w
              duration = baseQuarterNoteDuration * 4;
              break;
            case 'H': // half note, punctuated :H
              duration = baseQuarterNoteDuration * 3;
              break;
            case 'h': // half note :h
              duration = baseQuarterNoteDuration * 2;
              break;
            case 'Q': // quarter note, punctuated :Q
              duration = baseQuarterNoteDuration * 1.5;
              break;
            case 'q': // quarter note (default) :q
              duration = baseQuarterNoteDuration;
              break;
            case 'E': // eighth note, punctuated :E
              duration = baseQuarterNoteDuration * 0.75;
              break;
            case 'e': // eighth note :e
              duration = baseQuarterNoteDuration * 0.5;
              break;
            case 's': // sixteenth note :s
              duration = baseQuarterNoteDuration * 0.25;
              break;
            default:
              // For unknown modifiers, use default duration
              console.warn(`AUDIO: Unknown duration modifier '${durationModifier}' in note ${noteName}`);
              duration = baseQuarterNoteDuration;
          }
        }
        
        // Check if note has no octave specified, add default octave 4
        // Look for notes that are just a letter (A-G) without a number
        if (typeof noteName === 'string' && /^[A-Ga-g]$/.test(noteName)) {
          const originalNote = noteName;
          noteName = noteName + '4';
          console.log(`AUDIO: Note without octave specified, using default octave 4: ${originalNote} → ${noteName}`);
        }
        
        return {
          name: noteName,
          duration: duration
        };
      });
      
      console.log('AUDIO: Processed notes with durations:', processedNotes);
      
      // Prepare melody timeouts if not already initialized
      if (!this.melodyTimeouts) {
        this.melodyTimeouts = [];
      }
      
      // CRITICAL FIX: Make sure we explicitly preserve and log the instrument parameter
      // Extract the instrument from original options
      const instrumentToUse = options.instrument || 'default';
      console.log(`[INSTRUMENT_CRITICAL] Starting melody sequence with instrument: ${instrumentToUse}`);
      
      // Start playing notes sequentially with the correct instrument
      this.playProcessedNoteSequence(processedNotes, 0, context, {
        melodyId: melodyId,
        // CRITICAL: Preserve the instrument parameter!
        instrument: instrumentToUse,
        onComplete: () => {
          console.log(`AUDIO: Sound judgment melody playback complete`);
          // Safely reset isPlaying flag and ensure UI is updated
          this.isPlaying = false;
          
          // Enable play buttons
          document.querySelectorAll('.play-button').forEach(btn => {
            btn.classList.remove('playing');
            btn.disabled = false;
          });
        }
      });
      
      // Return a cleanup function
      return () => {
        console.log(`AUDIO: External call to stop melody playback`);
        this.stopCurrentSound();
      };
    },
    
    /**
     * Helper method to play a sequence of processed notes with custom durations
     * @param {Array} notes - Array of {name, duration} objects
     * @param {number} index - Current index to play
     * @param {string} context - Context of playback
     * @param {Object} options - Additional options including instrument selection
     */
    playProcessedNoteSequence(notes, index, context = 'general', options = {}) {
      // REFACTORED: Always track instrument directly through the chain
      // Add specific debugging to trace instrument through the async calls
      const instrumentTracking = options.instrument || 'default';
      
      console.log(`[INSTRUMENT_TRACKING] Note ${index}/${notes.length} with instrument: ${instrumentTracking}`);
      
      // Save the instrument at the start of each note to ensure consistency
      const currentSequenceInstrument = instrumentTracking;
      
      // If we've reached the end of the sequence or playback was stopped
      if (!this.isPlaying || index >= notes.length) {
        if (this.isPlaying) { // Make sure we only call onComplete if we didn't stop manually
          console.log(`AUDIO: End of note sequence reached for ${context}`);
          this.isPlaying = false;
          if (options.onComplete) {
            options.onComplete();
          }
        }
        return;
      }
      
      const currentNote = notes[index];
      const { name, duration } = currentNote;
      
      // Play the note using the audio engine
      try {
        // FULL_DURATION_DEBUG: Let's add comprehensive logging to debug the note duration issue
        let noteDuration;
        
        // Get the actual base quarter note duration - this could be from the context of this sequence
        // Not a hardcoded value
        const effectiveQuarterDuration = options.melodyId && this.knownMelodies[options.melodyId]?.quarterNoteDuration || 700;
        console.log(`DURATION_DEBUG: Using effective quarter note duration: ${effectiveQuarterDuration}ms`);
        
        // Get the input parameters for logging
        console.log(`DURATION_DEBUG: Original note data:`, { 
          name, 
          duration, 
          index, 
          context, 
          'melody ID': options.melodyId,
          'total notes': notes.length,
          'options': JSON.stringify(options)
        });
        
        if (duration) {
          // Base the mapping on relative multiples of quarter note duration
          const relativeToQuarter = duration / effectiveQuarterDuration;
          
          // Original mapping logic with better thresholds
          if (relativeToQuarter <= 0.25) { // 16th note (1/4 of quarter)
            noteDuration = '16n';
          } else if (relativeToQuarter <= 0.5) { // 8th note (1/2 of quarter)
            noteDuration = '8n';
          } else if (relativeToQuarter <= 0.9) { // Quarter note
            noteDuration = '4n';
          } else if (relativeToQuarter <= 1.9) { // Half note (about 2x quarter)
            noteDuration = '2n';
          } else { // Whole note or longer (4x quarter or more)
            noteDuration = '1n';
          }
          
          console.log(`DURATION_DEBUG: Mapped ${duration}ms (${relativeToQuarter}x quarter note) to ${noteDuration}`);
        } else {
          // Default value if duration is not defined
          noteDuration = '4n';
          console.log(`DURATION_DEBUG: No duration provided, defaulting to ${noteDuration}`);
        }
        
        console.log(`AUDIO: Playing note ${index+1}/${notes.length}: ${name} with notation ${noteDuration} (${duration}ms) in context "${context}"`);
        
        // Verarbeite den Notennamen je nach Kontext
        let processedName = name;
        let volume = 0.75;
        
        // REFACTORED: Handle different instrument types more explicitly and consistently
        // Extract instrument directly from options for clarity
        const requestedInstrument = options.instrument || 'default';
        
        if (context === 'practice' && requestedInstrument !== 'default') {
          // Log the explicit instrument we're using for this melody
          console.log(`[INSTRUMENT_EXPLICIT] Using explicit instrument for melody: ${requestedInstrument}`);
          
          // Set volume based on instrument type - but don't call useInstrument here
          // We'll pass the instrument directly to each note instead
          if (requestedInstrument === 'violin') {
            volume = 0.65; // Reduced violin volume as it has enhanced harmonics now
            console.log('[INSTRUMENT_SETUP] Using violin with volume 0.65 (AMSynth with triangle oscillator)');
          } else if (requestedInstrument === 'flute') {
            volume = 0.85; // Increased flute volume as it has a purer tone
            console.log('[INSTRUMENT_SETUP] Using flute with volume 0.85 (Synth with sine wave)');
          } else if (requestedInstrument === 'tuba') {
            volume = 0.6; // Reduced tuba volume as it has enhanced bass response
            console.log('[INSTRUMENT_SETUP] Using tuba with volume 0.6 (FMSynth with square8 wave)');
          } else {
            // Fallback to standard sound
            console.log('[INSTRUMENT_SETUP] Using default instrument with standard volume (PolySynth)');
          }
          
          // Make sure the instrument is explicitly logged
          console.log(`[INSTRUMENT_VERBOSE] Playing ${requestedInstrument} note: ${name} with volume ${volume}`);
        } else if (context === 'sound-judgment') {
          // REFACTORED: Don't call useInstrument here, always pass 'default' as the instrument parameter
          // Instead of relying on global state that can be lost in async calls
          console.log('[INSTRUMENT_SOUND_JUDGMENT] Using default instrument for sound judgment');
          
          // Für die "Does It Sound Right?"-Aktivität: Präfix hinzufügen
          processedName = `sound_${name.toLowerCase()}`;

          // Feedback-Sounds haben eine höhere Lautstärke
          volume = 0.85;
        } else {
          // REFACTORED: Don't call useInstrument here either, just log what we're doing
          // and let the direct parameter passing take care of it
          console.log('[INSTRUMENT_DEFAULT] Using default instrument for general playback');
          // Default instrument will be passed directly as parameter
        }
        
        // CRITICAL_FIX: The key insight is that we need to use the ORIGINAL duration 
        // when playing the note, NOT the converted notation which gets mis-translated
        
        // Use the duration directly in milliseconds for accurate timing
        const millisecondDuration = duration / 1000; // Convert ms to seconds for the audio engine
        
        console.log(`DURATION_FIX: Playing note with exact duration: ${millisecondDuration}s (${duration}ms)`);
        
        // REFACTORED: Always get instrument directly from options and pass it as a direct parameter
        // Never embed it within the options object again
        const instrumentToUse = options.instrument || 'default';
        
        // Log the instrument being used for this note
        console.log(`[INSTRUMENT_DIRECT] Playing note ${processedName} with instrument: ${instrumentToUse}`);
        
        // Pass the instrument directly as a parameter - never inside options
        // Make sure we're matching the audioEngine.playNote signature correctly:
        // playNote(noteName, duration, time, velocity, instrument, options)
        console.log(`[INSTRUMENT_DEBUG] About to call playNote with instrument: ${instrumentToUse}`);
        audioEngine.playNote(processedName, millisecondDuration, undefined, volume, instrumentToUse);
        
        // Speichere die aktuelle Note für zukünftige Stops
        this.lastPlayedNote = processedName;
        
        // Use the original duration for timing the next note
        // This ensures perfect synchronization between note length and timing
        const nextNoteTiming = duration;
        
        // Schedule the next note
        const timeoutId = setTimeout(() => {
          // Remove this timeout from the tracking array once executed
          const idx = this.melodyTimeouts.indexOf(timeoutId);
          if (idx !== -1) {
            this.melodyTimeouts.splice(idx, 1);
          }
          
          // REFACTORED: Never rely on options object for instrument passing - capture it explicitly
          // This is the critical fix that ensures instrument consistency across the entire melody
          // Extract the instrument to make it clear and explicit in logs what's being passed
          const instrumentForNextNote = currentSequenceInstrument;
          console.log(`[INSTRUMENT_PRESERVED] Scheduling next note with instrument: ${instrumentForNextNote}`);
          
          // Pass the instrument in the options object but in a way that it's explicitly tracked
          const nextOptions = {...options, instrument: instrumentForNextNote};
          this.playProcessedNoteSequence(notes, index + 1, context, nextOptions);
        }, nextNoteTiming);
        
        // Track this timeout for potential stopping
        this.melodyTimeouts.push(timeoutId);
        
      } catch (err) {
        console.error(`AUDIO_ERROR: Failed to play note ${name}:`, err);
        // Try to continue with next note despite error
        const timeoutId = setTimeout(() => {
          this.playProcessedNoteSequence(notes, index + 1, context, options);
        }, 500); // Use a short safety delay
        this.melodyTimeouts.push(timeoutId);
      }
    },
    
    /**
     * Check the user's answer for the "Does It Sound Right?" activity
     * With progressive level system:
     * - Level 1-7 with increasing difficulty
     * - Need 10 correct answers in a row to advance to next level
     * - Progress is saved in preferences
     * @param {boolean} userSaysCorrect - True if the user said the melody sounds correct
     */
    checkSoundHighOrLow(userSaysCorrect) {
      // Stop any currently playing sound
      this.stopCurrentSound();
      
      // Get the current language
      const language = localStorage.getItem('lalumo_language') === 'german' ? 'de' : 'en';
      
      // Check if the user's answer is correct
      // User says "Sounds Good" (true) and the melody has no wrong note (!this.melodyHasWrongNote) OR
      // User says "Sounds Wrong" (false) and the melody has a wrong note (this.melodyHasWrongNote)
      const isCorrect = (userSaysCorrect && !this.melodyHasWrongNote) || (!userSaysCorrect && this.melodyHasWrongNote);
      
      // Prepare feedback messages based on language and result
      let feedbackMessage;
      if (isCorrect) {
        feedbackMessage = language === 'de' ? 'Toll gemacht! Du hast richtig gehört!' : 'Well done! You heard correctly!';
      } else {
        if (this.melodyHasWrongNote) {
          feedbackMessage = language === 'de' ? 'Hör noch mal hin! Da war ein falscher Ton.' : 'Listen again! There was a wrong note.';
        } else {
          feedbackMessage = language === 'de' ? 'Die Melodie war richtig. Versuche es noch einmal!' : 'The melody was correct. Try again!';
        }
      }
      
      // Display feedback message
      this.feedback = feedbackMessage;
      this.showFeedback = true;
      
      // Play feedback sound using the central audio engine
      audioEngine.playNote(isCorrect ? 'success' : 'try_again', 1.0);
      console.log(`AUDIO: Playing ${isCorrect ? 'success' : 'try_again'} feedback sound with audio engine`);
      
      // Show visual feedback animation
      if (isCorrect) {
        // Create and show rainbow success animation
        showRainbowSuccess();
        
        // Increment progress counter
        if (!this.progress['1_4_pitches_does-it-sound-right']) {
          this.progress['1_4_pitches_does-it-sound-right'] = 0;
        }
        this.progress['1_4_pitches_does-it-sound-right']++;
        
        // Save progress to localStorage
        localStorage.setItem('lalumo_progress', JSON.stringify(this.progress));
        
        console.log('Updated sound judgment progress:', this.progress['1_4_pitches_does-it-sound-right']);
        
        // Increment the streak counter for level progression
        this.soundJudgmentCorrectStreak++;
        console.log(`SOUND JUDGMENT: Streak increased to ${this.soundJudgmentCorrectStreak}`);
        
        // Check if we should advance to the next level (10 correct in a row)
        if (this.soundJudgmentCorrectStreak >= 3 && this.soundJudgmentLevel < 7) {
          this.soundJudgmentLevel++;
          this.soundJudgmentCorrectStreak = 0; // Reset streak for next level
          
          // Save the updated level to preferences
          localStorage.setItem('lalumo_soundJudgmentLevel', this.soundJudgmentLevel);
          
          console.log(`SOUND JUDGMENT: Advanced to level ${this.soundJudgmentLevel}!`);
          
          // Show level-up message
          let levelUpMessage;
          if (language === 'de') {
            levelUpMessage = `Super! Du hast Level ${this.soundJudgmentLevel} erreicht!`;
          } else {
            levelUpMessage = `Great! You've reached level ${this.soundJudgmentLevel}!`;
          }
          
          // Show mascot message for level up
          this.showMascotMessage(levelUpMessage);
          
          // Special animation for level up (bigger rainbow)
          showBigRainbowSuccess();
        }
        
        // Update level display
        this.update_progress_display();
      } else {
        // Reset streak on wrong answers
        this.soundJudgmentCorrectStreak = 0;
        console.log('SOUND JUDGMENT: Streak reset to 0');
        this.update_progress_display();
      }
      
      // After a delay, reset and prepare for the next melody
      setTimeout(() => {
        this.showFeedback = false;
        
        if (isCorrect) {
          // If the answer was correct, generate a new melody
          this.playMelody(true);
        } else {
          // If the answer was incorrect, replay the same melody
          // Pass false to indicate not to generate a new melody
          this.playMelody(false);
        }
      }, 2000);
    },

    /**
     * Start game mode for memory (called when play button is pressed)
     */
    startMemoryGame() {
      this.gameMode = true;
      this.memoryFreePlay = false;
      this.setupMemoryMode_1_5(true, true); // Play sound and generate new
      this.showContextMessage(); // Update instructions
    },

    /**
     * Start game mode for matching (called when play button is pressed)
     */
    
    /**
     * Updates the background image based on the matching progress
     * - Below 10 correct: pitches_action1_2_no_waves_and_frog.jpg
     * - Between 10-19 correct: pitches_action1_2_no_frog.jpg
     * - 20+ correct: pitches_action1_2.jpg
     */
    // Helper method to preload an image
    preloadBackgroundImage(imageUrl) {
      if (!this.preloadedImages) {
        this.preloadedImages = new Set();
      }
      
      // Skip if already preloaded
      if (this.preloadedImages.has(imageUrl)) {
        return;
      }
      
      // Create an image object and start loading
      const img = new Image();
      img.src = imageUrl;
      this.preloadedImages.add(imageUrl);
      console.log(`Preloading background image: ${imageUrl}`);
    },
    
    updateMatchingBackground() {
      const progress = this.progress['1_2_pitches_match-sounds'] || 0;
      let backgroundImage;
      
      // Progress thresholds change at exactly 10 and 20 successes
      if (progress <= 9) { // Change at exactly 10
        backgroundImage = '/images/backgrounds/pitches_action1_2_no_waves_and_frog.jpg';
        
        // Preload next background when approaching transition point
        if (progress === 9) {
          this.preloadBackgroundImage('/images/backgrounds/pitches_action1_2_no_frog.jpg');
        }
      } else if (progress <= 19) { // Change at exactly 20
        backgroundImage = '/images/backgrounds/pitches_action1_2_no_frog.jpg';
        
        // Preload next background when approaching transition point
        if (progress === 19) {
          this.preloadBackgroundImage('/images/backgrounds/pitches_action1_2.jpg');
        }
      } else {
        backgroundImage = '/images/backgrounds/pitches_action1_2.jpg';
      }
      
      const matchingActivity = document.querySelector('[x-show="mode === \'1_2_pitches_match-sounds\'"]');
      if (matchingActivity) {
        matchingActivity.style.backgroundImage = `url(${backgroundImage})`;
        console.log(`Updated background based on progress (${progress}): ${backgroundImage}`);
      } else {
        console.log('[Error] while updating background: div not found')
      }
    },
    
    /**
     * Adjusts the size and layout of pitch cards in Match-Sounds Activity (1_2)
     * based on the unlocked patterns status.
     */
    updateMatchSoundsPitchCardLayout() {
      console.log('Updating Match Sounds pitch card layout based on unlocked patterns');
      
      // Identify the Match-Sounds activity container
      const matchingActivity = document.querySelector('[x-show="mode === \'1_2_pitches_match-sounds\'"]');
      if (!matchingActivity) return;
      
      // Find the container that holds the pitch cards in a grid
      const gridContainer = matchingActivity.querySelector('.match-sounds-container');
      if (!gridContainer) {
        console.log('No match-sounds-container found in match sounds activity');
        return;
      }
      
      // Check which patterns are unlocked
      const hasWave = this.unlockedPatterns.includes('wave');
      const hasJump = this.unlockedPatterns.includes('jump');
      
      // Remove existing state classes
      gridContainer.classList.remove('no-unlocks', 'no-frog', 'all-unlocked');
      
      // Case 1: Neither wave nor frog patterns are unlocked (all cards are taller)
      if (!hasWave && !hasJump) {
        gridContainer.classList.add('no-unlocks');
        console.log('Applied no-unlocks class: all cards will be double height');
      }
      // Case 2: No frog unlocked (down card spans two rows)
      else if (!hasJump) {
        gridContainer.classList.add('no-frog');
        console.log('Applied no-frog class: down card will span two rows');
      }
      // Case 3: All patterns are unlocked (bottom row buttons are 50% taller)
      else if (hasWave && hasJump) {
        gridContainer.classList.add('all-unlocked');
        console.log('Applied all-unlocked class: bottom row cards will be 50% taller');
      }
    },
    
    startMatchGame() {
      this.gameMode = true;
      this.setupMatchingMode_1_2(true, true); // Play sound and generate new
      this.showContextMessage(); // Update instructions
    }
  };
}
