/**
 * Test script to verify chord modules are working correctly
 */

// Import debug utility
import { debugLog } from '../utils/debug.js';

// Import test functions from individual modules (direct imports)
import { testCommonModuleImport } from './2_chords/common.js';
import { testChordColorMatchingModuleImport } from './2_chords/2_1_chord_color_matching.js';
import { testChordBuildingModuleImport } from './2_chords/2_3_chord_building.js';
import { testMissingNoteModuleImport } from './2_chords/2_4_missing_note.js';
import { testChordCharactersModuleImport } from './2_chords/2_5_chord_characters.js';

// Run all test functions
debugLog('TEST', 'Testing chord module imports:');
testCommonModuleImport();
testChordColorMatchingModuleImport();
testChordBuildingModuleImport();
testMissingNoteModuleImport();
testChordCharactersModuleImport();
debugLog('TEST', 'All chord module tests completed!');
