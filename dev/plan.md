# Draw a Melody Feature Enhancements

## Notes
- User requested enhancements to the "Draw a melody" feature: note highlighting when hit, semi-transparent trace of the last drawing, and a clickable top box to replay the melody.
- Explored and reviewed relevant code in pitches.js and index.html.
- Implementation is now focused only on: When starting a new drawing, the previous path should be shown semi-transparently.
- User clarified: The last path should always be visible when drawing a new path, not just after using the clear button.
- User also requested: The reference melody box (top box) should be clickable to replay the melody.
- Clickable reference melody box feature is actively being debugged; ensure event listener attaches correctly and element is present in DOM.
- In game mode, the replay melody should have the same number of notes as painted on the canvas; initially 3 notes, increasing as the user advances (dynamic, not static).
- State variable for draw melody level is now added; reference melody generation is now dynamic by level. Next: test and refine this progression logic.

## Task List
- [x] Add previousDrawPath state variable to store the last drawing path
- [x] Update clearDrawing to save the current path to previousDrawPath before clearing
- [x] Update startDrawing to render previousDrawPath with semi-transparency before starting a new drawing
- [ ] Test semi-transparent previous drawing feature
- [x] Update implementation so previous path is always visible when drawing a new path (not just after clearing)
  - [x] Update endDrawing to save current path to previousDrawPath
- [x] Make the top box clickable to replay the melody
- [ ] Debug and fix clickable reference melody box feature (ensure event listener attaches and element is present)
- [ ] Update replay melody so that in game mode, it dynamically matches the number of notes painted on the canvas (start with 3 and increase as user advances)
- [ ] Test and refine dynamic melody length progression logic

## Current Goal
Test semi-transparent previous drawing feature, debug clickable reference melody box, and test dynamic melody length