# Investigate Mascot Message Persistence

## Notes
- User sees log: "Skipping mascot message for 1_1_pitches_high_or_low - already shown once" immediately after app start.
- Suggests seen-flag survives page reload, likely stored in localStorage.
- Relevant code snippet (pitches.js L1664-L1668) checks `this.mascotSettings.seenActivityMessages[activityId]`.
- Mascot settings are loaded from localStorage at L278-285 (`lalumo_mascot_settings`), so flags persist across reload.
- `seenActivityMessages` is initialised with an empty object at L68 in pitches.js.
- User selected **Option 1**: clear `seenActivityMessages` on every app start; auto-hide still not working reliably.
- Need ability to globally disable Mascot TTS; user requested a central setting.
- Added `disableTTS` flag to `mascotSettings` (default `true`).
- Runtime log showed `disableTTS` was `undefined`; fixed by merging defaults with loaded settings and persisting back to localStorage.
- User now wants to create a public homepage within the same repo (`lalumo.eu`) and consider moving the app into `app.html` to hide monetized activities while staying open source.
- User requested automatic `npm run build:fast` to be executed automatically after code changes.
- Close button for mascot overlay no longer works; preference toggle currently has no effect and needs fixing.
- Issue due to duplicate Pitches instance in settings (`x-data="pitches()"`) creating separate mascotSettings scope; need shared store.
- Implemented global Alpine store `mascotSettings`; settings toggle and close button now use `$store` and persist across components.
- Updated `pitches.js` to reference `$store.mascotSettings` for `showHelpMessages`, `seenActivityMessages`, and `disableTTS`.
- Global store initialised after Alpine start (`Alpine.store('mascotSettings').init()`).
- Initial public homepage (`homepage/index.html`) created with app colour scheme and hero design.
- Started repository restructuring: created `app/` dir and copied built SPA to `app/index.html`.
- Webpack output path changed to `app/` and devServer updated accordingly.
- Fixed bug in "Match the Sounds": forced melody now only plays once (reset `correctAnswer` after unlock).
- Asset loading errors (404 for strings-en.xml, missing images) arose after homepage restructure; added CopyWebpackPlugin and extra static dirs.
- Updated run.sh to sync images into app/ directory and display both App and Homepage URLs; copy-webpack-plugin installed and webpack build now outputs XML files and images.
- User requested adding F-Droid download link and open-source GitHub repo (https://github.com/rubo77/Lalumo) to homepage and to the in-app credits view.
- Implemented F-Droid and GitHub links on homepage and in-app credits.
- User requested hamburger menu closes after `resetCurrentActivity`.
- Implemented F-Droid and GitHub links on homepage and in-app credits.
- Added initial logic to close hamburger menu in `resetCurrentActivity`, but menu still not closing; needs further fix.
- Added `close-hamburger-menu` custom event and listener in index.js/index.html, but introduced syntax (lint) errors; menu still not closing until fixed.
- Global `closeHamburgerMenu` function added in index.js and resetCurrentActivity now dispatches it; still needs syntax cleanup.

## Task List
- [x] Search codebase for any `localStorage.setItem` / `getItem` involving `mascotSettings` or `seenActivityMessages`.
- [x] Verify initialisation path of `this.mascotSettings` in pitches component.
- [x] Confirm whether data is loaded from localStorage on startup.
- [x] Explain findings to user and propose fix (e.g., reset on session start or better clearing logic).
- [x] Implement Option 1: clear `seenActivityMessages` at startup before skip-check.
- [x] Persist cleared `mascotSettings` back to localStorage after reset.
- [x] Retest reload: first message shows, no "Skipping" log until after display.
- [x] Investigate and fix auto-hide (10 s) not hiding mascot overlay.
- [x] Design central configuration mechanism (reuse `mascotSettings` object).
- [x] Add `disableTTS` flag to `mascotSettings` (default true).
- [x] Update mascot message logic to respect `disableTTS` and skip TTS calls.
- [x] Debug why `this.mascotSettings.disableTTS` is undefined in `showMascotMessage` and ensure correct initialisation.
- [x] Persist updated `mascotSettings` (with `disableTTS` and cleared seen flags) back to localStorage after init.
- [ ] Verify TTS is not invoked when disabled and no errors occur.
- [x] Draft homepage content structure in `dev/Homepage.md` (links, imprint, privacy).
- [x] Decide on repo structure: moved SPA to `app/` directory, separate from homepage.
- [x] Update build workflow to output SPA into `app/` directory and adjust paths.
- [x] Fix forced melody bug in 1_2 Match Sounds (reset `correctAnswer`)
- [ ] Verify asset loading (strings XML, images) works after webpack update
- [x] Update run.sh to serve both app and homepage, document access URLs
- [x] Update homepage links and navigation to point to `/app/`.
- [ ] Ensure monetized activity code is not exposed on public homepage.
- [x] Fix mascot close button & preference effect
  - [x] Replace settings toggle to use global mascotSettings store (remove extra `x-data="pitches()"`).
  - [x] Implement shared/global mascotSettings store accessible across components.
  - [x] Retest close button and toggle; ensure persistence.
- [x] Ensure mascot preference setting (`disableTTS` or visibility) takes effect and persists.
- [x] Create `homepage/index.html` using existing colour scheme and hero design.
- [x] Add F-Droid & GitHub links to `homepage/index.html` (downloads & footer).
- [x] Add GitHub open-source link to in-app credits view.
- [x] Ensure hamburger menu closes after reset current activity.
  - [x] Attempt: set `appComponent.__x.$data.menuOpen = false` after reset
  - [x] Investigate why menu still open; introduced custom event listener approach
  - [x] Fix syntax/lint errors in index.js introduced by event code
  - [x] Dispatch `closeHamburgerMenu()` from `resetCurrentActivity`
  - [x] Verify hamburger menu closes on mobile after activity reset

## Current Goal
Fix index.js errors & close hamburger menu