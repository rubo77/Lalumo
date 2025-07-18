/**
 * Free Play component
 * Allows free musical exploration for creative play
 */

import { debugLog } from '../utils/debug.js';

export function freeplay() {
  return {
    currentInstrument: 'piano',
    isRecording: false,
    hasRecording: false,
    recordedNotes: [],
    recordStartTime: null,
    availableInstruments: ['piano', 'guitar', 'drums', 'synth'],
    
    /**
     * Initialize the component
     */
    init() {
      debugLog('FREEPLAY', 'Free Play component initialized');
      this.setupNavigation();
    },
    
    /**
     * Configure navigation buttons to respect menu lock and add accessibility attributes
     */
    setupNavigation() {
      const navButtons = document.querySelectorAll('button.back-to-main');
      navButtons.forEach(button => {
        const originalClick = button.getAttribute('x-on:click') || button.getAttribute('@click');
        if (originalClick && !originalClick.includes('$root.menuLocked')) {
          // Add menu lock check to button click handler - avoid string concatenation
          if (originalClick.includes('$root.active')) {
            button.setAttribute('x-on:click', '!$root.menuLocked && ($root.active = "main")');
          } else {
            button.setAttribute('x-on:click', '!$root.menuLocked');
          }
          button.setAttribute(':class', '{ disabled: $root.menuLocked }');
          if (!button.hasAttribute('aria-label')) {
            button.setAttribute('aria-label', 'Back to main menu');
          }
        }
        if (!button.hasAttribute('role')) {
          button.setAttribute('role', 'button');
        }
      });
    },
    
    /**
     * Select an instrument to play
     * @param {string} instrument - The instrument identifier
     */
    selectInstrument(instrument) {
      if (this.availableInstruments.includes(instrument)) {
        this.currentInstrument = instrument;
        debugLog('FREEPLAY', `Selected instrument: ${instrument}`);
      }
    },
    
    /**
     * Play a note with the currently selected instrument
     * @param {string} note - The note to play (e.g., 'C4', 'G#3')
     */
    playNote(note) {
      try {
        // Dispatch sound event with instrument and note information
        window.dispatchEvent(new CustomEvent('lalumo:play-sound', {
          detail: { sound: `${this.currentInstrument}_${note}` }
        }));
        
        // If recording, store the note with timestamp
        if (this.isRecording) {
          const now = Date.now();
          const timeSinceStart = this.recordStartTime ? now - this.recordStartTime : 0;
          
          this.recordedNotes.push({
            note,
            instrument: this.currentInstrument,
            time: timeSinceStart
          });
        }
      } catch (error) {
        debugLog(['FREEPLAY', 'ERROR'], `Error playing note ${note}: ${error.message || error}`);
      }
    },
    
    /**
     * Start recording a sequence
     */
    startRecording() {
      this.recordedNotes = [];
      this.recordStartTime = Date.now();
      this.isRecording = true;
      debugLog('FREEPLAY', 'Recording started');
    },
    
    /**
     * Stop the current recording
     */
    stopRecording() {
      if (this.isRecording) {
        this.isRecording = false;
        this.hasRecording = this.recordedNotes.length > 0;
        debugLog('FREEPLAY', `Recording stopped, notes: ${this.recordedNotes.length}`);
      }
    },
    
    /**
     * Play back the recorded sequence
     */
    playRecording() {
      if (!this.hasRecording) return;
      
      let previousTime = 0;
      
      this.recordedNotes.forEach((noteInfo, index) => {
        // Calculate the delay for this note based on recorded timing
        const delay = index === 0 ? 0 : noteInfo.time - previousTime;
        previousTime = noteInfo.time;
        
        // Play each note with the right timing
        setTimeout(() => {
          // Switch to the instrument used when recording
          const originalInstrument = this.currentInstrument;
          this.currentInstrument = noteInfo.instrument;
          
          // Play the note
          this.playNote(noteInfo.note);
          
          // Switch back to the current instrument
          this.currentInstrument = originalInstrument;
        }, delay);
      });
      
      debugLog('FREEPLAY', 'Playing back recording');
    }
  };
}
