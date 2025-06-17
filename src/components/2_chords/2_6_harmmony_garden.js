/**
 * 2_6_harmmony_garden.js - Module for the "Harmony Garden" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Import Tone.js for audio processing
import Tone from 'tone';

// Import audio engine
import audioEngine from '../audio-engine.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 */
export function test2_6_harmmony_gardenModuleImport() {
  debugLog('CHORDS', 'Harmony Garden module successfully imported');
  return true;
}
