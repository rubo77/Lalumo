# Lalumo Draw a Melody Activity Plan

## Notes
- **Current focus:** The top priority issues are:
  - **Navigation between activities is not working**
  - **Answer checking bugs in "High or Low" (1_1)**
- Current focus: **Top Priority: Diagnose and fix navigation and answer checking bugs**, specifically:
  - Navigation between activities is still not working
  - In "High or Low" (1_1), all answers are marked as wrong regardless of choice
- User does not want to simply work through the TODO list; guidance will be provided step by step.
- Note highlighting on correct note hit is now implemented; confirm behavior.
- Root cause: `showFeedback` was used as both a variable and a function. User resolved by renaming the function. Feedback and highlighting now work as intended.
- New requirements: The same melody should persist until it is perfectly replayed; show a rainbow effect (as in 1_2) when the melody is mastered. Both are now implemented.
- Shared Playwright test utility (`test-utils.js`) created to handle username modal/setup logic for all tests
- All Playwright tests now refactored to use shared helper; others should follow
- There are currently many errors when starting the app; these must be investigated and resolved before further feature/test work continues
- The dev server port conflict has been resolved and the app is running; next, check for and diagnose any further startup errors or warnings in the running application.
- When running the first Playwright test, abort immediately if any error or JavaScript console error is detected; prioritize direct observation of browser console errors during test execution (per user instruction).
- First Playwright test (High or Low) aborted due to:
  - Alpine Expression Errors: `highOrLowProgress` and `correctAnswersCount` are not defined in the template expressions
  - Playwright strict mode error: locator('button:has-text("Generate")') matches multiple elements in username modal, causing test-utils.js to throw
- Playwright username modal strict mode error is now fixed (test-utils.js updated to select the primary button by class)
- Focus is now on restoring or adapting the missing progress variable(s) for High or Low, and updating the template to use the correct variable(s) so Alpine Expression Errors are resolved.
- Both the old pitches.js and pithes.js.new are available for reference. The correct progress variable for High or Low is `highOrLowProgress`, which should be tracked in the component and synced with `progress['1_1_pitches_high_or_low']` as before. This variable has now been reintroduced and synchronized in the High or Low module. Next step: verify if Alpine Expression Errors for this variable are resolved, then address any remaining errors (e.g., `correctAnswersCount`).
- There are additional Alpine Expression Errors for other variables: `unlockedPatterns`, `currentHighlightedNote`, `mascotSettings`, `showMascot`, etc. These must also be restored or initialized in the relevant Alpine components/modules. **It is crucial to note that all variables referenced in Alpine templates must exist in the global `pitches()` Alpine component, not just in module-local code. After modularization, variables that were previously globally available in the monolithic `pitches.js` are now only set in module-local scopes or not at all. Alpine templates still expect these variables to be present in the global `pitches()` Alpine component. Unless all referenced variables are initialized in the global scope, Alpine Expression Errors will occur, even if the migration steps (see dev/FILESTRUCTURE.md) are followed correctly. This is because Alpine templates do not have access to module-local variables; they rely on the global Alpine component for data. Therefore, it is essential to ensure that all necessary variables are initialized in the global `pitches()` Alpine component to resolve Alpine Expression Errors.**
- **After modularization, both all variables AND all functions referenced by Alpine templates (via x- directives) must be present in the global `pitches()` Alpine component. Failing to expose functions (e.g. checkHighOrLowAnswer, setMode, etc.) is a critical source of runtime errors and navigation/logic breakage.**
- **In addition to variables, any function referenced by Alpine templates (e.g. `checkHighOrLowAnswer`) must also be present in the global `pitches()` Alpine component. Modularization can break this if functions are only imported but not exposed on the Alpine data object. Exposing all Alpine-referenced functions on the global pitches() Alpine component is critical to prevent 'is not defined' runtime errors after modularization.**
- **After modularization, both all variables AND all functions referenced by Alpine templates (via x- directives) must be present in the global `pitches()` Alpine component. Failing to expose functions (e.g. checkHighOrLowAnswer, setMode, etc.) is a critical source of runtime errors and navigation/logic breakage.**
- **After migration, it is essential to document all additional pitfalls, lessons-learned, and required manual adjustments in dev/FILESTRUCTURE.md. This includes: ensuring all Alpine-referenced variables and functions are globally available, updating all imports/exports, verifying that audio and UI behaviors match the legacy implementation, and confirming that all navigation and answer-checking logic is fully functional.**
- Current issues: Navigation between activities is still not working; in "High or Low" (1_1), all answers are marked as wrong regardless of choice. These must be diagnosed and fixed next.
- Current focus: Diagnose and fix navigation and answer checking bugs, specifically:
  - Navigation between activities is still not working
  - In "High or Low" (1_1), all answers are marked as wrong regardless of choice

## Current Goal
**Top Priority: Diagnose and fix navigation and answer checking bugs in modularized code**

## Task List
- [x] Investigate and fix `this.showFeedback` context/definition bug so feedback is shown on success/failure
- [x] Implement note highlighting when correct note is hit
- [x] Confirm feedback and highlighting work as expected in "Draw a Melody"
- [x] Ensure the same melody persists until perfectly replayed
- [x] Show rainbow effect when melody is mastered (like in 1_2)
- [x] Implement slower advancement: 10x with 3 notes, then 10x with 4, etc.
- [x] Remove lowest octave from note range
- [x] Prevent duplicate puzzles and restrict second tone in High or Low
- [x] Implement level system for 'Does It Sound Right?' activity
- [x] Implement progress tracking, level initialization from preferences, and UI display for 'Does It Sound Right?'
- [x] Implement answer checking, streak, and export logic for 'Does It Sound Right?'
- [x] Integrate sound judgment progress/level with preferences export/import/reset
- [x] Add diagnostic logging for sound judgment progress/level changes
- [x] Investigate why 1_5_pitches_bad_rabbit.png is not transparent after edit
- [ ] Draw a Melody: reset all progress (not yet implemented)
- [ ] Note highlight should occur exactly when note is hit
- [ ] Android launcher icon is still white; fix icon generation and ensure correct icon is used
  - [x] Replace or repair ic_launcher_foreground.png so it is visible and not fully transparent
    - [x] Use the provided bird image as the new foreground for ic_launcher_foreground.png
    - [x] Update mobile-build.sh to generate mipmap icons from /src/images/app_icon.png
- [x] Version number in credits does not load; fix version display
- [x] Write a script to remove backgrounds from animal images, using top-left color as transparency reference, saving originals if not already present
- [x] Rerun background removal script with corrected path and verify rabbit image transparency
- [x] Investigate deployment/build pipeline and file propagation for static assets
- [x] Debug missing/incorrect activity container for progress display in 'Does It Sound Right?' activity
- [ ] Investigate how the progress display is handled in the activity container, and propose/implement a solution for persistent and clear progress/streak/level display during the activity.
- [x] Erstelle und dokumentiere ein Konzept für die File-Struktur und die Aufteilung von pitches.js in einzelne Activity-Module in dev/FILESTRUCTURE.md
- [x] Beginne mit der Umsetzung der modularen Aufteilung von pitches.js (Dateistruktur und common.js erstellt)
- [x] Erstelle Moduldateien für alle Einzelaktivitäten (1_1_high_or_low.js, 1_2_match_sounds.js, ...)
- [x] Migriere Funktionen aus pitches.js in die jeweiligen Moduldateien (common.js, 1_1_high_or_low.js, ...)
  - [x] Beginne mit Migration gemeinsamer Funktionen (z.B. afterInit) in common.js
  - [x] Migriere spezifische Aktivitätsfunktionen für Sound Judgment (1_4) in 1_4_sound_judgment.js
  - [x] Migriere spezifische Aktivitätsfunktionen für Draw a Melody (1_3) in 1_3_draw_melody.js
  - [x] Migriere spezifische Aktivitätsfunktionen für High or Low (1_1) in 1_1_high_or_low.js
  - [x] Migriere spezifische Aktivitätsfunktionen für Match Sounds (1_2) in 1_2_match_sounds.js
  - [x] Migriere spezifische Aktivitätsfunktionen für Memory Game (1_5) in 1_5_memory_game.js
  - [x] Alle Funktionsskelette aus pitches.js in die jeweiligen Moduldateien übertragen
  - [x] Vollständige Migration der Logik/Implementierung aus pitches.js in die Moduldateien und Anpassung aller Aufrufe/Imports
- [x] Vollständige Migration der Logik/Implementierung aus pitches.js in die Moduldateien und Anpassung aller Aufrufe/Imports
- [x] pitches.js als funktionierende Basis wiederhergestellt, nächster Schritt: Schrittweises Testen und Integration der Module
- [x] pitches.js löschen, wenn keine Referenzen mehr bestehen

## Current Goal
Restore/adapt progress variable for High or Low and fix template to resolve Alpine Expression Errors.