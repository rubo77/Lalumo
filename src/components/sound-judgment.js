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
export function playMelodyForSoundJudgment(component, generateNew = true) {
  // Get all melody keys
  const melodyKeys = Object.keys(component.knownMelodies);
  if (melodyKeys.length === 0) return;
  
  // If we should generate a new melody selection
  if (generateNew) {
    // Randomly decide if the melody should have a wrong note (50% chance)
    component.melodyHasWrongNote = Math.random() < 0.5;
    
    // Select a random melody from our collection
    const randomMelodyKey = melodyKeys[Math.floor(Math.random() * melodyKeys.length)];
    const selectedMelody = component.knownMelodies[randomMelodyKey];
    
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
    
    console.log('Generated sound judgment melody:', {
      name: component.currentMelodyName,
      hasWrongNote: component.melodyHasWrongNote,
      sequence: component.currentSequence
    });
  }
  
  // Hide any previous feedback
  component.showFeedback = false;
  
  // Play the melody
  component.playMelodySequence(component.currentSequence, 'sound-judgment');
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
