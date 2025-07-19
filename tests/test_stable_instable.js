/**
 * Test script for 2_2_chords_stable_unstable.js
 * Run this in the browser console to test the stable/unstable chord functionality
 */

// Import the functions we want to test
import { 
  generateStableChord, 
  generateUnstableChord, 
  checkStableUnstableMatch,
  playStableUnstableChord
} from '../src/components/2_chords/2_2_chords_stable_unstable.js';

// Test environment debug logging utility
// Uses console.log directly since this is test-time logging where console output is expected
const debugLog = (module, message, ...args) => {
  // For test files, always log since it's test/development time
  if (args.length > 0) {
    console.log(`[${module}] ${message}`, ...args);
  } else {
    console.log(`[${module}] ${message}`);
  }
};

const debugError = (module, message, ...args) => {
  if (args.length > 0) {
    console.error(`[${module}] ${message}`, ...args);
  } else {
    console.error(`[${module}] ${message}`);
  }
};

// Test data
const testCases = [
  { type: 'stable', func: generateStableChord, desc: 'Stable Chord Generation' },
  { type: 'unstable', func: generateUnstableChord, desc: 'Unstable Chord Generation' }
];

// Helper function to run tests
async function runTests() {
  debugLog('STABLE_UNSTABLE_TEST', '=== Starting Stable/Unstable Chord Tests ===');
  
  // Test 1: Verify chord generation functions return arrays of note names
  debugLog('STABLE_UNSTABLE_TEST', '\n--- Test 1: Chord Generation ---');
  testCases.forEach(({ type, func, desc }) => {
    try {
      const chord = func();
      debugLog('STABLE_UNSTABLE_TEST', `✓ ${desc}: Success`);
      debugLog('STABLE_UNSTABLE_TEST', `   Generated ${type} chord:`, chord);
      
      // Verify it's an array with 6 notes
      if (!Array.isArray(chord) || chord.length !== 6) {
        throw new Error(`Expected array of 6 notes, got ${chord.length}`);
      }
      
      // Verify each note is a string in the format 'A4', 'B#3', etc.
      chord.forEach((note, i) => {
        if (typeof note !== 'string' || !/^[A-G][#b]?\d+$/.test(note)) {
          throw new Error(`Invalid note format at position ${i}: ${note}`);
        }
      });
      
      debugLog('STABLE_UNSTABLE_TEST', '   ✓ Note format validation passed');
      
    } catch (error) {
      debugError('STABLE_UNSTABLE_TEST', `✗ ${desc} failed:`, error.message);
    }
  });
  
  // Test 2: Verify checkStableUnstableMatch function
  debugLog('STABLE_UNSTABLE_TEST', '\n--- Test 2: Answer Checking ---');
  try {
    // Mock the currentChordType that would be set by playStableUnstableChord
    const originalCurrentChordType = window.currentChordType;
    
    // Test correct guess for stable
    window.currentChordType = 'stable';
    const isCorrectStable = checkStableUnstableMatch('stable', { progress: {} });
    debugLog('STABLE_UNSTABLE_TEST', `✓ Stable chord check (should be true): ${isCorrectStable}`);
    
    // Test incorrect guess for stable
    const isIncorrectStable = checkStableUnstableMatch('unstable', { progress: {} });
    debugLog('STABLE_UNSTABLE_TEST', `  Incorrect guess for stable (should be false): ${isIncorrectStable}`);
    
    // Test correct guess for unstable
    window.currentChordType = 'unstable';
    const isCorrectUnstable = checkStableUnstableMatch('unstable', { progress: {} });
    debugLog('STABLE_UNSTABLE_TEST', `✓ Unstable chord check (should be true): ${isCorrectUnstable}`);
    
    // Test incorrect guess for unstable
    const isIncorrectUnstable = checkStableUnstableMatch('stable', { progress: {} });
    debugLog('STABLE_UNSTABLE_TEST', `  Incorrect guess for unstable (should be false): ${isIncorrectUnstable}`);
    
    // Test with no current chord type
    window.currentChordType = null;
    const noChordResult = checkStableUnstableMatch('stable', { progress: {} });
    debugLog('STABLE_UNSTABLE_TEST', `  No current chord (should be false): ${noChordResult}`);
    
    // Restore original value
    window.currentChordType = originalCurrentChordType;
    
  } catch (error) {
    debugError('STABLE_UNSTABLE_TEST', '✗ Answer checking test failed:', error);
  }
  
  // Test 3: Verify progress tracking
  debugLog('STABLE_UNSTABLE_TEST', '\n--- Test 3: Progress Tracking ---');
  try {
    const testKey = 'test_progress_key';
    const originalProgress = localStorage.getItem('lalumo_chords_progress');
    
    // Test progress increment on correct answer
    localStorage.setItem('lalumo_chords_progress', JSON.stringify({ [testKey]: 5 }));
    window.currentChordType = 'stable';
    
    const component = {
      progress: { [testKey]: 5 }
    };
    
    // Simulate correct answer
    checkStableUnstableMatch('stable', component);
    
    // Check if progress was incremented
    const updatedProgress = JSON.parse(localStorage.getItem('lalumo_chords_progress'));
    debugLog('STABLE_UNSTABLE_TEST', `✓ Progress increment (should be 6): ${updatedProgress[testKey]}`);
    
    // Test level reset on incorrect answer
    localStorage.setItem('lalumo_chords_progress', JSON.stringify({ [testKey]: 12 }));
    component.progress[testKey] = 12;
    
    // Simulate incorrect answer (should reset to 10, the start of the current level)
    checkStableUnstableMatch('unstable', component);
    
    const resetProgress = JSON.parse(localStorage.getItem('lalumo_chords_progress'));
    debugLog('STABLE_UNSTABLE_TEST', `✓ Level reset on incorrect (should be 10): ${resetProgress[testKey]}`);
    
    // Clean up
    if (originalProgress !== null) {
      localStorage.setItem('lalumo_chords_progress', originalProgress);
    } else {
      localStorage.removeItem('lalumo_chords_progress');
    }
    
  } catch (error) {
    debugError('STABLE_UNSTABLE_TEST', '✗ Progress tracking test failed:', error);
  }
  
  debugLog('STABLE_UNSTABLE_TEST', '\n=== Testing Complete ===');
}

// Run the tests
runTests().catch(error => debugError('STABLE_UNSTABLE_TEST', 'Test execution failed:', error));
