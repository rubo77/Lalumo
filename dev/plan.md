# Musici – Reset Button Concept & Activity Progress

## Notes
- User reverted previous reset-handling code; wants a better-designed reset button located in the main navigation.
- A concept document (in dev/) is required, describing:
  - All progress/state variables per activity (e.g. `highOrLowProgress`, `drawMelodyLevel`, `levelSuccessCounter`, `soundJudgmentLevel`, `progress` object keys, related localStorage keys).
  - How the nav reset button determines the currently active activity and resets only its state.
  - Whether Alpine `$data` is still needed; if yes, justify, else propose simpler access (e.g. component methods or Alpine `$store`).
- Global project rules apply (no failsafes, use logging for diagnostics, etc.).
- User approved concept; implementation phase started.
- Encountering tool timeouts when editing large `pitches.js`; will proceed with incremental small edits per method to avoid failures.
- Codebase has been modularized into individual activity files (e.g., `1_1_high_or_low.js`), so reset methods will be added in these smaller modules instead of the monolithic `pitches.js`.
- Implemented `resetHighOrLow` and `resetMatchSounds` functions in their respective modules.
- Implemented `reset_1_3_DrawMelody_Progress` function in its module.
- Implemented `reset_1_4_SoundJudgment_Progress` and `reset_1_5_MemoryGame_Progress` functions in their modules.
- Exported all reset, dispatcher, and feedback functions centrally via `pitches/index.js`.
- Added `resetCurrentActivity` dispatcher and visual feedback implementation in `pitches/common.js`, globally accessible.
- Implemented `resetAllProgress` method and global feedback in `pitches/common.js`.
- Exported dispatcher & feedback via `pitches/index.js` and inserted first in-activity reset button (High or Low header); remaining headers still pending.
- Standardized long reset function names (`reset_<id>_<Activity>_Progress`) and updated imports across modules.
- Fixed missing `setupHighOrLowMode_1_1` import; all pitch activity headers now include reset buttons.
- Added consistent CSS styling & focus outlines for reset/back buttons.

## Task List
- [x] Implemented basic Draw-a-Melody functions (`toggleMelodyChallenge`, etc.).
- [x] Removed old window reset event listeners as per user revert.
- [x] Catalogue all activity progress variables & their localStorage keys.
- [x] Draft `dev/reset_buttons_concept.md` explaining nav reset design, variable mapping, and `$data` discussion.
- [x] Present concept to user for feedback and iterate.
- [x] Implement nav reset button in UI.
- [x] Implement `reset_1_1_DrawMelody_Progress` method.
- [x] Implement `reset_1_2_MatchSounds_Progress` method.
- [x] Implement `reset_1_3_DrawMelody_Progress` method.
- [x] Implement `reset_1_4_SoundJudgment_Progress` method.
- [x] Implement `reset_1_5_MemoryGame_Progress` method.
- [x] Export reset methods via central `pitches/index.js` for dispatcher.
- [x] Wire `resetCurrentActivity` dispatcher.
- [x] Provide visual feedback (`showResetFeedback`).
- [x] Implement `resetAllProgress` method for global reset.
- [x] Import `setupHighOrLowMode_1_1` into `pitches.js` to resolve runtime error.
- [x] Add reset button to all pitch activity headers.
- [x] Finalize reset button styling & accessibility.
- [ ] Remove remaining `$data` usages across codebase.

## Current Goal
Remove remaining `$data` usages across codebase