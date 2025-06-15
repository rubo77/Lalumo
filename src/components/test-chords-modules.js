/**
 * Test script to verify chord modules are working correctly
 */

// Import test functions from individual modules (direct imports)
import { testCommonModuleImport } from './2_chords/common.js';
import { testChordColorMatchingModuleImport } from './2_chords/2_1_chord_color_matching.js';
import { testChordMoodLandscapesModuleImport } from './2_chords/2_2_chord_mood_landscapes.js';
import { testChordBuildingModuleImport } from './2_chords/2_3_chord_building.js';
import { testMissingNoteModuleImport } from './2_chords/2_4_missing_note.js';
import { testChordCharactersModuleImport } from './2_chords/2_5_chord_characters.js';

// Run all test functions
console.log('Testing chord module imports:');
testCommonModuleImport();
testChordColorMatchingModuleImport();
testChordMoodLandscapesModuleImport();
testChordBuildingModuleImport();
testMissingNoteModuleImport();
testChordCharactersModuleImport();
console.log('All chord module tests completed!');
