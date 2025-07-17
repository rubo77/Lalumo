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
- Feedback messages for 1_2 activity are already present in both English and German in the code, but are currently hardcoded and need to be migrated to strings.xml for proper localization.
- 1_2 feedback messages (English & German) have been added to strings.xml and the code now uses the global store for localization.
- Next: Migrate 1_2 feedback messages in checkMatch to use strings.xml/global store.
- For 2_2 stable/unstable chords, feedback messages should use strings.xml for translation, using "unstable chord" (EN) and "instabiler Akkord" (DE); debug logs should remain unchanged.
- `showMascotMessage` has been moved to a global utility (src/components/shared/feedback.js) and all calls in chords and pitches components now use the global function. The global import in index.js has been updated.
- Searching for and cleaning up remnants of the old mascot system is complete.
- Let me check the code in `2_2_chords_stable_unstable.js` to find where the feedback messages are being set.
- Locations where stable/unstable chord feedback messages are set have been identified in the code.
- Relevant feedback strings for stable/unstable chords already exist in strings.xml (EN & DE).
- Bug: Feedback message for 2_2 activity shows a mix of languages (e.g., "Incorrect. It was Falsch. Es war ein instabiler Akkord.."). Need to use placeholder-based feedback strings for proper localization.
- Bug: Browser language detection does not default to German for first-time users; should set language to de if browser prefers German and no prior language is stored.
- In progress: Searching for hardcoded UI strings (welcome message, name prompt, reset activity) and preparing to add them to strings.xml and update code references.
- Some UI strings (e.g. "Welcome to Lalumo!", name prompt, "Reset activity") remain in English and need to be localized using strings.xml (EN & DE).
- User requested to also localize "Your progress will be saved automatically" and "Reset Current Activity" (including @/var/www/Musici/src/index.html:L132).
- The strings for "Your progress will be saved automatically" and "Reset Current Activity" have now been added to both English and German string files.
- The UI code in index.html now uses the new localized strings for both the progress saved message and the reset current activity button/title.
- User requested a global rename of "Stable or Unstable" to "stable or unstable" throughout the codebase.
- String resources and some references have been updated from "instable" to "unstable"; next step is to update filenames and code references.
- The main JS module file has been copied and updated from `2_2_chords_stable_instable.js` to `2_2_chords_stable_unstable.js` with internal references changed.
- Main code imports and function references in `chords.js` have been updated to use `stable_unstable`. Next: check and update any remaining references elsewhere in the codebase.
- HTML template references in `index.html` have been updated to use the new `stable_unstable` naming convention.
- Test files referencing `stable_unstable` have been identified for update to `stable_unstable`.

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
- [x] Implement context-specific feedback messages for incorrect answers in 1_2 (English & German); ensure no message on success
  - [x] Migrate 1_2 feedback messages (English & German) to strings.xml and update code to use the global store for localization; ensure no message on success
    - [x] Add 1_2 feedback messages to strings.xml (EN & DE)
    - [x] Update checkMatch to use $store.strings for feedback
- [x] Refactor 2_2 stable/unstable chord feedback messages to use strings.xml for translation with correct localization and placeholders
- [x] Add/fix placeholder-based feedback strings (e.g., feedback_correct_chord, feedback_incorrect_chord, stable_chord, unstable_chord) in strings.xml (EN & DE)
- [ ] Fix browser language detection to default to German for new users
- [ ] Localize remaining English UI strings (welcome message, name prompt, reset activity) in strings.xml (EN & DE) and update code to use them
  - [x] Add welcome message, name prompt, and reset activity strings to strings.xml (EN & DE)
  - [x] Update index.html and any relevant code to use $store.strings for these UI strings
  - [x] Add "Your progress will be saved automatically" and "Reset Current Activity" to strings.xml (EN & DE)
  - [x] Update index.html and code to use $store.strings for these new UI strings
- [x] Search for and remove remnants of the old mascot system
- [x] Update string resources and UI to use "stable or unstable" instead of "Stable or Unstable"
- [x] Copy and update main JS module file from stable_unstable to stable_unstable
- [x] Update all code references and imports to use stable_unstable instead of stable_unstable
- [x] Update HTML template references in index.html to use stable_unstable
- [ ] Update test files to use stable_unstable naming

## Current Goal
Update test files to use stable_unstable naming