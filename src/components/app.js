/**
 * Main application component
 */
export function app() {
  return {
    active: 'pitches',
    menuOpen: false,
    username: null,
    firstVisit: false,
    showUsernamePrompt: false,
    isAudioEnabled: false,
    audioContext: null,
    oscillators: {},
    
    init() {
      // We'll initialize audio only on first user interaction
      this.isAudioEnabled = false;
      
      // Set up event listener for audio initialization
      window.addEventListener('click', () => this.initAudio(), { once: true });
      
      // Initialize Alpine.js store for state sharing
      window.Alpine.store('pitchMode', 'listen');
      
      // Check for existing username in localStorage
      this.loadUserData();
      
      // If no username exists, show prompt after a short delay
      if (!this.username) {
        this.firstVisit = true;
        setTimeout(() => {
          this.showUsernamePrompt = true;
        }, 2000);
      }
      
      // Set up event listener for playing notes from other components
      window.addEventListener('musici:playnote', (event) => {
        if (event.detail && event.detail.note) {
          this.playSound(event.detail.note);
        }
      });
    },
    
    /**
     * Load user data from localStorage
     */
    loadUserData() {
      try {
        const savedUsername = localStorage.getItem('musici_username');
        if (savedUsername) {
          this.username = savedUsername;
          console.log('Progress loaded for user:', this.username);
        }
      } catch (e) {
        console.log('Error loading user data', e);
      }
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
        localStorage.setItem('musici_username', this.username);
        console.log('Username saved:', this.username);
      } catch (e) {
        console.log('Error saving username', e);
      }
      
      this.showUsernamePrompt = false;
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
          pitchProgress: localStorage.getItem('musici_progress') || {},
          lastActivity: this.active
        };
        
        // Convert to JSON and encode for export
        const jsonString = JSON.stringify(progressData);
        const encoded = btoa(jsonString);
        
        // Return the save code
        return encoded;
      } catch (e) {
        console.log('Error exporting progress', e);
        return null;
      }
    },
    
    /**
     * Import progress from a save game string
     */
    importProgress(saveCode) {
      try {
        // Decode and parse the save code
        const jsonString = atob(saveCode);
        const progressData = JSON.parse(jsonString);
        
        // Validate the data
        if (!progressData || !progressData.username) {
          console.log('Invalid save code');
          return false;
        }
        
        // Restore the username
        this.username = progressData.username;
        localStorage.setItem('musici_username', this.username);
        
        // Restore pitch progress
        if (progressData.pitchProgress) {
          localStorage.setItem('musici_progress', progressData.pitchProgress);
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
     * Initialize Web Audio API - simpler than Tone.js
     */
    initAudio() {
      if (this.isAudioEnabled) return;
      
      try {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this.isAudioEnabled = true;
        console.log('Audio context started successfully');
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    },
    
    /**
     * Play a sound - simplified approach
     */
    playSound(sound) {
      if (!this.isAudioEnabled) {
        this.initAudio();
        if (!this.isAudioEnabled) return; // Still not enabled
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
          const color = sound.split('_')[1];
          this.playToneColor(color);
        }
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    },
    
    /**
     * Play a tone with the given frequency and duration
     */
    playTone(frequency, duration = 0.5) {
      if (!this.audioContext) return;
      
      try {
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
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
        'G5': 783.99
      };
      
      // Return the frequency or default to middle C
      return noteFrequencies[noteName] || 261.63;
    }
  };
}
