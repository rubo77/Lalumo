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

## Task List
- [x] Locate Alpine.js `pitches` component definition
- [x] Add `showFeedback` and `feedbackMessage` to the component's data object with appropriate initial values
- [x] Audit all Alpine.js components and relevant global context for usage of `showFeedback` and `feedbackMessage`, and ensure they are initialized where needed
- [x] Add `showFeedback` and `feedbackMessage` to the Alpine.js global store so the unified feedback container works
- [x] Update the unified feedback message container in `index.html` to reference the global store (e.g. `$store.feedback.showFeedback`)
- [x] Test that feedback messages now display without JS errors
- [x] Refactor pitches component feedback triggers to use the global store
- [ ] Refactor all other feedback message triggers to use `Alpine.store('feedback').showMessage()` or set the global store variables directly
  - [ ] Refactor chords component feedback triggers to use the global store

## Current Goal
Refactor other feedback triggers to use the global store