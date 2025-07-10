# Asset Sync & Build Debug Plan (ARCHIVED)

## Notes
- Sound assets are synced for Android and iOS via general rsync from public/ to dist/; there is no filtering for unused sound files (all are included).
- Images are filtered and only used ones are copied to Android assets, but for the web build, all public/ assets should be available unless excluded or mishandled by the build process.
- .gitignore excludes /ios/App/App/public/ and /android/app/src/main/assets/public/ so these are not tracked by git.
- User reported that an image (2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg) is missing from the webpack web build at /app/images/backgrounds/.
- Confirmed: image exists in public/, but is missing in dist/app/images/backgrounds/ after build.
- Webpack config includes a rule to copy backgrounds to app/images/backgrounds/, but the image is not present there after build; next step is to debug why this copy is not occurring as expected.
- Fixed error in ios-build.sh where it tried to copy to dist/app/ after deletion; script now only copies to dist/.
- ios-build.sh now runs successfully after fix (no errors).
- Confirmed: dist/app/images/backgrounds/ directory does not exist after build, even though image is present in dist/images/backgrounds/.
- Discovered: mobile-build.sh deletes dist/app/ after build (lines 217-218), causing loss of app/images/backgrounds/ and other assets copied there by webpack.
- Refactored mobile-build.sh to preserve dist/app/ and its assets after build (no deletion).
- Refactored ios-build.sh to preserve dist/app/ and its assets after build (no deletion).
- User requested to merge ios-build.sh logic into mobile-build.sh using a flag, since differences are minimal.
- User noted that the sound asset check/copy in build scripts is redundant and has been removed, as the whole public directory is already synced.
- ios-build.sh logic is being merged into mobile-build.sh; ios-build.sh will be deleted after migration is complete.
- Detection and opening of Android Studio/Xcode has been removed from build script per user request.
- Two new background images (2_5_chords_dog_with_melodica_cat_kibitz_squirrel_octopus_sleeping.png and 2_5_chords_dog_cat_owl_sleeping_squirrel_sleeping_octopus.png) need to be integrated into the background progression logic of 2_5_chord_characters.js as per user request.
- User requested cheatcodes in importProgress: entering <activity_id>:<progress-level> (e.g. 2_5:19) sets the progress for that activity; for activities needing two values, a one-letter prefix can be used for the second value.
- 2_5_chords_color_matching: at progress >=30, chords should vary in height by a transpose factor of ±6 semitones (see chords.js#L983-1006); until 40, squirrel and octopus buttons should be display:none, at 50 only octopus display:none, at 60 all visible again; texts need to be updated.
- At progress >=30, diminished/augmented chords must not be selected or played; currently, a diminished chord is played at progress 30 due to new-level logic—this needs fixing.
- Cheatcode for 2_5 activity does not update progress as expected; investigate and fix cheatcode logic in app.js.
- Investigation ongoing: At progress 30, diminished chords are still being played, indicating the selection logic fix is not complete.
- User requested: Between progress 30-39, random chord selection should allow up to 3 consecutive repeats of the same chord type (limit should be relaxed in this range).
- User reported that an image (2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg) is missing from the webpack web build at /app/images/backgrounds/.
- User reported: Chord transposition (transpose ±6 semitones) at progress >=30 is not working as expected and needs debugging/fixing.
- Chord transposition bug: baseNotes object extended to cover full ±6 semitone range (F#2–F#5), but transpose behavior at progress >=30 is still incorrect.
- Investigation: Transpose value is generated, but playback always uses same root note (C4); currently reviewing how/where the rootNote is passed to playChord/playChordByType.
- Investigation is focused on why the random transpose is not being applied during playback, despite being generated.
- User requested to log the actual transpose value used in playback for debugging purposes.
- Debug logging for transpose value in playback has been added; now verifying if/why transposition is not applied during playback.
- Verified: Transpose value is being logged, but remains 0 at high progress (e.g. 68); root cause appears to be that transposition is only calculated when currentChordType is null, so after the first chord, no new transpose value is generated for subsequent chords.
- Root cause: Transpose value is only generated once per session/chord type; must refactor so a new transpose value is generated for every chord/playback at progress >=30.
- Solution in progress: Add a generateTranspose() function and call it on every chord/playback to ensure correct randomization and application of transpose at progress >=30.
- generateTranspose function implemented. Syntax issue fixed; now must ensure it is called on every chord playback.
- generateTranspose is now called on every chord playback; transposition logic is fully integrated and correct.
- New requirement: For progress <10, allow up to 3 consecutive repeats of the same chord; for all other progress levels (except 30–39), no repeats allowed.
- New requirement: In game mode, the transpose value must persist for the current question until the correct answer is given (the same transposed chord is replayed until solved).
- Chord repetition and transpose persistence logic updated: max 3 repeats for progress <10 and 30–39, 0 repeats otherwise; transpose value is now stored and reused for the current question until answered correctly.
- Clarification: After a correct answer, a new transposition is generated for the next question. After an incorrect answer, the same chord and transposition are repeated until solved.
- Chord/transposition persistence logic is now: after a correct answer, both chord and transpose are regenerated; after a wrong answer, the same chord and transpose are repeated for retries until solved.
- Chord/transposition repetition after a wrong answer must be strictly identical to the version played when the user presses the play button again after a mistake (full persistence of both chord and transpose until solved).
- Implementation now guarantees strict persistence of chord & transpose after error, including replay via play button, until solved.
- Confirmed: Implementation guarantees strict persistence of chord & transpose after error, including replay via play button, until solved.
- Confirmed: Chord and transpose persistence logic works as expected after error, including replay via play button, until solved.
- Persistence bug not fully fixed: after a wrong answer, the replayed chord sometimes uses a different transposition than the play button; strict persistence of both rootNote and transposeAmount is still not guaranteed in all cases; further debugging and refactoring needed in playCurrent2_5Chord and playChordByType.
- Persistence bug after wrong answer: strict persistence of rootNote and transposeAmount is not guaranteed; debugging and refactoring needed in playCurrent2_5Chord and playChordByType.
- Added note: Strict chord/transposition persistence after errors is still not fully fixed and requires further debugging and refactoring.
- Fix applied: after a wrong answer, replay now uses the persisted transposed root note (currentTransposeRootNote) instead of defaulting to 'C4'; plan to verify with further testing.
- Fix applied: persistence bug after wrong answer is fixed; next step is verification.

## Task List
- [x] Add debug logging to show the actual transpose value used for playback
- [x] Refactor: Generate a new transpose value for every chord/playback at progress >=30
- [x] Review and update random chord repetition limit at progress 30-39 (allow up to 3 repeats)
- [x] Fix chord selection logic at progress >=30 so diminished/augmented chords are not selected or played
- [x] Fix cheatcode logic for 2_5 so progress is updated as expected
- [x] Implement 2_5_chords_color_matching logic:
  - [x] Vary chord height (transpose ±6) at progress >=30
  - [x] Button visibility: squirrel/octopus display:none until 40, only octopus display:none until 60, all visible at 60+
  - [x] Update texts to reflect new logic
- [x] Update 2_5_chord_characters.js background progression logic to include new images
- [x] Implement cheatcode handling in importProgress for activity progress setting
- [x] Update chord repetition and transpose persistence logic per new requirements
- [x] Refine transpose/chord persistence: new on correct, repeat on wrong
- [x] Debug and fix: after wrong answer, ensure replayed chord and play button always use the same persisted rootNote and transposeAmount until solved
- [ ] Verify strict chord/transposition persistence after errors

## Current Goal
Verify strict chord/transposition persistence after errors

# Multi-Touch Handling for Android Chrome

## Notes
- User wants multi-touch handling: when multi-touch is detected, all other touches should be ignored and only the last touch should trigger the button.
- Target: Chrome on Android 15 (mobile web, possibly PWA or hybrid app context).
- Touch event handlers are found in index.html, app.js, pitches.js, chords.js, and other component files.
- No global addEventListener("touch...") found, but touchstart is handled in various places (including AlpineJS inline handlers).
- Debug logging is available via debugLog utility.
- Multi-touch handler utility (touch-handler.js) implemented to process only the last touch on Android Chrome.
- User wants multi-touch handler to run on all browsers, not just Android Chrome, and reports that browser detection may not be working as intended.
- Multi-touch handler refactored to run on all browsers (browser detection removed).
- Debug logging for multi-touch events improved and made consistent with app-wide debugLog usage.
- App initialization and multi-touch handler are both being called twice (double initialization bug observed in logs).
- Multi-touch handler throws an error when lastTouchTarget is null (needs null check). Null check implemented; error should be resolved.
- Investigating root cause of double initialization by reviewing HTML/app structure and AlpineJS usage.
- Alpine.js warning: "Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems."
- Double initialization may be related to errors loading native-app-detector.js, Alpine component structure, or multiple x-data/x-init usage on main elements.
- New error: missing method `checkIOSAudio` ("is not a function") found in logs; may contribute to Alpine/app double initialization.
- Alpine.js double initialization is now prevented by a global flag (`window._alpineInitialized`) in index.js; debug logging added for Alpine startup.
- `checkIOSAudio` method implemented in app component to resolve missing function error.
- Critical: native-app-detector.js is being served with the wrong MIME type (text/html instead of application/javascript), likely blocking proper app initialization and Alpine.js single initialization.
- Decided to eliminate the separate native-app-detector.js file and all related build handling (webpack, mobile-build.sh, ios-build.sh). Instead, set window.isNativeApp directly in main code (e.g., index.js or inline in index.html) for simpler, more robust native app detection.
- Webpack CopyWebpackPlugin rule removed as it is no longer needed.
- native-app-detector.js file and all related build handling have been removed. Inline native app detection is now used in index.html.
- User requested to merge ios-build.sh logic into mobile-build.sh using a flag, since differences are minimal.
- User noted that the sound asset check/copy in build scripts is redundant and has been removed, as the whole public directory is already synced.

## Task List
- [x] Identify all relevant touch event handlers for buttons/interactions
- [x] Implement logic to ignore all but the last touch when multi-touch is detected (Android Chrome)
- [x] Integrate multi-touch handler utility into main app.js
- [x] Refactor handler to run on all browsers and fix detection logic
- [x] Add debug logging for multi-touch events (optional)
- [x] Test on all browsers to confirm correct behavior
- [x] Fix multi-touch handler crash when lastTouchTarget is null
- [x] Fix double initialization of app and multi-touch handler
  - [x] Analyze Alpine.js/component structure and resolve root cause
  - [x] Fix missing checkIOSAudio method or its invocation
- [x] Test and confirm Alpine.js/app single initialization (no warnings)
- [x] Add translation/localization string keys for piano key label (H/B)
- [x] Test and confirm correct localization for piano key label (H/B)
- [x] Remove native-app-detector.js file and all related build handling (webpack.config.js, mobile-build.sh, ios-build.sh)
- [x] Add inline native app detection (window.isNativeApp = (typeof window.Capacitor !== 'undefined')) in main code
- [x] Merge ios-build.sh logic into mobile-build.sh using a flag

## Current Goal
Task complete: multi-touch & native detection refactor complete