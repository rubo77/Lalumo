# Investigate Mascot Message Persistence

## Notes
- User sees log: "Skipping mascot message for 1_1_pitches_high_or_low - already shown once" immediately after app start.
- Suggests seen-flag survives page reload, likely stored in localStorage.
- Relevant code snippet (pitches.js L1664-L1668) checks `this.mascotSettings.seenActivityMessages[activityId]`.
- Mascot settings are loaded from localStorage at L278-285 (`lalumo_mascot_settings`), so flags persist across reload.
- `seenActivityMessages` is initialised with an empty object at L68 in pitches.js.
- User selected **Option 1**: clear `seenActivityMessages` on every app start; auto-hide still not working reliably.

## Task List
- [x] Search codebase for any `localStorage.setItem` / `getItem` involving `mascotSettings` or `seenActivityMessages`.
- [x] Verify initialisation path of `this.mascotSettings` in pitches component.
- [x] Confirm whether data is loaded from localStorage on startup.
- [x] Explain findings to user and propose fix (e.g., reset on session start or better clearing logic).
- [x] Implement Option 1: clear `seenActivityMessages` at startup before skip-check.
- [ ] Persist cleared `mascotSettings` back to localStorage after reset.
- [ ] Retest reload: first message shows, no "Skipping" log until after display.
- [x] Investigate and fix auto-hide (10 s) not hiding mascot overlay.

## Current Goal
Verify reset & auto-hide work correctly