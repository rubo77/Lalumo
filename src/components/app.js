import { debugLog } from '../utils/debug';
import config from '../config.js';
import { initMultiTouchHandler } from '../utils/touch-handler.js';

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
    isSpeaking: false,
    ttsAvailable: false,
    currentVoice: null,
    voicesByLanguage: {},
    preferredVoice: null,
    isMuted: false,
    activeOscillators: [],
    currentToneTimeout: null,
    sequenceTimeouts: [], // Array für Sequenz-Timeouts
    exportedData: null,
    importData: '',
    preferredLanguage: 'english',
    
    // Referral system state
    isUsernameLocked: false,     // Whether username is locked
    lockedUsername: '',          // Locked username
    referralCode: '',            // User's referral code
    referralCount: 0,            // Number of received referrals
    referralClickCount: 0,       // Number of clicks on referral link
    referralLink: '',            // Shareable referral link
    friendCode: '',              // Friend code input by user
    referredBy: '',              // Code/username of who referred this user (from deep link)
    referrerUsername: '',         // Username of the person who referred this user
    areAllActivitiesUnlocked: false, // Whether chord chapter is unlocked
    
    /**
     * Mapping of chapters and activities to new ID format
     * Format: <chapter-id>_<chapter-name>_<activity-id>_<activity-name>
     */
    chapterActivityMap: {
      '1_pitches': {
        name: 'Pitches & Melodies',
        activities: {
          '1_1_pitches_high_or_low': 'High or Low?',
          '1_2_pitches_match-sounds': 'Match Sounds',
          '1_3_pitches_draw-melody': 'Draw a Melody',
          '1_4_pitches_does-it-sound-right': 'Does It Sound Right?',
          '1_5_pitches_memory-game': 'Memory Game'
        },
        // Mapping von alten zu neuen IDs
        legacyMapping: {
          '1_1_pitches_high_or_low': '1_1_pitches_high_or_low',
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
          '2_2_chords_stable_instable': 'Stable Or Instable',
          '2_3_chords_chord-building': 'Chord Building',
          '2_4_chords_missing-note': 'Missing Note',
          '2_5_chords_characters': 'Chord Characters',
          '2_6_chords_harmony-gardens': 'Harmony Gardens'
        },
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
        ? 'strings-de.xml'
        : 'strings-en.xml';
      
      console.log(`Loading strings from: ${xmlPath}`);
      console.log("[STRING_LOAD_DEBUG] Fetching XML from path:", xmlPath);
      
      // Fetch the XML file
      const response = await fetch(xmlPath);
      console.log("[STRING_LOAD_DEBUG] Fetch response status:", response.status, "- OK:", response.ok);
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
          strings[name] = value.replace("\\", "");
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
    
    resetSpeech() {
      // Reset speech synthesis
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    },
    
    /**
     * Referral System Functions
     */
    
    /**
     * Ruft den Benutzernamen anhand eines Referral-Codes ab
     * @param {string} code - Der Referral-Code
     * @return {Promise<string|null>} Der Benutzername oder null, wenn nicht gefunden
     */
    async getUsernameByReferralCode(code) {
      if (!code) return null;
      
      try {
        debugLog(`[REFERRAL] Fetching username for code: ${code}`);
        const apiUrl = `${config.API_BASE_URL}/referral.php?code=${encodeURIComponent(code)}&action=username`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.success && data.username) {
          debugLog(`[REFERRAL] Found username: ${data.username} for code: ${code}`);
          return data.username;
        } else {
          debugLog(`[REFERRAL] No username found for code: ${code}`);
          return null;
        }
      } catch (error) {
        console.error(`[REFERRAL] Error fetching username for code: ${code}`, error);
        return null;
      }
    },
    
    /**
     * Lock username and get referral code
     * Implementiert UI-Feedback während der Registrierung (Spinner, Erfolgs-/Fehlermeldungen)
     * Erstellt einen permanenten Benutzeraccount und generiert einen Referral-Code
     */
    
    /**
     * Fetch referral count for the current user
     */
    async fetchReferralCount() {
      if (!this.lockedUsername) {
        console.log('[REFERRAL_DEBUG] Kein Username gesperrt, überspringe Abfrage');
        return;
      }
      
      console.log('[REFERRAL_DEBUG] Rufe Statistik für User ab:', this.lockedUsername);
      
      try {
        const apiUrl = `${config.API_BASE_URL}/referral.php?username=${encodeURIComponent(this.lockedUsername)}`;
        console.log('[REFERRAL] API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('[REFERRAL] Antwort-Status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('[REFERRAL] Raw response:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('[REFERRAL] JSON parse error:', e);
          throw new Error('Invalid JSON in response');
        }
        
        console.log('[REFERRAL] Verarbeitete Daten:', data);
        
        if (data.success) {
          // Update referral counts with detailed logging
          console.log('[REFERRAL_DEBUG] Server returned - registrationCount:', data.registrationCount, 'clickCount:', data.clickCount);
          
          const oldReferralCount = this.referralCount;
          this.referralCount = data.registrationCount || 0;
          this.referralClickCount = data.clickCount || 0;
          
          console.log('[REFERRAL_DEBUG] Werte aktualisiert - Alt:', oldReferralCount, 'Neu:', this.referralCount);
          console.log('[REFERRAL_DEBUG] Datentypen - registrationCount:', typeof data.registrationCount, 'clickCount:', typeof data.clickCount);
          
          // Speichere aktualisierte Daten im localStorage
          this.saveReferralData();
          
          // Check if the chapter should be unlocked
          if (this.referralCount >= 3 && !this.areAllActivitiesUnlocked) {
            this.areAllActivitiesUnlocked = true;
            this.saveReferralData();
          }
        } else if (data.error) {
          // Fehlerbehandlung mit übersetzten Nachrichten
          const errorMessage = this.translateReferralMessage(data.error);
          console.error('[REFERRAL] Serverfehler:', errorMessage);
          // Wir zeigen hier keine Alert-Nachricht an, um den Benutzer nicht zu stören
          // bei automatischen Hintergrundaktualisierungen
        }
      } catch (error) {
        console.error('Error fetching referral count:', error);
      }
    },
    
    /**
     * Copy referral code to clipboard
     */
    async copyReferralCode() {
      if (!this.referralCode) return;
      
      try {
        await navigator.clipboard.writeText(this.referralCode);
        this.showToast(this.$store.strings?.copied || 'Copied!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = this.referralCode;
        textArea.style.position = 'fixed'; // Avoid scrolling
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            this.showToast(this.$store.strings?.copied || 'Copied!');
          } else {
            this.showToast(this.$store.strings?.copy_failed || 'Failed to copy');
          }
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
        }
        
        document.body.removeChild(textArea);
      }
    },
    
    /**
     * Share referral code using Web Share API or fallback to clipboard
     */
    async shareReferralCode() {
      if (!this.referralCode) return;
      
      const shareTitle = this.$store.strings?.share_title || 'Lalumo Referral Code';
      const shareText = (this.$store.strings?.share_text || 'Try Lalumo and use my referral code') + ': ' + this.referralCode;
      const shareUrl = 'https://lalumo.app'; // Your app's URL
      
      // Check if the Web Share API is available
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          console.log('Content shared successfully');
        } catch (error) {
          console.error('Error sharing content:', error);
          // Fall back to clipboard if sharing was cancelled or failed
          this.copyReferralCode();
        }
      } else {
        // If Web Share API is not available, use clipboard instead
        await this.copyReferralCode();
        this.showToast(this.$store.strings?.share_fallback || 'The referral code has been copied to your clipboard. Share it with your friends!');
      }
    },
    
    /**
     * Show a toast message
     */
    showToast(message, duration = 3000) {
      // Create toast element if it doesn't exist
      let toast = document.getElementById('lalumo-toast');
      
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lalumo-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(60, 60, 60, 0.9)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '20px';
        toast.style.zIndex = '1000';
        toast.style.textAlign = 'center';
        toast.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(toast);
      }
      
      // Set toast message
      toast.textContent = message;
      toast.style.opacity = '1';
      
      // Hide after duration
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, duration);
    },  
    /**
     * Analysiert den URL-Hash für Deep-Links und Referrals
     * Unterstützte Formate:
     * - #ref=CODE - Für Referral-Links mit vorausgefülltem Code
     * - #activity=ID - Für direkten Start einer bestimmten Aktivität (z.B. 2_5)
     */
    parseUrlHash() {
      const hash = window.location.hash;
      console.log('[DEEPLINK] Analysiere URL-Hash:', hash);
      
      if (!hash || hash.length <= 1) {
        return; // Kein Hash vorhanden
      }
      
      // Extrahiere den Hash ohne das #-Zeichen
      const hashContent = hash.substring(1); 
      
      // Aufteilen nach Parametern (falls mehrere durch & getrennt sind)
      const params = {};
      hashContent.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[key] = decodeURIComponent(value);
        }
      });
      
      console.log('[DEEPLINK] Extrahierte Parameter:', params);
      
      // Process referral code from URL hash (#ref=CODE)
      if (params.ref) {
        console.log('[DEEPLINK] Referral code found:', params.ref);
        // Store who referred this user
        this.referredBy = params.ref;
        
        // Fetch username of referring user if not already stored
        if (!this.referrerUsername && this.referredBy) {
          debugLog('[REFERRAL] Fetching username for referring user code: ' + this.referredBy);
          
          // Start async process to get referrer's username
          this.getUsernameByReferralCode(this.referredBy).then(username => {
            if (username) {
              debugLog('[REFERRAL] Found referring username: ' + username);
              this.referrerUsername = username;
              this.saveReferralData();
            }
          });
        }
        
        this.saveReferralData();
        
        // Show notification to user that they were referred
        this.$nextTick(() => {
          // Display a toast or notification
          this.$dispatch('show-toast', {
            message: this.$store.strings?.referred_by_friend || 'You were referred by a friend!',
            type: 'info',
            duration: 5000
          });
        });
        
        // Remove only the 'ref' parameter from URL hash to prevent duplicate processing
        // Keep other parameters like 'activity' intact for navigation purposes
        if (history.replaceState) {
          // Build a new hash string with any parameters except 'ref'
          let newHash = '';
          Object.keys(params).forEach(key => {
            if (key !== 'ref') {
              newHash += (newHash ? '&' : '') + key + '=' + encodeURIComponent(params[key]);
            }
          });
          
          // Apply the new hash (or clear if empty)
          if (newHash) {
            history.replaceState(null, document.title, window.location.pathname + window.location.search + '#' + newHash);
          } else {
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
          }
        } else {
          // Fallback for older browsers
          // Note: This will remove all hash parameters as a fallback
          window.location.hash = params.activity ? 'activity=' + params.activity : '';
        }
      }
      
      // Verarbeite Activity-Parameter (#activity=ID)
      if (params.activity) {
        console.log('[DEEPLINK] Aktivität gefunden:', params.activity);
        // Hier den direkten Start der Aktivität implementieren
        this.$nextTick(() => {
          // Start different activities based on ID format (1_1, 2_5, etc.)
          const activityId = params.activity;
          
          if (activityId.startsWith('1_')) {
            // Pitch activities - dispatch the set-activity-mode event
            console.log('[DEEPLINK] Starting pitch activity:', activityId);
            window.dispatchEvent(new CustomEvent('set-activity-mode', {
              detail: activityId
            }));
            
            // Focus the navigation button for this activity (if it exists)
            this.$nextTick(() => {
              const navButton = document.getElementById('nav_' + activityId.split('_').slice(0, 2).join('_'));
              if (navButton) navButton.focus();
            });
          } else if (activityId.startsWith('2_')) {
            // Chord activities - dispatch the set-activity-mode event
            console.log('[DEEPLINK] Starting chord activity:', activityId);
            window.dispatchEvent(new CustomEvent('set-activity-mode', {
              detail: activityId
            }));
            
            // Focus the navigation button for this activity (if it exists)
            this.$nextTick(() => {
              const navButton = document.getElementById('nav_' + activityId.split('_').slice(0, 2).join('_'));
              if (navButton) navButton.focus();
            });
          }
          
          // Lösche den Hash aus der URL nach dem Start der Aktivität
          if (history.replaceState) {
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
          } else {
            window.location.hash = '';
          }
        });
      }
    },
    
    async init() {
      debugLog('APP', 'Initializing app');
      // We'll initialize audio only on first user interaction
      this.isAudioEnabled = false;
      
      // Initialize Alpine.js store immediately to prevent undefined errors
      window.Alpine.store('strings', {});
      window.Alpine.store('pitchMode', '1_1_pitches_high_or_low');
      
      // Set up the global strings instance and helper functions
      window.Alpine.store('strings', {
        ...this.strings
      });
      
      // Registriere Plattform-Erkennungsfunktionen für Template-Zugriff
      window.Alpine.store('isAndroidApp', this.isAndroidApp.bind(this));
      window.Alpine.store('isIOSApp', this.isIOSApp.bind(this));
      
      // Initialize multi-touch handler for Android Chrome
      initMultiTouchHandler();
      
      // Load user data (including language) from localStorage
      this.loadUserData();
      
      // Parse URL hash for deep links and referrals
      this.parseUrlHash();
      
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
      this.processedEventIds = new Set(); // Set zum Speichern bereits verarbeiteter Event-IDs
      
      // Event-Listener entfernen, falls er bereits existiert (verhindert mehrfache Registrierung)
      if (this.handlePlayNoteEvent) {
        window.removeEventListener('lalumo:playnote', this.handlePlayNoteEvent);
      }
      
      // Event-Handler-Funktion als Eigenschaft definieren
      this.handlePlayNoteEvent = (event) => {
        if (event.detail && event.detail.note) {
          // Event-ID generieren, falls keine vorhanden
          const eventId = event.detail.id || `${event.detail.note}_${Date.now()}`;
          const currentTime = Date.now();
          
          // Prüfen, ob wir dieses Event bereits verarbeitet haben
          if (this.processedEventIds.has(eventId)) {
            console.log(`AUDIO_APP: Already processed event ID: ${eventId}, note: ${event.detail.note}`);
            return;
          }
          
          // Debug logs zu Event-IDs und Timing
          console.log(`AUDIO_APP: Received note event: ${event.detail.note}, ID: ${eventId}`);
          console.log(`AUDIO_APP: Last ID: ${this.lastNoteEventId}, Time diff: ${currentTime - this.lastNoteEventTime}ms`);
          
          // Doppelte Events verhindern: Ignoriere Events mit gleicher ID oder zu kurzen Abständen
          if (eventId === this.lastNoteEventId) {
            console.log(`AUDIO_APP: Skipping due to IDENTICAL ID: ${event.detail.note}`);
            return;
          } 
          
          if (currentTime - this.lastNoteEventTime < 50) {
            console.log(`AUDIO_APP: Skipping due to TOO SOON (${currentTime - this.lastNoteEventTime}ms): ${event.detail.note}`);
            return;
          }
          
          // Event zu verarbeiteten Events hinzufügen
          this.processedEventIds.add(eventId);
          
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
      };
      
      // Jetzt den Event-Listener mit der Handler-Funktion registrieren
      window.addEventListener('lalumo:playnote', this.handlePlayNoteEvent);
      
      // Set up event listener for stopping all sounds
      window.addEventListener('lalumo:stopallsounds', () => {
        // Aktiv alle Oszillatoren stoppen, wenn das Event ausgelöst wird
        console.log('Received request to stop sounds - stopping all oscillators');
        this.stopAllOscillators();
      });
      
      // Special iOS audio check on page load
      this.checkIOSAudio();
    },
    
    /**
     * Special iOS audio check for compatibility
     * @returns {Promise<void>}
     */
    checkIOSAudio() {
      // iOS requires user interaction to start audio context
      // This is a placeholder for any special iOS audio initialization that might be needed
      debugLog('APP', 'iOS audio check placeholder for any special iOS audio initialization that might be needed');
      return Promise.resolve();
    },
    
    /**
     * Checks if a username still exists in the server database
     * only if you are already locked. this can only happen if the server db is deleted or in admin the user
     * @param {string} username - Username to check
     * @returns {Promise<boolean>} - True if username exists, false otherwise
     */
    async checkUsernameStillExists(username) {
      try {
        console.log(`[REFERRAL] Checking if username '${username}' exists on server...`);
        const response = await fetch(`./referral.php?check_existing=1&username=${encodeURIComponent(username)}`);
        const data = await response.json();
        
        debugLog("REFERRAL", "Username exists: " + data.success);
        // User exists if the API returns success
        return data.success === true;
      } catch (error) {
        console.error(`[REFERRAL] Error checking if username exists:`, error);
        // Assume user exists in case of error (to prevent accidental unlock)
        return true;
      }
    },
    
    /**
     * Load user data from localStorage
     */
    async loadUserData() {
      debugLog("REFERRAL", "Loading user data");
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
          console.log('Language preference loaded:', this.preferredLanguage);
          // Update the HTML lang attribute immediately
          document.documentElement.lang = this.preferredLanguage === 'german' ? 'de' : 'en';
        }
        
        // Load referral system data from localStorage
        const savedReferralData = localStorage.getItem('lalumo_referral');
        if (savedReferralData) {
          debugLog("REFERRAL", "Loaded referral data from localStorage:", savedReferralData);
          try {
            const referralData = JSON.parse(savedReferralData);
            this.isUsernameLocked = referralData.isUsernameLocked || false;
            this.lockedUsername = referralData.lockedUsername || '';
            this.referralCode = referralData.referralCode || '';
            this.referralCount = referralData.referralCount || 0;
            this.referralClickCount = referralData.referralClickCount || 0;
            this.areAllActivitiesUnlocked = referralData.areAllActivitiesUnlocked || false;
            this.referredBy = referralData.referredBy || '';
            this.referrerUsername = referralData.referrerUsername || '';
            console.log('Referral data loaded:', { 
              isUsernameLocked: this.isUsernameLocked,
              lockedUsername: this.lockedUsername,
              referralCode: this.referralCode,
              referralCount: this.referralCount,
              referralClickCount: this.referralClickCount,
              areAllActivitiesUnlocked: this.areAllActivitiesUnlocked,
              referredBy: this.referredBy,
              referrerUsername: this.referrerUsername
            });
            
            debugLog("REFERRAL", "Loaded referral data");
            
            // Wenn der Benutzer bereits registriert ist, prüfen ob der Username noch existiert
            if (this.isUsernameLocked && this.lockedUsername) {
              console.log('[REFERRAL] User is registered, checking if username still exists...');
              
              // Check if username still exists in the server database
              const usernameExists = await this.checkUsernameStillExists(this.lockedUsername);
              
              debugLog("REFERRAL", "Username exists: " + usernameExists);
              
              if (!usernameExists) {
                console.log(`[REFERRAL] Username '${this.lockedUsername}' no longer exists on server, unlocking...`);
                // Reset username lock and save changes
                this.isUsernameLocked = false;
                this.lockedUsername = '';
                this.referralCode = '';
                this.saveReferralData();
                
                // Show notification to the user
                this.showToast(this.$store.strings?.username_reset || 'Your user account was reset because it no longer exists on the server.');
              } else {
                // Fetch current referral counts if the user still exists
                console.log('[REFERRAL] Username verified, fetching current referral counts...');
                setTimeout(() => this.fetchReferralCount(), 1000);
              }
            }
          } catch (e) {
            console.error('Error parsing referral data:', e);
          }
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    },
    
    /**
     * Toggle the menu lock state (child safety feature)
     */
    toggleMenuLock() {
      this.menuLocked = !this.menuLocked;
      try {
        // Save to localStorage
        localStorage.setItem('lalumo_menu_locked', this.menuLocked);
        console.log('Menu lock state updated:', this.menuLocked);
        
        // Notify Android about menu lock state change if running in Android
        if (window.AndroidMenuLock) {
          try {
            window.AndroidMenuLock.setMenuLockState(this.menuLocked);
            console.log('Android notified about menu lock state:', this.menuLocked);
          } catch (androidError) {
            console.log('[Error] while notifying Android about menu lock state', androidError);
          }
        }
      } catch (e) {
        console.log('[Error] while saving menu lock state', e);
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
        // Also update the <html lang> attribute
        document.documentElement.lang = language === "german" ? "de" : "en";
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
      const adjectives = [
        'Happy', 'Clever', 'Brave', 'Bright', 'Creative', 'Curious', 'Eager', 'Friendly', 'Gentle', 'Kind',
        'Cheerful', 'Sunny', 'Shy', 'Playful', 'Calm', 'Witty', 'Bold', 'Joyful', 'Mighty', 'Peaceful',
        'Cuddly', 'Charming', 'Jolly', 'Quick', 'Wise', 'Dreamy', 'Magical', 'Lucky', 'Quiet', 'Hopeful',
        'Bubbly', 'Silly', 'Smart', 'Steady', 'Lively', 'Patient', 'Adventurous', 'Noble', 'Daring', 'Glowing',
        'Graceful', 'Humble', 'Strong', 'Gentle', 'Sparkly', 'Warm', 'Chill', 'Fearless', 'Kindhearted', 'Loyal',
        'Courageous', 'Inventive', 'Resourceful', 'Spry', 'Starlit', 'Snuggly', 'Peppy', 'Mellow', 'Twinkly', 'Helpful'
      ];
    
      const animals = [
        'Dolphin', 'Tiger', 'Eagle', 'Panda', 'Koala', 'Lion', 'Penguin', 'Rabbit', 'Fox', 'Butterfly',
        'Otter', 'Squirrel', 'Owl', 'Wolf', 'Bear', 'Frog', 'Hedgehog', 'Mouse', 'Cat', 'Dog',
        'Horse', 'Sheep', 'Goat', 'Pig', 'Chicken', 'Duck', 'Goose', 'Seal', 'Walrus', 'Moose',
        'Giraffe', 'Zebra', 'Elephant', 'Hippo', 'Rhinoceros', 'Kangaroo', 'Bat', 'Swan', 'Peacock', 'Parrot',
        'Canary', 'Lizard', 'Turtle', 'Chameleon', 'Crab', 'Lobster', 'Octopus', 'Starfish', 'Seahorse', 'Jellyfish',
        'Bee', 'Ladybug', 'Ant', 'Grasshopper', 'Dragonfly', 'Firefly', 'Spider', 'Snail', 'Worm', 'Moth',
        'Hamster', 'Gerbil', 'GuineaPig', 'Ferret', 'Mole', 'Shrew', 'Porcupine', 'Armadillo', 'Raccoon', 'Skunk',
        'Badger', 'Platypus', 'Kookaburra', 'Cockatoo', 'Toucan', 'Orangutan', 'Chimpanzee', 'Lemur', 'Cheetah', 'Leopard',
        'Jaguar', 'Cougar', 'Lynx', 'Caracal', 'Serval', 'Buffalo', 'Bison', 'Wombat', 'Wallaby', 'TasmanianDevil',
        'Flamingo', 'Pelican', 'Stork', 'Crane', 'Albatross', 'Dodo', 'Emu', 'Ostrich', 'Hummingbird', 'Kingfisher',
        'Salamander', 'Toad', 'Newt', 'Alligator', 'Crocodile', 'Gazelle', 'Ibex', 'Okapi', 'Tapir', 'Manatee'
      ];
    
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
        
        // Show info box with username information
        const message = this.$store.strings?.username_created 
          ? this.$store.strings.username_created.replace('{username}', this.username)
          : `Your name is ${this.username}. You can change this in the settings.`;
        this.showToast(message, 5000);
      } catch (e) {
        console.log('[Error] while saving username', e);
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
          
          // Show info box with username information
          const message = this.$store.strings?.username_updated 
            ? this.$store.strings.username_updated.replace('{username}', this.username)
            : `Your name is ${this.username}. You can change this in the settings.`;
          this.showToast(message, 5000);
        } catch (e) {
          console.log('[Error] while saving custom username', e);
        }
      } else {
        // If empty, revert to current username
        this.editableUsername = this.username;
      }
    },
    
    /**
     * Export the user's progress as a save game string
     * This now exports the complete localStorage contents for maximum compatibility
     */
    exportProgress() {
      // Reset exportedData vor jedem neuen Export
      this.exportedData = '';
      
      try {
        console.log('Starte Export aller Daten aus dem localStorage...');
        
        // Sammle alle localStorage Daten
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          localStorageData[key] = localStorage.getItem(key);
        }
        
        // Füge Metadaten hinzu
        const exportData = {
          version: "2.0", // Neue Version mit vollständigem localStorage
          timestamp: new Date().toISOString(),
          device: navigator.userAgent,
          localStorageData: localStorageData
        };
        
        console.log('Export Daten:', exportData);
        
        // Konvertieren zu JSON und codieren für Export
        const jsonString = JSON.stringify(exportData);
        console.log('JSON-String Länge:', jsonString.length);
        
        const encoded = btoa(jsonString);
        console.log('Kodierter String Länge:', encoded.length);
        
        if(!encoded || encoded.length === 0) {
          console.error('Kodierter String ist leer');
          alert(this.$store.strings?.export_error_empty || 'Error exporting data: encoded string is empty');
          return null;
        }
        
        // Alpine.js Reaktivität erzwingen mit Timeout
        setTimeout(() => {
          // Set the exportedData property for display in the UI
          this.exportedData = encoded;
          console.log('ExportedData wurde gesetzt auf:', '[Länge: ' + encoded.length + ']');
          
          // Log für bessere Diagnose
          console.log('All localStorage data exported successfully');
        }, 10);
        
        return encoded;
      } catch (e) {
        console.error('Fehler beim Exportieren:', e);
        alert(this.$store.strings?.export_error_dynamic?.replace('%1$s', e.message) || 
              'Error exporting data: ' + e.message);
        return null;
      }
    },
    
    /**
     * Copy the exported progress code to clipboard
     */
    copyExportedData() {
      if (!this.exportedData) {
        alert(this.$store.strings?.no_export_data || 'Please export your progress first!');
        return;
      }
      
      try {
        // Copy to clipboard
        navigator.clipboard.writeText(this.exportedData)
          .then(() => {
            alert(this.$store.strings?.progress_code_copied || 'Progress code copied to clipboard!');
          })
          .catch(err => {
            console.error('Clipboard write failed:', err);
            alert(this.$store.strings?.copy_failed || 'Failed to copy to clipboard. Please manually select and copy the code.');
          });
      } catch (e) {
        console.error('Error copying progress data:', e);
        alert(this.$store.strings?.copy_failed || 'Failed to copy to clipboard. Please manually select and copy the code.');
      }
    },
    
    /**
     * Import user progress from a save game string
     * Only supports version 2.0 format with complete localStorage data
     * Also supports cheatcodes in format <activity_id>:<progress-level>
     * For activities needing two values, use a one-letter prefix (e.g., 2_5:19s10 where 's' is the prefix)
     */
    importProgress() {
      try {
        console.log('Import-Debug: importData =', this.importData, 'importedData =', this.importedData);
        
        // Check if input is a cheatcode
        if (this.importData && this.importData.includes(':')) {
          return this.handleCheatcode(this.importData);
        }
        
        // Regular import process
        // Verwende die richtige Property (importData statt importedData)
        // Die Property muss mit dem x-model in settings.html übereinstimmen
        if (!this.importData) {
          console.error('Import-Debug: Keine Importdaten gefunden in this.importData');
          alert(this.$store.strings?.import_error_empty || 'Error: No import data provided');
          return;
        }
        
        // Entferne Whitespaces und überprüfe erneut
        const cleanedData = this.importData.trim();
        if (cleanedData === '') {
          console.error('Import-Debug: Importdaten sind leer nach Trim');
          alert(this.$store.strings?.import_error_empty || 'Error: No import data provided');
          return;
        }
        
        console.log('Attempting to import data...', cleanedData.substring(0, 20) + '...');
        
        // Base64-Dekodierung mit verbesserten Fehlerprüfungen
        let decodedData;
        try {
          decodedData = atob(cleanedData);
          console.log('Decoded data successfully, length:', decodedData.length, 'Preview:', decodedData.substring(0, 50) + '...');
        } catch (e) {
          console.error('Base64 decoding failed:', e, 'Data was:', cleanedData.substring(0, 100));
          alert(this.$store.strings?.import_error_format || 'Error: Invalid import data format');
          return;
        }
        
        // JSON-Parsing mit Fehlerbehandlung
        let parsedData;
        try {
          parsedData = JSON.parse(decodedData);
          console.log('Import data parsed successfully:', Object.keys(parsedData));
        } catch (e) {
          console.error('JSON parsing failed:', e, 'Decoded data was:', decodedData.substring(0, 100));
          alert(this.$store.strings?.import_error_json || 'Error: Could not parse import data');
          return;
        }
        
        // Überprüfe Version und Datenformat
        if (!parsedData.version || parsedData.version !== "2.0" || !parsedData.localStorageData) {
          console.error('Unsupported import format:', JSON.stringify(parsedData).substring(0, 200));
          alert(this.$store.strings?.import_error_version || 'Error: Unsupported import format. Only version 2.0 is supported.');
          return;
        }
        
        console.log('Detected version 2.0 format with complete localStorage data');
        
        // Wiederherstellung aller localStorage-Einträge
        const localStorageData = parsedData.localStorageData;
        const restoredItems = [];
        
        // Setze alle Einträge in den localStorage
        for (const key in localStorageData) {
          localStorage.setItem(key, localStorageData[key]);
          
          // Formatiere Schlüsselnamen für bessere Anzeige
          if (key.includes('lalumo_')) {
            const readableName = key.replace('lalumo_', '').replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
            restoredItems.push(readableName);
          } else {
            restoredItems.push(key);
          }
        }
        
        console.log('Restored all localStorage data successfully');
        
        // Feedback anzeigen und Seite neu laden
        const restoredMessage = restoredItems.length > 0 
          ? `Restored: ${restoredItems.join(', ')}` 
          : 'No data restored';
          
        alert(this.$store.strings?.import_success || 'Import successful! ' + restoredMessage);
        
        // Reload the page to apply changes
        window.location.reload();
        
      } catch (e) {
        console.error('Error importing data:', e);
        alert(this.$store.strings?.import_error_dynamic?.replace('%1$s', e.message) || 
              'Error importing data: ' + e.message);
      }
    },
    
    /**
     * Unlock audio on mobile devices
     * This addresses both iOS and Android requirements for user interaction to enable audio
     */
    async unlockAudio() {
      // Import debug utils for consistent logging
      // const { debugLog } = await import('../utils/debug');
      // debugLog('AUDIO', 'Attempting to unlock audio...');
      
      if (this.isAudioEnabled && this.audioContext && this.audioContext.state === 'running') {
        // debugLog('AUDIO', 'Audio already unlocked and running');
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
        
        // Resume the audio context (mobile browsers often start in 'suspended' state)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        
        // Play a silent buffer to unlock audio
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        
        // Initialize the central audio engine
        debugLog('AUDIO', 'Initializing the central audio engine...');
        try {
          const audioEngine = (await import('./audio-engine.js')).default;
          await audioEngine.initialize();
          debugLog('AUDIO', 'Central audio engine initialized successfully');
        } catch (engineError) {
          console.error('Failed to initialize central audio engine:', engineError);
        }
        
        this.isAudioEnabled = true;
        debugLog('AUDIO', 'Audio unlocked successfully');
        
        // Special handling for Android Chrome
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
          
          // Apply Android-specific optimizations
          this.initAndroidAudio();
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
    
    // initAudio method removed - functionality moved into unlockAudio
    
    
    /**
     * Special handling for Android Chrome
     * No longer creates a separate audio context but ensures the central audio engine works well on Android
     */
    async initAndroidAudio() {
      // Import debug utils for consistent logging
      const { debugLog } = await import('../utils/debug');
      debugLog('AUDIO', 'Applying Android-specific audio optimizations');
      
      try {
        // Import the central audio engine and Tone.js dynamically
        const [audioEngineModule, ToneModule] = await Promise.all([
          import('./audio-engine.js'),
          import('tone')
        ]);
        const audioEngine = audioEngineModule.default;
        const Tone = ToneModule;
        
        // Make sure Tone.js is initialized and running on Android
        const toneContext = Tone.getContext().rawContext;
        debugLog('AUDIO', `Tone.js audio context state: ${toneContext.state}`);
        
        // Force resume the Tone.js context if needed
        if (toneContext.state === 'suspended') {
          debugLog('AUDIO', 'Attempting to resume Tone.js audio context for Android');
          await toneContext.resume();
          debugLog('AUDIO', 'Tone.js audio context resumed for Android');
        }
        
        // Additional Android-specific settings can be applied here if needed
        // For example, lower latency settings for Tone.js on Android
        
        debugLog('AUDIO', 'Android audio optimizations applied successfully');
        this.isAudioEnabled = true;
      } catch (error) {
        console.error('Failed to apply Android audio optimizations:', error);
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
          return;
        }
      }
      
      // Resume audio context if it's suspended (needed for Chrome on Android)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        console.log('AUDIODEBUG: Audio context suspended in playSound, attempting to resume');
        this.audioContext.resume().then(() => {
          console.log('AUDIODEBUG: Audio context resumed successfully in playSound');
        });
      }
      
      try {
        // Parse the sound identifier
        if (sound.startsWith('pitch_') || sound.startsWith('sound_')) {
          // Extract the note name and play it with consistent sound for both pitch_ and sound_ prefixes
          const noteName = sound.split('_')[1].toUpperCase();
          console.log(`AUDIODEBUG: Playing ${sound} as tone with frequency for ${noteName}`);
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
     * Check if device is an iPad
     * @returns {boolean} True if iPad
     */
    isIpad() {
      return navigator.userAgent.match(/iPad/i) !== null;
    },
  
    /**
     * Check if running in Android native app context
     * @returns {boolean} True if Android app
     */
    isAndroidApp() {
      const isAndroid = /Android/.test(navigator.userAgent);
      // Zusätzliche Prüfung für Android App vs. Android Browser
      // In der App ist typischerweise window.isNativeApp gesetzt
      return isAndroid && (window.isNativeApp === true);
    },
  
    /**
     * Check if running in iOS native app context
     * @returns {boolean} True if iOS app
     */
    isIOSApp() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      // Zusätzliche Prüfung für iOS App vs. Safari Browser
      // In der App ist typischerweise window.isNativeApp gesetzt
      return isIOS && (window.isNativeApp === true);
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
    },
    
    /**
     * Prüft, ob der Benutzer genügend Referrals hat, um das Akkorde-Kapitel freizuschalten
     * Wird nach erfolgreicher Registrierung und beim App-Start aufgerufen
     */
    checkChapterUnlock() {
      // Ein Benutzer bekommt das Chord-Kapitel freigeschaltet, wenn er mindestens 3 erfolgreiche Referrals hat
      const minReferrals = 3;
      
      // Prüfen, ob die Bedingungen erfüllt sind
      if (this.referralCount >= minReferrals) {
        this.areAllActivitiesUnlocked = true;
        this.saveReferralData(); // Freischaltung speichern
      }
    },
    
    /**
     * Speichert die Referral-Daten im localStorage
     */
    saveReferralData() {
      try {
        // Referral-Link generieren, falls noch nicht vorhanden
        if (this.referralCode && !this.referralLink) {
          this.generateReferralLink();
        }
        
        const referralData = {
          isUsernameLocked: this.isUsernameLocked,
          lockedUsername: this.lockedUsername,
          referralCode: this.referralCode,
          referralCount: this.referralCount,
          referralClickCount: this.referralClickCount || 0,
          referralLink: this.referralLink || '',
          areAllActivitiesUnlocked: this.areAllActivitiesUnlocked,
          // Wichtig: referredBy und referrerUsername speichern
          referredBy: this.referredBy || '',
          referrerUsername: this.referrerUsername || ''
        };
        localStorage.setItem('lalumo_referral', JSON.stringify(referralData));
        console.log('Saved referral data:', referralData);
      } catch (error) {
        console.error('Error saving referral data:', error);
      }
    },
    
    /**
     * Generiert einen teilbaren Referral-Link
     */
    generateReferralLink() {
      if (!this.referralCode) {
        console.error('[REFERRAL] Kein Referral-Code vorhanden!');
        return '';
      }
      
      // Link zum Backend-Endpoint generieren (wichtig: ?code= Format für Klickzählung)
      // Stelle sicher, dass der Pfad korrekt ist und kein doppeltes /api/ enthält
      let apiBaseUrl = config.API_BASE_URL;
      
      // In der lokalen Entwicklungsumgebung apiBaseUrl anpassen
      const isProduction = window.location.hostname === 'lalumo.eu' || 
                        window.location.hostname === 'lalumo.z11.de';
      
      console.log('[REFERRAL] Environment:', isProduction ? 'production' : 'development');
      console.log('[REFERRAL] Original API_BASE_URL:', apiBaseUrl);
      
      // Stelle sicher, dass der Pfad zum Referral-Endpoint korrekt ist
      let referralEndpoint = '/referral.php';
      // For local development, we want to use /referral.php directly, not /api/referral.php
      
      this.referralLink = `${apiBaseUrl}${referralEndpoint}?code=${this.referralCode}`;
      console.log('[REFERRAL] Generierter Link:', this.referralLink);
      
      return this.referralLink;
    },
    
    /**
     * Kopiert den Referral-Link in die Zwischenablage
     */
    copyReferralLink() {
      if (!this.referralLink) {
        // Wenn kein Link im State, neu generieren
        this.generateReferralLink();
      }
      
      this.copyToClipboard(this.referralLink, '.referral-link-container .secondary-button');
    },
    
    /**
     * Kopiert Text in die Zwischenablage und zeigt Feedback-Animation an
     * @param {string} text - Der zu kopierende Text
     * @param {string} buttonSelector - CSS-Selektor für den Button, der die Animation zeigen soll
     */
    copyToClipboard(text, buttonSelector) {
      console.log('[CLIPBOARD] Versuche zu kopieren:', text);
      
      try {
        // Moderne Clipboard API verwenden
        navigator.clipboard.writeText(text)
          .then(() => {
            console.log('[CLIPBOARD] Text erfolgreich kopiert');
            this.showCopyFeedback(buttonSelector, true);
          })
          .catch(err => {
            console.error('[CLIPBOARD] Clipboard-API-Fehler:', err);
            // Fallback zur alten Methode
            this.copyToClipboardFallback(text, buttonSelector);
          });
      } catch (e) {
        console.error('[CLIPBOARD] Fehler beim Kopieren:', e);
        this.copyToClipboardFallback(text, buttonSelector);
      }
    },
    
    /**
     * Fallback-Methode für ältere Browser, die die Clipboard API nicht unterstützen
     */
    copyToClipboardFallback(text, buttonSelector) {
      try {
        // Temporäres Textarea-Element erstellen
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '0';
        textArea.style.top = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        
        // Text auswählen und kopieren
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Feedback anzeigen
        this.showCopyFeedback(buttonSelector, successful);
        
        if (!successful) {
          console.error('[CLIPBOARD] execCommand copy fehlgeschlagen');
          alert(this.$store.strings?.copy_failed || 'Kopieren fehlgeschlagen. Bitte manuell kopieren.');
        }
      } catch (e) {
        console.error('[CLIPBOARD] Fallback-Fehler:', e);
        alert(this.$store.strings?.copy_failed || 'Kopieren fehlgeschlagen. Bitte manuell kopieren.');
      }
    },
    
    /**
     * Zeigt Feedback-Animation an, wenn Text kopiert wurde
     */
    showCopyFeedback(buttonSelector, success) {
      const button = document.querySelector(buttonSelector);
      if (!button) return;
      
      // Kurze visuelle Bestätigung durch CSS-Klasse
      const originalText = button.textContent;
      button.classList.add(success ? 'copy-success' : 'copy-error');
      button.textContent = success ? (this.$store.strings?.copied || 'Kopiert!') : (this.$store.strings?.copy_failed_short || 'Fehler!');
      
      // Nach kurzer Zeit zurücksetzen
      setTimeout(() => {
        button.classList.remove('copy-success', 'copy-error');
        button.textContent = originalText;
      }, 2000);
    },
    
    // Statusvariablen für UI-Feedback
    isRegistering: false,         // Ob gerade eine Registrierung läuft
    registrationMessage: '',      // Feedback-Nachricht für die Registrierung
    registrationSuccess: false,   // Ob die Registrierung erfolgreich war
    registrationError: false,     // Ob ein Fehler bei der Registrierung aufgetreten ist
    generatedPassword: '',        // Das generierte Passwort bei erfolgreicher Registrierung
    referralClickCount: 0,        // Anzahl der Klicks auf den Referral-Link
    
    /**
     * Fixiert den Benutzernamen und sendet ihn an den Server,
     * um einen Referral-Code zu erhalten
     */
    async lockUsername() {
      if (!this.username) {
        console.error('Kein Benutzername gesetzt!');
        return;
      }
      
      // Reset vorheriger Meldungen
      this.registrationMessage = '';
      this.registrationSuccess = false;
      this.registrationError = false;
      this.generatedPassword = '';
      
      // Lade-Status aktivieren
      this.isRegistering = true;
      
      try {
        console.log('Username wird gelockt und Referral-Code wird generiert...');
        
        // API endpoint URL (relative to the app root)
        const apiUrl = `${config.API_BASE_URL}/referral.php`;
        
        // GET-Anfrage an den Server senden mit Parametern in der URL
        const params = new URLSearchParams({
            username: this.username,
            action: 'lockUsername'
        });
        
        // referredBy nur hinzufügen, wenn tatsächlich ein Code vorhanden ist
        if (this.referredBy) {
          params.append('referredBy', this.referredBy);
          console.log('[REFERRAL] Sending referredBy code:', this.referredBy);
        } else {
          console.log('[REFERRAL] No referral code to send');
        }
        
        const fullUrl = `${apiUrl}?${params.toString()}`;
        console.log('Vollständige GET-Request URL:', fullUrl);
        
        const response = await fetch(fullUrl, {
          method: 'GET'
        });
        
        // Antwort verarbeiten
        let data;
        let rawResponse;
        
        try {
            // Zuerst den Rohtext der Antwort holen
            rawResponse = await response.text();
            console.log('Rohtext der Server-Antwort:', rawResponse);
            
            // Dann als JSON parsen
            data = JSON.parse(rawResponse);
        } catch (error) {
            console.error('Fehler beim Parsen der JSON-Antwort:', error);
            console.error('Ungültiger Rohtext der Server-Antwort:', rawResponse);
            throw new Error('Fehler beim Registrieren: ' + error.message);
        }
        
        if (data.success) {
          // Referral-Code und fixierten Username speichern
          this.isUsernameLocked = true;
          this.lockedUsername = this.username;
          this.referralCode = data.referralCode;
          
          // Passwort speichern, falls zurückgegeben
          if (data.password) {
            this.generatedPassword = data.password;
          }
          
          // Erfolg anzeigen
          this.registrationSuccess = true;
          this.registrationMessage = this.$store.strings?.registration_success || 'Username successfully registered!';
          
          // Daten im localStorage speichern
          this.saveReferralData();
          
          // Referral-Statistiken abrufen
          this.fetchReferralCount();
          
          // Prüfen, ob der Benutzer genügend Referrals hat, um das Chords-Kapitel freizuschalten
          this.checkChapterUnlock();
        } else if (data.error) {
          // Fehler anzeigen
          this.registrationError = true;
          
          // Spezifische Fehlermeldungen
          if (data.error === 'username_exists') {
            this.registrationMessage = this.$store.strings?.username_exists || 'This username is already registered. Please choose a different name.';
          } else {
            this.registrationMessage = data.message || (this.$store.strings?.registration_error || 'An error occurred. Please try again later.');
          }
        }
      } catch (error) {
        console.error('Fehler beim Registrieren:', error);
        this.registrationError = true;
        this.registrationMessage = this.$store.strings?.registration_error || 'An error occurred. Please try again later.';
      } finally {
        // Lade-Status beenden
        this.showToast(this.registrationMessage);
        this.isRegistering = false;
      }
    },
    
    /**
     * Teilt den Referral-Code über die native Share-API
     */
    shareReferralCode() {
      if (!this.referralCode) {
        console.error('Kein Referral-Code vorhanden!');
        return;
      }
      
      const shareText = `${this.$store.strings?.share_text || 'Try Lalumo and use my referral code'}: ${this.referralCode}`;
      
      // Web Share API verwenden, wenn verfügbar
      if (navigator.share) {
        navigator.share({
          title: this.$store.strings?.share_title || 'Lalumo Referral Code',
          text: shareText,
          url: window.location.href
        }).then(() => {
          console.log('Erfolgreich geteilt');
        }).catch((error) => {
          console.error('Fehler beim Teilen:', error);
        });
      } else {
        // Fallback für Browser ohne Share API
        this.copyReferralCode();
        alert(this.$store.strings?.share_fallback || 'The referral code has been copied to your clipboard. Share it with your friends!');
      }
    },
    
    /**
     * Übersetzt Referral-Nachrichtencodes in lokalisierte Strings basierend auf der aktuellen Sprache
     * @param {string} messageCode - Der Nachrichtencode aus der API-Antwort
     * @returns {string} Lokalisierter Text 
     */
    translateReferralMessage(messageCode) {
      // Mapping von API-Nachrichtencodes zu $store.strings-Schlüsseln
      const messageKeyMap = {
        'invalid_referral_code': 'invalid_code',
        'you_cannot_redeem_your_own_referral_code': 'own_code_error',
        'code_successfully_redeemed': 'code_redeemed',
        'username_required': 'username_required',
        'username_exists': 'username_exists',
        'user_creation_failed': 'user_creation_failed',
        'database_error': 'database_error',
        'invalid_get_parameters': 'invalid_parameters',
        'method_not_allowed': 'method_not_allowed',
        'redeem_failed': 'redeem_error',
        'code_not_found': 'code_not_found',
        'already_redeemed': 'already_redeemed'
      };
      
      // Übersetzten String zurückgeben oder den Fehlercode als Fallback
      const storeKey = messageKeyMap[messageCode];
      return this.$store.strings[storeKey] || this.$store.strings.unknown_error;
    },
    
    /**
     * Löst einen Freundes-Referral-Code ein
     */
    async redeemFriendCode() {
      console.warn('[REDEEM] redeemFriendCode-Methode verwendet.');
      if (!this.friendCode) {
        console.error('Kein Freundes-Code eingegeben!');
        return;
      }
      
      // Normalisierte Version erstellen (entferne Bindestriche und Leerzeichen)
      let normalizedCode = this.friendCode.replace(/[-\s]+/g, '').toUpperCase();
      
      // Flexiblere Code-Format-Validierung (mindestens 8 alphanumerische Zeichen)
      const codePattern = /^[A-Z0-9]{8,}$/;
      if (!codePattern.test(normalizedCode)) {
        console.error('[REDEEM] Invalid referral code format!, original: ' + this.friendCode + ", normalized: " + normalizedCode);
        alert(this.$store.strings?.invalid_code || 'Invalid referral code format. Please check and try again.');
        return;
      }
      
      console.log('[REDEEM] Normalized code: ' + normalizedCode);
      
      console.log('[REDEEM] Code format valid - normalized: ' + normalizedCode);
      
      // Prüfen, ob der Benutzer seinen eigenen Code einlösen versucht
      if (this.friendCode === this.referralCode) {
        alert(this.$store.strings?.own_code_error || 'You cannot redeem your own referral code!');
        return;
      }
      
      try {
        // API endpoint URL (relative to the app root)
        const apiUrl = `${config.API_BASE_URL}/referral.php`;
        
        // POST-Anfrage an den Server senden
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.lockedUsername || this.username,
            redeemCode: this.friendCode
          })
        });
        
        // HTTP-Status prüfen
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 403) {
            // 403 Forbidden - Benutzer versucht, eigenen Code einzulösen
            const errorMessage = this.translateReferralMessage(data.error || 'you_cannot_redeem_your_own_referral_code');
            alert(errorMessage);
            return;
          } else {
            // Andere API-Fehler
            const errorMessage = this.translateReferralMessage(data.error || 'redeem_failed');
            alert(errorMessage);
            return;
          }
        }
        
        // Erfolgreiche Antwort verarbeiten
        const data = await response.json();
        
        if (data.success) {
          // Aktualisierte Referral-Anzahl speichern
          if (data.referralCount) {
            this.referralCount = data.referralCount;
          } else {
            // Falls keine zurückgeliefert wird, lokal erhöhen
            this.referralCount += 1;
          }
          
          // Akkorde-Kapitel freischalten, wenn 3 oder mehr Referrals erreicht
          if (this.referralCount >= 3) {
            this.areAllActivitiesUnlocked = true;
          }
          
          // Daten speichern
          this.saveReferralData();
          
          // UI-Feedback
          this.friendCode = ''; // Eingabefeld zurücksetzen
          const successMessage = this.translateReferralMessage(data.message || 'code_successfully_redeemed');
          alert(successMessage);
          
          // Statistiken aktualisieren
          this.fetchReferralCount();
        } else if (data.error) {
          // Fehlermeldung anzeigen
          let errorMessage = data.message || (this.$store.strings?.redeem_error || 'Error redeeming code. Please try again.');
          
          // Spezifische Fehlermeldungen
          if (data.error === 'own_code') {
            errorMessage = this.$store.strings?.own_code_error || 'You cannot redeem your own referral code!';
          } else if (data.error === 'code_not_found') {
            errorMessage = this.$store.strings?.code_not_found || 'This referral code was not found.';
          } else if (data.error === 'already_redeemed') {
            errorMessage = this.$store.strings?.already_redeemed || 'You have already redeemed this code.';
          }
          
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Fehler beim Einlösen des Codes:', error);
        alert(this.$store.strings?.redeem_error || 'Error redeeming code. Please try again.');
      }
    },
    
    /**
     * Handle cheatcodes for setting specific activity progress
     * 
     * FORMAT: <activity_id>:<progress-level>[<prefix><secondary-value>]
     * 
     * AVAILABLE CHEATCODES:
     * 
     * 1. General activity progress:
     *    - 1_1:XX - Sets high-or-low progress to XX (lalumo_progress_high_or_low)
     *    - 1_2:XX - Sets match sounds progress to XX (stored in lalumo_progress_match)
     *    - 1_3:XX - Sets draw melody progress to XX (stored in lalumo_draw_melody_level)
     *    - 1_4:XX - Sets sound judgment progress to XX (stored in lalumo_soundJudgmentLevel)
     *    - 1_5:XX - Sets memory game progress to XX (stored in lalumo_memory_level)
     *    - 2_1:XX - Sets chord color matching progress to XX (stored in lalumo_chords_progress JSON)
     *    - 2_2:XX - Sets chord Stable Or Instable progress to XX (stored in lalumo_chords_progress JSON)
     *    - 2_3:XX - Sets chord building progress to XX (stored in lalumo_chords_progress JSON)
     *    - 2_4:XX - Sets chord missing note progress to XX (stored in lalumo_chords_progress JSON)
     *    - 2_5:XX - Sets chord character matching progress to XX (stored in lalumo_chords_progress JSON)
     *    - 2_6:XX - Sets harmony gardens progress to XX (stored in lalumo_chords_progress JSON)
     * 
     * 2. Combined values (with secondary values):
     *    - 1_3:5s3 - Sets draw melody level to 5 and success counter to 3
     *    - 1_2:8d3 - Sets match sounds progress to 8 and difficulty to 3
     *    - 1_4:6s10 - Sets sound judgment level to 6 and streak to 10
     * 
     * 3. Multiple cheats at once (comma separated):
     *    - 2_5:30,1_5:8 - Sets chord character matching to 30 and memory game to 8
     * 
     * @param {string} code - The cheatcode string
     * @returns {boolean} - Success status
     */
    handleCheatcode(code) {
      try {
        debugLog(['CHEATCODE'], `: Processing cheatcode: ${code}`);
        
        if (!code) return false;
        
        // Handle comma-separated multiple cheatcodes
        if (code.includes(',')) {
          const codes = code.split(',');
          let allSuccess = true;
          
          debugLog(['CHEATCODE'], `: Processing multiple cheatcodes: ${codes.join(', ')}`);
          
          // Process each cheatcode
          codes.forEach(singleCode => {
            if (!this.handleCheatcode(singleCode.trim())) {
              allSuccess = false;
            }
          });
          
          return allSuccess;
        }
        
        // Process single cheatcode
        const parts = code.trim().split(':');
        if (parts.length !== 2) {
          debugLog(['CHEATCODE'], `Invalid cheatcode format: ${code}. Use <activity_id>:<progress-level>`);
          alert('Invalid cheatcode format. Use <activity_id>:<progress-level>');
          return false;
        }
        
        const activityId = parts[0].trim();
        const progressPart = parts[1].trim();
        
        // Determine if we have a secondary value with prefix
        let progressValue = parseInt(progressPart, 10);
        let secondaryKey = null;
        let secondaryValue = null;
        
        // Check for secondary value with one-letter prefix
        const secondaryMatch = progressPart.match(/^(\d+)([a-z])(\d+)$/);
        if (secondaryMatch) {
          progressValue = parseInt(secondaryMatch[1]);
          secondaryKey = secondaryMatch[2];
          secondaryValue = parseInt(secondaryMatch[3]);
          debugLog(['CHEATCODE'], `: Detected secondary value: primary=${progressValue}, secondary key=${secondaryKey}, secondary value=${secondaryValue}`);
        } else {
          // Ensure progressValue is a number
          progressValue = parseInt(progressValue);
          if (isNaN(progressValue)) {
            debugLog(['CHEATCODE'], ` Invalid progress value: ${progressPart}`);
            alert('Invalid progress value in cheatcode');
            return false;
          }
          debugLog(['CHEATCODE'], `: Simple progress value: ${progressValue}`);
        }
        
        // Handle different activity types
        if (activityId.startsWith('2_')) {
          // For chord activities
          let chordsProgressData = {};
          const existingChordsData = localStorage.getItem('lalumo_chords_progress');
          debugLog(['CHEATCODE'], `: Current chord progress data: ${existingChordsData}`);
          
          if (existingChordsData) {
            try {
              chordsProgressData = JSON.parse(existingChordsData);
            } catch(e) {
              debugLog(['CHEATCODE'], ` Error parsing existing chords progress data:`, e);
            }
          }
          
          // Special handling for 2_5 activity
          if (activityId === '2_5' || activityId === '2_5_chords_characters') {
            // Always update the 2_5_chords_characters key for this activity
            chordsProgressData['2_5_chords_characters'] = progressValue;
            debugLog(['CHEATCODE'], `: Setting 2_5_chords_characters progress to ${progressValue}`);
            debugLog(['CHEATCODE', '2_5'], `Setting 2_5_chords_characters progress to ${progressValue}`);
            
            // Handle secondary value if present
            if (secondaryKey && secondaryValue !== null) {
              debugLog(['CHEATCODE'], ` Activity ${activityId} does not support secondary values`);
            }
          } 
          // Special handling for 2_2 activity
          else if (activityId === '2_2' || activityId === '2_2_chords_stable_instable') {
            // Always update the 2_2_chords_stable_instable key for this activity
            chordsProgressData['2_2_chords_stable_instable'] = progressValue;
            debugLog(['CHEATCODE'], `: Setting 2_2_chords_stable_instable progress to ${progressValue}`);
            debugLog(['CHEATCODE', '2_2_PROGRESS'], `Setting 2_2_chords_stable_instable progress to ${progressValue}`);
            
            // Handle secondary value if present
            if (secondaryKey && secondaryValue !== null) {
              debugLog(['CHEATCODE'], ` Activity ${activityId} does not support secondary values`);
            }
          } else {
            // Generic chord activity
            chordsProgressData[activityId] = progressValue;
            debugLog(['CHEATCODE'], `: Setting chord activity ${activityId} progress to ${progressValue}`);
          }
          
          // Save updated chords progress
          const updatedChordsData = JSON.stringify(chordsProgressData);
          localStorage.setItem('lalumo_chords_progress', updatedChordsData);
          debugLog(['CHEATCODE'], `: Updated chord progress in localStorage: lalumo_chords_progress = ${updatedChordsData}`);
        } else if (activityId.startsWith('1_')) {
          // For pitch activities - handle each one specifically
          if (activityId === '1_1') { // High or low
            localStorage.setItem('lalumo_progress_high_or_low', progressValue);
            debugLog(['CHEATCODE'], `: Set localStorage: lalumo_progress_high_or_low = ${progressValue}`);
          } else if (activityId === '1_2') { // Match sounds activity
            localStorage.setItem('lalumo_progress_match', progressValue);
            debugLog(['CHEATCODE'], `: Set localStorage: lalumo_progress_match = ${progressValue}`);
            
            if (secondaryKey && secondaryValue !== null) {
              if (secondaryKey === 'd') { // d for difficulty
                localStorage.setItem('lalumo_difficulty', secondaryValue);
                debugLog(['CHEATCODE'], `: Set localStorage: lalumo_difficulty = ${secondaryValue}`);
              } else {
                debugLog(['CHEATCODE'], `Unknown secondary key ${secondaryKey} for activity ${activityId}`);
              }
            }
          } else if (activityId === '1_3') { // Draw melody activity
            localStorage.setItem('lalumo_draw_melody_level', progressValue);
            debugLog(['CHEATCODE'], `: Set localStorage: lalumo_draw_melody_level = ${progressValue}`);
            
            if (secondaryKey && secondaryValue !== null) {
              if (secondaryKey === 's') { // s for success counter
                localStorage.setItem('lalumo_draw_melody_success_counter', secondaryValue);
                debugLog(['CHEATCODE'], `: Set localStorage: lalumo_draw_melody_success_counter = ${secondaryValue}`);
              } else {
                debugLog(['CHEATCODE'], `Unknown secondary key ${secondaryKey} for activity ${activityId}`);
              }
            }
          } else if (activityId === '1_4') { // Sound judgment activity
            localStorage.setItem('lalumo_soundJudgmentLevel', progressValue);
            debugLog(['CHEATCODE'], `: Set localStorage: lalumo_soundJudgmentLevel = ${progressValue}`);
            
            if (secondaryKey && secondaryValue !== null) {
              if (secondaryKey === 's') { // s for streak
                localStorage.setItem('lalumo_soundJudgmentStreak', secondaryValue);
                debugLog(['CHEATCODE'], `: Set localStorage: lalumo_soundJudgmentStreak = ${secondaryValue}`);
              } else {
                debugLog(['CHEATCODE'], `Unknown secondary key ${secondaryKey} for activity ${activityId}`);
              }
            }
          } else if (activityId === '1_5') { // Memory game
            localStorage.setItem('lalumo_memory_level', progressValue);
            debugLog(['CHEATCODE'], `: Set localStorage: lalumo_memory_level = ${progressValue}`);
          } else {
            debugLog(['CHEATCODE'], `Unknown pitch activity: ${activityId}`);
            alert(`Unknown pitch activity ID: ${activityId}`);
            return false;
          }
        } else {
          // Unknown activity type
          debugLog(['CHEATCODE'], `Unknown activity ID format: ${activityId}`);
          alert(`Unknown activity ID format: ${activityId}`);
          return false;
        }
        
        // Update UI and show feedback
        debugLog(['CHEATCODE'], `Cheatcode successfully applied for ${activityId}=${progressValue}`);
        alert(`Cheatcode applied: ${activityId} set to ${progressValue}. Page will reload.`);
        
        // Simple page reload to refresh all components
        window.location.reload();
        return true;
      } catch(e) {
        debugLog(['CHEATCODE'], `Error processing cheatcode:`, e);
        alert(`Error processing cheatcode: ${e.message}`);
        return false;
      }
    },
  };
}
