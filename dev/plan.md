# Unified Feedback Refactor Issue

## Notes
- Commit 745425d4 refactored mascot overlay to a unified feedback system.
- Errors `showFeedback is not defined` and `feedbackMessage is not defined` are due to missing initialization in the Alpine.js component data.
- The new feedback variables must be added to the Alpine.js `pitches` component.
- The errors persist after fixing `pitches`, suggesting other Alpine.js components or global context may also reference `showFeedback` and `feedbackMessage` without initialization.
- `showFeedback` and `feedbackMessage` are now added to the Alpine.js global store as `Alpine.store('feedback', ...)`.
- Message box not showing because components are not updating the global feedback store; they are still setting local variables.
- The pitches component now updates the global feedback store for help messages.
- The chords component also contains local feedback assignments that must be refactored to use the global store.
- Chords component feedback triggers are being refactored to use the global store.
- All feedback triggers in major components now use the global feedback store.
- Unused mascot message function removed from app.js; no listeners found in codebase.
- Remaining usages in pitches.js already use the global feedback store, but function could be renamed for clarity.
- Investigating empty feedback/help message in 1_2 activity (false button).
- In 1_2 activity, `checkMatch` sets `this.feedback = ''` for both correct and incorrect answers, leading to empty feedback messages on false button presses. This needs to be updated to provide a meaningful message.
- User clarified: On success in 1_2, show no feedback message; on incorrect, show a context-specific message ("No, the melody was going up/down/wave/jumpy somehow") in both English and German.
- German translations for feedback messages are required and must be implemented alongside English.
- For 2_2 stable/instable chords, feedback messages should use strings.xml for translation, using "unstable chord" (EN) and "instabiler Akkord" (DE); debug logs should remain unchanged.
- `showMascotMessage` has been moved to a global utility (src/components/shared/feedback.js) and all calls in chords and pitches components now use the global function. The global import in index.js has been updated.

## Task List
- [x] Locate Alpine.js `pitches` component definition
- [x] Add `showFeedback` and `feedbackMessage` to the component's data object with appropriate initial values
- [x] Audit all Alpine.js components and relevant global context for usage of `showFeedback` and `feedbackMessage`, and ensure they are initialized where needed
- [x] Add `showFeedback` and `feedbackMessage` to the Alpine.js global store so the unified feedback container works
- [x] Update the unified feedback message container in `index.html` to reference the global store (e.g. `$store.feedback.showFeedback`)
- [x] Test that feedback messages now display without JS errors
- [x] Refactor pitches component feedback triggers to use the global store
- [x] Refactor all other feedback message triggers to use `Alpine.store('feedback').showMessage()` or set the global store variables directly
  - [x] Refactor chords component feedback triggers to use the global store
- [x] Remove unused mascot message function from app.js
- [x] Check for remaining mascot message usages and confirm migration
- [x] Refactor mascot message calls in pitches.js and chords.js to use the global utility
- [x] Move showMascotMessage from utils/feedback.js to components/shared/feedback.js and update global import
- [ ] Optionally rename showMascotMessage in pitches.js for clarity
- [ ] Document the unified feedback refactor
- [ ] Implement context-specific feedback messages for incorrect answers in 1_2 (English & German); ensure no message on success
  - [ ] Implement and test German translations for 1_2 feedback messages
- [ ] Refactor 2_2 stable/instable chord feedback messages to use strings.xml for translation (not in debug logs)

## Current Goal
Implement and test German translations for 1_2 feedback