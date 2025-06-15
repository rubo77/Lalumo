/**
 * index.js - Central export point for all pitch modules
 */

// Export specific functions from each module
// Common Module
export { testCommonModuleImport, resetCurrentActivity, showResetFeedback, resetAllProgress } from './common.js';

// High or Low Module
export { resetHighOrLow } from './1_1_high_or_low.js';

// Match Sounds Module
export { testMatchSoundsModuleImport, resetMatchSounds } from './1_2_match_sounds.js';

// Draw Melody Module
export { testDrawMelodyModuleImport, resetDrawMelody } from './1_3_draw_melody.js';

// Sound Judgment Module
export { testSoundJudgmentModuleImport, resetSoundJudgment } from './1_4_sound_judgment.js';

// Memory Game Module
export { testMemoryGameModuleImport, resetMemoryGame } from './1_5_memory_game.js';
