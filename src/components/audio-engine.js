/**
 * Audio-Engine Modul
 * 
 * Zentrale Komponente für alle Audiooperationen in der Lalumo-App.
 * Verwendet Tone.js für qualitativ hochwertige Audiowiedergabe.
 */
import * as Tone from 'tone';
import { debugLog } from '../utils/debug';
import { playToneNote, playViolinNote, playFluteNote, playBrassNote, playDoubleBassNote, isInstrumentReady } from '../utils/toneJsSampler.js';

// Audio-Engine Hauptklasse
export class AudioEngine {
  constructor() {
    // Synthesizer konfigurieren - standardmäßig ein einfacher Synth
    this._synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this._currentInstrument = 'default';
    
    // Status-Variablen
    this._isInitialized = false;
    this._activeSequences = new Map();
    this._notesPlaying = new Set();
    
    // Spezielle Sound-Effekte definieren
    this._specialSounds = {
      'success': {
        notes: ['C4', 'E4', 'G4', 'C5'], 
        durations: [0.15, 0.15, 0.15, 0.4],
        velocity: 0.9
      },
      'try_again': {
        notes: ['E4', 'C4'], 
        durations: [0.25, 0.5],
        velocity: 0.8
      }
    };
    
    // Add cleanup on page unload as additional safety measure
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
    
    // Instrument-Typen, die verwendet werden können
    this._instrumentTypes = {
      default: () => new Tone.PolySynth(Tone.Synth),
      // Piano instrument defined below
      marimba: () => {
        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0,
            release: 0.8
          },
          oscillator: {
            type: "sine"
          }
        });
        return synth;
      },
      piano: () => {
        debugLog('PIANO', 'Creating piano with MP3 samples');
        
        // Create a temporary synth for use while samples load
        const tempSynth = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 12,
          volume: 5,
        }).set({
          oscillator: { 
            type: "triangle8" 
          },
          envelope: {
            attack: 0.004,
            decay: 0.2,
            sustain: 0.2,
            release: 1.5
          }
        });
        
        // Create the reverb effect
        const reverb = new Tone.Reverb({
          decay: 1.8,
          wet: 0.3,
          preDelay: 0.01
        }).toDestination();
        
        // Connect the temp synth to reverb
        tempSynth.connect(reverb);
        
        // Track whether samples are loaded - use global variable to maintain state across calls
        // This fixes the issue with free play mode where new piano instances are created
        if (window._pianoSamplesLoaded === undefined) {
          window._pianoSamplesLoaded = false;
        }
        let samplesLoaded = window._pianoSamplesLoaded;
        
        // Create loading diagnostic display
        debugLog('PIANO', 'Attempting to load piano samples from ./sounds/piano/');
        debugLog('PIANO', `Global samples loaded state: ${samplesLoaded ? 'LOADED' : 'NOT LOADED'}`);
        
        // Force preload samples immediately when instrument is created
        if (!samplesLoaded) {
          // Try preloading common note files directly to warm browser cache
          const preloadUrls = ['C4.mp3', 'D4.mp3', 'E4.mp3', 'G4.mp3', 'A4.mp3'];
          preloadUrls.forEach(url => {
            const audio = new Audio(`./sounds/piano/${url}`);
            audio.preload = 'auto';
            audio.load();
          });
          
          debugLog('PIANO', 'Preloaded sample URLs to warm browser cache');
        }
        
        // Progressive status updates during loading
        if (!samplesLoaded) {
          setTimeout(() => {
            debugLog('PIANO', `Loading status check 1: ${window._pianoSamplesLoaded ? '✅ LOADED' : '⏳ STILL LOADING'}`);
          }, 500);
          
          setTimeout(() => {
            debugLog('PIANO', `Loading status check 2: ${window._pianoSamplesLoaded ? '✅ LOADED' : '⏳ STILL LOADING'}`);
          }, 1000);
        }
        
        // Create the sampler with our piano samples
        const sampler = new Tone.Sampler({
          urls: {
            // We have these MP3 files locally - using all available piano samples
            "C4": "C4.mp3",
            "D4": "D4.mp3",
            "E4": "E4.mp3",
            "F4": "F4.mp3",
            "G4": "G4.mp3",
            "A4": "A4.mp3",
            "B4": "B4.mp3",
          },
          baseUrl: "./sounds/piano/", // Use relative path with ./ prefix to ensure proper resolution
          release: 1.5,
          volume: 10,
          onload: () => { 
            debugLog('PIANO', '🎹 Piano samples loaded successfully!');
            // Update both local and global state to ensure free play mode works
            samplesLoaded = true;
            window._pianoSamplesLoaded = true;
            debugLog('PIANO', 'Global piano sample state set to LOADED');
          },
          onerror: (err) => {
            debugLog(['PIANO', 'ERROR'], `Could not load piano samples: ${err.message || err}`);
            debugLog('PIANO', 'Attempting to load with alternate paths as fallback');
            
            // Try alternative approaches to loading samples
            // First, try direct Audio preloading to force browser cache
            const forcePreloadUrls = ['C4.mp3', 'D4.mp3', 'E4.mp3', 'G4.mp3', 'A4.mp3'];
            forcePreloadUrls.forEach(url => {
              // Try multiple path variations to ensure one works
              ['./sounds/piano/', '/sounds/piano/', '../sounds/piano/'].forEach(basePath => {
                const audio = new Audio(`${basePath}${url}`);
                audio.preload = 'auto';
                audio.load();
                debugLog('PIANO', `Force preloading ${basePath}${url}`);
              });
            });
          }
        }).connect(reverb);
        
        // Create a wrapper that safely handles the loading state
        return {
          triggerAttackRelease: function(note, duration, time, velocity) {
            // Get the current URL to detect the 1_5 memory game activity
            const is1_5Activity = window.location.pathname.includes('/pitches/1_5');
            
            try {
              // First normalize the note name to ensure proper format for Tone.js
              note = note.toString().toUpperCase();
              // Clean up duration and velocity to sensible defaults if missing
              duration = duration || 0.8;
              velocity = velocity || 1.0;
              
              // When in free play or 1_5 activity, boost volume for better sound
              if (velocity < 0.5) velocity = 0.7; // Boost quiet notes
              
              // Check both local and global sample loading state
              // This ensures we catch loading that happened in other piano instances
              const samplesReady = samplesLoaded || window._pianoSamplesLoaded;
              
              // Store the actual ready state of the sampler buffers
              // This is different from the loading flag and ensures we don't try to play before buffers are loaded
              window._pianoSamplesActuallyReady = window._pianoSamplesActuallyReady || false;
              
              try {
                // Test if the sample buffer for C4 is actually loaded and ready
                if (samplesReady && sampler.loaded && sampler.buffers && 
                    sampler.buffers.has('C4') && 
                    sampler.buffers.get('C4').loaded) {
                  window._pianoSamplesActuallyReady = true;
                }
              } catch (e) {
                debugLog('PIANO', `Buffer check failed: ${e.message || e}`);
              }
              
              // Special handling for 1_5 memory game activity - NEVER use fallback synth
              if (is1_5Activity) {
                // In 1_5 activity: Only play if samples are ACTUALLY ready, otherwise silent
                if (samplesReady && window._pianoSamplesActuallyReady) {
                  debugLog(['PIANO', '1_5'], `Playing sampled note: ${note} (dur: ${duration}, vel: ${velocity})`);
                  const scheduledTime = time || Tone.now();
                  sampler.triggerAttackRelease(note, duration, scheduledTime, velocity);
                } else {
                  debugLog(['PIANO', '1_5'], '⚠️ SKIPPING playback - samples not fully ready yet. NO FALLBACK USED.');
                  // Try preloading again if needed
                  if (!window._pianoPreloadAttempted) {
                    window._pianoPreloadAttempted = true;
                    debugLog('PIANO', 'Making one more attempt to preload samples');
                    const audio = new Audio(`./sounds/piano/C4.mp3`);
                    audio.addEventListener('canplaythrough', () => {
                      debugLog('PIANO', 'Preload success!');
                    });
                    audio.load();
                  }
                }
              } else {
                // Normal behavior for other activities - use fallback if needed
                if (samplesReady && window._pianoSamplesActuallyReady) {
                  debugLog('PIANO', `Playing sampled note: ${note} (dur: ${duration}, vel: ${velocity})`);
                  const scheduledTime = time || Tone.now();
                  sampler.triggerAttackRelease(note, duration, scheduledTime, velocity);
                } else {
                  debugLog('PIANO', `Samples not ready yet (global: ${window._pianoSamplesLoaded}, actual: ${window._pianoSamplesActuallyReady}), using temp synth`);
                  tempSynth.triggerAttackRelease(note, duration, time, velocity);
                }
              }
            } catch (err) {
              debugLog(['PIANO', 'ERROR'], `Error in piano playback: ${err.message || err}`);
              
              // Only use fallback if NOT in 1_5 activity
              if (!is1_5Activity) {
                try {
                  debugLog('PIANO', 'Using fallback synth (non-1_5 activity)');
                  tempSynth.triggerAttackRelease(note || "C4", duration || 0.5, time, velocity || 0.8);
                } catch (finalErr) {
                  debugLog(['PIANO', 'ERROR'], `Even fallback failed: ${finalErr.message || finalErr}`);
                }
              }
            }
          },
          connect: function(destination) {
            reverb.connect(destination);
            return this;
          },
          disconnect: function() {
            reverb.disconnect();
            return this;
          },
          toDestination: function() {
            return this;
          },
          dispose: function() {
            // Properly dispose of all audio nodes to prevent memory leaks
            try {
              if (sampler && typeof sampler.dispose === 'function') {
                sampler.dispose();
              }
            } catch (err) {
              debugLog(['PIANO', 'WARN'], `Error disposing sampler: ${err.message || err}`);
            }
            
            try {
              if (tempSynth && typeof tempSynth.dispose === 'function') {
                tempSynth.dispose();
              }
            } catch (err) {
              debugLog(['PIANO', 'WARN'], `Error disposing tempSynth: ${err.message || err}`);
            }
            
            try {
              if (reverb && typeof reverb.dispose === 'function') {
                reverb.dispose();
              }
            } catch (err) {
              debugLog(['PIANO', 'WARN'], `Error disposing reverb: ${err.message || err}`);
            }
          },
          releaseAll: function(time) {
            if (samplesLoaded) {
              sampler.releaseAll(time);
            }
            tempSynth.releaseAll(time);
          },
          triggerAttack: function(notes, time, velocity) {
            if (samplesLoaded) {
              try {
                sampler.triggerAttack(notes, time, velocity);
              } catch (err) {
                tempSynth.triggerAttack(notes, time, velocity);
              }
            } else {
              tempSynth.triggerAttack(notes, time, velocity);
            }
          },
          triggerRelease: function(notes, time) {
            if (samplesLoaded) {
              try {
                sampler.triggerRelease(notes, time);
              } catch (err) {
                tempSynth.triggerRelease(notes, time);
              }
            } else {
              tempSynth.triggerRelease(notes, time);
            }
          }
        };
      },
      violin: () => {
        // This is now handled by toneJsSampler.js
        debugLog('AUDIO_ENGINE', 'Using global violin from toneJsSampler.js');
        return null; // We should never reach this point as playNote() will call toneJsSampler directly
      },
      flute: () => {
        // This is now handled by toneJsSampler.js
        debugLog('AUDIO_ENGINE', 'Using global flute from toneJsSampler.js');
        return null; // We should never reach this point as playNote() will call toneJsSampler directly
      },
      tuba: () => {
        // Verwende FMSynth für reichhaltigeren Tuba-Klang
        const synth = new Tone.FMSynth({
          harmonicity: 3.01,
          modulationIndex: 14,
          oscillator: {
            type: "square8"
          },
          envelope: {
            attack: 0.2,
            decay: 0.3,
            sustain: 0.4,
            release: 0.8
          },
          modulation: {
            type: "triangle"
          },
          modulationEnvelope: {
            attack: 0.5,
            decay: 0.1,
            sustain: 0.2,
            release: 0.1
          }
        });
        
        // Tiefere Oktave für Tuba-Charakter
        synth.set({
          detune: -1200, // Eine Oktave tiefer
          volume: -2 // Etwas leiser, um nicht zu dominant zu sein
        });
        
        return synth;
      },
      doublebass: () => {
        // This is now handled by toneJsSampler.js
        debugLog('AUDIO_ENGINE', 'Using global doublebass from toneJsSampler.js');
        return null; // We should never reach this point as playNote() will call toneJsSampler directly
      },
      bell: () => {
        const synth = new Tone.PolySynth(Tone.FMSynth);
        synth.set({
          harmonicity: 3.01,
          modulationIndex: 14,
          oscillator: {
            type: "triangle"
          },
          envelope: {
            attack: 0.002,
            decay: 0.5,
            sustain: 0.1,
            release: 1.2
          },
          modulation: {
            type: "square"
          },
          modulationEnvelope: {
            attack: 0.005,
            decay: 0.01,
            sustain: 0.9,
            release: 0.5
          }
        });
        return synth;
      }
    };
    
    // Event-Listener für globale Audio-Events hinzufügen
    this._setupGlobalEventListeners();
  }
  
  /**
   * Initialisiert die Audio-Engine. Muss vor dem ersten Abspielen aufgerufen werden.
   * @returns {Promise} Ein Promise, das aufgelöst wird, wenn die Audio-Engine bereit ist
   */
  async initialize() {
    if (this._isInitialized) return Promise.resolve();
    
    try {
      // Tone.js initialisieren (erfordert Benutzerinteraktion wegen Browser-Richtlinien)
      await Tone.start();
      
      // Globale Tone.js Einstellungen
      Tone.Transport.bpm.value = 120;
      
      this._isInitialized = true;
      debugLog('AUDIO_ENGINE', 'Audio-Engine erfolgreich initialisiert');
      return Promise.resolve();
    } catch (error) {
      debugLog(['AUDIO_ENGINE', 'ERROR'], `Fehler beim Initialisieren der Audio-Engine: ${error.message || error}`);
      return Promise.reject(error);
    }
  }
  
  /**
   * Wechselt schnell zwischen Instrumenten, ohne den aktuellen Synth zu unterbrechen
   * Für Aktivitäten, die verschiedene Instrumenten-Sounds benötigen
   * @param {string} instrumentType - Typ des Instruments ('default', 'piano', 'violin', 'flute', 'tuba', etc.)
   */
  useInstrument(instrumentType) {
    // Always create a fresh synth instance regardless of current state
    // This ensures each note gets a clean instrument setup
    if (!this._instrumentTypes[instrumentType]) {
      debugLog(['AUDIO_ENGINE', 'WARN'], `Unbekannter Instrument-Typ: ${instrumentType}, verwende Standard-Synth`);
      instrumentType = 'default';
    }
    
    // Bisherigen Synth entfernen und neuen erstellen
    // FIXED: Properly dispose of old synth to prevent memory leaks
    if (this._synth) {
      try {
        this._synth.disconnect();
        // Dispose of the synthesizer to free audio resources
        if (typeof this._synth.dispose === 'function') {
          this._synth.dispose();
        }
      } catch (err) {
        debugLog(['AUDIO_ENGINE', 'WARN'], `Error disposing old synth: ${err.message || err}`);
      }
    }
    
    this._synth = this._instrumentTypes[instrumentType]();
    this._synth.toDestination();
    this._currentInstrument = instrumentType;
    
    debugLog('INSTRUMENT', `Instrumentenwechsel zu: ${instrumentType}`);
  }
  
  /**
   * Spielt eine einzelne Note
   * @param {string} noteName - Name der Note (C4, D#3, etc.) oder 'success' oder 'try_again'
   * @param {number} duration - Dauer in Sekunden
   * @param {number} time - Zeitpunkt für den Start der Note (Optional)
   * @param {number} velocity - Lautstärke (0.0 - 1.0)
   * @param {string} instrument - Instrument to use ('violin', 'flute', 'tuba', 'default')
   * @param {Object} options - Zusätzliche Optionen (NICHT mehr für Instrument verwenden!)
   */
  playNote(noteName, duration = 0.5, time, velocity = 0.75, instrument = 'default', options = {}) {
    if (!this._isInitialized) {
      debugLog(['AUDIO_ENGINE', 'WARN'], 'Audio-Engine wurde noch nicht initialisiert!');
      return;
    }
    
    // Prüfen, ob es sich um einen speziellen Sound handelt
    if (this._specialSounds[noteName]) {
      debugLog('AUDIO', `Spiele speziellen Sound-Effekt: ${noteName}`);
      this._playSpecialSound(noteName, velocity);
      return;
    }
    
    // Noten-Format überprüfen und ggf. korrigieren
    const parsedNote = this._parseNoteString(noteName);
    
    if (!parsedNote) {
      debugLog(['AUDIO', 'ERROR'], `Ungültige Note: ${noteName}`);
      return;
    }
    
    // Convert duration to seconds if it's a string notation
    let durationInSeconds = duration;
    if (typeof duration === 'string') {
      durationInSeconds = Tone.Time(duration).toSeconds();
    }
    
    // Log the instrument being used
    debugLog('INSTRUMENT', `playNote() ${noteName} with instrument: ${instrument}, parsedNote: ${parsedNote}, duration: ${durationInSeconds.toFixed(3)}s`);
    
    // INTEGRATION POINT: Use our toneJsSampler instruments based on the instrument type
    let played = false;
    
    // First check if the requested instrument is ready
    const instrumentReady = isInstrumentReady(instrument.toLowerCase());
    if (!instrumentReady) {
      debugLog('INSTRUMENT', `Instrument ${instrument} is not ready yet. Initializing...`);
      // Give some time for instrument to initialize if not ready
      setTimeout(() => {
        debugLog('INSTRUMENT', `Delayed check for ${instrument} readiness: ${isInstrumentReady(instrument.toLowerCase())}`);
      }, 500);
    }
    
    // Use the right instrument type from toneJsSampler
    switch(instrument.toLowerCase()) {
      case 'piano':
        played = playToneNote(parsedNote, durationInSeconds, velocity);
        break;
      case 'violin':
        played = playViolinNote(parsedNote, durationInSeconds, velocity);
        break;
      case 'doublebass':
        played = playDoubleBassNote(parsedNote, durationInSeconds, velocity);
        break;
      case 'flute':
        played = playFluteNote(parsedNote, durationInSeconds, velocity);
        break;
      case 'brass': // Used as replacement for 'tuba' in the free mode
        played = playBrassNote(parsedNote, durationInSeconds, velocity);
        break;
      default:
        // For backwards compatibility, use the internal synth for non-matched instruments
        try {
          // Always use the direct instrument parameter
          this.useInstrument(instrument);
          
          // Note spielen mit musikalischer Zeitnotation
          this._synth.triggerAttackRelease(parsedNote, duration, time, velocity);
          
          // Note als aktiv markieren
          this._notesPlaying.add(parsedNote);
          
          // Nach Ablauf der Note aus der aktiven Liste entfernen
          const cleanupTime = time !== undefined ? 
            (typeof time === 'number' ? time + durationInSeconds : Tone.Time(time).toSeconds() + durationInSeconds) : 
            Tone.now() + durationInSeconds;
          
          Tone.Transport.scheduleOnce(() => {
            this._notesPlaying.delete(parsedNote);
          }, cleanupTime);
          
          played = true;
        } catch (err) {
          debugLog(['INSTRUMENT', 'ERROR'], `Error playing with legacy synth: ${err.message || err}`);
          played = false;
        }
    }
    
    return played;
  }
  
  /**
   * Stoppt eine aktiv spielende Note sofort
   * @param {string} note - Die zu stoppende Note (z.B. 'C4', 'D#4', etc.)
   */
  stopNote(note) {
    if (!this._isInitialized) {
      debugLog(['AUDIO_ENGINE', 'WARN'], 'Audio-Engine nicht initialisiert. Initialisiere zuerst mit initialize()');
      return;
    }
    
    // Spezielle Sounds können nicht gestoppt werden
    if (this._specialSounds[note]) {
      debugLog('AUDIO', `Kann speziellen Sound nicht stoppen: ${note}`);
      return;
    }
    
    // Noten-Format überprüfen und ggf. korrigieren
    const parsedNote = this._parseNoteString(note);
    
    if (!parsedNote) {
      debugLog(['AUDIO', 'ERROR'], `Ungültige Note zum Stoppen: ${note}`);
      return;
    }
    
    // Note sofort stoppen mit triggerRelease
    this._synth.triggerRelease(parsedNote);
    
    // Note aus der Liste aktiver Noten entfernen
    this._notesPlaying.delete(parsedNote);
    
    debugLog('AUDIO', `Note gestoppt: ${parsedNote}`);
  }
  
  /**
   * Spielt eine Sequenz von Noten ab
   * @param {Array} notes - Array mit Noten (z.B. ['C4', 'D4', 'E4'])
   * @param {Object} options - Optionen für die Sequenz
   * @param {number} options.tempo - Tempo in BPM
   * @param {number} options.noteDuration - Dauer einer Note in Sekunden
   * @param {Function} options.onNoteStart - Callback für Start einer Note
   * @param {Function} options.onNoteEnd - Callback für Ende einer Note
   * @param {Function} options.onSequenceEnd - Callback für Ende der Sequenz
   * @returns {Object} Kontrollobjekt mit Methoden zum Steuern der Sequenz
   */
  playNoteSequence(notes, options = {}) {
    if (!this._isInitialized) {
      debugLog(['AUDIO_ENGINE', 'WARN'], 'Audio-Engine nicht initialisiert. Initialisiere zuerst mit initialize()');
      return { stop: () => {} };
    }
    
    if (!notes || notes.length === 0) {
      debugLog(['AUDIO_ENGINE', 'WARN'], 'Leere Notensequenz, nichts abzuspielen');
      if (options.onSequenceEnd) options.onSequenceEnd();
      return { stop: () => {} };
    }
    
    // Standardoptionen setzen
    const defaultOptions = {
      tempo: 120,
      noteDuration: 0.4,
      onNoteStart: null,
      onNoteEnd: null,
      onSequenceEnd: null
    };
    
    // Optionen mit Standardwerten zusammenführen
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Eindeutige ID für diese Sequenz generieren
    const sequenceId = `seq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Noten verarbeiten und Pausen/Modifikatoren berücksichtigen
    const processedNotes = this._processNoteSequence(notes, mergedOptions.noteDuration);
    
    // Tone.js-Sequence erstellen
    const sequence = new Tone.Sequence((time, event) => {
      if (event.isRest) {
        debugLog('AUDIO_SEQUENCE', `Pause an Position ${event.index + 1}/${processedNotes.length}, Dauer: ${event.duration}s`);
        // Bei Pausen keinen Ton abspielen, aber Callback aufrufen
        if (mergedOptions.onNoteStart) {
          mergedOptions.onNoteStart(null, event.index);
        }
      } else {
        // Note abspielen
        this._synth.triggerAttackRelease(
          event.note, 
          event.duration, 
          time, 
          event.velocity
        );
        
        debugLog('AUDIO_SEQUENCE', `Note gespielt: ${event.note} (${event.originalNote}) an Position ${event.index + 1}/${processedNotes.length}`);
        
        // Callback für Notenstart
        if (mergedOptions.onNoteStart) {
          mergedOptions.onNoteStart(event.originalNote, event.index);
        }
      }
      
      // Callback für Notenende planen
      if (mergedOptions.onNoteEnd) {
        Tone.Transport.scheduleOnce(() => {
          mergedOptions.onNoteEnd(event.originalNote, event.index);
        }, `+${event.duration}`);
      }
      
      // Wenn letzte Note, Sequenzende planen
      if (event.index === processedNotes.length - 1) {
        Tone.Transport.scheduleOnce(() => {
          // Callback für Sequenzende
          if (mergedOptions.onSequenceEnd) {
            mergedOptions.onSequenceEnd();
          }
          
          // Sequenz aus aktiver Liste entfernen
          this._activeSequences.delete(sequenceId);
          
          debugLog('AUDIO_SEQUENCE', `Sequenz ${sequenceId} abgeschlossen`);
        }, `+${event.duration}`);
      }
    }, processedNotes, '4n');
    
    // Sequenztempo setzen
    Tone.Transport.bpm.value = mergedOptions.tempo;
    
    // Sequenz starten
    sequence.start(0);
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }
    
    // Sequenz zur aktiven Liste hinzufügen
    this._activeSequences.set(sequenceId, {
      sequence,
      startTime: Tone.now()
    });
    
    debugLog('AUDIO_SEQUENCE', `Sequenz ${sequenceId} mit ${notes.length} Noten gestartet, Tempo: ${mergedOptions.tempo} BPM`);
    
    // Kontrollobjekt zurückgeben
    return {
      stop: () => {
        sequence.stop();
        sequence.dispose();
        this._activeSequences.delete(sequenceId);
        debugLog('AUDIO_SEQUENCE', `Sequenz ${sequenceId} manuell gestoppt`);
      },
      id: sequenceId
    };
  }
  
  /**
   * Spielt mehrere Noten gleichzeitig als Akkord
   * @param {Array<string>} notes - Array mit Notennamen (z.B. ['C4', 'E4', 'G4'])
   * @param {Object} options - Optionen für den Akkord
   * @param {number} options.duration - Dauer in Sekunden (default: 2)
   * @param {number} options.velocity - Lautstärke (0-1, default: 0.7)
   */
  playChord(notes, options = {}) {
    if (!this._isInitialized) {
      debugLog(['AUDIO_ENGINE', 'WARN'], 'Audio-Engine nicht initialisiert. Initialisiere zuerst mit initialize()');
      return false;
    }
    
    if (!notes || notes.length === 0) {
      debugLog(['AUDIO_ENGINE', 'WARN'], 'Leeres Noten-Array, nichts abzuspielen');
      return false;
    }
    
    // Standardoptionen
    const duration = options.duration || 2;
    const velocity = options.velocity || 0.7;
    
    // Bisherige Töne stoppen
    this.stopAll();
    
    // Alle gültigen Noten sammeln
    const validNotes = [];
    
    notes.forEach(note => {
      const parsedNote = this._parseNoteString(note);
      if (parsedNote) {
        validNotes.push(parsedNote);
      } else {
        debugLog(['AUDIO_CHORD', 'WARN'], `Invalid Note ignored: ${note} (not in the format e.g. 'C4', 'D#4')`);
      }
    });
    
    if (validNotes.length === 0) {
      debugLog(['AUDIO_CHORD', 'WARN'], 'No valid notes in chord');
      return false;
    }
    
    debugLog('AUDIO', `Spiele Akkord mit Noten: ${validNotes.join(', ')}, Dauer: ${duration}s`);
    
    try {
      // Alle Noten gleichzeitig abspielen
      this._synth.triggerAttackRelease(validNotes, duration, Tone.now(), velocity);
      
      // Noten als aktiv markieren
      validNotes.forEach(note => {
        this._notesPlaying.add(note);
      });
      
      // Nach Ablauf der Noten aus der aktiven Liste entfernen
      Tone.Transport.scheduleOnce(() => {
        validNotes.forEach(note => {
          this._notesPlaying.delete(note);
        });
      }, `+${duration}`);
      
      return true;
    } catch (error) {
      debugLog(['AUDIO_CHORD', 'ERROR'], `Fehler beim Abspielen des Akkords: ${error.message || error}`);
      return false;
    }
  }
  
  /**
   * Stoppt alle aktiven Sequenzen und Noten
   */
  stopAll() {
    // Alle aktiven Sequenzen stoppen
    this._activeSequences.forEach((sequenceData, id) => {
      try {
        sequenceData.sequence.stop();
        sequenceData.sequence.dispose();
      } catch (err) {
        debugLog(['AUDIO_ENGINE', 'WARN'], `Error stopping sequence ${id}: ${err.message || err}`);
      }
      debugLog('AUDIO_SEQUENCE', `Sequenz ${id} gestoppt`);
    });
    
    this._activeSequences.clear();
    
    // Alle aktiven Noten stoppen
    if (this._notesPlaying.size > 0) {
      try {
        this._synth.releaseAll();
      } catch (err) {
        debugLog(['AUDIO_ENGINE', 'WARN'], `Error releasing all notes: ${err.message || err}`);
      }
      this._notesPlaying.clear();
    }
    
    debugLog('AUDIO_ENGINE', 'Alle Audiowiedergaben gestoppt');
  }
  
  /**
   * Disposes of all audio resources to free memory
   * Should be called when the app is backgrounded or before major activity changes
   */
  cleanup() {
    debugLog('AUDIO_ENGINE', 'Starting cleanup of audio resources...');
    
    // Stop all active audio first
    this.stopAll();
    
    // Dispose of current synth
    if (this._synth) {
      try {
        this._synth.disconnect();
        if (typeof this._synth.dispose === 'function') {
          this._synth.dispose();
        }
      } catch (err) {
        debugLog(['AUDIO_ENGINE', 'WARN'], `Error disposing main synth: ${err.message || err}`);
      }
      this._synth = null;
    }
    
    debugLog('AUDIO_ENGINE', 'Audio cleanup completed');
  }
  
  /**
   * Setzt Event-Listener für globale Audio-Events
   * @private
   */
  _setupGlobalEventListeners() {
    // Legacy-Event-Listener für Kompatibilität mit bestehendem Code
    window.addEventListener('lalumo:playnote', (event) => {
      if (!event.detail || !event.detail.note) return;
      
      // Präfixe vom Notennamen entfernen (z.B. 'pitch_C4' -> 'C4')
      const noteName = event.detail.note
        .replace('pitch_', '')
        .replace('sound_', '')
        .toUpperCase();
      
      // Note abspielen
      this.playNote(noteName, 0.4);
      
      debugLog('LEGACY_EVENT', `Legacy-Event verarbeitet: ${event.detail.note} -> ${noteName}`);
    });
  }
  
  /**
   * Verarbeitet eine Notensequenz und bereitet sie für Tone.js vor
   * @param {Array} notes - Array mit Notennamen
   * @param {number} baseNoteDuration - Basisdauer einer Note in Sekunden
   * @returns {Array} Verarbeitete Notensequenz mit zusätzlichen Metadaten
   * @private
   */
  _processNoteSequence(notes, baseNoteDuration) {
    return notes.map((note, index) => {
      // Standardwerte
      let processedNote = {
        index,
        originalNote: note,
        isRest: false,
        duration: baseNoteDuration,
        velocity: 0.7
      };
      
      // Prüfen, ob es eine Pause ist
      if (typeof note === 'string' && (note.toLowerCase() === 'r' || note.startsWith('r'))) {
        processedNote.isRest = true;
        processedNote.note = null;
        return processedNote;
      }
      
      // Modifikatoren verarbeiten (z.B. "C4:h" für halbe Note)
      if (typeof note === 'string' && note.includes(':')) {
        const [notePart, modifier] = note.split(':');
        processedNote.originalNote = note;
        processedNote.note = this._parseNoteString(notePart);
        
        // Dauer basierend auf Modifikator anpassen
        if (modifier === 'h') { // Halbe Note
          processedNote.duration = baseNoteDuration * 2;
        } else if (modifier === 'w') { // Ganze Note
          processedNote.duration = baseNoteDuration * 4;
        } else if (modifier === '8') { // Achtelnote
          processedNote.duration = baseNoteDuration / 2;
        } else if (modifier === '16') { // Sechzehntelnote
          processedNote.duration = baseNoteDuration / 4;
        }
      } else {
        // Normale Note ohne Modifikatoren
        processedNote.note = this._parseNoteString(note);
      }
      
      return processedNote;
    });
  }
  
  /**
   * Spielt einen speziellen Sound-Effekt ab
   * @param {string} soundName - Name des speziellen Sound-Effekts ('success', 'try_again')
   * @param {number} velocity - Lautstärke (0-1)
   * @private
   */
  _playSpecialSound(soundName, velocity = 0.8) {
    const sound = this._specialSounds[soundName];
    if (!sound) return;
    
    // Bisherige Sounds stoppen
    this.stopAll();
    
    // Aktuelle Zeit ermitteln
    let currentTime = Tone.now();
    
    // Alle Noten der Sequenz nacheinander abspielen
    sound.notes.forEach((note, index) => {
      const duration = sound.durations[index] || 0.25;
      
      // Note zum richtigen Zeitpunkt abspielen
      this._synth.triggerAttackRelease(
        note, 
        duration, 
        currentTime, 
        velocity
      );
      
      // Zeit für nächste Note berechnen
      currentTime += duration;
    });
    
    debugLog('AUDIO', `Speziellen Sound '${soundName}' abgespielt mit Lautstärke ${velocity}`);
  }
  
  /**
   * Überprüft und normalisiert einen Notennamen für Tone.js
   * @param {string} note - Notenname (z.B. 'C4', 'D#4')
   * @returns {string} Normalisierter Notenname oder null, falls ungültig
   * @private
   */
  _parseNoteString(note) {
    if (!note || typeof note !== 'string') return null;
    
    // Präfixe entfernen
    let cleanNote = note
      .replace('pitch_', '')
      .replace('sound_', '')
      .toUpperCase();
    
    // Sicherstellen, dass die Note eine Oktavnummer enthält
    if (/^[A-G][b#]?$/.test(cleanNote)) {
      // Ohne Oktave, Standard-Oktave 4 hinzufügen
      cleanNote = `${cleanNote}4`;
    }
    
    // Regex für gültige Noten in wissenschaftlicher Notation
    const noteRegex = /^[A-G][b#]?[0-8]$/;
    
    if (!noteRegex.test(cleanNote)) {
      debugLog(['AUDIO', 'WARN'], `Ungültiger Notenname: ${note} -> ${cleanNote}`);
      return null;
    }
    
    return cleanNote;
  }
}

// Singleton-Instanz der Audio-Engine
const audioEngine = new AudioEngine();

// Global cleanup function that can be called when app is backgrounded or on activity changes
export function cleanupAudioResources() {
  audioEngine.cleanup();
}

// Make cleanup function available globally for manual calls
if (typeof window !== 'undefined') {
  window.cleanupAudioResources = cleanupAudioResources;
}

// Exportiere die Audio-Engine-Instanz als Standard
export default audioEngine;
