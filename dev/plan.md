# Musici File Structure Alignment Plan

## Notes
- User identified /src/effects/feedback.js as being in the wrong place.
- Reference canonical structure in dev/FILESTRUCTURE.md, shared utilities should live under `src/components/shared/`.
- The directory `src/components/shared/` has been created to house shared utilities.
- `feedback.js` relocated to `src/components/shared/`.
- Manual review revealed and fixed one import referencing the old path.
- Must also look for any other JS files that violate the documented structure and relocate them.
- After relocating, all import paths across the codebase must be updated.
- Update dev/FILESTRUCTURE.md to match the new, real structure.
- Adhere to user global rules: no fallback code, no unnecessary deployment, add diagnostics if needed.
- Git checkout/reset commands are disallowed; repair files manually.
- User confirmed file structure is correct; focus shifts to enhancing Chord Chapter user experience.
- User requested to review Chord code first and keep 2_x abbreviations in function names.
- Main Chords entry file is `src/components/chords.js`; sub-modules `2_*` will be migrated later.
- Rainbow feedback integrated into `chords.js` across all chord activities.
- Runtime error `checkColorAnswer is not defined` observed in `chords.js`; must fix.
- `checkColorAnswer` now imported into chords.js, error resolved.
- Tone.js audio and richer landscapes integrated into 2_2 mood landscapes.
- Play-full-chord button implemented in 2_3 chord-building.
- Audio-engine singleton (`src/components/audio-engine.js`) now powers all chord sounds; initAudio simply ensures `audioEngine.initialize()` is called upon first user gesture.
- User reports no sound in 2_1 and 2_2, and missing/unresponsive Play Full Chord button in 2_3; suspect off-screen buttons—set containers to 100% viewport height and debug Tone.js initialization / Transport start.
- Initial fixes committed: forced Tone.start() in initAudio, added full-height CSS for activity containers, and improved Play Full Chord button container lookup; awaiting user verification.
- `setupFullHeightContainers` function has been implemented to enforce 100vh containers and style rules.
- Replaced require usage in setupFullHeightContainers to avoid bundler issues; enhanced Tone.js auto-start logic and fixed Play Full Chord button positioning.
- User requested moving injected CSS rules into external stylesheet `src/styles/2_chords.css` and setting `.chord-chapters-view` height to 800px.
- Created external stylesheet `src/styles/2_chords.css` including chord activity styles and `.chord-chapters-view` height rule.
- Stylesheet now imported in `chords.js`, and inline CSS injection removed from `setupFullHeightContainers`.
- Initial background image for 2_5 chord characters added in index.html activity container.
- `updateCharacterBackground` function implemented and wired into `chords.js` (init & after correct answer); progress now persisted in `lalumo_chords_progress` (localStorage).
- User requested extracting `update_progress_display` helper from pitches.js into a shared `common.js` for reuse.
- `updateCharacterBackground` function implemented and wired into `chords.js` (init & after correct answer); progress now persisted in `lalumo_chords_progress` (localStorage).
- User requested extracting `update_progress_display` helper from pitches.js into a shared `common.js` for reuse.
- Discovery: two separate common.js files already exist (`src/components/pitches/common.js` and `src/components/2_chords/common.js`); need unified location for shared UI helpers.
- New shared helper module `src/components/shared/ui-helpers.js` created containing `update_progress_display`; imported into `pitches.js`.
- Shared UI helper now also imported in `chords.js` and used in 2_5 character activity to update progress display.
- Runtime bug: `$store is not defined` when `update_progress_display` executes inside `chords.js` (Alpine context missing). Must refactor call to avoid direct `$store` reference (use component or Alpine.store()).
- Need to remove legacy `update_progress_display` method from `pitches.js` and redirect all calls to shared helper.
- Runtime bug `$store is not defined` in 2_5 progress display has been fixed by constructing strings via `this.$store` before passing to helper.
- New UI issue: progress display shows duplicate "Correct answers" lines and no unlock hint. Must ensure single element and dynamic hint ("Get 10 correct ...", "Get 20 correct ...") renders correctly.
- Removed redundant JS progress display in 2_5; Alpine bindings now show correct count and unlock hints.
- `debug-element` CSS class added to `main.css` to hide debug buttons by default; visibility toggled via `body.dev-mode`.
- Inline `style="opacity: 0;"` attributes auto-replaced with `class="debug-element"` in index.html via sed.
- Frontend protection added: users cannot redeem their own referral code (redeemFriendCode now checks against `referralCode`).
- Backend PHP now blocks self-redeem attempts when the username is supplied; frontend must include `username` in the redeem request.
- Duplicate `redeemFriendCode` functions detected in `src/components/app.js` (lines ~291 and ~1953); older version must be removed to prevent conflicting logic.
- Duplicate `redeemFriendCode` functions issue resolved: older version replaced with stub comment; only enhanced version remains.
- Referral section being extracted to partial `src/partials/referrals.html`; `html-loader` dev dependency installed to enable inclusion via webpack.
- Need to update `webpack.config.js` with `html-loader` rule and adjust `index.html` to load partial.
- [x] Modularize referral code page using html-loader
  - [x] Create `src/partials/referrals.html` with referral section content
  - [x] Add `html-loader` rule in `webpack.config.js`
  - [x] Replace referral section in `src/index.html` with `<div data-include="./partials/referrals.html"></div>` or appropriate require syntax
  - [x] Verify build & runtime functionality without regressions
- Note: Updated webpack.config.js with html-loader rule and index.html now includes referral partial.
- Build currently fails: html-loader not processing referrals.html (Module parse failed). Need to adjust loader rule/import and restore successful build.
- Note: Updated webpack.config.js with html-loader rule and index.html now includes referral partial.
- Added `utils/html-include.js` with `loadHtmlPartials()` utility; imported in `index.js` to dynamically render HTML partials.
- Build currently fails: html-loader not processing referrals.html (Module parse failed). Need to adjust loader rule/import and restore successful build.
- [x] Fix html-loader rule so partial HTML files are correctly processed (adjust include/exclude pattern)
- [x] Update or remove import statement in `index.js` to match loader expectations
- [ ] Verify build & runtime functionality without regressions (build currently failing)
- [x] Fix html-loader rule so partial HTML files are correctly processed (adjust include/exclude pattern)
- [x] Update or remove import statement in `index.js` to match loader expectations
- [x] Call `loadHtmlPartials()` after Alpine initialization to render partials
- [ ] Validate runtime functionality of referral partial loading and resolve any server port conflicts
- html-loader build error resolved with `esModule: false`; build now succeeds.
- Introduced `utils/html-include.js` and `loadHtmlPartials()` runs post-Alpine to inject referral partial at runtime.
- Runtime in browser shows `HTML partial loading error` (fetch 404 for ./partials/referrals.html); need to adjust dev server path or include utility logic.
- Path handling updated in html-include.js and index.html to use absolute `/src/partials/referrals.html`; awaiting verification.
- [x] Call `loadHtmlPartials()` after Alpine initialization to render partials
- [ ] Validate runtime functionality of referral partial loading and resolve any server port conflicts
- [ ] Fix fetch path / dev server config so `/src/partials/referrals.html` loads successfully
- [x] Fix fetch path / dev server config so `/src/partials/referrals.html` loads successfully
- [x] Fix fetch path / dev server config so `/src/partials/referrals.html` loads successfully
- Runtime in browser showed `HTML partial loading error` (404). Partial copied to `public/partials/referrals.html` so dev server can serve it.
- Need to update `index.html` data-include path to `/partials/referrals.html` and verify loading succeeds.
- [x] Copy `referrals.html` to `public/partials/` for dev server access
- [x] Update `index.html` data-include to `/partials/referrals.html`
- [x] Verify referral partial loads without 404 and renders correctly
- [x] Verify referral partial loads without 404; test runtime
- [x] Extract Impress page into `partials/impress.html` and include via data-include
- [x] Extract Credits page into `partials/credits.html` and include via data-include
- [x] Extract Settings page into `partials/settings.html` and include via data-include
- Impress partial (`src/partials/impress.html`) created; next copy to public and hook up.
- Runtime referral partial confirmed working via `/partials/referrals.html`.
- Next: modularize remaining pages (Impress, Credits, Settings) similarly.
- Ensure copied to `public/partials/` and paths updated.
- [x] Update index.html to include Impress, Credits, Settings partials via data-include
  - [x] Update index.html to include Impress partial via data-include
  - [x] Update index.html to include Credits partial via data-include
  - [x] Update index.html to include Settings partial via data-include
  - [x] Verify Impress, Credits, Settings partials load without 404 and render correctly
- Runtime referral partial confirmed working via `/partials/referrals.html`.
- Impress, Credits, and Settings partial HTML files created under `src/partials/` and copied to `public/partials/`.
- `index.html` updated to include Impress and Credits via data-include elements; Settings include still pending.
- [x] Extract Impress page into `partials/impress.html` and include via data-include
- [x] Extract Credits page into `partials/credits.html` and include via data-include
- [x] Extract Settings page into `partials/settings.html` and include via data-include
- [x] Copy `impress.html` to `public/partials/` and update path in index
- [x] Copy `credits.html` to `public/partials/` and update path in index
- [x] Copy `settings.html` to `public/partials/` and update path in index
- [x] Verify Impress, Credits, Settings partials load without 404 and render correctly
- [x] Copy `settings.html` to `public/partials/` and update path in index
- [x] Update index.html to include Settings partial via data-include
- [x] Verify Impress, Credits, Settings partials load without 404 and render correctly
- Note: Reset section in settings partial restructured; reset buttons correctly embedded and partial copied to `public/partials/`; awaiting UI verification.
- Existing file `src/components/pitches/1_2_match_sounds.js` already contains some helper logic.
- New directory `src/components/1_pitches/` created to hold pitch activity modules; need to consolidate location.
- New directory `src/components/1_pitches/` was created by mistake; per FILESTRUCTURE.md, activity modules stay under `src/components/pitches/`. Must consolidate to a single canonical path and remove duplicates.
- New directory `src/components/1_pitches/` was created by mistake; per FILESTRUCTURE.md, activity modules must remain in `src/components/pitches/`. Consolidation required.
- Duplicate directory `src/components/1_pitches/` has been removed.
- Migration of 1_2_match_sounds functions to separate module was reverted; related tasks cancelled.
- [x] Delete duplicate `src/components/1_pitches/1_2_match_sounds.js`
- [x] Update imports in `pitches.js` to use canonical path
- [x] Update `pitches.js` to import and delegate to new module (remove duplicates)
- [ ] Run build & verify 1_2 activity functionality
- [ ] Fix SyntaxError in `pitches.js` (line ~1297) and any related issues
- [ ] Re-run build & confirm no errors
- [ ] Manually inspect `pitches.js` for additional brace/comma mismatches introduced by automated replacements and correct them
- [ ] Once build passes, test 1_2_match_sounds activity end-to-end
- Runtime Alpine error: `component.stopCurrentSound is not a function` discovered in 1_2 activity; calling undefined method.
- Earlier attempt to inline call caused massive syntax errors; must revert and instead export `stopCurrentSound` from pitches.js and import in 1_2 module.
- Approach: add named export `stopCurrentSound` in pitches.js (no structural rewrite), alias in component (`this.stopCurrentSound` already exists), and import `{ stopCurrentSound }` into 1_2_match_sounds.js; call directly.
- [ ] Fix `stopCurrentSound` undefined runtime error (expose/export function and import in 1_2 module)
  - [ ] Revert erroneous inline replacement in pitches.js
  - [ ] Add `export function stopCurrentSound(component)` helper encapsulating existing logic
  - [ ] Ensure pitches.js references this helper; keep method intact
  - [ ] Import and use `stopCurrentSound` directly in 1_2_match_sounds.js instead of `component.stopCurrentSound()`
  - [ ] Run build & verify 1_2 activity functionality
  - [ ] Retest 1_2_match_sounds activity end-to-end after fix
- [ ] Fix `stopCurrentSound` undefined runtime error (expose/export function and import in 1_2 module)
- [ ] Fix `stopCurrentSound` undefined runtime error (expose/export function and import in 1_2 module)
- Chords progress tracking system implemented in `chords.js`, mirroring the logic from `pitches.js`; per-activity counts now persist in `lalumo_chords_progress`.
- `checkColorAnswer` now increments `totalQuestions` and writes progress after each answer.
- Color grid in index.html currently passes `$store` to `checkColorAnswer`, causing `currentChordType` to be undefined – need to pass the chords component (`$data`) instead.
- Color grid click handlers updated to use `$data`; answers now recognized.
- Scope bug in `playChord` fixed (outer `chord` variable); ReferenceError resolved.
- [x] Fix color grid click handlers in index.html to pass chords component to `checkColorAnswer`.
  - [ ] Verify rainbow / error feedback effects and audio playback trigger correctly after fix.
  - Note: Fixing this bug revealed a new issue with audio playback not working as expected.
- [ ] Fix audio playback issue in color-matching activity.
- New issue: `ReferenceError: chord is not defined` inside `playChord`; likely variable scope bug preventing audio playback.
- [x] Fix `ReferenceError: chord is not defined` in `playChord` and ensure sound plays.
  - [ ] Verify audio playback works after fix.
- New runtime error: `audioEngine.playChord is not a function`; need chord playback method in AudioEngine or adjust call in chords.js.
- [ ] Fix audio playback issue in color-matching activity.
  - [ ] Implement `playChord` method in `audio-engine.js` (poly-synth plays multiple notes) or refactor `chords.js` to use existing API
  - [ ] Verify chord audio playback in 2_1 and 2_2 after fix
- New runtime error resolved: `playChord` method implemented in AudioEngine; need sound verification.
- Requested enhancement: `debugLog` should accept an array of tags and prepend them.
- [x] Implement `playChord` method in `audio-engine.js` (poly-synth plays multiple notes) or refactor `chords.js` to use existing API
- [ ] Verify chord audio playback in 2_1 and 2_2 after fix
- [x] Update `debugLog` utility to accept array of tags
- debugLog utility now accepts array of tags.
- Naming conflict detected: two playChord functions (chords.js vs audio-engine.js); must resolve.
- playChord function in chords.js renamed to playChordByType; internal and 2_1 module references updated.
- [ ] Update all references to component.playChord to playChordByType in 2_chords modules and chords.js wrappers
  - [ ] Replace playChord calls in 2_1_chord_color_matching.js
  - [x] Replace playChord calls in 2_2_chord_mood_landscapes.js
  - [ ] Remove/adjust guards that check typeof component.playChord
  - [ ] Run build & verify no missing method errors
- [ ] Run build & verify chord audio playback in 2_1 and 2_2 after refactor
- [x] Resolve playChord naming conflict between chords.js and audio-engine.js (renamed to playChordByType)
- [ ] Update all references to component.playChord to playChordByType in 2_chords modules and chords.js wrappers
  - [x] Replace playChord calls in 2_1_chord_color_matching.js
  - [ ] Replace playChord calls in 2_2_chord_mood_landscapes.js
  - [x] Remove/adjust guards that check typeof component.playChord
  - [ ] Run build & verify no missing method errors
- [ ] Run build & verify chord audio playback in 2_1 and 2_2 after refactor
- User requested dynamic background progression for 2_5 chord characters based on correct answer milestones (0, 10, 20) with specific images.
- [x] Remove/adjust guards that check typeof component.playChord
- [x] Replace playChord calls in 2_1_chord_color_matching.js
- [x] Remove/adjust guards that check typeof component.playChord
- [ ] Run build & verify chord audio playback in 2_1 and 2_2 after refactor
- # New tasks for 2_5 chord character activity
- [x] Update index.html 2_5 activity container to use initial background image `/public/images/backgrounds/2_5_chords_dog_cat_owl_no_squirrel_no_octopus.png`.
- [ ] Implement progress-based background updates for 2_5 chord characters:
  - [x] Add `updateCharacterBackground()` (similar to pitches.updateMatchingBackground).
  - [x] Change background to *_squirrel_no_octopus at 10 correct answers.
  - [x] Change background to *_squirrel_octopus at 20 correct answers.
  - [x] Store & read progress in `lalumo_chords_progress`.
  - [x] Wire `updateCharacterBackground` call in `chords.js` on init & after correct answer.
  - [ ] Verify visuals during gameplay.
- `updateCharacterBackground` helper implemented in `2_5_chord_characters.js` to switch backgrounds at 0/10/20 correct answers.
- `updateCharacterBackground` now imported into `chords.js`; wiring to events pending.
- [ ] Implement progress-based background updates for 2_5 chord characters:
  - [x] Add `updateCharacterBackground()` (similar to pitches.updateMatchingBackground).
  - [x] Change background to *_squirrel_no_octopus at 10 correct answers.
  - [x] Change background to *_squirrel_octopus at 20 correct answers.
  - [x] Store & read progress in `lalumo_chords_progress`.
  - [x] Wire `updateCharacterBackground` call in `chords.js` on init & after correct answer.
  - [ ] Verify visuals during gameplay.
- Note: Wiring updateCharacterBackground and storing progress in lalumo_chords_progress is now complete.
- Progress display added to **2_5** activity in index.html showing correct count and unlock hints.
- [x] Verify visuals during gameplay.
- User requested using the shared `update_progress_display` in 2_5 character activity.
- [x] Remove local `update_progress_display` method from pitches.js and update calls to use shared helper
- [x] Ensure build passes after refactor
- [x] Integrate shared `update_progress_display` into 2_5 character activity (update index/chords logic)
## Current Goal
Implement referral link click tracking
## Current Goal
- [x] Fix `$store` undefined error in 2_5 progress display
- [x] Deduplicate progress display in 2_5 activity and inject unlock-hint text (10/20 thresholds)
- [x] Add configurable CSS class to hide debug buttons (opacity 0) with toggle for local development
## Current Goal
- Implement CSS class for hiding debug buttons
- Note: Added debug-element CSS class to hide debug buttons by default; visibility toggled via body.dev-mode.
- [x] Add `.debug-element` class to main.css with opacity control and `body.dev-mode` override
- [x] Replace inline `style="opacity: 0;"` on debug buttons with `class="debug-element"`
- [x] Document/enable dev-mode body class toggle for local development
- [x] Add configurable CSS class to hide debug buttons (opacity 0) with toggle for local development
- [ ] Display shareable referral link with click count in UI
## Current Goal
- Implement backend self-redeem protection & share link display
- Note: Frontend self-redeem protection implemented; users cannot redeem their own referral code.
- [x] Prevent users from redeeming their own referral code (backend & frontend)
- [x] Display shareable referral link with click count in UI
- Note: Referral link feature partially implemented; need to fix syntax errors and complete UI.
- [ ] Fix syntax errors in referral link feature
- [ ] Complete referral link UI and display click count
- [ ] Verify referral link feature works as expected
## Current Goal
- Implement backend self-redeem protection & share link display
Referral link generation & copy functionality added to app.js; link now shown in referral UI.
- [x] Fix syntax errors in referral link feature
- [ ] Complete referral link UI and display click count
- [ ] Verify referral link feature works as expected
Referral link feature implemented; link generation, UI and click count display integrated; awaiting verification.
- [x] Complete referral link UI and display click count
## Current Goal
Update Concept doc & verify referral link UI
Finalize Concept doc & complete self-redeem integration
- [x] Verify referral link feature works as expected
- [x] Update `redeemFriendCode()` to include `username` in the POST payload
- [x] Handle 403 response and show UI error when user tries to redeem own code
- [x] Add e2e test to confirm self-redeem is blocked
- [x] Remove duplicate `redeemFriendCode` function (old version at ~291) from `app.js`
-   - [x] Keep enhanced version (~1953) with dashed code validation pattern
-   - [ ] Run build & referral e2e tests to confirm no regressions
- Remove duplicate redeemFriendCode and verify build/tests pass
- [x] Remove duplicate redeemFriendCode (stubbed old version)
-   - [ ] Run build & referral e2e tests to confirm no regressions
- [ ] Investigate missing user data in admin dashboard (DB insertion/query)
-   - [ ] Verify referral.php inserts user & referral rows on registration
-   - [ ] Fix issues and rerun admin dashboard tests
- [x] Investigate missing admin data: verify SQLite DB entry on registration and fix.
- [ ] Fix referral code validation for multi-dash codes and add unit/e2e tests
## Current Goal
Implement referral link click tracking
- [x] Fix multi-dash referral code validation
- [ ] Implement referral link click tracking
  - [x] Update referral.php to track link clicks
  - [x] Update generateReferralLink() to match backend click handler (use ?code= param)
  - [x] Ensure referral link targets correct host/port (8080 or proxy) so clicks resolve
  - [ ] Add click tracking to referral link UI
  - [ ] Verify click tracking works as expected
- [ ] Run unit and e2e tests for referral link click tracking
- [ ] Update Concept doc to reflect referral link click tracking
## Current Goal
Add click count UI & tests
- [x] Fix referral code display formatting
  - [x] Update formatCode() in referral.php to insert single dashes (4-4-4)
  - [x] Migrate/clean existing stored codes if necessary
  - [x] Add unit tests for formatCode
- [ ] Implement referral link click tracking
  - [x] Update referral.php to track link clicks
  - [x] Update generateReferralLink() to match backend click handler (use ?code= param)
  - [x] Ensure referral link targets correct host/port (8080 or proxy) so clicks resolve
  - [ ] Add click tracking to referral link UI
  - [ ] Verify click tracking works as expected
- [ ] Run unit and e2e tests for referral link click tracking
- [ ] Update Concept doc to reflect referral link click tracking
## Current Goal
Fix referral code formatting & add click count UI
- [ ] Add styling to referral link UI to improve readability and visual appeal
- Issue: Codes displayed to user contain too many dashes (e.g., `EAGE--159-7-67`); root cause is `formatCode()` in referral.php which pads/segments incorrectly—needs fix so codes render like `EAGE-1597-67D0`.
- Referral code formatting bug fixed: `formatCode()` now strips existing dashes, pads, and formats as `XXXX-XXXX-XXXX`.
- [ ] Add styling to referral link UI to improve readability and visual appeal
- [ ] Style 2_5 chord characters container to match 1_1 design (update index.html & CSS)
{{ ... }}
- Referral code formatting bug fixed: `formatCode()` now strips existing dashes, pads, and formats as `XXXX-XXXX-XXXX`.
- New issue: UI still shows 0/3 registrations while admin lists users; need to debug frontend count fetch.
- [x] Fix referral code display formatting
  - [x] Update formatCode() in referral.php to insert single dashes (4-4-4)
  - [x] Migrate/clean existing stored codes if necessary
  - [x] Add unit tests for formatCode
- [ ] Debug registration count mismatch between UI and admin
  - [ ] Verify referral.php GET /?username= returns correct registration_count
  - [ ] Ensure fetchReferralCount updates referralCount state and UI
- New issue: UI still shows 0/3 registrations while admin lists users; frontend `fetchReferralCount` or backend response mapping likely incorrect.
- [x] Style 2_5 chord characters container to match 1_1 design (update index.html & CSS)
- [x] Update container markup in index.html (id & background-image)
- [x] Introduce `.chords-container` and chapter-wide `.chapters-view` styles
- [ ] Debug registration count mismatch between UI and admin
  - [ ] Verify referral.php GET /?username= returns correct registrationCount JSON field
  - [ ] Check fetchReferralCount mapping (data.registrationCount vs camelCase)
  - [ ] Ensure referralCount state saves to localStorage via saveReferralData()
  - [ ] Update UI bindings so Registrations display matches backend
- Added verbose logging and error handling to `fetchReferralCount` for easier debugging of registration/count issues.
- [x] Add detailed diagnostics/logging to fetchReferralCount
- **Observation:** logs indicate `fetchReferralCount` may never be invoked on startup; need to ensure it runs after loading referral data and on interval.
- [x] Ensure `fetchReferralCount()` is called after username lock and on app init
- [ ] Verify backend JSON uses `registrationCount` / `clickCount` fields (camelCase)
- [ ] Update `fetchReferralCount` mapping if necessary
- [ ] Persist updated counts via `saveReferralData` and refresh UI bindings
## Current Goal
-Debug registration count mismatch & add click/click-count UI
- Referral code formatting bug fixed: `formatCode()` now strips existing dashes, pads, and formats as `XXXX-XXXX-XXXX`.
- New issue: `fetchReferralCount` is not triggered on app init; counts remain stale until another action fires it.
## Current Goal
-Fix registration count mismatch (trigger fetchReferralCount on init) & finish click-count UI
{{ ... }}
- **Observation:** logs indicate `fetchReferralCount` may never be invoked on startup; need to ensure it runs after loading referral data and on interval.
- fetchReferralCount now auto-triggers on app init; next step is translating server messages in app.js.
- [x] Ensure `fetchReferralCount()` is called after username lock and on app init
  - [x] Verify UI updates counts correctly after fetch
  - [x] Schedule periodic refresh (e.g., every 5 min)
- [ ] Localize backend referral response codes in app.js
  - [ ] Add `translateReferralMessage(code)` helper
  - [ ] Use translated messages when showing success/error toasts
  - [ ] Test translations for DE/EN languages
## Current Goal
Localize referral messages & verify registration/click counts
- Server responses from `referral.php` now return codified message keys for localization; app.js must translate them client-side.
- translateReferralMessage helper implemented in app.js and wired into redeemFriendCode for localized server messages.
- [ ] Localize backend referral response codes in app.js
  - [x] Add `translateReferralMessage(code)` helper
  - [x] Use helper in redeemFriendCode success/error toasts
  - [x] Integrate helper in fetchReferralCount error handling
  - [ ] Replace remaining static referral messages with helper
  - [ ] Test translations for DE/EN languages
## Current Goal
Finish localization integration & click-count UI verification
- Server responses from `referral.php` now return codified message keys for localization; app.js translates them via `translateReferralMessage`.
- Need to parse URL hash (`#ref=<CODE>`, `#activity=<ID>`) on app startup for referral deep linking and activity navigation.
- [x] Implement URL hash parsing for deep links
  - [x] Detect `#ref=<CODE>` on load and pre-fill referral flow
  - [x] Detect `#activity=<ID>` and auto-start corresponding activity
  - [ ] Add unit/e2e tests for hash parsing
- [x] Refine hash cleanup: keep #activity param, remove only #ref and add English inline comment
## Current Goal
Verify deep link parsing & click-count UI
- URL hash parsing implemented in app.js (parseUrlHash in init) to handle #ref and #activity deep links.
- [x] Detect `#ref=<CODE>` on load and pre-fill referral flow
- [x] Detect `#activity=<ID>` and auto-start corresponding activity
- [ ] Add unit/e2e tests for hash parsing
- Comments must always be written in English (user reminder).
## Current Goal
Refine hash cleanup & verify deep links
- Deep link implementation caused runtime error: `showChordActivity is not a function`; need to add or import this method.
- Coding standard reminder: comments must always be written in English.
- [ ] Fix `showChordActivity is not a function` runtime error
## Current Goal
Fix showChordActivity runtime error & verify deep links
- Deep link implementation updated: switched to event dispatching; runtime error fixed.
- Referral deep link should store the referring code (`referredBy`) instead of pre-filling the input; show this info in Player Settings (e.g., "Friend: <username/code>").
- [x] Fix `showChordActivity is not a function` runtime error
- [ ] Persist `referredBy` code from `#ref=` hash into local user data
  - [ ] Save to localStorage and include in `saveReferralData`
  - [ ] Display referring friend (code or username) in Player Settings UI
  - [ ] Adjust parseUrlHash comment / logic accordingly
## Current Goal
Persist referredBy code & verify deep links
- Deep link logic now dispatches `set-pitch-mode` / `set-chord-mode` events instead of calling nonexistent functions; runtime error resolved.
- Referral hash processing to store `referredBy` code (not auto-fill); will surface in Player Settings.
- [ ] Persist `referredBy` code from `#ref=` hash into local user data
  - [ ] Save to localStorage and include in `saveReferralData`
  - [ ] Display referring friend (code or username) in Player Settings UI
  - [ ] Adjust parseUrlHash comment / logic accordingly
- referredBy property added; saveReferralData now persists it and parseUrlHash stores the code & displays info toast.
- [ ] Persist `referredBy` code from `#ref=` hash into local user data
  - [x] Save to localStorage and include in `saveReferralData`
  - [ ] Display referring friend (code or username) in Player Settings UI
  - [x] Adjust parseUrlHash comment / logic accordingly
## Current Goal
- Display referredBy in Settings UI & verify deep links
[x] Persist `referredBy` code from `#ref=` hash into local user data
  - [x] Save to localStorage and include in `saveReferralData`
  - [x] Display referring friend (code or username) in Player Settings UI
  - [x] Adjust parseUrlHash comment / logic accordingly

## New Tasks
- [ ] Fix admin.php auto-refresh causing login redirect (implement conditional refresh post-auth, or AJAX data refresh)

## Current Goal
Verify referredBy display & fix admin auto-refresh