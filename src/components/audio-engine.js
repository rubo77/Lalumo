/**
 * Audio-Engine Modul
 * 
 * Zentrale Komponente für alle Audiooperationen in der Lalumo-App.
 * Verwendet Tone.js für qualitativ hochwertige Audiowiedergabe.
 */
import * as Tone from 'tone';

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
    
    // Instrument-Typen, die verwendet werden können
    this._instrumentTypes = {
      default: () => new Tone.PolySynth(Tone.Synth),
      piano: () => new Tone.Sampler({
        urls: {
          A4: "A4.mp3",
          C4: "C4.mp3",
          E4: "E4.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        onload: () => console.log("Piano samples loaded")
      }),
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
      // Violin - String Instrument
      violin: () => {
        const synth = new Tone.PolySynth(Tone.AMSynth);
        synth.set({
          harmonicity: 2.5,
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.8,
            release: 1.2
          },
          modulation: {
            type: "sine"
          },
          modulationEnvelope: {
            attack: 0.5,
            decay: 0.1,
            sustain: 1,
            release: 0.5
          }
        });
        return synth;
      },
      // Flute - Wind Instrument
      flute: () => {
        const synth = new Tone.PolySynth(Tone.Synth);
        synth.set({
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.05,
            decay: 0.1,
            sustain: 0.7,
            release: 0.15
          }
        });
        return synth;
      },
      // Tuba - Brass Instrument
      tuba: () => {
        const synth = new Tone.PolySynth(Tone.FMSynth);
        synth.set({
          harmonicity: 0.5,
          modulationIndex: 2,
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.08,
            decay: 0.1,
            sustain: 0.8,
            release: 0.4
          },
          modulation: {
            type: "square"
          },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.5,
            sustain: 0.2,
            release: 0.1
          }
        });
        return synth;
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
      console.log('Audio-Engine erfolgreich initialisiert');
      return Promise.resolve();
    } catch (error) {
      console.error('Fehler beim Initialisieren der Audio-Engine:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Ändert den Synthesizer-Typ
   * @param {string} instrumentType - Typ des Instruments ('default', 'piano', 'marimba', 'violin', 'flute', 'tuba', 'bell')
   */
  setInstrument(instrumentType) {
    if (!this._instrumentTypes[instrumentType]) {
      console.warn(`Unbekannter Instrument-Typ: ${instrumentType}, verwende Standard-Synth`);
      instrumentType = 'default';
    }
    
    // Bisherigen Synth entfernen und neuen erstellen
    if (this._synth) {
      this._synth.disconnect();
    }
    
    this._synth = this._instrumentTypes[instrumentType]();
    this._synth.toDestination();
    this._currentInstrument = instrumentType;
    
    console.log(`Instrument geändert zu: ${instrumentType}`);
  }
  
  /**
   * Wechselt schnell zwischen Instrumenten, ohne den aktuellen Synth zu unterbrechen
   * Für Aktivitäten, die verschiedene Instrumenten-Sounds benötigen
   * @param {string} instrumentType - Typ des Instruments ('default', 'piano', 'violin', 'flute', 'tuba', etc.)
   */
  useInstrument(instrumentType) {
    // Prüfen, ob das angeforderte Instrument existiert
    if (!this._instrumentTypes[instrumentType]) {
      console.warn(`Unbekannter Instrument-Typ: ${instrumentType}, verwende Standard-Synth`);
      instrumentType = 'default';
    }
    
    // Instrument nur wechseln, wenn es sich geändert hat
    if (this._currentInstrument !== instrumentType) {
      // Bisherigen Synth entfernen und neuen erstellen
      if (this._synth) {
        this._synth.disconnect();
      }
      
      this._synth = this._instrumentTypes[instrumentType]();
      this._synth.toDestination();
      this._currentInstrument = instrumentType;
      
      console.log(`Schneller Instrumentenwechsel zu: ${instrumentType}`);
    }
  }
  
  /**
   * Spielt eine einzelne Note oder einen speziellen Sound-Effekt
   * @param {string} note - Die zu spielende Note (z.B. 'C4', 'D#4', etc.) oder ein spezieller Sound ('success', 'try_again')
   * @param {string|number} duration - Notendauer als Tone.js-Notation ('4n', '8n', '16n', etc.) oder in Sekunden
   * @param {*} [time] - Zeitpunkt, zu dem die Note abgespielt werden soll (optional)
   * @param {number} [velocity] - Lautstärke der Note (0-1)
   */
  playNote(note, duration = '4n', time = undefined, velocity = 0.7) {
    if (!this._isInitialized) {
      console.warn('Audio-Engine nicht initialisiert. Initialisiere zuerst mit initialize()');
      return;
    }
    
    // Prüfen, ob es sich um einen speziellen Sound handelt
    if (this._specialSounds[note]) {
      console.log(`AUDIO: Spiele speziellen Sound-Effekt: ${note}`);
      this._playSpecialSound(note, velocity);
      return;
    }
    
    // Noten-Format überprüfen und ggf. korrigieren
    const parsedNote = this._parseNoteString(note);
    
    if (!parsedNote) {
      console.error(`Ungültige Note: ${note}`);
      return;
    }
    
    // Note spielen mit musikalischer Zeitnotation
    this._synth.triggerAttackRelease(parsedNote, duration, time, velocity);
    
    // Note als aktiv markieren
    this._notesPlaying.add(parsedNote);
    
    // Berechne die tatsächliche Dauer in Sekunden für das Cleanup
    let durationInSeconds;
    if (typeof duration === 'string') {
      // Wenn es eine musikalische Notation wie '4n', '8n', etc. ist
      durationInSeconds = Tone.Time(duration).toSeconds();
    } else {
      // Wenn es bereits eine Zahl in Sekunden ist
      durationInSeconds = duration;
    }
    
    // Nach Ablauf der Note aus der aktiven Liste entfernen
    const cleanupTime = time !== undefined ? 
      (typeof time === 'number' ? time + durationInSeconds : Tone.Time(time).toSeconds() + durationInSeconds) : 
      Tone.now() + durationInSeconds;
    
    Tone.Transport.scheduleOnce(() => {
      this._notesPlaying.delete(parsedNote);
    }, cleanupTime);
    
    console.log(`Note gespielt: ${parsedNote}, Dauer: ${duration} (${durationInSeconds.toFixed(3)}s)`);
  }
  
  /**
   * Stoppt eine aktiv spielende Note sofort
   * @param {string} note - Die zu stoppende Note (z.B. 'C4', 'D#4', etc.)
   */
  stopNote(note) {
    if (!this._isInitialized) {
      console.warn('Audio-Engine nicht initialisiert. Initialisiere zuerst mit initialize()');
      return;
    }
    
    // Spezielle Sounds können nicht gestoppt werden
    if (this._specialSounds[note]) {
      console.log(`AUDIO: Kann speziellen Sound nicht stoppen: ${note}`);
      return;
    }
    
    // Noten-Format überprüfen und ggf. korrigieren
    const parsedNote = this._parseNoteString(note);
    
    if (!parsedNote) {
      console.error(`Ungültige Note zum Stoppen: ${note}`);
      return;
    }
    
    // Note sofort stoppen mit triggerRelease
    this._synth.triggerRelease(parsedNote);
    
    // Note aus der Liste aktiver Noten entfernen
    this._notesPlaying.delete(parsedNote);
    
    console.log(`Note gestoppt: ${parsedNote}`);
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
      console.warn('Audio-Engine nicht initialisiert. Initialisiere zuerst mit initialize()');
      return { stop: () => {} };
    }
    
    if (!notes || notes.length === 0) {
      console.warn('Leere Notensequenz, nichts abzuspielen');
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
        console.log(`Pause an Position ${event.index + 1}/${processedNotes.length}, Dauer: ${event.duration}s`);
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
        
        console.log(`Note gespielt: ${event.note} (${event.originalNote}) an Position ${event.index + 1}/${processedNotes.length}`);
        
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
          
          console.log(`Sequenz ${sequenceId} abgeschlossen`);
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
    
    console.log(`Sequenz ${sequenceId} mit ${notes.length} Noten gestartet, Tempo: ${mergedOptions.tempo} BPM`);
    
    // Kontrollobjekt zurückgeben
    return {
      stop: () => {
        sequence.stop();
        sequence.dispose();
        this._activeSequences.delete(sequenceId);
        console.log(`Sequenz ${sequenceId} manuell gestoppt`);
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
      console.warn('Audio-Engine nicht initialisiert. Initialisiere zuerst mit initialize()');
      return false;
    }
    
    if (!notes || notes.length === 0) {
      console.warn('Leeres Noten-Array, nichts abzuspielen');
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
        console.warn(`Ungültige Note ignoriert: ${note}`);
      }
    });
    
    if (validNotes.length === 0) {
      console.warn('Keine gültigen Noten im Akkord');
      return false;
    }
    
    console.log(`AUDIO: Spiele Akkord mit Noten: ${validNotes.join(', ')}, Dauer: ${duration}s`);
    
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
      console.error('Fehler beim Abspielen des Akkords:', error);
      return false;
    }
  }
  
  /**
   * Stoppt alle aktiven Sequenzen und Noten
   */
  stopAll() {
    // Alle aktiven Sequenzen stoppen
    this._activeSequences.forEach((sequenceData, id) => {
      sequenceData.sequence.stop();
      sequenceData.sequence.dispose();
      console.log(`Sequenz ${id} gestoppt`);
    });
    
    this._activeSequences.clear();
    
    // Alle aktiven Noten stoppen
    if (this._notesPlaying.size > 0) {
      this._synth.releaseAll();
      this._notesPlaying.clear();
    }
    
    console.log('Alle Audiowiedergaben gestoppt');
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
      
      console.log(`Legacy-Event verarbeitet: ${event.detail.note} -> ${noteName}`);
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
      const noteVelocity = sound.velocity || velocity;
      
      // Note zum richtigen Zeitpunkt abspielen
      this._synth.triggerAttackRelease(
        note, 
        duration, 
        currentTime, 
        noteVelocity
      );
      
      // Zeit für nächste Note berechnen
      currentTime += duration;
    });
    
    console.log(`AUDIO: Speziellen Sound '${soundName}' abgespielt`);
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
      console.warn(`Ungültiger Notenname: ${note} -> ${cleanNote}`);
      return null;
    }
    
    return cleanNote;
  }
}

// Singleton-Instanz der Audio-Engine
const audioEngine = new AudioEngine();

// Exportiere die Audio-Engine-Instanz als Standard
export default audioEngine;
