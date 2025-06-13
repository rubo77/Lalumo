# Lalumo Draw a Melody Activity Plan

## Notes
- Current focus: Implement note highlight effect at the exact moment a note is hit
- User does not want to simply work through the TODO list; guidance will be provided step by step.
- Note highlighting on correct note hit is now implemented; confirm behavior.
- Root cause: `showFeedback` was used as both a variable and a function. User resolved by renaming the function. Feedback and highlighting now work as intended.
- New requirements: The same melody should persist until it is perfectly replayed; show a rainbow effect (as in 1_2) when the melody is mastered. Both are now implemented.
- Next requirements:
  - Slower advancement: 10x with 3 notes, then 10x with 4, etc. (now implemented)
  - Progress should be saved in preferences and exported in the string
  - When a note is hit, the corresponding note in the box should briefly light up at that moment (current focus)
  - Remove the lowest octave from the note range (now implemented)
  - High or Low (1_1):
    - Prevent consecutive duplicate puzzles (now implemented)
    - Ensure the second tone is never C5 (now implemented)
  - Android: Deprecated SYSTEM_UI_FLAG_* API warning in MainActivity.java; needs update to WindowInsetsController for Android 11+ (see TODO.md)
  - Android launcher icon remains white despite icon generation logic; investigate icon creation and mipmap usage
  - Investigation: Icon files exist and are referenced in manifest and adaptive icon XML; next, check actual image contents and format
  - Diagnostic: ic_launcher_foreground.png is fully transparent or contains only one color; this likely causes the white icon issue. Need to inspect and replace/fix this image.
  - User provided a bird image to use as the new launcher icon foreground (see conversation, image 0)
  - Bird icon image is now available at /src/images/app_icon.png and ready for icon generation logic update
  - Version number in credits only shows "Loading version..."; fix version injection logic (now fixed)
  - New requirement: Script to remove backgrounds from animal images (goodAnimalImages and badAnimalImages) by making top-left color transparent within a threshold, saving originals if not already present
  - Implement level system and progress logic for 'Does It Sound Right?' activity; persist and export progress in preferences.
  - Relevant code locations for 'Does It Sound Right?' activity have been identified and reviewed in pitches.js.
  - Level system for 'Does It Sound Right?' activity is now implemented in generateSoundHighOrLowMelody and state variable soundJudgmentLevel.
  - Progress tracking, level initialization from preferences, and UI display for 'Does It Sound Right?' activity are now implemented. Next: answer checking, streak, and export logic.
  - Sound judgment progress/level is now integrated with preferences export/import/reset, and includes diagnostic logging.
- Investigate why /images/1_5_pitches_bad_rabbit.png is not showing transparent background after edit/commit
- Animal background removal script did not process rabbit image due to wrong working directory or image path; must fix script invocation or paths to resolve transparency issue
- Script path/config fixed; next step: rerun script and verify transparency for rabbit image
- [x] Add working directory check to animal background removal script
- The transparency issue was not with the image processing script (which works as intended), but with the browser still showing the old/original image—likely due to browser cache or deployment artifact. Further investigation should focus on cache/deployment handling.

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
- [ ] Investigate browser caching or deployment artifact issues causing old/original rabbit image to show

## Current Goal
Investigate browser/deployment cache issue for animal images