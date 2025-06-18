/**
 * Chords component
 * Implements interactive chord learning experiences for children
 */

// External library imports
import * as Tone from 'tone';

// Export specific functions from each module
// Common Module
export { testCommonModuleImport } from './2_chords/common.js';

// Chord Modules - Modular approach
import { testChordColorMatchingModuleImport, newColorMatchingQuestion, checkColorAnswer } from './2_chords/2_1_chord_color_matching.js';

// Feedback utilities - central import
import { showCompleteSuccess, playSuccessSound } from './shared/feedback.js';

// Chord Color Matching Module
export { 
  testChordColorMatchingModuleImport,
  newColorMatchingQuestion,
  checkColorAnswer
} from './2_chords/2_1_chord_color_matching.js';

// Chord Mood Landscapes Module
export { testChordMoodLandscapesModuleImport } from './2_chords/2_2_chord_mood_landscapes.js';

// Chord Building Module
export { testChordBuildingModuleImport } from './2_chords/2_3_chord_building.js';

// Missing Note Module
export { testMissingNoteModuleImport } from './2_chords/2_4_missing_note.js';

// Chord Characters Module
export { testChordCharactersModuleImport } from './2_chords/2_5_chord_characters.js';

// Import debug utilities
import { debugLog } from '../utils/debug.js';

// Import chord styles
import '../styles/2_chords.css';

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
        this.setupFullHeightContainers();
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
     */
    async playChord(chordType, rootNote = 'C4', options = { duration: 2 }) {
      this.stopAllSounds();
      
      try {
        // Import debug utils for logging
        const { debugLog } = await import('../utils/debug');
        
        // Get and initialize audioEngine if needed
        const audioEngine = (await import('./audio-engine.js')).default;
        if (!audioEngine._isInitialized) {
          await this.initAudio();
        }
        
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
                setTimeout(() => this.playChord(chordType, rootNote, options), 100);
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
        const chord = this.chords[chordType];
        if (!chord) {
          console.error(`Unknown chord type: ${chordType}`);
          return;
        }
        
        debugLog('CHORDS', `Playing ${chordType} chord with root ${rootNote}`);
      } catch (error) {
        console.error('Error preparing chord playback:', error);
        return;
      }
      
      this.currentChordType = chordType;
      this.activeChord = [];
      
      try {
        // Get the audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        const { debugLog } = await import('../utils/debug');
        
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
        
        // Calculate all note names in the chord based on intervals
        chord.intervals.forEach((interval) => {
          // Calculate the note within the chromatic scale
          const noteIndex = (rootIndex + interval) % 12;
          let noteOctave = octave + Math.floor((rootIndex + interval) / 12);
          
          // Create the full note name (e.g., 'C4')
          const noteName = `${chromaticScale[noteIndex]}${noteOctave}`;
          noteNames.push(noteName);
        });
        
        debugLog('CHORDS', `Playing chord notes: ${noteNames.join(', ')}`);
        
        // Play all notes together as a chord with the audio engine
        audioEngine.playChord(noteNames, { duration: options.duration || 2 });
        
        this.isPlaying = true;
        debugLog('CHORDS', `Playing ${chord.name} chord on ${rootNote} using central audio engine`);
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
        // Import the central audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        
        if (!audioEngine._isInitialized) {
          await this.initAudio();
        }
        
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
        // Import the central audio engine
        const audioEngine = (await import('./audio-engine.js')).default;
        
        if (!audioEngine._isInitialized) {
          console.warn('Audio engine not initialized, cannot stop sounds');
          return;
        }
        
        // Use the audio engine's stopAll method
        audioEngine.stopAll();
        
        // Reset active chord tracking
        this.activeChord = [];
        this.isPlaying = false;
        
        // Import debug utils
        const { debugLog } = await import('../utils/debug');
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
    
    // Color Matching Activity Methods
    startColorMatching() {
      this.resetActivity();
      // Use the imported function with 'this' as the component reference
      newColorMatchingQuestion(this);
      
      // Log that we're using the modular function
      debugLog('CHORDS', 'Started color matching activity using modular function');
    },
    
    // These functions are now imported from the module
    // Wrapper functions to maintain compatibility with existing code
    async newColorMatchingQuestion() {
      // Import the module function dynamically and call it
      const colorMatchingModule = await this.loadColorMatchingModule();
      if (colorMatchingModule && typeof colorMatchingModule.newColorMatchingQuestion === 'function') {
        colorMatchingModule.newColorMatchingQuestion(this);
      } else {
        debugLog('CHORDS', 'Error: newColorMatchingQuestion not available');
      }
    },
    
    async checkColorAnswer(selectedColor) {
      // Import the module function dynamically and call it
      const colorMatchingModule = await this.loadColorMatchingModule();
      if (colorMatchingModule && typeof colorMatchingModule.checkColorAnswer === 'function') {
        const result = colorMatchingModule.checkColorAnswer(this, selectedColor);
        
        // Show rainbow success if correct
        if (this.showFeedback && this.feedbackMessage && this.feedbackMessage.includes('Great job')) {
          debugLog('CHORDS', '2_1_chord_color_matching: Correct answer, showing rainbow');
          showCompleteSuccess();
        }
        
        return result;
      } else {
        debugLog('CHORDS', 'Error: checkColorAnswer not available');
      }
    },
    
    // 2_2_chord_mood_landscapes Activity Methods
    // Dynamic loader for the mood landscapes module
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
    
    // Wrapper to maintain backward compatibility
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
    
    // Dynamic wrapper for updateLandscape function from the module
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
    
    // Chord Building Activity Methods
    // Create a button to play the full chord
    addPlayChordButton() {
      // First check if button already exists
      let playButton = document.getElementById('play-full-chord-button');
      
      // If button doesn't exist yet, create it
      if (!playButton) {
        // Find the container in different possible locations
        let container = document.querySelector('.chord-blocks') || 
                       document.querySelector('.chord-building-container') ||
                       document.querySelector('.chord-activity-container');
        
        if (container) {
          // Create a container for the button to style it separately
          const buttonContainer = document.createElement('div');
          buttonContainer.style.marginTop = '15px';
          buttonContainer.style.textAlign = 'center';
          buttonContainer.style.clear = 'both';
          buttonContainer.style.position = 'relative';
          buttonContainer.style.zIndex = '100'; // Ensure it's above other elements
          
          // Create the button itself
          playButton = document.createElement('button');
          playButton.id = 'play-full-chord-button';
          playButton.className = 'play-chord-button';
          playButton.textContent = 'Play Full Chord';
          playButton.style.padding = '8px 16px';
          playButton.style.fontSize = '16px';
          playButton.style.backgroundColor = '#4CAF50';
          playButton.style.color = 'white';
          playButton.style.border = 'none';
          playButton.style.borderRadius = '4px';
          playButton.style.cursor = 'pointer';
          
          // Add hover effect
          playButton.onmouseover = () => {
            playButton.style.backgroundColor = '#45a049';
          };
          playButton.onmouseout = () => {
            playButton.style.backgroundColor = '#4CAF50';
          };
          
          // Add click handler
          playButton.onclick = () => this.playBuiltChord();
          
          // Create a fixed container at the bottom of the screen
          const fixedContainer = document.createElement('div');
          fixedContainer.id = 'play-full-chord-button-container';
          
          // Add to DOM - both in the flow and fixed position
          buttonContainer.appendChild(playButton.cloneNode(true));
          container.parentNode.insertBefore(buttonContainer, container.nextSibling);
          
          // Add fixed button
          fixedContainer.appendChild(playButton);
          document.body.appendChild(fixedContainer);
          
          debugLog('CHORDS', '2_3_chord_building: Added play chord button');
        }
      }
    },
    
    // Play the currently built chord
    async playBuiltChord() {
      debugLog('CHORDS', '2_3_chord_building: Playing built chord');
      
      // If we have a recognized chord type, play it using the audio engine
      if (this.recognizedChordType) {
        try {
          // Get and initialize audioEngine if needed
          const audioEngine = (await import('./audio-engine.js')).default;
          if (!audioEngine._isInitialized) {
            await audioEngine.initialize();
          }
          
          // Play the chord with the central audio engine
          this.playChord(this.recognizedChordType, 'C4', { duration: 2.5 });
          
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
          // Get and initialize audioEngine if needed
          const audioEngine = (await import('./audio-engine.js')).default;
          if (!audioEngine._isInitialized) {
            await audioEngine.initialize();
          }
          
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
      
      // Add play button if we built a recognized chord
      if (recognizedChord) {
        this.showFeedback = true;
        this.feedbackMessage = `You built a ${this.chords[recognizedChord].name} chord!`;
        this.recognizedChordType = recognizedChord; // Store for play button
        
        // Show rainbow success effect for 2_3_chord_building
        showCompleteSuccess();
        
        // Add a play button if it doesn't exist yet
        this.addPlayChordButton();
        
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
        
        // Show rainbow success effect
        showCompleteSuccess();
        
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
        
        // Show rainbow success effect for 2_5_chord_characters
        showCompleteSuccess();
        
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
          this.playChord(chordType);
        }, delay);
        delay += 1000; // 1 second between chords
      });
    }
  };
}
