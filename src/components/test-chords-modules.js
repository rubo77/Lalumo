/**
 * Test script to verify chord modules are working correctly
 */

// Import test functions from the modules
import {
  testCommonModuleImport,
  testChordColorMatchingModuleImport,
  testChordMoodLandscapesModuleImport,
  testChordBuildingModuleImport,
  testMissingNoteModuleImport,
  testChordCharactersModuleImport
} from './2_chords/index.js';

// Run all test functions
console.log('Testing chord module imports:');
testCommonModuleImport();
testChordColorMatchingModuleImport();
testChordMoodLandscapesModuleImport();
testChordBuildingModuleImport();
testMissingNoteModuleImport();
testChordCharactersModuleImport();

console.log('All chord module tests completed');
