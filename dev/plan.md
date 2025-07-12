# Plan: 2_2_chords_stable_instable Activity

## Notes
- User wants to copy the structure of the 2_5 activity (Chord Characters) to 2_2, renaming it "Stable Or Instable".
- The concept for 2_2 is: "man hört entweder einen geraden wohlklingenden akkord oder einen sehr schief klingenden akkord mit viel dissonanzen, jeweils aus 6 Tönen bestehend" (one hears either a consonant, pleasant chord or a very dissonant, out-of-tune chord, each consisting of 6 notes).
- The user wants the concept for 2_2 expanded in the markdown concept document.
- The new JS module for 2_2 has been created and core logic implemented.
- The concept for 2_2 has been expanded in CONCEPT.md.
- JavaScript UI for 2_2 is now in place; core logic implemented; integration with chords component pending.
- Integration of playStableInstableChord and checkStableInstableMatch with chords component is complete.
- Level-based reset system for 2_2 activity implemented (progress resets to start of current level on error).
- UI, feedback, and progress display for 2_2 activity verified and connected.
- UI/UX for stable/instable chords activity enhanced with new button styles and feedback animations.
- Chord generation functions now output Tone.js note names (e.g., 'C4', 'D#4') as required by the audio engine.
- Function naming for unstable/instable chord generation unified and fixed in all usages.
- HTML and chords.js integration for 2_2_chords_stable_instable reviewed and confirmed; UI event bindings and feedback display are in place.
- Playwright test created for automated end-to-end testing of 2_2_chords_stable_instable activity.
- Playwright test should be run with a 3-second timeout as requested by user.
- Multiple attempts to run Playwright tests did not complete successfully due to server/process issues. Dev server stability needs to be ensured before reliable test execution.
- Playwright test navigation must first click the "Chords" button in the navigation, then the "Stable or Instable" button, to reach the activity (per user clarification).
- The correct selector for the "Stable Or Instable" navigation button is id="nav_2_2" (confirmed by user; use this in Playwright test).
- Latest Playwright test run failed:
  - "Chords" button was not found by the test (likely selector or timing issue).
  - Selector '#2_2_chords_stable_instable' caused a querySelector syntax error (likely due to invalid or missing element).
- Next steps: Fix navigation selectors and ensure correct element IDs/selectors in both test and app.
- Duplicate variable declarations for playButton in the Playwright test script have now been fixed.
- When an incorrect answer is given in 2_2_chords_stable_instable, the same chord should be replayed (not a new random chord). This requires tracking and replaying the current chord, not just calling playStableInstableChord().
- User reports three new issues: (1) transposition is not kept when replaying via the play button, (2) automatic play of next note after success does not work, (3) progress logging always shows zero.
- Rearrangement of homepage download buttons requested for responsive layout; F-Droid icon to be downloaded locally and used.
- User wants download buttons to always show 2 per row using flex, and 1 per row on small screens; grid is not desired. Continue with 2_2 after fixing this.
- "Play again" in 2_2_chords_stable_instable must keep the current chord and transposition, not just the type.
- Free play mode in 2_2 must generate a random stable or instable chord on each button before the first play, exactly like 2_5 logic.

## Task List
- [x] Review the structure and code of 2_5_chord_characters.js
- [x] Copy the structure and logic of 2_5_chord_characters.js to a new 2_2_chords_stable_instable.js (or equivalent), renaming and adapting as needed
- [x] Update all relevant references, names, and logic to match the "Stable Or Instable" concept
- [x] Expand and rewrite the concept for 2_2 in CONCEPT.md, using the user's description and elaborating as appropriate
- [x] Adapt the index.html section for 2_2 to match the 2_5 style (background, layout, two buttons for stable/instable)
- [x] Implement JS logic for playStableInstableChord and checkStableInstableMatch in 2_2 module
- [x] Integrate playStableInstableChord and checkStableInstableMatch with chords component
- [x] Implement level-based reset system for 2_2 activity (reset progress to start of current level on error)
- [x] Test and polish the full 2_2_chords_stable_instable activity (manual and script-based)
- [x] Investigate 2_2 and 2_5 JS modules for free play/replay logic
- [ ] Ensure dev server is running and stable before test
- [ ] Run automated Playwright tests for 2_2_chords_stable_instable
- [ ] Analyze test results and finalize polish/fixes as needed
- [ ] Fix navigation selectors and ensure correct element IDs/selectors in test and app (use id="nav_2_2" for Stable Or Instable navigation button)
- [x] Fix duplicate variable declarations for playButton in Playwright test script
- [x] Refactor 2_2_chords_stable_instable so that after an incorrect answer, the same chord (not a new random one) is replayed. Track and replay the current chord and type.
- [x] Update homepage download buttons to always show 2 per row with flex (fallback to 1 per row on small screens)
- [ ] Rearrange homepage download buttons for responsive layout and use local F-Droid badge
- [ ] Fix 2_2_chords_stable_instable so play again keeps current chord and transposition
- [ ] Implement free play mode for 2_2_chords_stable_instable: generate random stable/instable chord on each button before first play (match 2_5 logic)

## Current Goal
Implement and test 2_2 free play and replay logic