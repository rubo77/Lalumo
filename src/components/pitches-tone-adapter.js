/**
 * Adapter für die Integration von Tone.js in die Pitches-Komponente
 *
 * Diese Datei dient als Brücke zwischen der bestehenden Event-basierten
 * Audio-Architektur und der neuen Tone.js-basierten Sound-Engine.
 * Sie stellt sicher, dass alle bestehenden APIs unverändert funktionieren,
 * während intern die moderne Tone.js-Bibliothek verwendet wird.
 */

import soundEngine from './sound-engine.js';

/**
 * Initialisiert die Tone.js-Audio-Engine und registriert Kompatibilitäts-Event-Handler
 */
export function initToneEngineForPitches() {
  console.log('Tone.js-Engine für Pitches-Komponente initialisiert');
  
  // Sicherstellen, dass die Audio-Engine initialisiert wird
  soundEngine.initialize().catch(err => {
    console.error('Fehler beim Initialisieren der Tone.js-Engine:', err);
  });
  
  return soundEngine; // Soundengine zurückgeben für direkten Zugriff
}

/**
 * Ersatz für die playAudioSequence Funktion in der Pitches-Komponente
 * Behält die gleiche API bei, verwendet aber intern Tone.js
 * 
 * @param {Array} noteArray - Array mit Notennamen 
 * @param {String} context - Kontext-String für Logging (z.B. 'draw', 'match')
 * @param {Object} options - Optionen für die Wiedergabe
 * @returns {Object} Objekt mit stop-Funktion zum Abbrechen
 */
export function playToneAudioSequence(component, noteArray, context, options = {}) {
  if (!noteArray || !noteArray.length) {
    console.warn(`AUDIO: Versuch, leeres Noten-Array für ${context} abzuspielen`);
    return { stop: () => {} };
  }

  // Komponenten-Status setzen
  component.isPlaying = true;

  // Standard-Optionen
  const defaultOptions = {
    prepareNote: (note) => `pitch_${note.toLowerCase()}`,
    noteDuration: 700, // Millisekunden
    onNoteStart: null,
    onNoteEnd: null,
    onComplete: null,
    highlightPianoKey: true
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  console.log(`AUDIO: Sequenz für ${context} mit ${noteArray.length} Noten wird abgespielt (${mergedOptions.noteDuration}ms pro Viertelnote)`);
  
  // Tone.js-Optionen erstellen
  const engineOptions = {
    // Millisekunden zu Sekunden für Tone.js
    noteDuration: mergedOptions.noteDuration / 1000,
    // BPM berechnen
    tempo: Math.round(60 / (mergedOptions.noteDuration / 1000)),
    
    // Callbacks
    onNoteStart: (originalNote, index) => {
      // Piano-Taste hervorheben
      if (mergedOptions.highlightPianoKey) {
        component.currentHighlightedNote = originalNote;
      }
      
      // Callback für Notenstart
      if (mergedOptions.onNoteStart) {
        mergedOptions.onNoteStart(originalNote, index);
      }
    },
    
    onNoteEnd: mergedOptions.onNoteEnd,
    
    onComplete: () => {
      // Status zurücksetzen
      component.isPlaying = false;
      
      // Highlight zurücksetzen
      if (mergedOptions.highlightPianoKey) {
        component.currentHighlightedNote = null;
      }
      
      // Callback für Sequenzende
      if (mergedOptions.onComplete) {
        mergedOptions.onComplete();
      }
      
      console.log(`AUDIO: Sequenz für ${context} abgeschlossen`);
    },
    
    // Notentransformation für die Sound-Engine
    noteModifier: (note) => {
      // Wenn prepareNote definiert ist, aber wir wollen das Format für Tone.js beibehalten
      // Den Präfix hier nicht anwenden, nur für Event-basierte Kompatibilität
      return note;
    }
  };

  // Sequenz abspielen
  const sequenceControl = soundEngine.playSequence(noteArray, engineOptions);
  
  // Kontrollobjekt zurückgeben
  return {
    stop: () => {
      sequenceControl.stop();
      component.isPlaying = false;
      
      // Highlight zurücksetzen
      if (mergedOptions.highlightPianoKey) {
        component.currentHighlightedNote = null;
      }
      
      console.log(`AUDIO: Abbruch der Sequenz für ${context}`);
    }
  };
}

/**
 * Ersatz für die playMelodySequence Funktion in der Pitches-Komponente
 * 
 * @param {Object} component - Pitches-Komponenten-Instanz
 * @param {Array} notes - Array mit Notennamen
 * @param {String} context - Kontext-String
 * @param {String} melodyId - ID der Melodie
 * @returns {Object} Objekt mit stop-Funktion
 */
export function playToneMelodySequence(component, notes, context = 'sound-judgment', melodyId = null) {
  if (!notes || !notes.length) {
    console.warn(`AUDIO: Versuch, leere Melodie für ${context} abzuspielen`);
    return { stop: () => {} };
  }

  // Noteninformationen protokollieren
  let noteArray = [...notes];
  console.log(`AUDIO: Melodie-Sequenz für '${context}'${melodyId ? ` (${melodyId})` : ''} mit ${noteArray.length} Noten wird abgespielt`);
  
  // Standardwert für eine Viertelnote in Millisekunden
  let baseQuarterNoteDuration = 700;
  
  // Melodie-spezifische Tempi aus knownMelodies übernehmen
  if (melodyId && component.knownMelodies[melodyId] && component.knownMelodies[melodyId].quarterNoteDuration) {
    baseQuarterNoteDuration = component.knownMelodies[melodyId].quarterNoteDuration;
    console.log(`AUDIO: Melodie-spezifische Viertelnoten-Dauer: ${baseQuarterNoteDuration}ms für ${melodyId}`);
  }
  
  // Audio-Sequenz abspielen
  return playToneAudioSequence(component, noteArray, context, {
    // Noten für Sound Judgment transformieren - 'sound_' Präfix hinzufügen
    prepareNote: (note) => {
      // Für Noten mit Modifikatoren (z.B. 'C4:h') nur den Noten-Teil extrahieren
      if (typeof note === 'string' && note.includes(':')) {
        note = note.split(':')[0];
      }
      return `sound_${note.toLowerCase()}`;
    },
    
    // Bestimmte Viertelnoten-Dauer für diese Melodie verwenden
    noteDuration: baseQuarterNoteDuration,
    
    // Callback für Sequenzende
    onComplete: () => {
      console.log(`AUDIO: Sound Judgment Melodie-Wiedergabe abgeschlossen`);
    }
  });
}

/**
 * Stoppt alle aktiven Sequenzen
 */
export function stopAllToneSequences() {
  soundEngine.stopAllSequences();
}

/**
 * Direktes Abspielen einer einzelnen Note über die Tone.js-Engine
 */
export function playToneNote(note, duration = 0.4) {
  soundEngine.playNote(note, duration);
}
