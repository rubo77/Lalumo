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
    firstVisit: false,
    showUsernamePrompt: false,
    isAudioEnabled: false,
    audioContext: null,
    oscillators: {},
    exportedData: null,
    importData: '',
    preferredLanguage: 'english',
    
    init() {
      // We'll initialize audio only on first user interaction
      this.isAudioEnabled = false;
      
      // Set up multiple event listeners for iOS audio unlocking
      ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(eventType => {
        document.documentElement.addEventListener(eventType, this.unlockAudio.bind(this), true);
      });
      
      // Additional global handler for any user interaction
      document.addEventListener('click', () => this.unlockAudio(), false);
      
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
      window.addEventListener('lalumo:playnote', (event) => {
        if (event.detail && event.detail.note) {
          // Try to unlock audio first in case this is the first interaction
          this.unlockAudio();
          this.playSound(event.detail.note);
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
          console.log('Progress loaded for user:', this.username);
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
    setLanguage(language) {
      this.preferredLanguage = language;
      localStorage.setItem('lalumo_language', language);
      console.log('Language set to:', language);
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
          pitchProgress: localStorage.getItem('lalumo_progress') || {},
          lastActivity: this.active
        };
        
        // Convert to JSON and encode for export
        const jsonString = JSON.stringify(progressData);
        const encoded = btoa(jsonString);
        
        // Set the exportedData property for display in the UI
        this.exportedData = encoded;
        
        console.log('Progress exported successfully');
        return encoded;
      } catch (e) {
        console.log('Error exporting progress', e);
        return null;
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
     * Unlock audio on iOS devices
     * This addresses the iOS requirement for user interaction to enable audio
     */
    unlockAudio() {
      console.log('Attempting to unlock audio...');
      
      if (this.isAudioEnabled) return;
      
      try {
        // Create audio context if it doesn't exist
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
        }
        
        // iOS specific: resume the audio context
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        
        // Create and play a silent buffer to unlock audio
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        
        // Mark audio as enabled
        this.isAudioEnabled = true;
        console.log('Audio unlocked successfully, context state:', this.audioContext.state);
        
        // Remove the event listeners once audio is unlocked
        ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(eventType => {
          document.documentElement.removeEventListener(eventType, this.unlockAudio.bind(this), true);
        });
        
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
    },
    
    /**
     * Play a sound - simplified approach
     */
    playSound(sound) {
      if (!this.isAudioEnabled) {
        this.unlockAudio();
        if (!this.isAudioEnabled) {
          console.log('AUDIOTROUBLE: Still cannot enable audio. User may need to interact with the page first');
          // Try to get user attention with a visible message
          this.showMascotMessage('Tap anywhere on the screen to enable sound!');
          return;
        }
      }
      
      // iOS Safari requires resuming AudioContext on each user interaction
      if (this.audioContext && this.audioContext.state === 'suspended') {
        console.log('AUDIOTROUBLE: Resuming suspended audio context');
        this.audioContext.resume();
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
     * Check for iOS device and add special handling
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
     * Play a tone with the given frequency and duration
     */
    playTone(frequency, duration = 0.5) {
      if (!this.audioContext) return;
      
      try {
        // If we have active oscillators, store them so we can access them later
        if (this.activeOscillators) {
          // Stop all currently playing oscillators immediately to avoid audio conflicts
          this.activeOscillators.forEach(osc => {
            try {
              osc.stop();
              osc.disconnect();
            } catch (e) {
              // Ignore errors from already stopped oscillators
            }
          });
        }
        
        // Create a new array to track active oscillators
        this.activeOscillators = [];
        
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
        'G5': 783.99
      };
      
      // Return the frequency or default to middle C
      return noteFrequencies[noteName] || 261.63;
    }
  };
}
