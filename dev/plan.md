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
- Reset buttons successfully moved to main navigation; individual header buttons removed and nav button styled.
- Confirmation dialog now displays specific activity name in reset prompt.
- User asked why we use a central `pitches/index.js` (and per-activity indirection) and whether it can be streamlined or removed.
- User decided to remove all `index.js` barrels and document this change.
- `pitches/index.js` file deleted and `dev/FILESTRUCTURE.md` updated; remaining code still needs direct-import refactor.
- `pitches/index.js` removed. First automated replacement in `pitches.js` produced duplicate/incorrect import lines; need manual cleanup across codebase.
- Direct-import refactor successfully applied in `pitches.js`; grep shows no remaining `index.js` barrel references and import block cleaned.
- Build passes successfully after cleanup; duplicates resolved.
- Activity visual & audio feedback guidelines documented in CODING_STANDARDS.md.
- Nav reset button context is outside the Alpine component; `$data.mode` is `undefined`. Need to expose current `mode` globally (Alpine store or `window`) so reset button can access it.
+ ``pitchMode`` store already existed; no further global exposure needed.
+ Reset dispatcher updated to inject `window.pitchesComponent` into individual reset functions.
+ `resetCurrentActivity` signature simplified; HTML updated to pass only `$store.pitchMode`; dispatcher now injects `window.pitchesComponent`; previous `component is undefined` error resolved.
+ Reset now runs without error but appears not to clear progress; user requested success message detailing what was reset (current and global).
+ Still encountering `component is undefined` runtime errors; window.pitchesComponent may not be set early enough or reset functions still expect a parameter.
+ Added extra debug logging in `resetCurrentActivity` to trace component availability; success feedback strings enhanced.
+ Added debug logs to `afterInit` registration; **logs do not appear** – indicates Alpine `afterInit()` may never run, so `window.pitchesComponent` not set prior to resets.
+ Discovered Alpine does not invoke `afterInit()`; global registration must occur in `init()` (or helper), and `afterInit` can be removed.
+ User mandated editing `pitches.js` via bash (sed) commands instead of direct edits.
+ Initial sed edits created duplicate `init()` and multiple `initializeAudioEngine()` methods; file requires cleanup.
- Sed miscommand wiped most of `pitches.js`; user restored file; proceed with cautious incremental import edits.
- Initial sed edits created duplicate `init()` and multiple `initializeAudioEngine()` methods; file requires cleanup.
+ Barrel removal extended to chords; `2_chords/index.js` deleted and direct exports added in `chords.js`.
+ New requirement: document common activity visuals (background, rainbow success, shaking error, success/error melodies) in `dev/CODING_STANDARDS.md`; export rainbow/melody utilities in shared file for reuse across chapters.
+ Shared feedback utilities module `src/effects/feedback.js` created (rainbow, shake, success/error sounds).
+ Build error: `components/chords.js` still imports deleted `./2_chords/index.js`; refactor to direct imports to resolve.
+ Build passes after removing all legacy `./2_chords/index.js` imports from chords components and tests; ready to integrate feedback utilities.
- User asked why we use a central `pitches/index.js` (and per-activity indirection) and whether it can be streamlined or removed.
- User decided to remove all `index.js` barrels and document this change.
- `pitches/index.js` file deleted and `dev/FILESTRUCTURE.md` updated; remaining code still needs direct-import refactor.
- `pitches/index.js` removed. First automated replacement in `pitches.js` produced duplicate/incorrect import lines; need manual cleanup across codebase.
- Direct-import refactor successfully applied in `pitches.js`; grep shows no remaining `index.js` barrel references and import block cleaned.
- Build passes successfully after cleanup; duplicates resolved.
- Activity visual & audio feedback guidelines documented in CODING_STANDARDS.md.
- Nav reset button context is outside the Alpine component; `$data.mode` is `undefined`. Need to expose current `mode` globally (Alpine store or `window`) so reset button can access it.
+ ``pitchMode`` store already existed; no further global exposure needed.
+ Reset dispatcher updated to inject `window.pitchesComponent` into individual reset functions.
+ `resetCurrentActivity` signature simplified; HTML updated to pass only `$store.pitchMode`; dispatcher now injects `window.pitchesComponent`; previous `component is undefined` error resolved.
+ Reset now runs without error but appears not to clear progress; user requested success message detailing what was reset (current and global).
+ Still encountering `component is undefined` runtime errors; window.pitchesComponent may not be set early enough or reset functions still expect a parameter.
+ Added extra debug logging in `resetCurrentActivity` to trace component availability; success feedback strings enhanced.
+ Added debug logs to `afterInit` registration; **logs do not appear** – indicates Alpine `afterInit()` may never run, so `window.pitchesComponent` not set prior to resets.
+ Discovered Alpine does not invoke `afterInit()`; global registration must occur in `init()` (or helper), and `afterInit` can be removed.
+ User mandated editing `pitches.js` via bash (sed) commands instead of direct edits.
+ Initial sed edits created duplicate `init()` and multiple `initializeAudioEngine()` methods; file requires cleanup.
- Sed miscommand wiped most of `pitches.js`; user restored file; proceed with cautious incremental import edits.
- Initial sed edits created duplicate `init()` and multiple `initializeAudioEngine()` methods; file requires cleanup.
+ Barrel removal extended to chords; `2_chords/index.js` deleted and direct exports added in `chords.js`.
+ New requirement: document common activity visuals (background, rainbow success, shaking error, success/error melodies) in `dev/CODING_STANDARDS.md`; export rainbow/melody utilities in shared file for reuse across chapters.
+ Shared feedback utilities module `src/effects/feedback.js` created (rainbow, shake, success/error sounds).
+ Build passes after removing all legacy `./2_chords/index.js` imports from chords components and tests; ready to integrate feedback utilities.
- User asked why we use a central `pitches/index.js` (and per-activity indirection) and whether it can be streamlined or removed.
- User decided to remove all `index.js` barrels and document this change.
- `pitches/index.js` file deleted and `dev/FILESTRUCTURE.md` updated; remaining code still needs direct-import refactor.
- `pitches/index.js` removed. First automated replacement in `pitches.js` produced duplicate/incorrect import lines; need manual cleanup across codebase.
- Direct-import refactor successfully applied in `pitches.js`; grep shows no remaining `index.js` barrel references and import block cleaned.
- Build passes successfully after cleanup; duplicates resolved.
- Activity visual & audio feedback guidelines documented in CODING_STANDARDS.md.
- Nav reset button context is outside the Alpine component; `$data.mode` is `undefined`. Need to expose current `mode` globally (Alpine store or `window`) so reset button can access it.
+ ``pitchMode`` store already existed; no further global exposure needed.
+ Reset dispatcher updated to inject `window.pitchesComponent` into individual reset functions.
+ `resetCurrentActivity` signature simplified; HTML updated to pass only `$store.pitchMode`; dispatcher now injects `window.pitchesComponent`; previous `component is undefined` error resolved.
+ Reset now runs without error but appears not to clear progress; user requested success message detailing what was reset (current and global).
+ Still encountering `component is undefined` runtime errors; window.pitchesComponent may not be set early enough or reset functions still expect a parameter.
+ Added extra debug logging in `resetCurrentActivity` to trace component availability; success feedback strings enhanced.
+ Added debug logs to `afterInit` registration; **logs do not appear** – indicates Alpine `afterInit()` may never run, so `window.pitchesComponent` not set prior to resets.
+ Discovered Alpine does not invoke `afterInit()`; global registration must occur in `init()` (or helper), and `afterInit` can be removed.
+ User mandated editing `pitches.js` via bash (sed) commands instead of direct edits.
+ Initial sed edits created duplicate `init()` and multiple `initializeAudioEngine()` methods; file requires cleanup.
- Sed miscommand wiped most of `pitches.js`; user restored file; proceed with cautious incremental import edits.
- Initial sed edits created duplicate `init()` and multiple `initializeAudioEngine()` methods; file requires cleanup.
+ Barrel removal extended to chords; `2_chords/index.js` deleted and direct exports added in `chords.js`.
+ New requirement: document common activity visuals (background, rainbow success, shaking error, success/error melodies) in `dev/CODING_STANDARDS.md`; export rainbow/melody utilities in shared file for reuse across chapters.
+ Shared feedback utilities module `src/effects/feedback.js` created (rainbow, shake, success/error sounds).
+ Build passes after removing all legacy `./2_chords/index.js` imports from chords components and tests; ready to integrate feedback utilities.

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
- [x] Remove individual reset buttons from activity headers.
- [x] Add single reset button to main navigation that calls `resetCurrentActivity`.
- [x] Adjust CSS/layout for nav reset button & ensure accessibility.
- [x] Update documentation (`dev/FILESTRUCTURE.md`) to note index.js removal.
- [x] Update concept (`dev/reset_buttons_concept.md`) to reflect index.js removal.
- [ ] Remove remaining `$data` usages across codebase.
- [x] Refactor imports in codebase that still reference `./pitches/index.js`.
- [x] Clean duplicate/incorrect import block in `src/components/pitches.js` and verify build.
- [x] Expose current `mode` globally for nav reset button.
- [x] Update nav reset button to use global mode and ensure `resetCurrentActivity` receives correct value.
- [x] Simplify `resetCurrentActivity` signature (remove unused component param) and adjust HTML call.
- [x] Verify reset button logs correct mode and confirmation dialog.
- [ ] Debug individual reset functions to ensure they actually reset progress/localStorage.
- [ ] Add user-facing success feedback listing what was reset for current and global resets.
- [x] Ensure `window.pitchesComponent` is reliably registered before any reset call (maybe move registration earlier or poll).
- [ ] Update individual reset functions to gracefully handle missing component (fallback to localStorage-only reset).
- [ ] Fix `component is undefined` errors during High or Low reset (test all activities).
- [ ] Provide final success feedback confirming reset completed and variables cleared.
- [x] Investigate why `afterInit()` is not executed (component mounting / x-init order) and ensure reliable `window.pitchesComponent` registration.
- [x] Move global registration from `afterInit()` to `init()` (add helper `initializeAudioAndRegister`) and remove unused `afterInit()`.
- [x] Remove duplicate `init()` and `initializeAudioEngine()` definitions from `pitches.js` and keep one clean implementation.
- [x] Clean up sed-introduced code duplication and formatting issues; verify build passes.
- [x] Update `dev/CODING_STANDARDS.md` with activity visual/feedback guidelines and examples.
- [x] Create shared `effects/feedback.js` exporting rainbow animation and success/error melodies for all chapters.
- [ ] Refactor existing chapters to use shared feedback utilities.
- [x] Create shared `effects/feedback.js` exporting rainbow animation and success/error melodies for all chapters.
- [x] Remove obsolete `./2_chords/index.js` import from `components/chords.js` and ensure direct imports.
- [ ] Refactor existing chapters to use shared feedback utilities.
- [x] Import shared feedback utilities in `pitches.js`
+ All small and big rainbow animations now use shared utilities.
+ Shared feedback utilities successfully imported into `pitches.js`; build still passes.
+ First duplicate rainbow animation replaced with `showRainbowSuccess()`; build still passes.
+ Second duplicate rainbow animation replaced with `showRainbowSuccess()`; build still passes.
+ Third duplicate rainbow animation replaced with `showRainbowSuccess()`; build passes.
+ Fourth duplicate rainbow animation replaced with `showRainbowSuccess()`; build passes.
+ Fifth duplicate rainbow animation replaced with `showRainbowSuccess()`; build passes.
+ Sixth duplicate rainbow animation replaced with `showRainbowSuccess()`; all rainbow animations unified.
- [ ] Replace duplicate feedback code in `pitches.js` with shared utilities
  - [x] Replace remaining rainbow animations with shared utilities (`showRainbowSuccess`/`showBigRainbowSuccess`) (all done)
  - [ ] Replace shake error animations with `showShakeError()`
  - [ ] Replace complete success/error animations with shared utilities

## Current Goal
- Replace shake & complete feedback duplicates