/**
 * index.js - Central export point for all chord modules
 */

// Export specific functions from each module
// Common Module
export { testCommonModuleImport } from './common.js';

// Chord Color Matching Module
export { 
  testChordColorMatchingModuleImport,
  newColorMatchingQuestion,
  checkColorAnswer
} from './2_1_chord_color_matching.js';

// Chord Mood Landscapes Module
export { testChordMoodLandscapesModuleImport } from './2_2_chord_mood_landscapes.js';

// Chord Building Module
export { testChordBuildingModuleImport } from './2_3_chord_building.js';

// Missing Note Module
export { testMissingNoteModuleImport } from './2_4_missing_note.js';

// Chord Characters Module
export { testChordCharactersModuleImport } from './2_5_chord_characters.js';
