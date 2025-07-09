// Direct Tone.js global instance for piano playback
import * as Tone from 'tone';
import { debugLog } from './debug';

// Global tone.js sampler instance - this is the ONLY instance we'll use
let pianoSampler = null;
let isInitialized = false;

/**
 * Initialize global Tone.js and piano sampler
 * Call once at app startup
 */
export async function initToneJs() {
  // Avoid multiple initialization
  if (isInitialized) return;
  
  debugLog("PIANO", "Starting Tone.js context and initializing piano");
  
  try {
    // Start Tone.js audio context (needed for audio to work)
    await Tone.start();
    debugLog("PIANO", "Tone.js audio context started successfully");
    
    // Create one single piano sampler
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
        debugLog("PIANO", "🎹 Piano samples loaded!");
        isInitialized = true;
      }
    }).toDestination();
    
    // Wait until everything is loaded
    await Tone.loaded();
    debugLog("PIANO", "All Tone.js assets fully loaded");
    
  } catch (err) {
    debugLog("PIANO", "Error initializing Tone.js:", err);
  }
}

/**
 * Play a piano note using the global Tone.js sampler
 */
export function playPianoNote(note, duration = 0.8, velocity = 0.8) {
  try {
    // Make sure note is properly formatted
    note = note.toString().toUpperCase();
    
    // First check if Tone.js and sampler are ready
    if (!pianoSampler) {
      debugLog("PIANO_DIRECT", "No sampler available yet");
      return false;
    }
    
    // Play the note directly through Tone.js
    debugLog("PIANO_DIRECT", `Playing note ${note} (dur: ${duration}s, vel: ${velocity})`);
    pianoSampler.triggerAttackRelease(note, duration, Tone.now(), velocity);
    return true;
    
  } catch (err) {
    debugLog("PIANO_DIRECT", "Error playing note:", err);
    return false;
  }
}

/**
 * Check if the piano sampler is initialized
 */
export function isPianoReady() {
  return isInitialized && pianoSampler !== null;
}

/**
 * Play a note using the global piano sampler
 * @param {string} note - The note to play (e.g., "C4")
 * @param {number} duration - Duration in seconds
 * @param {number} velocity - Note velocity (0-1)
 * @param {boolean} is1_5Activity - Whether this is the 1_5 memory game activity (no fallback)
 * @returns {boolean} - Whether the note was played
 */
export function playPianoNoteWithBufferCheck(note, duration = 0.8, velocity = 0.8, is1_5Activity = false) {
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
    console.log(`[PIANO] [1_5] Skipping note ${note} - specific buffer not ready yet`);
    return false;
  }
  
  try {
    // Only attempt to play if the sampler exists
    if (pianoState.sampler) {
      // Final buffer confirmation before playing
      if (pianoState.sampler.loaded && 
          pianoState.sampler.buffers && 
          pianoState.sampler.buffers.has(note)) {
        
        console.log(`[PIANO] 🔈 Playing note: ${note} (dur: ${duration}, vel: ${velocity})`);
        pianoState.sampler.triggerAttackRelease(note, duration, Tone.now(), velocity);
        return true;
      } else {
        console.log(`[PIANO] ❌ Buffer definitely not ready for note ${note}`);
        return false;
      }
    }
    return false;
  } catch (err) {
    console.error("[PIANO] Error playing note:", err);
    return false;
  }
}

// No code here - old implementations removed
