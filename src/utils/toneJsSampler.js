// Direct Tone.js global instance for instrument playback
import * as Tone from 'tone';
import { debugLog } from './debug';

// Global Tone.js instances - single instances for each instrument type
let pianoSampler = null;      // Piano sampler with MP3 samples
let violinSynth = null;        // Violin synth
let fluteSynth = null;         // Flute synth
let brassSynth = null;         // Brass synth
let doublebassSynth = null;    // Double Bass (double bass) synth

let isInitialized = false;     // Overall initialization status

/**
 * Initialize global Tone.js and all instruments
 * Call once at app startup
 */
export async function initToneJs() {
  // Avoid multiple initialization
  if (isInitialized) {
    debugLog("TONE_JS", "🎵 Already initialized, skipping");
    return;
  }
  
  debugLog("TONE_JS", "🎵 Starting global instrument initialization...");
  
  debugLog("TONE_JS", "Starting Tone.js context and initializing instruments");
  
  try {
    // Start Tone.js audio context (needed for audio to work)
    await Tone.start();
    debugLog("TONE_JS", "Tone.js audio context started successfully");
    
    // 1. Create piano sampler with MP3 samples
    pianoSampler = new Tone.Sampler({
      urls: {
        "C4": "C4.mp3",
        "D4": "D4.mp3",
        "E4": "E4.mp3",
        "F4": "F4.mp3",
        "G4": "G4.mp3",
        "A4": "A4.mp3",
        "B4": "B4.mp3",
      },
      baseUrl: "./sounds/piano/",
      volume: 15,
      release: 1,
      onload: () => {
        debugLog("TONE_JS", "🎹 Piano samples loaded!");
      }
    }).toDestination();
    
    // 2. Create violin synth - string-like sound with slow attack and vibrato
    violinSynth = new Tone.PolySynth(Tone.FMSynth, {
      maxPolyphony: 6
    }).set({
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.2,
        decay: 0.3,
        sustain: 0.7,
        release: 1.2
      },
      modulation: {
        type: "sine"
      },
      modulationEnvelope: {
        attack: 0.5,
        decay: 0.1,
        sustain: 0.2,
        release: 0.5
      },
      volume: 5
    });
    
    // Add subtle reverb to violin
    const violinReverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.2
    }).toDestination();
    violinSynth.connect(violinReverb);
    
    // 3. Create flute synth - airy, breathy sound
    fluteSynth = new Tone.PolySynth(Tone.AMSynth, {
      maxPolyphony: 4
    }).set({
      harmonicity: 2,
      oscillator: {
        type: "sine"
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.7,
        release: 1.2
      },
      modulation: {
        type: "square"
      },
      modulationEnvelope: {
        attack: 0.5,
        decay: 0.05,
        sustain: 0.3,
        release: 0.8
      },
      volume: 4
    });
    
    // Add flute-appropriate effects
    const fluteReverb = new Tone.Reverb({
      decay: 2,
      wet: 0.3
    }).toDestination();
    fluteSynth.connect(fluteReverb);
    
    // 4. Create brass synth - bold and brassy
    brassSynth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 4
    }).set({
      oscillator: {
        type: "sine",
        spread: 60
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.8,
        release: 0.4
      },
      portamento: 0.02,
      volume: 6
    }).toDestination();
    
    // 5. Create doublebass synth - deep, resonant string sound with bow attack
    debugLog("TONE_JS", "Creating doublebass synth...");
    doublebassSynth = new Tone.PolySynth(Tone.MonoSynth, {
      maxPolyphony: 1
    }).set({
      oscillator: {
        type: "sawtooth",  // Simple sawtooth for string-like sound
      },
      filter: {
        Q: 2,
        type: "lowpass",
        rolloff: -24,
        frequency: 800  // Lower filter for deep bass tone
      },
      envelope: {
        attack: 0.1,      // Slow attack for bow sound
        decay: 0.3,
        sustain: 0.8,
        release: 1.5
      },
      filterEnvelope: {
        attack: 0.08,
        decay: 0.5,
        sustain: 0.5,
        release: 1.5,
        baseFrequency: 80,
        octaves: 2.5,
        exponent: 3
      },
      portamento: 0.08,  // For smooth bass slides
      volume: 10        // Boost volume for better presence
    });
    
    // Add effects chain for doublebass
    const doublebassEQ = new Tone.EQ3({
      low: 6,           // Boost lows for deeper bass
      mid: 0,
      high: -6          // Reduce highs for warmth
    });
    
    const doublebassReverb = new Tone.Reverb({
      decay: 1.5,       // Natural room reverb
      wet: 0.12         // Just a touch of reverb
    });
    
    // Add subtle distortion for bow friction sound
    const doublebassDistortion = new Tone.Distortion({
      distortion: 0.05,
      wet: 0.1
    });
    
    // Connect effects chain
    if (doublebassSynth) {
      debugLog("TONE_JS", "Connecting doublebass effects chain...");
      doublebassSynth.chain(doublebassEQ, doublebassDistortion, doublebassReverb, Tone.Destination);
      debugLog("TONE_JS", "Doublebass synth ready with effects");
    } else {
      debugLog("TONE_JS", "ERROR: Failed to create doublebass synth!");
    }
    
    // Wait until all assets are loaded
    await Tone.loaded();
    
    // Final check of instrument status
    debugLog("TONE_JS", "🎵 Piano sampler ready: " + (pianoSampler !== null));
    debugLog("TONE_JS", "🎵 Violin synth ready: " + (violinSynth !== null));
    debugLog("TONE_JS", "🎵 Flute synth ready: " + (fluteSynth !== null));
    debugLog("TONE_JS", "🎵 Brass synth ready: " + (brassSynth !== null));
    debugLog("TONE_JS", "🎵 Doublebass synth ready: " + (doublebassSynth !== null));
    
    debugLog("TONE_JS", "🎵 All instruments initialized and ready");
    isInitialized = true;
    
  } catch (err) {
    debugLog("TONE_JS", "Error initializing Tone.js instruments:", err);
  }
}

/**
 * Play a piano note using the global Tone.js sampler
 */
export function playToneNote(note, duration = 0.8, velocity = 0.8) {
  try {
    // Make sure note is properly formatted
    note = note.toString().toUpperCase();
    
    // First check if Tone.js and sampler are ready
    if (!pianoSampler) {
      debugLog("TONE_JS", "No piano sampler available yet");
      return false;
    }
    
    // Play the note directly through Tone.js
    debugLog("TONE_JS", `Playing piano note ${note} (dur: ${duration}s, vel: ${velocity})`);
    pianoSampler.triggerAttackRelease(note, duration, Tone.now(), velocity);
    return true;
    
  } catch (err) {
    debugLog("TONE_JS", "Error playing piano note:", err);
    return false;
  }
}

/**
 * Play a violin note using the global synth
 */
export function playViolinNote(note, duration = 0.8, velocity = 0.8) {
  try {
    // Make sure note is properly formatted
    note = note.toString().toUpperCase();
    
    // First check if Tone.js and synth are ready
    if (!violinSynth) {
      debugLog("TONE_JS", "No violin synth available yet");
      return false;
    }
    
    // Play the note directly through Tone.js
    debugLog("TONE_JS", `Playing violin note ${note} (dur: ${duration}s, vel: ${velocity})`);
    violinSynth.triggerAttackRelease(note, duration, Tone.now(), velocity);
    return true;
    
  } catch (err) {
    debugLog("TONE_JS", "Error playing violin note:", err);
    return false;
  }
}

/**
 * Play a flute note using the global synth
 */
export function playFluteNote(note, duration = 0.8, velocity = 0.8) {
  try {
    // Make sure note is properly formatted
    note = note.toString().toUpperCase();
    
    // First check if Tone.js and synth are ready
    if (!fluteSynth) {
      debugLog("TONE_JS", "No flute synth available yet");
      return false;
    }
    
    // Play the note directly through Tone.js
    debugLog("TONE_JS", `Playing flute note ${note} (dur: ${duration}s, vel: ${velocity})`);
    fluteSynth.triggerAttackRelease(note, duration, Tone.now(), velocity);
    return true;
    
  } catch (err) {
    debugLog("TONE_JS", "Error playing flute note:", err);
    return false;
  }
}

/**
 * Play a brass note using the global synth
 */
export function playBrassNote(note, duration = 0.8, velocity = 0.2) {
  try {
    // Make sure note is properly formatted
    note = note.toString().toUpperCase();
    
    // First check if Tone.js and synth are ready
    if (!brassSynth) {
      debugLog("TONE_JS", "No brass synth available yet");
      return false;
    }
    
    // Play the note directly through Tone.js
    debugLog("TONE_JS", `Playing brass note ${note} (dur: ${duration}s, vel: ${velocity})`);
    brassSynth.triggerAttackRelease(note, duration, Tone.now(), velocity);
    return true;
    
  } catch (err) {
    debugLog("TONE_JS", "Error playing brass note:", err);
    return false;
  }
}

/**
 * Play a doublebass note using the global synth
 */
export function playDoubleBassNote(note, duration = 0.8, velocity = 0.8) {
  try {
    // Make sure note is properly formatted
    note = note.toString().toUpperCase();
    
    // First check if Tone.js and synth are ready
    if (!doublebassSynth) {
      debugLog("TONE_JS", "No doublebass synth available yet - attempting to re-initialize");
      
      // Force re-init of Tone.js as a recovery attempt
      if (!isInitialized) {
        initToneJs();
        return false; // Return false for now, next call might succeed
      }
      return false;
    }
    
    // Lower the note by one octave to get real double bass range
    // Only if the note doesn't already specify an octave below 4
    if (note.includes('4') || note.includes('5') || note.includes('6')) {
      note = note.replace(/([A-G][#b]?)([4-6])/, function(match, noteName, octave) {
        return noteName + (parseInt(octave) - 1);
      });
    }
    
    // Play the note directly through Tone.js
    debugLog("TONE_JS", `Playing doublebass note ${note} (dur: ${duration}s, vel: ${velocity})`);
    doublebassSynth.triggerAttackRelease(note, duration, Tone.now(), velocity);
    return true;
    
  } catch (err) {
    debugLog("TONE_JS", "Error playing doublebass note:", err);
    return false;
  }
}

/**
 * Check if Tone.js and all instruments are initialized
 */
export function isToneJsReady() {
  return isInitialized;
}

/**
 * Check if a specific instrument is ready
 * @param {string} instrument - 'piano', 'violin', 'flute', or 'brass'
 * @returns {boolean} - Whether the instrument is ready
 */
export function isInstrumentReady(instrument) {
  // First check if Tone.js is ready overall
  if (!isInitialized) {
    debugLog("INSTRUMENT_CHECK", `Tone.js not initialized yet when checking ${instrument}`);
    return false;
  }

  let result = false;
  
  // Check specific instrument
  switch (instrument.toLowerCase()) {
    case 'piano':
      result = pianoSampler !== null;
      break;
    case 'violin':
      result = violinSynth !== null;
      break;
    case 'flute':
      result = fluteSynth !== null;
      break;
    case 'brass':
      result = brassSynth !== null;
      break;
    case 'doublebass':
      result = doublebassSynth !== null;
      break;
    default:
      result = false;
  }
  
  debugLog("INSTRUMENT_CHECK", `Instrument ${instrument} ready: ${result}`);
  return result;
}

/**
 * Universal instrument playback function
 * @param {string} instrument - 'piano', 'violin', 'flute', or 'brass'
 * @param {string} note - Note to play (e.g. 'C4')
 * @param {number} duration - Duration in seconds
 * @param {number} velocity - Volume (0-1)
 * @returns {boolean} - Whether the note was played
 */
export function playInstrument(instrument, note, duration = 0.8, velocity = 0.8) {
  // Select the appropriate play function based on instrument
  switch(instrument.toLowerCase()) {
    case 'piano':
      return playToneNote(note, duration, velocity);
    case 'violin':
      return playViolinNote(note, duration, velocity);
    case 'flute':
      return playFluteNote(note, duration, velocity);
    case 'brass':
      return playBrassNote(note, duration, velocity);
    case 'doublebass':
      return playDoubleBassNote(note, duration, velocity);
    case 'tuba':  // Map 'tuba' to 'brass' for backwards compatibility
      return playBrassNote(note, duration, velocity);
    default:
      debugLog("TONE_JS", `Unknown instrument: ${instrument}`);
      return false;
  }
}

/**
 * Play a note using the global piano sampler
 * @param {string} note - The note to play (e.g., "C4")
 * @param {number} duration - Duration in seconds
 * @param {number} velocity - Note velocity (0-1)
 * @param {boolean} is1_5Activity - Whether this is the 1_5 memory game activity (no fallback)
 * @returns {boolean} - Whether the note was played
 */
export function playToneNoteWithBufferCheck(note, duration = 0.8, velocity = 0.8, is1_5Activity = false) {
  // Normalize parameters
  note = note.toString().toUpperCase();
  
  // Boost quiet notes
  if (velocity < 0.5) velocity = 0.7;
  
  // For 1_5 activity, check if this specific note's buffer is ready
  const specificNoteReady = pianoState.noteBuffers[note] === true;
  
  // Run a buffer check if needed
  if (!specificNoteReady) {
    // Try to refresh buffer status
    checkAllNoteBuffers();
  }
  
  // If in 1_5 activity and note buffer isn't specifically ready, don't play
  if (is1_5Activity && !specificNoteReady) {
    debugLog(['PIANO', '1_5'], `Skipping note ${note} - specific buffer not ready yet`);
    return false;
  }
  
  try {
    // Only attempt to play if the sampler exists
    if (pianoState.sampler) {
      // Final buffer confirmation before playing
      if (pianoState.sampler.loaded && 
          pianoState.sampler.buffers && 
          pianoState.sampler.buffers.has(note)) {
        
        debugLog('PIANO', `🔈 Playing note: ${note} (dur: ${duration}, vel: ${velocity})`);
        pianoState.sampler.triggerAttackRelease(note, duration, Tone.now(), velocity);
        return true;
      } else {
        debugLog('PIANO', `❌ Buffer definitely not ready for note ${note}`);
        return false;
      }
    }
    return false;
  } catch (err) {
    debugLog(['PIANO', 'ERROR'], `Error playing note: ${err.message || err}`);
    return false;
  }
}

// No code here - old implementations removed
