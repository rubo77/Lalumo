# Referrals System Redesign Plan

## Notes
- User wants to keep a single unlock flag: `areAllActivitiesUnlocked`.
- This flag should unlock three specific activities: "Draw a Melody", "Memory Game" (both in Pitches), and "Chord Story Characters" (in Chords).
- The entire Chords chapter should NOT be unlocked, only these activities.
- UI text in referrals.html and menus must reflect new unlock logic.
- Each of the three activities should have a second, always-unlocked debug button with class `debug-element`.

## Task List
- [x] Update concept documentation to specify single-flag/multi-activity unlock
- [x] Update referrals.html text to describe new unlock system
- [x] Update menu and activity access logic to use `areAllActivitiesUnlocked` for the three activities
- [x] Add a debug button (class `debug-element`) for each of the three activities, always visible/unlocked
- [ ] Test that only the three activities are unlocked by referrals, not the entire Chords chapter
- [ ] Test debug buttons for all three activities

## Current Goal
Update menu/activity logic and add debug buttons