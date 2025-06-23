import { debugLog } from '../utils/debug';
import config from '../config.js';

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
    isChordChapterUnlocked: false, // Whether chord chapter is unlocked
    
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
          '2_2_chords_mood-landscapes': 'Mood Landscapes',
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
    
    resetSpeech() {
      // Reset speech synthesis
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    },
    
    /**
     * Referral System Functions
     */
    
    /**
     * Save referral data to localStorage
     */
    saveReferralData() {
      const referralData = {
        isUsernameLocked: this.isUsernameLocked,
        lockedUsername: this.lockedUsername,
        referralCode: this.referralCode,
        referralCount: this.referralCount,
        referralClickCount: this.referralClickCount || 0,
        isChordChapterUnlocked: this.isChordChapterUnlocked,
        referredBy: this.referredBy || ''
      };
      
      localStorage.setItem('lalumo_referral_data', JSON.stringify(referralData));
      console.log('Referral data saved:', referralData);
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
        console.log('[REFERRAL] Kein Username gesperrt, überspringe Abfrage');
        return;
      }
      
      console.log('[REFERRAL] Rufe Statistik für User ab:', this.lockedUsername);
      
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
          console.log('[REFERRAL] registrationCount:', data.registrationCount, 'clickCount:', data.clickCount);
          
          const oldReferralCount = this.referralCount;
          this.referralCount = data.registrationCount || 0;
          this.referralClickCount = data.clickCount || 0;
          
          console.log('[REFERRAL] Werte aktualisiert - Alt:', oldReferralCount, 'Neu:', this.referralCount);
          
          // Speichere aktualisierte Daten im localStorage
          this.saveReferralData();
          
          // Check if the chapter should be unlocked
          if (this.referralCount >= 3 && !this.isChordChapterUnlocked) {
            this.isChordChapterUnlocked = true;
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
            this.showToast('Failed to copy');
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
            // Pitch activities - dispatch the set-pitch-mode event
            console.log('[DEEPLINK] Starting pitch activity:', activityId);
            window.dispatchEvent(new CustomEvent('set-pitch-mode', {
              detail: activityId
            }));
            
            // Focus the navigation button for this activity (if it exists)
            this.$nextTick(() => {
              const navButton = document.getElementById('nav_' + activityId.split('_').slice(0, 2).join('_'));
              if (navButton) navButton.focus();
            });
          } else if (activityId.startsWith('2_')) {
            // Chord activities - dispatch the set-chord-mode event
            console.log('[DEEPLINK] Starting chord activity:', activityId);
            window.dispatchEvent(new CustomEvent('set-chord-mode', {
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
      // We'll initialize audio only on first user interaction
      this.isAudioEnabled = false;
      
      // Initialize Alpine.js store immediately to prevent undefined errors
      window.Alpine.store('strings', {});
      window.Alpine.store('pitchMode', '1_1_pitches_high_or_low');
      
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
        
        // Load referral system data from localStorage
        const savedReferralData = localStorage.getItem('lalumo_referral_data');
        if (savedReferralData) {
          try {
            const referralData = JSON.parse(savedReferralData);
            this.isUsernameLocked = referralData.isUsernameLocked || false;
            this.lockedUsername = referralData.lockedUsername || '';
            this.referralCode = referralData.referralCode || '';
            this.referralCount = referralData.referralCount || 0;
            this.referralClickCount = referralData.referralClickCount || 0;
            this.isChordChapterUnlocked = referralData.isChordChapterUnlocked || false;
            this.referredBy = referralData.referredBy || '';
            console.log('Referral data loaded:', { 
              isUsernameLocked: this.isUsernameLocked,
              lockedUsername: this.lockedUsername,
              referralCode: this.referralCode,
              referralCount: this.referralCount,
              referralClickCount: this.referralClickCount,
              isChordChapterUnlocked: this.isChordChapterUnlocked
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
        
        // Load language preference from localStorage
        const savedLanguage = localStorage.getItem('lalumo_language');
        // If no language is set, try to detect from browser
        if (!savedLanguage) {
          const browserLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
          if (browserLang.startsWith("de")) {
            this.preferredLanguage = "german";
            localStorage.setItem("lalumo_language", "german");
          } else {
            this.preferredLanguage = "english";
            localStorage.setItem("lalumo_language", "english");
          }
          document.documentElement.lang = this.preferredLanguage === "german" ? "de" : "en";
        } else {
          document.documentElement.lang = savedLanguage === "german" ? "de" : "en";
        }
        if (savedLanguage) {
          this.preferredLanguage = savedLanguage;
        } else {
          // Default to English if not set
          localStorage.setItem('lalumo_language', 'english');
        }
        
        // Load menu lock state from localStorage
        const savedMenuLock = localStorage.getItem('lalumo_menu_locked');
        if (savedMenuLock === 'true') {
          this.menuLocked = true;
        }
        
        // Load referral data from localStorage
        const referralData = localStorage.getItem('lalumo-referral');
        if (referralData) {
          try {
            const data = JSON.parse(referralData);
            this.isUsernameLocked = data.isUsernameLocked || false;
            this.lockedUsername = data.lockedUsername || '';
            this.referralCode = data.referralCode || '';
            this.referralCount = data.referralCount || 0;
            this.referralClickCount = data.referralClickCount || 0;
            this.isChordChapterUnlocked = data.isChordChapterUnlocked || false;
            
            console.log('Loaded referral data:', data);
            
            // Aktualisiere die Daten vom Server, wenn ein Benutzername gesperrt ist
            if (this.isUsernameLocked && this.lockedUsername) {
              console.log('[REFERRAL] Aktualisiere Referral-Daten vom Server...');
              // Verzögern für die Stabilität der Netzwerkanfrage
              setTimeout(() => this.fetchReferralCount(), 1000);
            }
          } catch (parseError) {
            console.error('Error parsing referral data:', parseError);
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
            console.log('Error notifying Android about menu lock state', androidError);
          }
        }
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
      // Reset exportedData vor jedem neuen Export
      this.exportedData = '';
      
      try {
        console.log('Starte Export des Fortschritts...');
        
        // Lese den aktuellen Fortschritt aus dem localStorage
        const pitchProgressRaw = localStorage.getItem('lalumo_progress') || '{}';
        console.log('Roher Fortschritt aus localStorage:', pitchProgressRaw);
        
        let pitchProgress = JSON.parse(pitchProgressRaw);
        console.log('Geparster Fortschritt:', pitchProgress);
        
        // Prüfe auf freigeschaltete Features für bessere Diagnose
        let unlockedFeatures = [];
        
        // Prüfe auf freigeschaltete Welle in 1_2
        if (pitchProgress && pitchProgress['1_2_pitches_match-sounds'] && 
            pitchProgress['1_2_pitches_match-sounds'] >= 5) {
          unlockedFeatures.push('Wave mode in "Match Sounds"');
        }

        // Sammle alle Fortschrittsdaten
        const progressData = {
          username: this.username || 'Player',
          lastSaved: new Date().toISOString(),
          pitchProgress: pitchProgress, // Direkt als Objekt speichern, keine erneute JSON-Konvertierung
          memoryGameLevel: parseInt(localStorage.getItem('lalumo_memory_level') || '0', 10),
          lastActivity: this.active,
          unlockedFeatures: unlockedFeatures, // Speichere freigeschaltete Features für bessere Diagnose
          
          // Speichere Draw-a-Melody spezifische Fortschrittsdaten
          drawMelodyLevel: parseInt(localStorage.getItem('lalumo_draw_melody_level') || '0', 10),
          drawMelodySuccessCounter: parseInt(localStorage.getItem('lalumo_draw_melody_success_counter') || '0', 10),
          
          // Speichere Sound-Judgment ("Does It Sound Right?") spezifische Fortschrittsdaten
          soundJudgmentLevel: parseInt(localStorage.getItem('lalumo_soundJudgmentLevel') || '1', 10),
          soundJudgmentStreak: parseInt(localStorage.getItem('lalumo_soundJudgmentStreak') || '0', 10)
        };
        
        // Konvertieren zu JSON und codieren für Export
        const jsonString = JSON.stringify(progressData);
        console.log('JSON-String für Export:', jsonString);
        
        const encoded = btoa(jsonString);
        console.log('Kodierter String:', encoded, 'Länge:', encoded.length);
        
        if(!encoded || encoded.length === 0) {
          console.error('Kodierter String ist leer');
          alert('Error exporting progress: encoded string is empty');
          return null;
        }
        
        // Alpine.js Reaktivität erzwingen mit Timeout
        setTimeout(() => {
          // Set the exportedData property for display in the UI
          this.exportedData = encoded;
          console.log('ExportedData wurde gesetzt auf:', this.exportedData);
          
          // Log für bessere Diagnose
          console.log('Progress exported successfully with these features:', unlockedFeatures);
        }, 10);
        
        return encoded;
      } catch (e) {
        console.error('Fehler beim Exportieren:', e);
        alert('Error exporting progress: ' + e.message);
        return null;
      }
    },
    
    /**
     * Stoppt alle aktiven Oszillatoren, um Audio-Konflikte zu vermeiden
     */
    stopAllOscillators() {
      // Stop all active oscillators
      if (this.activeOscillators && this.activeOscillators.length > 0) {
        console.log(`Stopping ${this.activeOscillators.length} active oscillators`);
        
        // Stop all active oscillators immediately
        this.activeOscillators.forEach(osc => {
          try {
            osc.stop(0); // Stop immediately
            osc.disconnect();
          } catch (e) {
            // Ignore errors from already stopped oscillators
            console.log('Error stopping oscillator, may already be stopped');
          }
        });
        
        // Clear the list
        this.activeOscillators = [];
      }
      
      // Also clear current tone timeout
      if (this.currentToneTimeout) {
        clearTimeout(this.currentToneTimeout);
        this.currentToneTimeout = null;
      }
      
      // Sequence timeouts handling removed (reverted to pre-e5a7f41f version)
    },
    
    /**
     * Copy the exported progress code to the clipboard
     */
    /**
     * Kopiert beliebigen Text in die Zwischenablage
     * @param {string} text - Der zu kopierende Text (optional, verwendet this.exportedData wenn nicht angegeben)
     * @param {boolean} showAlert - Ob eine Bestätigung angezeigt werden soll (default: true)
     */
    copyToClipboard(text, showAlert = true) {
      // Den zu kopierenden Text bestimmen
      const contentToCopy = text || this.exportedData;
      
      // Prüfen, ob überhaupt etwas zu kopieren ist
      if (!contentToCopy) {
        console.error('Nichts zu kopieren - kein Text angegeben');
        if (showAlert) {
          alert('No data to copy.');
        }
        return;
      }
      
      console.log('Versuche zu kopieren:', contentToCopy);
      
      try {
        // Moderne Clipboard API verwenden, wenn verfügbar
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(contentToCopy)
            .then(() => {
              console.log('Text copied to clipboard using Clipboard API!');
              if (showAlert) {
                alert('Copied to clipboard!');
              }
            })
            .catch(err => {
              console.error('Clipboard API failed:', err);
              // Fallback zur alten Methode
              this.copyToClipboardFallback(contentToCopy, showAlert);
            });
        } else {
          // Fallback für ältere Browser
          this.copyToClipboardFallback(contentToCopy, showAlert);
        }
      } catch (e) {
        console.error('Failed to copy to clipboard:', e);
        if (showAlert) {
          alert('Failed to copy. Please select and copy the text manually.');
        }
      }
    },
    
    /**
     * Fallback-Methode zum Kopieren in die Zwischenablage für ältere Browser
     * @param {string} text - Der zu kopierende Text
     * @param {boolean} showAlert - Ob eine Bestätigung angezeigt werden soll
     */
    copyToClipboardFallback(text, showAlert = true) {
      // Fallback-Methode für ältere Browser
      try {
        // Temporäres Textfeld erstellen
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed'; // Verhindern, dass ein Scrolling verursacht wird
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px'; // Außerhalb des sichtbaren Bereichs platzieren
        
        // Zum DOM hinzufügen und auswählen
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        // Kopieren ausführen und Erfolg prüfen
        const success = document.execCommand('copy');
        
        // Aufräumen - Element wieder entfernen
        document.body.removeChild(textarea);
        
        // Erfolgs- oder Fehlermeldung
        if (success) {
          console.log('Text copied to clipboard using fallback!');
          if (showAlert) {
            alert('Copied to clipboard!');
          }
        } else {
          throw new Error('execCommand returned false');
        }
      } catch (e) {
        console.error('Fallback copy failed:', e);
        alert('Could not copy automatically. Please select and copy the text manually.');
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
          alert('Invalid save code. Please check your progress string.');
          return false;
        }
        
        // Restore the username
        this.username = progressData.username;
        localStorage.setItem('lalumo_username', this.username);
        
        // Prepare the unlocked features message
        let unlockedFeatures = [];
        
        // Restore pitch progress
        if (progressData.pitchProgress) {
          // Parse the progress if it's a string, otherwise use directly
          let pitchProgress = typeof progressData.pitchProgress === 'string' 
            ? JSON.parse(progressData.pitchProgress) 
            : progressData.pitchProgress;
          
          // Store as JSON string in localStorage
          localStorage.setItem('lalumo_progress', JSON.stringify(pitchProgress));
          
          // Check for unlocked wave in 1_2
          if (pitchProgress && pitchProgress['1_2_pitches_match-sounds'] && 
              pitchProgress['1_2_pitches_match-sounds'] >= 5) {
            unlockedFeatures.push('Wave mode in "Match Sounds" activity');
          }
          
          // Check other activities progress
          for (const activity in pitchProgress) {
            if (pitchProgress[activity] > 0) {
              // Format activity name for display
              const activityName = activity.split('_').slice(2).join(' ')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
              unlockedFeatures.push(`Progress in ${activityName}: Level ${pitchProgress[activity]}`);
            }
          }
        }
        
        // Restore last activity
        if (progressData.lastActivity) {
          this.active = progressData.lastActivity;
        }
        
        // Restore Draw-a-Melody specific progress data
        if (typeof progressData.drawMelodyLevel !== 'undefined') {
          localStorage.setItem('lalumo_draw_melody_level', progressData.drawMelodyLevel);
          console.log('Restored Draw-a-Melody level:', progressData.drawMelodyLevel);
          
          // Add to unlocked features message
          unlockedFeatures.push(`Draw-a-Melody: Level ${progressData.drawMelodyLevel + 1} (${progressData.drawMelodyLevel + 3} notes)`);
        }
        
        if (typeof progressData.drawMelodySuccessCounter !== 'undefined') {
          localStorage.setItem('lalumo_draw_melody_success_counter', progressData.drawMelodySuccessCounter);
          console.log('Restored Draw-a-Melody success counter:', progressData.drawMelodySuccessCounter);
        }
        
        // Restore Sound Judgment ("Does It Sound Right?") specific progress data
        if (typeof progressData.soundJudgmentLevel !== 'undefined') {
          localStorage.setItem('lalumo_soundJudgmentLevel', progressData.soundJudgmentLevel);
          console.log('SOUND JUDGMENT: Imported level:', progressData.soundJudgmentLevel);
          
          // Add to unlocked features message
          unlockedFeatures.push(`Does It Sound Right?: Level ${progressData.soundJudgmentLevel} (${7-progressData.soundJudgmentLevel} levels to go)`);
        }
        
        if (typeof progressData.soundJudgmentStreak !== 'undefined') {
          localStorage.setItem('lalumo_soundJudgmentStreak', progressData.soundJudgmentStreak);
          console.log('SOUND JUDGMENT: Imported streak counter:', progressData.soundJudgmentStreak);
        }
        
        // Show detailed success message
        let message = `Progress imported successfully for ${this.username}!`;
        
        if (unlockedFeatures.length > 0) {
          message += '\n\nUnlocked features:';
          unlockedFeatures.forEach(feature => {
            message += '\n- ' + feature;
          });
        } else {
          message += '\n\nNo special features unlocked yet.';
        }
        
        alert(message);
        console.log('Imported progress for', this.username, 'with unlocked features:', unlockedFeatures);
        return true;
      } catch (e) {
        alert('Error importing progress. The provided string may be invalid.');
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
      // iOS-Erkennung ist standardmäßig aktiviert
      // Zukünftige Erweiterung: Einstellung über Präferenzen zur Deaktivierung
      
      // Multi-factor iOS detection instead of just User-Agent
      const userAgentHasIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const noAndroid = !/Android/.test(navigator.userAgent);
      const platformCheck = /iPhone|iPad|iPod/.test(navigator.platform);
      
      // Additional platform checks
      // These checks are more reliable on real iOS devices
      let hasIOSPlatformSpecificFeatures = false;
      
      // Check for touch events in iOS specific way
      if (typeof window.TouchEvent !== 'undefined' && 
          typeof window.ontouchstart !== 'undefined' && 
          typeof navigator.maxTouchPoints !== 'undefined' && 
          navigator.maxTouchPoints > 0) {
        hasIOSPlatformSpecificFeatures = true;
      }
      
      // Final iOS determination - multiple factors must be true
      const isIOS = userAgentHasIOS && noAndroid && (platformCheck || hasIOSPlatformSpecificFeatures);
      
      console.log('AUDIO_DEVICE_CHECK: Details', {
        userAgentHasIOS, 
        noAndroid, 
        platformCheck, 
        hasIOSPlatformSpecificFeatures,
        finalDecision: isIOS,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
      
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
        this.isChordChapterUnlocked = true;
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
          isChordChapterUnlocked: this.isChordChapterUnlocked
        };
        localStorage.setItem('lalumo-referral', JSON.stringify(referralData));
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
        console.error('Kein Referral-Code vorhanden!');
        return '';
      }
      
      // Link zum Backend-Endpoint generieren (wichtig: ?code= Format für Klickzählung)
      this.referralLink = `${config.API_BASE_URL}/referral.php?code=${this.referralCode}`;
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
        console.log('Username wird fixiert und Referral-Code wird generiert...');
        
        // API endpoint URL (relative to the app root)
        const apiUrl = `${config.API_BASE_URL}/referral.php`;
        
        // POST-Anfrage an den Server senden
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username
          })
        });
        
        // Antwort verarbeiten
        const data = await response.json();
        
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
          this.registrationMessage = this.$store.strings?.registration_success || 'Username erfolgreich registriert!';
          
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
            this.registrationMessage = this.$store.strings?.username_exists || 'Dieser Benutzername ist bereits registriert. Bitte wähle einen anderen Namen.';
          } else {
            this.registrationMessage = data.message || (this.$store.strings?.registration_error || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
          }
        }
      } catch (error) {
        console.error('Fehler beim Registrieren:', error);
        this.registrationError = true;
        this.registrationMessage = this.$store.strings?.registration_error || 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
      } finally {
        // Lade-Status beenden
        this.isRegistering = false;
      }
    },
    
    /**
     * Kopiert den Referral-Code in die Zwischenablage
     */
    copyReferralCode() {
      if (!this.referralCode) {
        console.error('Kein Referral-Code vorhanden!');
        return;
      }
      
      // Code in die Zwischenablage kopieren
      navigator.clipboard.writeText(this.referralCode)
        .then(() => {
          console.log('Referral-Code in die Zwischenablage kopiert');
          
          // Visuelles Feedback (hier könnte eine UI-Benachrichtigung sein)
          const button = document.querySelector('.referral-code-container .secondary-button');
          if (button) {
            const originalText = button.textContent;
            button.textContent = this.$store.strings?.copied || 'Copied!';
            
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }
        })
        .catch(err => {
          console.error('Fehler beim Kopieren des Referral-Codes:', err);
        });
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
      // Fallback für den Fall, dass kein Store oder keine Strings verfügbar sind
      if (!this.$store || !this.$store.strings) {
        console.warn('[TRANSLATE] $store.strings nicht verfügbar, verwende Fallback-Übersetzungen');
        // Fallback-Übersetzungen
        const fallbackTranslations = {
          'invalid_referral_code': 'Invalid referral code format. Please check and try again.',
          'you_cannot_redeem_your_own_referral_code': 'You cannot redeem your own referral code!',
          'code_successfully_redeemed': 'Friend code redeemed successfully!',
          'username_required': 'Username is required to redeem a code.',
          'username_exists': 'This username is already taken. Please choose another one.',
          'user_creation_failed': 'Failed to create user account. Please try again.',
          'database_error': 'A database error occurred. Please try again later.',
          'invalid_get_parameters': 'Invalid request parameters.',
          'method_not_allowed': 'This request method is not allowed.'
        };
        
        return fallbackTranslations[messageCode] || messageCode || 'An unknown error occurred.';
      }
      
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
        'method_not_allowed': 'method_not_allowed'
      };
      
      // Übersetzten String zurückgeben oder Fallback, wenn nicht gefunden
      const storeKey = messageKeyMap[messageCode];
      return this.$store.strings[storeKey] || messageCode || 'An unknown error occurred.';
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
            this.isChordChapterUnlocked = true;
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
    }
  };
}
