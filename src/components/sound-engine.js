/**
 * Zentrale Sound-Engine für die Lalumo-App
 * Verwendet Tone.js für hochwertige Audiowiedergabe
 * 
 * Diese Komponente fungiert als Brücke zwischen der alten Event-basierten API 
 * und der neuen Tone.js-basierten Sound-Erzeugung
 */

import * as Tone from 'tone';

class SoundEngine {
  constructor() {
    this.isInitialized = false;
    this.activeSequences = new Map();
    this.synth = null;
    this.instrumentType = 'default';
    this.volume = 0.7;
    
    // Instrument-Konfigurationen
    this.instrumentConfigs = {
      default: {
        create: () => new Tone.PolySynth(Tone.Synth),
        settings: {
          envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.5
          }
        }
      },
      piano: {
        create: () => new Tone.PolySynth(Tone.Synth),
        settings: {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.2,
            release: 1.0
          },
          oscillator: {
            type: "triangle"
          }
        }
      },
      bell: {
        create: () => new Tone.PolySynth(Tone.FMSynth),
        settings: {
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
          }
        }
      }
    };
    
    // Kompatibilitäts-Listener für das alte Event-System
    this.setupCompatibilityListeners();
  }
  
  /**
   * Initialisiere die Sound-Engine
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Tone.js starten (erfordert Benutzerinteraktion)
      await Tone.start();
      console.log('Sound-Engine: Tone.js erfolgreich gestartet');
      
      // Synth erstellen und konfigurieren
      this.setupSynth(this.instrumentType);
      
      this.isInitialized = true;
      console.log('Sound-Engine: Initialisierung abgeschlossen');
    } catch (error) {
      console.error('Sound-Engine: Fehler bei der Initialisierung', error);
    }
  }
  
  /**
   * Erstellt und konfiguriert den Synthesizer
   */
  setupSynth(type = 'default') {
    // Sicherstellen, dass wir einen gültigen Typ haben
    if (!this.instrumentConfigs[type]) {
      console.warn(`Sound-Engine: Unbekannter Instrumenttyp '${type}', verwende 'default'`);
      type = 'default';
    }
    
    // Alten Synth entfernen, falls vorhanden
    if (this.synth) {
      this.synth.dispose();
    }
    
    // Neuen Synth erstellen
    const config = this.instrumentConfigs[type];
    this.synth = config.create();
    
    // Synth konfigurieren
    this.synth.set(config.settings);
    
    // Volume anpassen und mit Audio-Output verbinden
    this.synth.volume.value = Tone.gainToDb(this.volume);
    this.synth.toDestination();
    
    this.instrumentType = type;
    console.log(`Sound-Engine: Instrument auf '${type}' gesetzt`);
  }
  
  /**
   * Einmalige Note abspielen
   * @param {string} note - Name der Note (z.B. 'C4', 'D#4')
   * @param {number} duration - Dauer in Sekunden
   * @param {number} velocity - Lautstärke (0-1)
   */
  playNote(note, duration = 0.4, velocity = 0.7) {
    if (!this.isInitialized) {
      this.initialize().then(() => this.playNote(note, duration, velocity));
      return;
    }
    
    // Präfixe entfernen (z.B. 'pitch_', 'sound_')
    const cleanNote = this.cleanNoteFormat(note);
    
    if (!cleanNote) {
      console.warn(`Sound-Engine: Ungültige Note '${note}'`);
      return;
    }
    
    // Note abspielen
    this.synth.triggerAttackRelease(cleanNote, duration, Tone.now(), velocity);
    console.log(`Sound-Engine: Note ${cleanNote} (${note}) für ${duration}s abgespielt`);
  }
  
  /**
   * Notensequenz abspielen
   * @param {Array} notes - Array mit Notennamen
   * @param {Object} options - Optionen für die Wiedergabe
   * @returns {Object} Kontrollobjekt mit stop-Funktion
   */
  playSequence(notes, options = {}) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (!notes || notes.length === 0) {
      console.warn('Sound-Engine: Leere Notensequenz');
      return { stop: () => {} };
    }
    
    // Standard-Optionen
    const defaultOptions = {
      tempo: 120,              // Tempo in BPM
      noteDuration: 0.4,       // Dauer einer Note in Sekunden
      onNoteStart: null,       // Callback bei Notenstart
      onNoteEnd: null,         // Callback bei Notenende
      onComplete: null,        // Callback bei Sequenzende
      noteModifier: note => note  // Funktion zur Notenmodifikation
    };
    
    const settings = { ...defaultOptions, ...options };
    
    // ID für diese Sequenz generieren
    const sequenceId = `seq_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Noten verarbeiten
    const processedNotes = notes.map(note => {
      // Standardwerte
      let result = {
        originalNote: note,
        note: null,
        duration: settings.noteDuration,
        isRest: false,
        velocity: 0.7
      };
      
      // Pause?
      if (typeof note === 'string' && (note.toLowerCase() === 'r' || note.startsWith('r'))) {
        result.isRest = true;
        return result;
      }
      
      // Dauer-Modifikatoren (z.B. 'C4:h' für halbe Note)
      if (typeof note === 'string' && note.includes(':')) {
        const [noteName, modifier] = note.split(':');
        result.note = this.cleanNoteFormat(settings.noteModifier(noteName));
        
        // Dauer anpassen
        if (modifier === 'h') {  // Halbe Note
          result.duration = settings.noteDuration * 2;
        } else if (modifier === 'w') {  // Ganze Note
          result.duration = settings.noteDuration * 4;
        } else if (modifier === '8') {  // Achtelnote
          result.duration = settings.noteDuration / 2;
        } else if (modifier === '16') {  // Sechzehntelnote
          result.duration = settings.noteDuration / 4;
        }
      } else {
        result.note = this.cleanNoteFormat(settings.noteModifier(note));
      }
      
      return result;
    });
    
    // BPM für Tone.js setzen
    const bpm = Math.round(60 / settings.noteDuration);
    Tone.Transport.bpm.value = bpm;
    
    // Part erstellen
    let currentIndex = 0;
    const part = new Tone.Part((time, noteObj) => {
      const { note, duration, isRest, originalNote } = noteObj;
      
      if (!isRest && note) {
        // Note abspielen
        this.synth.triggerAttackRelease(note, duration, time, noteObj.velocity);
        console.log(`Sound-Engine: Sequenz ${sequenceId} - Note ${note} an Position ${currentIndex + 1}/${processedNotes.length}`);
      } else {
        console.log(`Sound-Engine: Sequenz ${sequenceId} - Pause an Position ${currentIndex + 1}/${processedNotes.length}`);
      }
      
      // Callback für Notenstart
      if (settings.onNoteStart) {
        settings.onNoteStart(originalNote, currentIndex);
      }
      
      // Callback für Notenende planen
      if (settings.onNoteEnd) {
        Tone.Transport.scheduleOnce(() => {
          settings.onNoteEnd(originalNote, currentIndex);
        }, `+${duration}`);
      }
      
      // Wenn letzte Note erreicht
      if (currentIndex === processedNotes.length - 1) {
        Tone.Transport.scheduleOnce(() => {
          // Callback für Sequenzende
          if (settings.onComplete) {
            settings.onComplete();
          }
          
          // Sequenz aus aktiver Liste entfernen
          this.activeSequences.delete(sequenceId);
          
          console.log(`Sound-Engine: Sequenz ${sequenceId} abgeschlossen`);
        }, `+${duration}`);
      }
      
      currentIndex++;
    }, processedNotes.map((noteObj, index) => [index * Tone.Time('4n').toSeconds(), noteObj]));
    
    // Sequenz starten
    part.start(0);
    if (Tone.Transport.state !== "started") {
      Tone.Transport.start();
    }
    
    // Sequenz zur aktiven Liste hinzufügen
    this.activeSequences.set(sequenceId, {
      part,
      startTime: Tone.now()
    });
    
    console.log(`Sound-Engine: Sequenz ${sequenceId} mit ${notes.length} Noten gestartet`);
    
    // Kontrollobjekt zurückgeben
    return {
      id: sequenceId,
      stop: () => {
        part.stop();
        part.dispose();
        this.activeSequences.delete(sequenceId);
        console.log(`Sound-Engine: Sequenz ${sequenceId} manuell gestoppt`);
      }
    };
  }
  
  /**
   * Alle aktiven Sequenzen stoppen
   */
  stopAllSequences() {
    this.activeSequences.forEach((seqData, id) => {
      seqData.part.stop();
      seqData.part.dispose();
      console.log(`Sound-Engine: Sequenz ${id} gestoppt`);
    });
    
    this.activeSequences.clear();
    console.log('Sound-Engine: Alle Sequenzen gestoppt');
  }
  
  /**
   * Event-Listener für das alte Event-System einrichten
   */
  setupCompatibilityListeners() {
    // Listener für einzelne Noten
    window.addEventListener('lalumo:playnote', (event) => {
      if (!event.detail || !event.detail.note) return;
      
      // Note abspielen
      this.playNote(event.detail.note);
      
      console.log(`Sound-Engine: Legacy-Event für Note '${event.detail.note}' verarbeitet`);
    });
    
    // Listener zum Stoppen aller Sounds
    window.addEventListener('lalumo:stopallsounds', () => {
      this.stopAllSequences();
      console.log('Sound-Engine: Legacy-Stopp-Event verarbeitet');
    });
  }
  
  /**
   * Bereinigt Notennamen für Tone.js
   * @param {string} note - Ursprünglicher Notenname
   * @returns {string} Bereinigter Notenname
   */
  cleanNoteFormat(note) {
    if (!note || typeof note !== 'string') return null;
    
    // Präfixe entfernen
    let cleaned = note
      .replace('pitch_', '')
      .replace('sound_', '')
      .toUpperCase();
    
    // Oktave hinzufügen, falls fehlend
    if (/^[A-G][b#]?$/.test(cleaned)) {
      cleaned = `${cleaned}4`;  // Standardoktave 4
    }
    
    // Prüfen, ob gültige Note
    const noteRegex = /^[A-G][b#]?[0-8]$/;
    if (!noteRegex.test(cleaned)) {
      console.warn(`Sound-Engine: Ungültiger Notenname '${note}' -> '${cleaned}'`);
      return null;
    }
    
    return cleaned;
  }
  
  /**
   * Lautstärke einstellen (0-1)
   * @param {number} value - Lautstärke
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.synth) {
      this.synth.volume.value = Tone.gainToDb(this.volume);
    }
    console.log(`Sound-Engine: Lautstärke auf ${this.volume} gesetzt`);
  }
  
  /**
   * Instrument wechseln
   * @param {string} type - Instrumenttyp ('default', 'piano', 'bell')
   */
  setInstrument(type) {
    this.setupSynth(type);
  }
}

// Singleton-Instanz erstellen
const soundEngine = new SoundEngine();

export default soundEngine;
