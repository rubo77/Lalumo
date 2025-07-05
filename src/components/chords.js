/**
 * Chords component
 * Implements interactive chord learning experiences for children
 */

// External library imports
import * as Tone from 'tone';

// Export specific functions from each module
// Common Module
export { testCommonModuleImport } from './2_chords/common.js';

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
import { update_progress_display } from '../components/shared/ui-helpers.js';

// 2_1 Chord Color Matching Module
import { 
  testChordColorMatchingModuleImport,
  newColorMatchingQuestion,
  checkColorAnswer
} from './2_chords/2_1_chord_color_matching.js';

// 2_2 Chord Mood Landscapes Module
import { testChordMoodLandscapesModuleImport } from './2_chords/2_2_chord_mood_landscapes.js';

// 2_3 Chord Building Module
import { testChordBuildingModuleImport } from './2_chords/2_3_chord_building.js';

// 2_4 Missing Note Module
import { testMissingNoteModuleImport } from './2_chords/2_4_missing_note.js';

// 2_5 Chord Characters Module
import { 
  testChordCharactersModuleImport,
  updateCharacterBackground 
} from './2_chords/2_5_chord_characters.js';

// 2_6 Chord Characters Module
import { test2_6_harmmony_gardenModuleImport } from './2_chords/2_6_harmmony_garden.js';

// Import debug utilities
import { debugLog } from '../utils/debug.js';

// Import the audio engine
import audioEngine from './audio-engine.js';

// Import chord styles
import '../styles/2_chords.css';

// test-chords-module.js
import { testChordsModuleImport } from './test-chords-modules.js';

export function chords() {
  return {
    // Current activity mode
    mode: 'main',
    
    // Audio context and active oscillators
    audioContext: null,
    oscillators: {},
    activeChord: null,
    isPlaying: false,
    
    /**
     * Update chord buttons visibility based on user progress
     * Controls which chord type buttons are shown in 2_5_chords_characters activity
     */
    updateChordButtonsVisibility() {
      // Get the current progress for chord characters activity
      const progressData = localStorage.getItem('lalumo_chords_progress');
      const progress = progressData ? 
        JSON.parse(progressData)['2_5_chords_characters'] || 0 : 
        this?.progress?.['2_5_chords_characters'] || 0;
      
      // Get chord buttons
      const diminishedBtn = document.getElementById('button_2_5_1_diminished');
      const augmentedBtn = document.getElementById('button_2_5_1_augmented');
      
      if (!diminishedBtn || !augmentedBtn) {
        // Buttons not found in DOM yet, will try again when activity is shown
        debugLog('CHORDS', 'Chord buttons not found in DOM yet');
        return;
      }
      
      // Apply visibility rules based on progress
      if (progress < 10) {
        // Progress < 10: Hide mysterious (diminished) and surprised (augmented)
        diminishedBtn.style.display = 'none';
        augmentedBtn.style.display = 'none';
        debugLog('CHORDS', 'Progress < 10: Hiding mysterious and surprised buttons');
      } else if (progress < 20) {
        // Progress 10-19: hide mysterious octopus (diminished), show surprised squirrel (augmented)
        diminishedBtn.style.display = 'none';
        augmentedBtn.style.display = '';
        debugLog('CHORDS', 'Progress 10-19: Showing mysterious, hiding surprised button');
      } else {
        // Progress >= 20: Show all buttons
        diminishedBtn.style.display = '';
        augmentedBtn.style.display = '';
        debugLog('CHORDS', 'Progress >= 20: Showing all chord buttons');
      }
    },
    
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
    previousChordType: null, // Track previous chord type for repetition logic
    consecutiveRepeats: 0, // Counter for consecutive chord type repeats
    selectedColors: [],
    correctAnswers: 0,
    totalQuestions: 0,
    feedbackMessage: '',
    showFeedback: false,
    progress: null,
    
    /**
     * Initialize the component
     */
    init() {
      debugLog('CHORDS', 'Chords component initialized');
      
      // Initialize chord progress
      try {
        const progressData = localStorage.getItem('lalumo_chords_progress');
        this.progress = progressData ? JSON.parse(progressData) : {};
      } catch (e) {
        console.error('Error reading progress:', e);
        this.progress = {};
      }
      
      // Initialize repetition tracking variables
      this.consecutiveRepeats = 0;
      this.previousChordType = null;
      debugLog('CHORDS', '[REPETITION] Initialized repetition tracking: consecutiveRepeats=0, previousChordType=null');
      
      // Register this component globally
      window.chordsComponent = this;
      debugLog('CHORDS', 'Registering chords component globally: window.chordsComponent is now:', !!window.chordsComponent);
      
      // Set up a MutationObserver to detect when chord buttons are added to the DOM
      if (window.MutationObserver) {
        debugLog('CHORDS', 'Setting up MutationObserver for chord buttons visibility');
        const observer = new MutationObserver((mutations) => {
          // Check if any of the mutations added our target elements
          for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
              const dimnishedBtn = document.getElementById('button_2_5_1_diminished');
              const augmentedBtn = document.getElementById('button_2_5_1_augmented');
              
              if (dimnishedBtn && augmentedBtn) {
                debugLog('CHORDS', 'Chord buttons found in DOM, updating visibility');
                this.updateChordButtonsVisibility();
                // No need to observe further once we've found our elements
                observer.disconnect();
                break;
              }
            }
          }
        });
        
        // Start observing the document with the configured parameters
        observer.observe(document.body, { childList: true, subtree: true });
      }
      
      // Also attempt direct initialization after a delay as fallback
      setTimeout(() => this.updateChordButtonsVisibility(), 1500);
      
      // Set up audio context when user interacts
      document.addEventListener('click', this.initAudio.bind(this), { once: true });
      document.addEventListener('touchstart', this.initAudio.bind(this), { once: true });
      
      // Listen for global events
      window.addEventListener('lalumo:stopallsounds', this.stopAllSounds.bind(this));
      
      // Try to load saved progress from localStorage
      try {
        const savedProgress = localStorage.getItem('lalumo_chords_progress');
        if (savedProgress) {
          this.progress = JSON.parse(savedProgress);
          
          // Ensure all activity progress fields exist
          if (!this.progress['2_1_chords_color-matching']) this.progress['2_1_chords_color-matching'] = 0;
          if (!this.progress['2_2_chords_mood-landscapes']) this.progress['2_2_chords_mood-landscapes'] = 0;
          if (!this.progress['2_3_chords_chord-building']) this.progress['2_3_chords_chord-building'] = 0;
          if (!this.progress['2_4_chords_missing-note']) this.progress['2_4_chords_missing-note'] = 0;
          if (!this.progress['2_5_chords_characters']) this.progress['2_5_chords_characters'] = 0;
          if (!this.progress['2_6_chords_harmony-gardens']) this.progress['2_6_chords_harmony-gardens'] = 0;
          
          debugLog('CHORDS', 'Loaded chords progress data:', this.progress);
          
          // Initialize activity progress from saved data
          this.totalQuestions = this.progress[this.mode] || 0;
          debugLog('CHORDS', `Initialized current activity progress from localStorage: ${this.totalQuestions}`);
        } else {
          // Initialize with empty progress object
          this.progress = {
            '2_1_chords_color-matching': 0,
            '2_2_chords_mood-landscapes': 0,
            '2_3_chords_chord-building': 0,
            '2_4_chords_missing-note': 0,
            '2_5_chords_characters': 0,
            '2_6_chords_harmony-gardens': 0
          };
        }
      } catch (e) {
        debugLog('CHORDS', 'Could not load saved progress:', e);
      }
      
      // Listen for chord mode changes via event
      document.addEventListener('set-chord-mode', (event) => {
        const mode = event.detail || 'main';
        debugLog('CHORDS', `Received chord mode change event: ${mode}`);
        // Call our own setMode method to ensure proper initialization
        this.setMode(mode);
      });
      
      // Setup navigation elements after DOM is fully loaded
      document.addEventListener('DOMContentLoaded', () => {
        this.setupNavigation();
        this.setupFullHeightContainers();
      });
      
      // Debug: Initial mode und state
      debugLog('CHORDS_2_1_DEBUG', `Initial chords component state: mode=${this.mode}, currentChordType=${this.currentChordType}, totalQuestions=${this.totalQuestions}`);
      
      // Debug log für Alpine.js Lebenszyklusereignisse
      document.addEventListener('alpine:initialized', () => {
        debugLog('CHORDS_2_1_DEBUG', 'Alpine.js initialized event fired');
      });
      
      window.addEventListener('load', () => {
        debugLog('CHORDS_2_1_DEBUG', `Window load event, current mode: ${this.mode}`);
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
          // Force a Tone.start() to handle browser autoplay restrictions
          await Tone.start();
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
     * @activity all
     * @used_by 2_1_chord_color_matching, 2_4_missing_note
     */
    async playChordByType(chordType, rootNote = 'C4', options = { duration: 2 }) {
      this.stopAllSounds();
      debugLog('CHORDS', 'playChord called with chordType:', chordType, 'rootNote:', rootNote);
      
      // Debug information for 2_1 activity
      debugLog('CHORDS_2_1_DEBUG', `playChord called with chordType: ${chordType}, component has currentChordType: ${this.currentChordType}`);
      debugLog('CHORDS_2_1_DEBUG', `Current component state: mode=${this.mode}, totalQuestions=${this.totalQuestions}`);

      if (!chordType) {
        debugLog('CHORDS_2_1_DEBUG', 'ERROR: Chord type is null or undefined! Stack trace:', new Error().stack);
        return false;
      }
      
      // Declare chord variable in outer scope so it's available throughout the method
      let chord;
      
      try {
        // Force Tone.js to start if needed (critical for sound playback)
        if (Tone.context.state !== "running") {
          debugLog('CHORDS', 'Tone.js context not running, attempting to start');
          try {
            await Tone.start();
            debugLog('CHORDS', 'Tone.js started successfully in playChord');
          } catch (error) {
            debugLog('CHORDS', `Failed to start Tone.js: ${error.message}`);
            // Try a user interaction fallback
            const startTone = async () => {
              try {
                await Tone.start();
                debugLog('CHORDS', 'Tone.js started via user interaction');
                document.removeEventListener('click', startTone);
                document.removeEventListener('touchstart', startTone);
                // Try playing the chord again after successful start
                setTimeout(() => this.playChordByType(chordType, rootNote, options), 100);
              } catch (e) {
                debugLog('CHORDS', `Still failed to start Tone.js: ${e.message}`);
              }
            };
            document.addEventListener('click', startTone, { once: true });
            document.addEventListener('touchstart', startTone, { once: true });
            return; // Exit early and wait for user interaction
          }
        }
        
        // Get chord definition
        chord = this.chords[chordType];
        debugLog('CHORDS_2_1_DEBUG', `Retrieved chord definition for ${chordType}:`, chord ? 'found' : 'not found');
        
        if (!chord) {
          debugLog('CHORDS_2_1_DEBUG', `ERROR: Unknown chord type: ${chordType}! Stack trace:`, new Error().stack);
          return; // Exit early instead of using fallback
        }
        
        debugLog('CHORDS_2_1_DEBUG', `Playing ${chordType} chord with root ${rootNote}`);
      } catch (error) {
        console.error('Error preparing chord playback:', error);
        return;
      }
      
      this.currentChordType = chordType;
      this.activeChord = [];
      
      try {
        // Verify the chord object is available
        if (!chord) {
          debugLog('CHORDS_2_1_DEBUG', 'ERROR: chord is undefined before playing. This should not happen!');
          return;
        }
        
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
        
        // Check if chord.intervals exists
        if (!chord.intervals) {
          debugLog('CHORDS_2_1_DEBUG', `ERROR: No intervals found for chord type ${chordType}:`, chord);
          return;
        }
        
        // Calculate all note names in the chord based on intervals
        debugLog('CHORDS_2_1_DEBUG', `Using intervals for ${chordType}:`, chord.intervals);
        chord.intervals.forEach((interval) => {
          // Calculate the note within the chromatic scale
          const noteIndex = (rootIndex + interval) % 12;
          let noteOctave = octave + Math.floor((rootIndex + interval) / 12);
          
          // Create the full note name (e.g., 'C4')
          const noteName = `${chromaticScale[noteIndex]}${noteOctave}`;
          noteNames.push(noteName);
        });
        
        debugLog('CHORDS_2_1_DEBUG', `Playing chord notes: ${noteNames.join(', ')}`);
        
        // Play all notes together as a chord with the audio engine
        audioEngine.playChord(noteNames, { duration: options.duration || 2 });
        
        this.isPlaying = true;
        debugLog('CHORDS_2_1_DEBUG', `Playing ${chord.name} chord on ${rootNote} using central audio engine`);
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
        // Use the audio engine's stopAll method
        audioEngine.stopAll();
        
        // Reset active chord tracking
        this.activeChord = [];
        this.isPlaying = false;
        
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
      
      debugLog('CHORDS_2_1_DEBUG', `setMode called, changing from ${this.mode} to ${mode}`);
      debugLog('CHORDS_2_1_DEBUG', `Before mode change: currentChordType=${this.currentChordType}`);
      
      // Speichere den bisherigen Fortschritt für die aktuelle Aktivität
      if (this.mode && this.mode !== 'main' && this.progress) {
        this.progress[this.mode] = this.totalQuestions;
        localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
        debugLog('CHORDS', `Saved progress for ${this.mode}: ${this.totalQuestions}`);
        this.updateChordButtonsVisibility();
      }
      
      this.mode = mode;
      this.resetActivity();
      
      // Lade den Fortschritt für die neue Aktivität
      if (mode !== 'main' && this.progress && this.progress[mode] !== undefined) {
        this.totalQuestions = this.progress[mode];
        debugLog('CHORDS', `Loaded progress for ${mode}: ${this.totalQuestions}`);
        this.updateChordButtonsVisibility();
      }
      
      // Update Alpine store
      if (window.Alpine?.store) {
        window.Alpine.store('chordMode', mode);
      }
      
      // Aktivität initialisieren, wenn zur Farb-Matching-Aktivität gewechselt wird
      if (mode === '2_1_chords_color-matching') {
        debugLog('CHORDS_2_1_DEBUG', `Starting color matching activity from setMode`);
        this.startColorMatching();
        debugLog('CHORDS_2_1_DEBUG', `After startColorMatching: currentChordType=${this.currentChordType}`);
        debugLog('CHORDS', 'Initialized color matching activity with a new chord');
      } else if (mode === '2_2_chords_mood-landscapes') {
        // Initialisierung für Mood Landscapes
        debugLog('CHORDS', 'Initializing mood landscapes activity');
        // Hier den Init-Code für diese Aktivität einfügen
      } else if (mode === '2_3_chords_chord-building') {
        // Initialisierung für Chord Building
        debugLog('CHORDS', 'Initializing chord building activity');
        // Hier den Init-Code für diese Aktivität einfügen
      } else if (mode === '2_4_chords_missing-note') {
        // Initialisierung für Missing Note
        debugLog('CHORDS', 'Initializing missing note activity');
        // Hier den Init-Code für diese Aktivität einfügen
      } else if (mode === '2_5_chords_characters') {
        // Initialisierung für Character Matching
        debugLog('CHORDS', 'Initializing character matching activity');
        // Hintergrundänderung basierend auf Fortschritt
        updateCharacterBackground(this);
        
        // Alpine.js übernimmt die Anzeige der Fortschrittsnachrichten über die x-text-Bindungen
      } else if (mode === '2_6_chords_harmony-gardens') {
        // Initialisierung für Harmony Gardens
        debugLog('CHORDS', 'Initializing harmony gardens activity');
        // Hier den Init-Code für diese Aktivität einfügen
      }
      
      debugLog('CHORDS', `Switched to ${mode} mode`);
    },
    
    /**
     * Reset the current activity state
     */
    resetActivity() {
      // Don't reset currentChordType to avoid "Unknown chord type: null" errors
      // Instead, we'll ensure it's properly set before use
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
      
      debugLog('CHORDS', 'Navigation elements configured');
    },
    
    /**
     * Ensure all activity containers have proper height
     */
    setupFullHeightContainers() {
      // External CSS is now loaded from 2_chords.css
      debugLog('CHORDS', 'Using external stylesheet for chord activities');
      // No need to inject styles here anymore as they're loaded from the CSS file
      
      
      console.log('CHORDS: Set up full-height containers for chord activities');
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
    
    /** *************************************************
     * ******** 2_1 Color Matching Activity Methods ********
     * *************************************************** */
    
    /**
     * Start the color matching activity
     * 
     * @activity 2_1_chord_color_matching
     */
    startColorMatching() {
      // Enhanced debug logging
      debugLog('CHORDS_2_1_DEBUG', `startColorMatching called with mode=${this.mode}, current state: totalQuestions=${this.totalQuestions}, currentChordType=${this.currentChordType}`);
      
      this.resetActivity();
      
      // Use the imported function with 'this' as the component reference
      debugLog('CHORDS_2_1_DEBUG', 'About to call newColorMatchingQuestion from startColorMatching');
      newColorMatchingQuestion(this);
      debugLog('CHORDS_2_1_DEBUG', `After newColorMatchingQuestion call: currentChordType=${this.currentChordType}`);
      
      // Log that we're using the modular function
      debugLog('CHORDS', 'Started color matching activity using modular function');
    },
    
    /** *************************************************
     * ******** 2_2_chord_mood_landscapes Activity Methods ********
     * *************************************************** */
    
    /**
     * Dynamic loader for the mood landscapes module
     * 
     * @activity 2_2_chord_mood_landscapes
     */
    async loadMoodLandscapesModule() {
      try {
        const module = await import('./2_chords/2_2_chord_mood_landscapes.js');
        return module;
      } catch (error) {
        console.error('Failed to load mood landscapes module:', error);
        debugLog('CHORDS', `Error loading mood landscapes module: ${error.message}`);
        return null;
      }
    },
    
    /**
     * Wrapper to maintain backward compatibility
     * 
     * @activity 2_2_chord_mood_landscapes
     */
    async getMoodLandscapes() {
      const moodLandscapesModule = await this.loadMoodLandscapesModule();
      if (moodLandscapesModule && typeof moodLandscapesModule.getMoodLandscapes === 'function') {
        return moodLandscapesModule.getMoodLandscapes();
      } else {
        debugLog('CHORDS', 'Error: getMoodLandscapes function not found in module');
        // Return empty object as fallback
        return {};
      }
    },
    
    /**
     * Dynamic wrapper for updateLandscape function from the module
     * 
     * @activity 2_2_chord_mood_landscapes
     */
    async updateLandscape(chordType) {
      // Import the module function dynamically and call it
      const moodLandscapesModule = await this.loadMoodLandscapesModule();
      
      if (moodLandscapesModule && typeof moodLandscapesModule.updateLandscape === 'function') {
        // Call the module function, passing the component (this) and chordType
        await moodLandscapesModule.updateLandscape(this, chordType);
      } else {
        debugLog('CHORDS', 'Error: updateLandscape function not found in module');
      }
    },
    
    /** *************************************************
     * ******** 2_3_chord_building Activity Methods ********
     * *************************************************** */
    
    
    /* Play the currently built chord
     * 
     * @activity 2_3_chord_building
     */
    async playBuiltChord() {
      debugLog('CHORDS', '2_3_chord_building: Playing built chord');
      
      // If we have a recognized chord type, play it using the audio engine
      if (this.recognizedChordType) {
        try {
          // Play the chord with the central audio engine
          this.playChordByType(this.recognizedChordType, 'C4', { duration: 2.5 });
          
          // Visual feedback
          const playButton = document.getElementById('play-full-chord-button');
          if (playButton) {
            const originalText = playButton.textContent;
            playButton.textContent = '▶ Playing...'; 
            playButton.disabled = true;
            
            setTimeout(() => {
              playButton.textContent = originalText;
              playButton.disabled = false;
            }, 2500);
          }
        } catch (error) {
          debugLog('CHORDS', `Error playing built chord: ${error.message}`);
        }
      } 
      // Otherwise, play the individual notes in sequence
      else if (this.builtChordIntervals && this.builtChordIntervals.length > 0) {
        // Play each note in sequence (bottom to top)
        const sortedIntervals = [...this.builtChordIntervals].sort((a, b) => a - b);
        
        try {
          for (const interval of sortedIntervals) {
            const noteBlocks = document.querySelectorAll('.chord-block');
            if (noteBlocks[sortedIntervals.indexOf(interval)]) {
              noteBlocks[sortedIntervals.indexOf(interval)].classList.add('playing');
            }
            
            // Calculate note name
            const noteNames = this.getNoteNamesFromIntervals(['C4'], [interval]);
            if (noteNames && noteNames.length > 0) {
              await audioEngine.playNote(noteNames[0], { duration: 0.5 });
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (noteBlocks[sortedIntervals.indexOf(interval)]) {
              noteBlocks[sortedIntervals.indexOf(interval)].classList.remove('playing');
            }
          }
          
          // Then play them together
          const noteNames = this.getNoteNamesFromIntervals(['C4'], sortedIntervals);
          if (noteNames && noteNames.length > 0) {
            await audioEngine.playChord(noteNames, { duration: 1.5 });
          }
        } catch (error) {
          debugLog('CHORDS', `Error playing built notes: ${error.message}`);
        }
      }
    },
    
    /**
     * Add a note to the chord
     * 
     * @param {*} interval The interval of the note to add
     * @activity 2_3_chord_building
     */
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
    
    /**
     * Check if a recognized chord has been built
     * 
     * @activity 2_3_chord_building
     */
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
      
      // Add play button if we built a recognized chord
      if (recognizedChord) {
        this.showFeedback = true;
        this.feedbackMessage = `You built a ${this.chords[recognizedChord].name} chord!`;
        this.recognizedChordType = recognizedChord; // Store for play button
        
        // Show rainbow success effect for 2_3_chord_building
        showCompleteSuccess();
        
        setTimeout(() => this.showFeedback = false, 3000);
      }
    },
    
    /** **********************************************
     * ***** 2_4 Missing Note Activity Methods ********
     * *********************************************** */


    /**
     * Play an incomplete chord for the missing note activity
     * 
     * @activity 2_4_chords_missing-note
     */
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
        // Get the current progress for this activity
        const progressData = localStorage.getItem('lalumo_chords_progress');
        const progress = progressData ? 
          JSON.parse(progressData)['2_5_chords_characters'] || 0 : 
          this?.progress?.['2_5_chords_characters'] || 0;
        
        // Available chord types based on progress
        let chordTypes;
        if (progress <= 9) {
          // Progress <= 9: Only happy (major) and sad (minor)
          chordTypes = ['major', 'minor'];
        } else if (progress <= 19) {
          // Progress 10-19: happy, sad, and augmented
          chordTypes = ['major', 'minor', 'augmented'];
        } else {
          // Progress >= 20: All types available
          chordTypes = ['major', 'minor', 'diminished', 'augmented']; // happy, sad, mysterious, tense
        }
        
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
      
      debugLog('CHORDS', `Missing interval: ${this.missingInterval}`);
    },
    
    /**
     * Check if the missing note is correct
     * 
     * @param {*} noteInterval The interval of the note to check
     * @activity 2_4_chords_missing-note
     */
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
        
        // Show rainbow success effect
        showCompleteSuccess();
        
        // Play the complete chord
        setTimeout(() => {
          this.playChordByType(this.currentChordType);
        }, 500);
        
        // Set up a new chord after a delay
        setTimeout(() => {
          // Don't reset currentChordType to null here
          // Instead, playIncompleteChord will ensure it's properly set
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
    
    /** *************************************************
     * ******** Character Matching Activity Methods ********
     * *************************************************** */
    /**
     * Free play mode flag for 2_5_chord_characters
     * When true, pressing character buttons plays the chord without checking answers
     * When false (game mode), the regular game logic applies
     */
    is2_5FreePlayMode: true,
    /**
     * Start game mode for the character matching activity
     * Switches from free play mode to game mode
     * 
     * @activity 2_5_chord_characters
     */
    start2_5GameMode() {
      debugLog('CHORDS', `[2_5] Switching to game mode`);
      this.is2_5FreePlayMode = false;
      // Play first chord in game mode
      this.currentChordType = null; // Reset to generate a new chord
      this.playCurrent2_5Chord();
    },
    
    /**
     * Play a specific chord type directly (for free play mode)
     * 
     * @activity 2_5_chord_characters
     */
    play2_5ChordByType(chordType) {
      debugLog('CHORDS', `[2_5] Playing chord in free play mode: ${chordType}`);
      this.playChordByType(chordType);
    },
    
    /**
     * Play the current chord for the character matching activity
     * 
     * @activity 2_5_chord_characters
     */
    playCurrent2_5Chord() {
      debugLog('CHORDS', `[REPETITION] playCurrent2_5Chord called with currentChordType=${this.currentChordType}, previousChordType=${this.previousChordType}, consecutiveRepeats=${this.consecutiveRepeats}`);
      
      if (!this.currentChordType) {
        // Need to generate a new chord type
        debugLog('CHORDS', '[REPETITION] No current chord type, generating a new one');
        
        // Get the current progress for this activity
        const progressData = localStorage.getItem('lalumo_chords_progress');
        const progress = progressData ? 
          JSON.parse(progressData)['2_5_chords_characters'] || 0 : 
          this?.progress?.['2_5_chords_characters'] || 0;
        
        // Get previous progress to detect progress level changes
        const previousProgress = this.previousProgress || 0;
        const progressLevelChanged = 
          (previousProgress <= 9 && progress >= 10) || 
          (previousProgress <= 19 && progress >= 20);
        
        // Store current progress for next comparison
        this.previousProgress = progress;
        
        debugLog('CHORDS', `[REPETITION] Current progress: ${progress}, previous: ${previousProgress}, levelChanged: ${progressLevelChanged}`);
        
        // Available chord types based on progress
        let chordTypes;
        let newChordType = null;
        
        if (progress <= 9) {
          // Progress <= 9: Only happy (major) and sad (minor)
          chordTypes = ['major', 'minor'];
        } else if (progress <= 19) {
          // Progress 10-19: happy, sad, and augmented
          chordTypes = ['major', 'minor', 'augmented'];
          // The new chord at this progress level is augmented
          if (progressLevelChanged) newChordType = 'augmented';
        } else {
          // Progress >= 20: All types available
          chordTypes = ['major', 'minor', 'diminished', 'augmented']; // happy, sad, mysterious, tense
          // The new chord at this progress level is diminished
          if (progressLevelChanged) newChordType = 'diminished';
        }
        
        debugLog('CHORDS', `[REPETITION] Available chord types: ${JSON.stringify(chordTypes)}, newChordType: ${newChordType}`);
        
        // If we just crossed a progress threshold, always use the newly unlocked chord type
        if (newChordType) {
          this.currentChordType = newChordType;
          debugLog('CHORDS', `[REPETITION] Progress level changed! Using new chord type: ${newChordType}`);
        } else {
          // No progress level change, use weighted random selection
          
          // Apply repetition constraints based on progress
          if ((progress >= 10 || this.consecutiveRepeats >= 2) && this.previousChordType && chordTypes.length > 1) {
            // For progress ≥10 OR when we already had 2 consecutive repeats:
            // Filter out the previous chord type to avoid repetition
            const availableTypes = chordTypes.filter(type => type !== this.previousChordType);
            
            // Create weighted list to favor major and minor chords
            const weightedTypes = [];
            
            // Add each available type to the weighted list
            availableTypes.forEach(type => {
              // Add major and minor twice for higher probability
              if (type === 'major' || type === 'minor') {
                weightedTypes.push(type);
                weightedTypes.push(type); // Add a second time for higher weight
              } else {
                weightedTypes.push(type);
              }
            });
            
            this.currentChordType = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
            this.consecutiveRepeats = 0; // Reset consecutive repeats as we're changing chord type
            debugLog('CHORDS', `[REPETITION] Selected non-repeating chord type: ${this.currentChordType}`);
          } else {
            // Create weighted list to favor major and minor chords
            const weightedTypes = [];
            
            // Add each type to the weighted list
            chordTypes.forEach(type => {
              // Add major and minor twice for higher probability
              if (type === 'major' || type === 'minor') {
                weightedTypes.push(type);
                weightedTypes.push(type); // Add a second time for higher weight
              } else {
                weightedTypes.push(type);
              }
            });
            
            // Random selection with weighting
            this.currentChordType = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
            
            // Check if we're repeating the previous chord type
            if (this.currentChordType === this.previousChordType) {
              this.consecutiveRepeats++;
              debugLog('CHORDS', `[REPETITION] Selected same chord type, incrementing repeat counter to: ${this.consecutiveRepeats}`);
            } else {
              // Different chord type selected, reset counter
              this.consecutiveRepeats = 0;
              debugLog('CHORDS', `[REPETITION] Selected different chord type, reset repeat counter`);
            }
          }
        }
        
        // Store for future comparison
        this.previousChordType = this.currentChordType;
        debugLog('CHORDS', `[REPETITION] New chord generated: ${this.currentChordType}, previousChordType set to: ${this.previousChordType}`);
      } else {
        // Using existing chord (persistence)
        debugLog('CHORDS', `[REPETITION] Using existing chord type: ${this.currentChordType}, no counter changes`);
      }
      
      // Play the chord (either new or existing)
      debugLog('CHORDS', `[REPETITION] Playing chord type: ${this.currentChordType}, current repeats: ${this.consecutiveRepeats}`);
      this.playChordByType(this.currentChordType);
    },
    
    /**
     * Check if the selected chord type matches the current chord type
     * In free play mode: simply play the chord
     * In game mode: check answer and handle feedback
     * 
     * @activity 2_5_chord_characters
     */
    checkCharacterMatch(selectedChordType) {
      // Check if in free play mode
      if (this.is2_5FreePlayMode) {
        debugLog('CHORDS', `[2_5] Free play mode: playing ${selectedChordType} chord`);
        this.play2_5ChordByType(selectedChordType);
        return;
      }
      
      // Game mode logic
      // Initialize if needed
      if (!this.currentChordType) {
        this.playCurrent2_5Chord(); // This will set a random chord
        return; // Don't process the selection yet
      }
      
      const isCorrect = selectedChordType === this.currentChordType;
      
      this.showFeedback = true;
      if (isCorrect) {
        debugLog('CHORDS', `[REPETITION] Correct answer for chord type: ${this.currentChordType}`);
        this.feedbackMessage = this.$store.strings.success_message || 'Great job! That\'s correct!';
        this.correctAnswers++;
        
        // Erhöhe den 2_5_chord_characters Fortschritt bei korrekter Antwort
        if (!this.progress['2_5_chords_characters']) this.progress['2_5_chords_characters'] = 0;
        this.progress['2_5_chords_characters']++;
        
        // Speichere den Fortschritt in localStorage
        localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
        
        // Aktualisiere den Hintergrund basierend auf dem neuen Fortschritt
        updateCharacterBackground(this);
        
        // Update chord buttons visibility based on new progress
        this.updateChordButtonsVisibility();
        
        // Alpine.js übernimmt die Anzeige der Fortschrittsnachrichten über die x-text-Bindungen
        
        // Show rainbow success effect for 2_5_chord_characters
        showCompleteSuccess();
        
        // Set up a new chord after a delay by setting currentChordType to null
        // This will trigger generation of a new chord next time playCurrent2_5Chord is called
        setTimeout(() => {
          // Set currentChordType to null to ensure new chord generation next time
          debugLog('CHORDS', `[REPETITION] Setting currentChordType to null after correct answer. previousChordType: ${this.previousChordType}`);
          this.currentChordType = null;
          this.showFeedback = false;
          
          // Automatically play the next chord after correct answer (new requirement)
          this.playCurrent2_5Chord();
        }, 1500);
      } else {
        this.feedbackMessage = this.$store.strings.error_message || 'Not quite right. Try again!';
        
        // Hide feedback after delay
        setTimeout(() => {
          this.showFeedback = false;
          
          // Repeat the same chord after incorrect answer (new requirement)
          this.playChordByType(this.currentChordType);
        }, 1500);
      }
      
      this.totalQuestions++;
    },
    
    /** *************************************************
     * ******** Harmony Gardens Activity Methods ********
     * *************************************************** */
    /**
     * Select a chord slot for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
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
    
    /**
     * Plant a chord in the garden for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
    plantChordInGarden(chordType) {
      if (this.selectedSlotIndex === null) {
        // No slot selected yet
        this.showFeedback = true;
        this.feedbackMessage = this.$store.strings.select_slot_first || 'Please select a slot first';
        setTimeout(() => this.showFeedback = false, 2000);
        return;
      }
      
      // Show small rainbow effect for 2_6_harmony_gardens when adding a chord
      showRainbowSuccess();
      
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
    
    /**
     * Add a plant emoji to the garden for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
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
    
    /**
     * Play the chord sequence for the harmony gardens activity
     * 
     * @activity 2_6_chord_gardens
     */
    playChordSequence() {
      if (!this.chordSequence || !this.chordSequence.filter(chord => chord).length) {
        this.showFeedback = true;
        this.feedbackMessage = this.$store.strings.no_chords_in_sequence || 'Add some chords to your sequence first';
        setTimeout(() => this.showFeedback = false, 2000);
        return;
      }
      
      // Show big rainbow success when playing a complete chord sequence in 2_6_harmony_gardens
      showBigRainbowSuccess();
      
      // Stop any playing sounds
      this.stopAllSounds();
      
      // Filter out undefined entries
      const sequence = this.chordSequence.filter(chord => chord);
      
      // Play each chord in sequence with a delay between them
      let delay = 0;
      sequence.forEach(chordType => {
        setTimeout(() => {
          this.playChordByType(chordType);
        }, delay);
        delay += 1000; // 1 second between chords
      });
    }
  };
}
