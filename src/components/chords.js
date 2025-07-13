/**
 * Chords component
 * Implements interactive chord learning experiences for children
 */

// External library imports
import * as Tone from 'tone';

// Import shared utilities
import { NOTE_NAMES, midiToNoteName } from './shared/music-utils.js';
import { getChordButtons } from './shared/ui-helpers.js';

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

// 2_2 Chord Stable Or Instable Module
import {
  playStableInstableChord, 
  checkStableInstableMatch,
  updateStableInstableBackground,
  reset_2_2_StableInstable_Progress
} from './2_chords/2_2_chords_stable_instable.js';

// 2_3 Chord Building Module
import { testChordBuildingModuleImport } from './2_chords/2_3_chord_building.js';

// 2_4 Missing Note Module
import { testMissingNoteModuleImport } from './2_chords/2_4_missing_note.js';

// 2_5 Chord Characters Module
import { 
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

// Define constants for the chord activities
const CHORD_CHARACTERS_LEVEL_STEP = 10; // Level progression step for 2_5_chords_characters

export function chords() {
  return {
    // Current activity mode
    mode: 'main',
    
    // Audio context and active oscillators
    audioContext: null,
    oscillators: {},
    activeChord: null,
    isPlaying: false,
    
    // Constants for activity configuration
    LEVEL_STEP: CHORD_CHARACTERS_LEVEL_STEP,
    
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
      const chordButtons = getChordButtons();
      
      if (!chordButtons) {
        // Buttons not found in DOM yet, will try again when activity is shown
        debugLog('CHORDS', 'Chord buttons not found in DOM yet');
        return;
      }
      
      const { diminishedBtn, augmentedBtn } = chordButtons;
      
      // Apply visibility rules based on progress
      if (progress < 10) {
        // Progress < 10: Hide mysterious (diminished) and surprised (augmented)
        diminishedBtn.style.display = 'none';
        augmentedBtn.style.display = 'none';
        debugLog(['CHORDS', 'BUTTONS'], 'Progress < 10: Hiding mysterious and surprised buttons');
      } else if (progress < 20) {
        // Progress 10-19: hide mysterious octopus (diminished), show surprised squirrel (augmented)
        augmentedBtn.style.display = '';
        diminishedBtn.style.display = 'none';
        debugLog(['CHORDS', 'BUTTONS'], 'Progress 10-19: Showing surprised, hiding mysterious button');
      } else if (progress < 30) {
        // Progress 20-29: show all
        augmentedBtn.style.display = '';
        diminishedBtn.style.display = '';
        debugLog(['CHORDS', 'BUTTONS'], 'Progress 20-29: Showing all buttons');
      } else if (progress < 40) {
        // Progress 20-39: Show basic buttons, but hide squirrel and octopus (diminished and augmented)
        augmentedBtn.style.display = 'none';
        diminishedBtn.style.display = 'none';
        debugLog(['CHORDS', 'BUTTONS'], 'Progress 20-39: Hiding octopus and squirrel (transposition phase)');
      } else if (progress < 50) {
        // Progress 40-59: Show all buttons except octopus (diminished)
        augmentedBtn.style.display = '';
        diminishedBtn.style.display = 'none';
        debugLog(['CHORDS', 'BUTTONS'], 'Progress 40-59: Hiding octopus, showing squirrel');
      } else {
        // Progress >= 50: Show all buttons
        augmentedBtn.style.display = '';
        diminishedBtn.style.display = '';
        debugLog(['CHORDS', 'BUTTONS'], 'Progress >= 60: Showing all chord buttons and animals');
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
      // Extended range for transposition: from F#2 to F#5
      'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
      'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
      'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
      'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.26, 'F5': 698.46, 'F#5': 739.99
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
              const chordButtons = getChordButtons();
              
              if (chordButtons) {
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
          if (!this.progress['2_2_chords_stable_instable']) this.progress['2_2_chords_stable_instable'] = 0;
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
            '2_2_chords_stable_instable': 0,
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
      // Listen for the unified activity mode event
      document.addEventListener('set-activity-mode', (event) => {
        const { component, mode } = event.detail;
        
        // Only handle the event if it's for the chords component
        if (component === 'chords') {
          debugLog('CHORDS', `Received unified activity mode event: ${mode}`);
          // Call our own setMode method to ensure proper initialization
          this.setMode(mode || 'main');
          
          // Update the unified activity mode in the Alpine store
          if (window.Alpine?.store) {
            window.Alpine.store('currentActivityMode', { component: 'chords', mode: mode || 'main' });
          }
        }
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
    /**
     * Generate a new transpose amount for chords at progress level >= 30
     * @returns {Object} Object with rootNote and transposeAmount
     */
    generateTranspose() {
      // Get the progress level
      const progress = this?.progress?.['2_5_chords_characters'] || 0;
      
      // Default values
      let rootNote = 'C4';
      let transposeAmount = 0;
      
      // Apply chord height variation at progress >= 30
      if (progress >= 30) {
        // Random transpose between -6 and +6 semitones
        // For progress 30-39, avoid repeating the exact same transpose amount
        if (progress >= 30 && progress < 40) {
          // Avoid using the same transpose value as the previous chord
          let attempts = 0;
          do {
            // transposeAmount = Math.floor(Math.random() * 13) - 6; // -6 to +6
            transposeAmount = Math.floor(Math.random() * 5) - 2; // -2 to +2 (debug)
            attempts++;
          } while (transposeAmount === this.previousTransposeAmount && attempts < 10);
          
          // Store this value for next comparison
          this.currentTransposeAmount = transposeAmount;
          debugLog('CHORDS', `[TRANSPOSE] Generated new transpose: ${transposeAmount}, previous was: ${this.previousTransposeAmount}`);
        } else {
          // For other progress levels, just get a random transpose
          // transposeAmount = Math.floor(Math.random() * 13) - 6; // -6 to +6
          transposeAmount = Math.floor(Math.random() * 5) - 2; // -2 to +2 (debug)
          this.currentTransposeAmount = transposeAmount;
        }
        
        if (transposeAmount !== 0) {
          // Base note C4 is MIDI note 60
          const baseNoteNumber = 60;
          const newNoteNumber = baseNoteNumber + transposeAmount;
          
          // Convert MIDI note number back to note name with octave
          const noteName = NOTE_NAMES[newNoteNumber % 12];
          const octave = Math.floor(newNoteNumber / 12) - 1; // MIDI octaves start at -1
          
          rootNote = `${noteName}${octave}`;
        }
        
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `Generated new transpose: ${transposeAmount} semitones, rootNote: ${rootNote} (Progress: ${progress})`);
      }
      
      // Save the transpose amount for later reference
      this.currentTransposeAmount = transposeAmount;
      this.currentRootNote = rootNote;
      
      return { rootNote, transposeAmount };
    },
    
    async playChordByType(chordType, rootNote = 'C4', options = { duration: 2 }) {
      this.stopAllSounds();
      debugLog('CHORDS', 'playChord called with chordType:', chordType, 'rootNote:', rootNote);
      
      // Debug information for 2_1 activity
      debugLog('CHORDS_2_1_DEBUG', `playChord called with chordType: ${chordType}, component has currentChordType: ${this.currentChordType}`);
      debugLog('CHORDS_2_1_DEBUG', `Current component state: mode=${this.mode}, totalQuestions=${this.totalQuestions}`);
      
      // Debug information specifically for transpose
      if (this.mode === '2_5_chords_characters') {
        const progress = this?.progress?.['2_5_chords_characters'] || 0;
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `PlayChordByType - Current progress: ${progress}, Root note: ${rootNote}, TransposeAmount: ${this.currentTransposeAmount || 0}`);
      }

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
        const noteName = NOTE_NAMES[midiNoteNumber % 12];
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
      } else if (mode === '2_2_chords_stable_instable') {
        // Initialize Stable Or Instable activity
        debugLog('CHORDS_2_2_DEBUG', 'Initializing Stable Or Instable activity');
        this.currentStableInstableChord = null;
        this.showStableInstableFeedback = false;
        this.stableInstableFeedback = '';
        this.stableInstableCorrect = false;
        
        // Initialize progress if it doesn't exist
        if (!this.progress) this.progress = {};
        if (typeof this.progress['2_2_chords_stable_instable'] === 'undefined') {
          this.progress['2_2_chords_stable_instable'] = 0;
        }
        
        // Update the background based on current progress
        updateStableInstableBackground(this);
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
      
      // Reset UI state for 2_2_chords_stable_instable activity, but keep the progress
      if (this.mode === '2_2_chords_stable_instable') {
        // Only reset UI state, not the progress
        this.showStableInstableFeedback = false;
        this.stableInstableFeedback = '';
        this.stableInstableCorrect = false;
        
        // Update background based on current progress
        updateStableInstableBackground(this);
      }
      // Reset for 2_5_chords_characters activity
      else if (this.mode === '2_5_chords_color_matching') {
        // Reset progress to 0 for this activity
        if (this.progress && this.progress['2_5_chords_characters']) {
          this.progress['2_5_chords_characters'] = 0;
          
          // Save updated progress
          localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
          
          // Update background to reflect reset progress
          updateCharacterBackground(this);
          
          // Update button visibility
          this.updateChordButtonsVisibility();
          
          console.log('CHORDS: Reset progress for 2_5_chords_characters activity');
        }
      }
    },
    
    /**
     * Reset progress to the start of current level
     * For 2_5_chords_characters activity, levels progress in steps defined by LEVEL_STEP
     * 
     * @activity 2_5_chords_characters
     */
    resetProgressToCurrentLevel() {
      if (!this.progress || !this.progress['2_5_chords_characters']) return;
      
      const currentProgress = this.progress['2_5_chords_characters'];
      
      // Calculate the start of the current level (floor to nearest multiple of LEVEL_STEP)
      const currentLevel = Math.floor(currentProgress / this.LEVEL_STEP);
      const newProgress = currentLevel * this.LEVEL_STEP;
      
      console.log(`CHORDS: Resetting progress from ${currentProgress} to ${newProgress} (level ${currentLevel})`);
      
      // Update progress
      this.progress['2_5_chords_characters'] = newProgress;
      
      // Save to localStorage
      localStorage.setItem('lalumo_chords_progress', JSON.stringify(this.progress));
      
      // CRITICAL: After a mistake, ensure we keep the same chord and transposition
      // by setting currentChordChanged to false and not clearing currentChordType
      this.currentChordChanged = false;
      
      // Update background and button visibility
      updateCharacterBackground(this);
      this.updateChordButtonsVisibility();
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
     * ******** 2_2_chord_chords_stable_instable Activity Methods ********
     * *************************************************** */
    
    /**
     * Check if the user's answer matches the current chord type
     * 
     * @param {boolean} isStable - Whether the user thinks the chord is stable
     * @activity 2_2_chord_chords_stable_instable
     */
    checkStableInstableAnswer(isStable) {
      // Make sure we have a current chord to check against
      if (!this.currentStableInstableChord) {
        this.showStableInstableFeedback = true;
        this.stableInstableFeedback = 'Please play a chord first';
        this.stableInstableCorrect = false;
        return;
      }
      
      try {
        // Check if the answer is correct
        const isCorrect = checkStableInstableMatch(isStable, this.currentStableInstableChord);
        
        // Update feedback
        this.showStableInstableFeedback = true;
        this.stableInstableCorrect = isCorrect;
        
        // Update progress and get feedback message
        const feedback = updateStableInstableBackground(this, isCorrect);
        this.stableInstableFeedback = feedback;
        
        // Log the result
        debugLog('CHORDS_2_2', `User selected ${isStable ? 'stable' : 'instable'}, ` +
          `correct: ${isCorrect ? 'yes' : 'no'}, progress: ${this.progress['2_2_chords_stable_instable']}`);
        
        // Play the chord again for reference
        playStableInstableChord(this);
        
      } catch (error) {
        console.error('Error checking stable/instable answer:', error);
        this.showStableInstableFeedback = true;
        this.stableInstableFeedback = 'Error checking answer. Please try again.';
        this.stableInstableCorrect = false;
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
      
      // Get the current progress for this activity
      const progressData = localStorage.getItem('lalumo_chords_progress');
      const progress = progressData ? 
        JSON.parse(progressData)['2_5_chords_characters'] || 0 : 
        this?.progress?.['2_5_chords_characters'] || 0;
      
      // Available chord types based on progress
      let chordTypes;
      
      // Apply chord height variation at progress >= 30
      let varyingPitch = false;
      let transposeAmount = 0;
      
      if (progress >= 30) {
        varyingPitch = true;
        // Random transpose between -6 and +6 semitones
        transposeAmount = Math.floor(Math.random() * 13) - 6; // -6 to +6
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `Applying transpose: ${transposeAmount} semitones`);
      }

      if (progress <= 9) {
        // Progress <= 9: Only happy (major) and sad (minor)
        chordTypes = ['major', 'minor'];
      } else if (progress <= 19) {
        // Progress 10-19: happy, sad, and augmented
        chordTypes = ['major', 'minor', 'augmented'];
      } else if (progress <= 29) {
        // Progress 20-29: happy, sad, mysterious, and augmented
        chordTypes = ['major', 'minor', 'diminished', 'augmented'];
      } else if (progress <= 39) {
        // Progress 30-39: only happy and sad with varying pitch
        chordTypes = ['major', 'minor'];
        // Log to confirm which chord types are available
        debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 30-39: Only major and minor chords available');
      } else if (progress <= 59) {
        // Progress 40-59: happy, sad and augmented (squirrel) with varying pitch
        chordTypes = ['major', 'minor', 'augmented'];
        debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 40-59: Major, minor and augmented chords available');
      } else {
        // Progress >= 60: All types available
        chordTypes = ['major', 'minor', 'diminished', 'augmented'];
        debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 60+: All chord types available');
      }
      
      // Check if current chord type is valid for this progress level,
      // or if we need to select a new one
      if (!this.currentChordType || !chordTypes.includes(this.currentChordType)) {
        const oldChordType = this.currentChordType;
        this.currentChordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
        
        // Log chord type changes for debugging
        if (oldChordType) {
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 
            `Changed invalid chord type ${oldChordType} → ${this.currentChordType} based on progress ${progress}`);
        }
      }
      
      // Get the chord definition
      const chord = this.chords[this.currentChordType];
      
      // Choose a note to remove (not the root)
      const availableIntervals = chord.intervals.slice(1); // Skip root note
      this.missingInterval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)];
      
      // Root note frequency with transposition if applicable
      let rootNote = 'C4';
      
      // Apply transposition if needed
      if (varyingPitch && transposeAmount !== 0) {
        // Base note C4 is MIDI note 60
        const baseNoteNumber = 60;
        const newNoteNumber = baseNoteNumber + transposeAmount;
        
        // TODO: use transposeNote() function from shared music-utils.js
        // Convert MIDI note number back to note name with octave
        const noteName = NOTE_NAMES[newNoteNumber % 12];
        const octave = Math.floor(newNoteNumber / 12) - 1; // MIDI octaves start at -1
        
        rootNote = `${noteName}${octave}`;
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `Transposed root note: C4 -> ${rootNote} (Transpose: ${transposeAmount})`);
      } else {
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `No transposition applied. varyingPitch=${varyingPitch}, transposeAmount=${transposeAmount}`);
      }
      
      const rootFreq = this.baseNotes[rootNote] || this.baseNotes['C4'];
      
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
          // Check for transposition
          const progress = this?.progress?.['2_5_chords_characters'] || 0;
          const shouldTranspose = progress >= 30;
          let rootNote = 'C4';
          
          // Apply transposition if needed
          if (shouldTranspose && this.currentTransposeAmount !== 0) {
            // Base note C4 is MIDI note 60
            const baseNoteNumber = 60;
            const newNoteNumber = baseNoteNumber + this.currentTransposeAmount;
            
            // Convert MIDI note number back to note name with octave
            const noteName = NOTE_NAMES[newNoteNumber % 12];
            const octave = Math.floor(newNoteNumber / 12) - 1;
            
            rootNote = `${noteName}${octave}`;
            debugLog(['CHORDS', '2_5_TRANSPOSE'], `Using transposed root note: ${rootNote} for complete chord (Transpose: ${this.currentTransposeAmount})`);
          } else {
            debugLog(['CHORDS', '2_5_TRANSPOSE'], `Using default root note: C4 for complete chord (no transposition applied)`);
          }
          
          // Pass the root note to playChordByType
          this.playChordByType(this.currentChordType, rootNote);
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
     * Store the previous transposition amount to avoid direct repetition
     */
    previousTransposeAmount: 0,
    
    /**
     * Store the current transposition amount
     */
    currentTransposeAmount: 0,
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
      
      // Get the progress to determine if we need to transpose
      const progressData = localStorage.getItem('lalumo_chords_progress');
      const progress = progressData ? 
        JSON.parse(progressData)['2_5_chords_characters'] || 0 : 
        this?.progress?.['2_5_chords_characters'] || 0;
      
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
        } else if (progress <= 29) {
          // Progress 20-29: happy, sad, mysterious, and augmented
          chordTypes = ['major', 'minor', 'diminished', 'augmented'];
          // The new chord at this progress level is diminished
          if (progressLevelChanged) newChordType = 'diminished';
        } else if (progress <= 39) {
          // Progress 30-39: Only major and minor with varying pitch
          chordTypes = ['major', 'minor'];
          // For level changes, just use major as the new type
          if (progressLevelChanged) newChordType = 'major';
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 30-39: Only major and minor chords available');
        } else if (progress <= 59) {
          // Progress 40-59: happy, sad and augmented (squirrel) with varying pitch
          chordTypes = ['major', 'minor', 'augmented'];
          // For level changes, use augmented as the new type
          if (progressLevelChanged) newChordType = 'augmented';
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 40-59: Major, minor and augmented chords available');
        } else {
          // Progress >= 60: All types available
          chordTypes = ['major', 'minor', 'diminished', 'augmented'];
          // For level changes, use diminished as the new type
          if (progressLevelChanged) newChordType = 'diminished';
          debugLog(['CHORDS', '2_5_CHORD_TYPES'], 'Progress 60+: All chord types available');
        }
        
        debugLog('CHORDS', `[REPETITION] Available chord types: ${JSON.stringify(chordTypes)}, newChordType: ${newChordType}`);
        
        // If we just crossed a progress threshold, always use the newly unlocked chord type
        if (newChordType) {
          this.currentChordType = newChordType;
          debugLog('CHORDS', `[REPETITION] Progress level changed! Using new chord type: ${newChordType}`);
        } else {
          // No progress level change, use weighted random selection
          
          // Apply repetition constraints based on progress
          // For progress < 10 OR 30-39, allow up to 3 consecutive repeats
          // For all other progress levels, no repeats allowed (maxRepeats = 0)
          let maxRepeats = 0; // Default: no repeats
          
          if ((progress < 10) || (progress >= 30 && progress <= 39)) {
            maxRepeats = 3; // Allow up to 3 repeats for beginners and transposition phase
          }
          
          // Determine if we should avoid repeating the previous chord
          const shouldAvoidRepeat = (
            // For progress <10, only avoid repeats after reaching the maximum
            ((progress < 10) && this.consecutiveRepeats >= maxRepeats) ||
            // For progress 10-29, always avoid repeats
            (progress >= 10 && progress < 30) ||
            // For progress 30-39, avoid direct repeats but allow the same type again later
            // (up to 3 total of same type, but never two identical in a row)
            (progress >= 30 && progress < 40 && this.consecutiveRepeats >= 1) ||
            // For progress 40-59, always avoid repeats
            (progress >= 40 && progress < 60) ||
            // For progress ≥60, avoid direct repeats but allow the same type again later
            (progress >= 60 && this.consecutiveRepeats >= 1)
          ) && 
            // Only apply if we have a previous chord type and more than one option
            this.previousChordType && 
            chordTypes.length > 1;
          
          if (shouldAvoidRepeat) {
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
              this.currentChordChanged = true;
              // Make sure we're also updating previousTransposeAmount when chord type changes
              this.previousTransposeAmount = this.currentTransposeAmount;
              debugLog('CHORDS', `[REPETITION] Selected different chord type, reset repeat counter. Previous transpose: ${this.previousTransposeAmount}`);
            }
          }
        }
        
        // Store for future comparison
        this.previousChordType = this.currentChordType;
        debugLog('CHORDS', `[REPETITION] New chord generated: ${this.currentChordType}, previousChordType set to: ${this.previousChordType}`);
      } else {
        // Using existing chord (persistence)
        this.currentChordChanged = false;
        debugLog('CHORDS', `[REPETITION] Using existing chord type: ${this.currentChordType}, no counter changes`);
      }
      
      // Play the chord (either new or existing)
      debugLog('CHORDS', `[REPETITION] Playing chord type: ${this.currentChordType}, current repeats: ${this.consecutiveRepeats}`);
      
      // Apply transposition for progress >= 30
      if (progress >= 30) {
        // Always generate new transpose value when starting a new question
        // (when chord type changes or when starting a new session)
        if (this.currentChordChanged || !this.currentTransposeRootNote || this.needsNewTranspose) {
          // Extrahiere BEIDE Werte: rootNote UND transposeAmount
          const { rootNote, transposeAmount } = this.generateTranspose();
          this.currentTransposeRootNote = rootNote;
          this.currentTransposeAmount = transposeAmount;
          // Reset the flag since we've generated a new transpose
          this.needsNewTranspose = false;
          debugLog(['CHORDS', '2_5_TRANSPOSE'], `PlayCurrent2_5Chord - Generated new transposed root note: ${rootNote} (Transpose: ${transposeAmount})`);
        }
        
        // Use stored transpose for consistent playback until answered correctly
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `PlayCurrent2_5Chord - Using stored transposed root note: ${this.currentTransposeRootNote}`);
        this.playChordByType(this.currentChordType, this.currentTransposeRootNote);
      } else {
        // Normal playback without transposition
        this.playChordByType(this.currentChordType, 'C4');
      }
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
        
        // Signal that we need a new transpose for the next chord
        this.needsNewTranspose = true;
        
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
          // Update previousTransposeAmount to avoid direct repeats in next chord
          this.previousTransposeAmount = this.currentTransposeAmount;
          debugLog('CHORDS', `[TRANSPOSE] After correct answer: updated previousTransposeAmount to ${this.previousTransposeAmount}`);
          this.showFeedback = false;
          
          // Automatically play the next chord after correct answer (new requirement)
          this.playCurrent2_5Chord();
        }, 1500);
      } else {
        this.feedbackMessage = this.$store.strings.error_message || 'Not quite right. Try again!';
        
        // Make sure we keep the same chord and transposition after a mistake
        this.currentChordChanged = false;
        debugLog(['CHORDS', '2_5_TRANSPOSE'], `After wrong answer: keeping chord ${this.currentChordType} with transposition ${this.currentTransposeRootNote}`);
        
        // Play error sound feedback
        audioEngine.playNote('try_again');
        console.log('AUDIO: Playing try_again feedback sound for incorrect chord match');
        
        // Reset progress to the beginning of the current level
        this.resetProgressToCurrentLevel();
        
        // Add shake animation to the incorrect button
        const selectedButton = document.querySelector(`#button_2_5_1_${selectedChordType}`);
        if (selectedButton) {
          selectedButton.classList.add('shake-animation');
          
          // Remove shake class after animation completes
          setTimeout(() => {
            selectedButton.classList.remove('shake-animation');
          }, 500);
        }
        
        // Hide feedback after delay
        setTimeout(() => {
          this.showFeedback = false;
          
          // Repeat the same chord after incorrect answer with the same transposition
          debugLog(['CHORDS', '2_5_TRANSPOSE'], `Replaying chord ${this.currentChordType} with the same transposition: ${this.currentTransposeRootNote}`);
          this.playChordByType(this.currentChordType, this.currentTransposeRootNote);
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
