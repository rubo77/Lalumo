/**
 * Sound Judgment Component
 * Implementation for the "Does It Sound Right?" activity
 * This is a helper module for the main pitches.js component
 */
export function initSoundJudgmentMode(component) {
  // Get the current language
  const languageSetting = localStorage.getItem('lalumo_language') || 'english';
  const language = languageSetting === 'german' ? 'de' : 'en';
  
  console.log('Initializing Sound Judgment Mode with language:', language);
  
  // Reset state variables specific to this activity
  component.melodyHasWrongNote = false;
  component.currentMelodyName = '';
  component.showFeedback = false;
  component.feedback = '';
  component.correctAnswer = null;
  component.isPlaying = false;
  component.melodyTimeouts = []; // Wichtig für das Tracking der Timeouts
  component.soundTimeoutId = null; // Für den Haupttimeout
  component.resetTimeoutId = null; // Für Reset-Timeouts
  
  // Implementiere die stopCurrentSound-Methode, falls nicht vorhanden
  if (!component.stopCurrentSound) {
    component.stopCurrentSound = function() {
      console.log('AUDIO: Stopping all current sounds in Sound Judgment');
      if (this.soundTimeoutId) clearTimeout(this.soundTimeoutId);
      if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
      if (this.melodyTimeouts) this.melodyTimeouts.forEach(clearTimeout);
      this.melodyTimeouts = []; // Array leeren
      this.isPlaying = false;
      document.querySelectorAll('.pitch-card.active').forEach(card => card.classList.remove('active'));
      window.audioEngine.stopAll(); // Zentrale Audio-Engine nutzen
    };
  }
  
  // Implementiere die playNoteSequence-Methode für zuverlässiges Abspielen
  if (!component.playNoteSequence) {
    component.playNoteSequence = function(noteArray, index) {
      console.log(`AUDIO: playNoteSequence called in Sound Judgment with index ${index}/${noteArray.length}`);
      
      // Sicherheitsprüfung für leere Arrays
      if (!noteArray || noteArray.length === 0) {
        console.error('AUDIO_ERROR: Empty note array passed to playNoteSequence');
        this.isPlaying = false;
        return;
      }
      
      // Wenn Ende der Sequenz erreicht, explizit alle Sounds stoppen und UI aktualisieren
      if (index >= noteArray.length) {
        console.log('AUDIO: End of note sequence reached in Sound Judgment, stopping all playback');
        // Melodie explizit stoppen und Status zurücksetzen
        this.stopMelody();
        return;
      }
      
      // Audio-Wiedergabe über die zentrale Audio-Engine
      const note = noteArray[index];
      
      // Extrahiere nur den Notennamen ohne Modifikator für die Audio-Engine
      let cleanNote = note;
      if (typeof note === 'string' && note.includes(':')) {
        cleanNote = note.split(':')[0];
      }
      
      // Berechne die Tonlänge für diese spezifische Note
      const duration = this.getNoteDuration(note);
      
      // Für Debug-Zwecke die abgespielte Note protokollieren
      console.log(`AUDIO: Playing note ${index+1}/${noteArray.length}: ${cleanNote} with duration ${duration}ms`);
      
      try {
        // Note über die Audio-Engine abspielen (nur den reinen Notennamen)
        window.audioEngine.playNote(cleanNote, 0.75);
      } catch (err) {
        console.error('AUDIO_ERROR: Error playing note in Sound Judgment:', err);
      }
      
      // Nächste Note mit Verzögerung abspielen
      const timeoutId = setTimeout(() => {
        // Wenn wir nicht mehr im Abspielmodus sind, abbrechen
        if (!this.isPlaying) {
          console.log('AUDIO: Playback was stopped externally, cancelling sequence');
          return;
        }
        
        // Timeout aus Liste entfernen, sobald er ausgeführt wurde
        const timeoutIndex = this.melodyTimeouts.indexOf(timeoutId);
        if (timeoutIndex !== -1) {
          this.melodyTimeouts.splice(timeoutIndex, 1);
        }
        
        // Nächste Note abspielen
        this.playNoteSequence(noteArray, index + 1);
      }, duration);
      
      // Timeout-ID im Array speichern für korrektes Tracking
      this.melodyTimeouts.push(timeoutId);
      
      // Für die letzte Note einen zusätzlichen Timeout setzen, um die Wiedergabe zu beenden
      if (index === noteArray.length - 1) {
        const finalTimeoutId = setTimeout(() => {
          console.log('AUDIO: Final note finished, resetting playback state');
          this.stopMelody();
        }, duration + 50);
        
        this.melodyTimeouts.push(finalTimeoutId);
      }
    };
  }
  
  // Methode für Tonlängenberechnung hinzufügen
  if (!component.getNoteDuration) {
    component.getNoteDuration = function(note) {
      // Hole melodiespezifisches Basistempo aus der aktuellen Melodie
      let baseDuration = 500; // Standardwert
      
      // Wenn eine aktuell ausgewählte Melodie vorhanden ist, versuche deren Tempo zu nutzen
      if (this.currentMelodyId && window.pitchesComponent && 
          window.pitchesComponent.knownMelodies && 
          window.pitchesComponent.knownMelodies[this.currentMelodyId] && 
          window.pitchesComponent.knownMelodies[this.currentMelodyId].quarterNoteDuration) {
        baseDuration = window.pitchesComponent.knownMelodies[this.currentMelodyId].quarterNoteDuration;
        console.log(`AUDIO: Using melody-specific tempo ${baseDuration}ms for ${this.currentMelodyId}`);
      }
      
      // Tonlänge basierend auf Notenmodifikatoren anpassen
      if (typeof note === 'string' && note.includes(':')) {
        const parts = note.split(':');
        const modifier = parts[1];
        
        // Verschiedene Notenwerte interpretieren
        switch(modifier) {
          case 'w': // ganze Note
            return baseDuration * 4;
          case 'h': // halbe Note
            return baseDuration * 2;
          case 'q': // viertelnote
            return baseDuration;
          case 'e': // achtelnote
            return baseDuration / 2;
          case 's': // sechzehntelnote
            return baseDuration / 4;
          default:
            return baseDuration;
        }
      }
      
      // Standardwert ist eine Viertelnote
      return baseDuration;
    };
  }
  
  // Füge explizite stopMelody-Methode hinzu
  if (!component.stopMelody) {
    component.stopMelody = function() {
      console.log('AUDIO: Explicitly stopping melody playback');
      // Rufe die umfassende stopCurrentSound-Methode auf
      this.stopCurrentSound();
      
      // Zeige an, dass keine Melodie mehr aktiv ist
      document.querySelectorAll('.play-button').forEach(btn => {
        btn.classList.remove('playing');
        btn.disabled = false;
      });
      
      // Statusaktualisierung für die UI
      document.querySelectorAll('.sound-status').forEach(el => {
        el.textContent = '';
      });
    };
  }
  
  // Show an introductory message
  component.mascotMessage = component.$store.strings?.sound_judgment_intro || 
    (language === 'de' 
      ? 'Hör dir die Melodie an! Klingt sie richtig? Oder ist da ein falscher Ton?'
      : 'Listen to the melody! Does it sound right? Or is there a wrong note?');
  
  // Track activity usage
  if (!component.progress['1_4_pitches_does-it-sound-right']) {
    component.progress['1_4_pitches_does-it-sound-right'] = 0;
  }
  
  // Show the mascot with help message
  setTimeout(() => {
    if (component.mascotMessage) {
      // Use native Android TTS if available
      try {
        if (window.AndroidTTS) {
          window.AndroidTTS.speak(component.mascotMessage);
        } 
        // Fallback to Web Speech API
        else if (window.speechSynthesis) {
          const speech = new SpeechSynthesisUtterance(component.mascotMessage);
          speech.lang = language === 'de' ? 'de-DE' : 'en-US';
          window.speechSynthesis.speak(speech);
        }
      } catch (error) {
        console.error('TTS error in sound judgment init:', error);
      }
    }
  }, 500);
}

/**
 * Play a melody for the sound judgment activity
 * @param {Object} component - The Alpine.js component instance
 * @param {boolean} generateNew - Whether to generate a new melody
 */
export async function playMelodyForSoundJudgment(component, generateNew = true) {
  // Verbindung zum Haupt-Pitches-Component herstellen (für Zugriff auf die knownMelodies)
  window.pitchesComponent = component;
  
  // Get all melody keys
  const melodyKeys = Object.keys(component.knownMelodies);
  if (melodyKeys.length === 0) {
    console.error('AUDIO_ERROR: No melodies available for Sound Judgment');
    return;
  }
  
  // WICHTIG: Immer zuerst alle aktiven Sounds stoppen, bevor eine neue Melodie startet
  // Dies verhindert, dass mehrere Melodien gleichzeitig abgespielt werden
  console.log('AUDIO: Explicitly stopping all sounds before playing new melody');
  component.stopCurrentSound();
  
  // Kurze Pause, um sicherzustellen, dass Audio-Engine Zeit hat, vorherige Sounds zu beenden
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // If we should generate a new melody selection
  if (generateNew) {
    // Randomly decide if the melody should have a wrong note (50% chance)
    component.melodyHasWrongNote = Math.random() < 0.5;
    
    // Select a random melody from our collection - aber nicht zweimal hintereinander die gleiche
    let randomMelodyKey;
    do {
      randomMelodyKey = melodyKeys[Math.floor(Math.random() * melodyKeys.length)];
    } while (randomMelodyKey === component.currentMelodyId && melodyKeys.length > 1);
    
    const selectedMelody = component.knownMelodies[randomMelodyKey];
    
    // Speichere die Melodie-ID, wichtig für korrekte Tonlängen
    console.log(`AUDIO: Selected melody ${randomMelodyKey} for playback`);
    component.currentMelodyId = randomMelodyKey;
    
    // Get the current language
    const languageSetting = localStorage.getItem('lalumo_language') || 'english';
    const language = languageSetting === 'german' ? 'de' : 'en';
    
    // Set the melody name in the appropriate language
    component.currentMelodyName = selectedMelody[language] || selectedMelody.en;
    
    // Create a copy of the melody notes
    let melodyToPlay = [...selectedMelody.notes];
    
    // If the melody should have a wrong note, modify it
    if (component.melodyHasWrongNote) {
      melodyToPlay = createWrongMelody(melodyToPlay);
    }
    
    // Set the current sequence for playback
    component.currentSequence = melodyToPlay;
    
    // Set the correct answer based on whether the melody has a wrong note
    component.correctAnswer = component.melodyHasWrongNote ? false : true;
    
    console.log('AUDIO: Generated sound judgment melody:', {
      id: component.currentMelodyId,
      name: component.currentMelodyName,
      hasWrongNote: component.melodyHasWrongNote,
      sequence: component.currentSequence,
      tempo: selectedMelody.quarterNoteDuration
    });
  } else {
    console.log(`AUDIO: Replaying current melody ${component.currentMelodyId}`);
  }
  
  // Hide any previous feedback
  component.showFeedback = false;
  
  // UMSTELLUNG: Verwende die zuverlässigere playNoteSequence statt playMelodySequence
  // Diese Methode ist robuster bei Start/Stop-Operationen, besonders auf Android
  console.log('AUDIO: Using reliable playNoteSequence method for sound judgment');
  
  // Setze isPlaying-Status - wichtig für korrekte Audio-Steuerung
  component.isPlaying = true;
  
  // UI-Aktualisierung - Play-Button disabled und als playing markieren
  document.querySelectorAll('.play-button').forEach(btn => {
    btn.classList.add('playing');
    btn.disabled = true;
  });
  
  // Statusmeldung aktualisieren
  document.querySelectorAll('.sound-status').forEach(el => {
    el.textContent = component.currentMelodyName || 'Melodie wird abgespielt...';
  });
  
  // Rufe direkt die playNoteSequence-Methode mit dem ersten Index auf
  if (component.currentSequence && component.currentSequence.length > 0) {
    // Prepare melodyTimeouts array if it doesn't exist
    if (!component.melodyTimeouts) {
      component.melodyTimeouts = [];
    }
    component.playNoteSequence(component.currentSequence, 0);
  } else {
    console.error('AUDIO_ERROR: No sequence available to play');
    component.stopMelody();
  }
}

/**
 * Create a melody with a wrong note
 * @param {Array} originalMelody - The original melody notes array
 * @returns {Array} Modified melody with a wrong note
 */
function createWrongMelody(originalMelody) {
  // Make a copy of the original melody
  const modifiedMelody = [...originalMelody];
  
  // Pick a random position to modify (not the first or last notes)
  const noteToModifyIndex = Math.floor(Math.random() * (modifiedMelody.length - 2)) + 1;
  
  // Extract the note to modify
  const noteToModify = modifiedMelody[noteToModifyIndex];
  
  // Extract the note letter and octave
  const noteLetter = noteToModify.substring(0, 1);
  const noteOctave = noteToModify.substring(1);
  
  // Possible note letters
  const possibleNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  // Get the index of the current note
  const currentNoteIndex = possibleNotes.indexOf(noteLetter);
  
  // Generate a wrong note that's different from the original
  let wrongNoteIndex;
  do {
    // Random shift between -2 and +2 semitones, but not 0
    const shift = Math.floor(Math.random() * 5) - 2;
    wrongNoteIndex = (currentNoteIndex + shift + possibleNotes.length) % possibleNotes.length;
  } while (wrongNoteIndex === currentNoteIndex);
  
  // Create the wrong note
  const wrongNote = possibleNotes[wrongNoteIndex] + noteOctave;
  modifiedMelody[noteToModifyIndex] = wrongNote;
  
  console.log(`Modified melody at position ${noteToModifyIndex}: ${noteToModify} -> ${wrongNote}`);
  
  return modifiedMelody;
}

/**
 * Check the user's sound judgment answer
 * @param {Object} component - The Alpine.js component instance
 * @param {boolean} userAnswer - User's answer (true = sounds good, false = sounds wrong)
 */
export function checkSoundJudgment(component, userAnswer) {
  // Get the current language
  const languageSetting = localStorage.getItem('lalumo_language') || 'english';
  const language = languageSetting === 'german' ? 'de' : 'en';
  
  // Compare user's answer with correct answer
  const isCorrect = userAnswer === component.correctAnswer;
  
  // Prepare feedback message
  if (isCorrect) {
    // Correct answer
    component.feedback = component.$store.strings?.sound_judgment_correct || 
      (language === 'de' 
        ? 'Super! Du hast richtig gehört!'
        : 'Great! Your ears are working well!');
    
    // Increment progress count for this activity
    component.progress['1_4_pitches_does-it-sound-right'] += 1;
    
    // Play success sound
    if (!component.playSuccessSound) {
      // Implementiere die Erfolgs-Sound-Methode, falls nicht vorhanden
      component.playSuccessSound = function() {
        console.log('AUDIO: Playing success sound using audio engine');
        try {
          // Erfolgs-Melodie: aufsteigendes Arpeggio (C-Dur)
          const successNotes = ['C4', 'E4', 'G4', 'C5'];
          const successDurations = [150, 150, 150, 400];
          
          // Stoppe zuerst alle laufenden Sounds
          window.audioEngine.stopAll();
          
          // Spiele die Erfolgs-Sequenz
          successNotes.forEach((note, index) => {
            setTimeout(() => {
              window.audioEngine.playNote(note, 0.7);
            }, successDurations.slice(0, index).reduce((a, b) => a + b, 0));
          });
        } catch (err) {
          console.error('Error playing success sound:', err);
        }
      };
    }
    component.playSuccessSound();
  } else {
    // Wrong answer
    if (component.melodyHasWrongNote) {
      component.feedback = component.$store.strings?.sound_judgment_wrong_has_mistake || 
        (language === 'de' 
          ? 'Hör genau hin! Da ist ein falscher Ton in der Melodie.'
          : 'Listen carefully! There is a wrong note in the melody.');
    } else {
      component.feedback = component.$store.strings?.sound_judgment_wrong_no_mistake || 
        (language === 'de' 
          ? 'Diese Melodie ist richtig! Es gibt keinen falschen Ton.'
          : 'This melody is correct! There is no wrong note.');
    }
    
    // Play error sound
    if (!component.playErrorSound) {
      // Implementiere die Fehler-Sound-Methode, falls nicht vorhanden
      component.playErrorSound = function() {
        console.log('AUDIO: Playing error sound using audio engine');
        try {
          // Fehler-Melodie: absteigende kleine Terz
          const errorNotes = ['E4', 'C4'];
          const errorDurations = [200, 400];
          
          // Stoppe zuerst alle laufenden Sounds
          window.audioEngine.stopAll();
          
          // Spiele die Fehler-Sequenz
          errorNotes.forEach((note, index) => {
            setTimeout(() => {
              window.audioEngine.playNote(note, 0.7);
            }, errorDurations.slice(0, index).reduce((a, b) => a + b, 0));
          });
        } catch (err) {
          console.error('Error playing error sound:', err);
        }
      };
    }
    component.playErrorSound();
  }
  
  console.log('Sound judgment check:', {
    userAnswer,
    correctAnswer: component.correctAnswer,
    isCorrect,
    melodyHasWrongNote: component.melodyHasWrongNote
  });
  
  // Show feedback
  component.showFeedback = true;
  
  // After showing feedback for 3 seconds, generate a new melody
  setTimeout(() => {
    // Hide feedback
    component.showFeedback = false;
    
    // After a short pause, generate a new melody if the answer was correct
    if (isCorrect) {
      setTimeout(() => {
        playMelodyForSoundJudgment(component, true);
      }, 500);
    }
  }, 3000);
}
