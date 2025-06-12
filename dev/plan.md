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

## Task List
- [x] Investigate and fix `this.showFeedback` context/definition bug so feedback is shown on success/failure
- [x] Implement note highlighting when correct note is hit
- [x] Confirm feedback and highlighting work as expected in "Draw a Melody"
- [x] Ensure the same melody persists until perfectly replayed
- [x] Show rainbow effect when melody is mastered (like in 1_2)
- [x] Implement slower advancement: 10x with 3 notes, then 10x with 4, etc.
- [x] Remove lowest octave from note range
- [x] Prevent duplicate puzzles and restrict second tone in High or Low
- [ ] Save and export progress in preferences/string
- [ ] Note highlight should occur exactly when note is hit

## Current Goal
Implement note highlight should occur exactly when note is hit