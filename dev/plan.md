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
- Referral.php CORS headers refactored with explicit allowedOrigins and debug logging (`referral-debug.log`) to resolve cross-origin errors.
- Debug logging now uses PHP `error_log`; file permission issue resolved.
- `utils/js_config.php` now shows diagnostics (env & config) when accessed directly.
- **Nginx config already sets `Access-Control-Allow-Origin` headers, leading to duplicates together with PHP headers.**
- PHP CORS headers removed in referral.php; Nginx now solely sets CORS, duplicate header issue resolved.
- `utils/js_config.php` now shows diagnostics (env & config) when accessed directly.
- [x] Fix `$store` undefined error in 2_5 progress display
- [x] Deduplicate progress display in 2_5 activity and inject unlock-hint text (10/20 thresholds)
- [x] Add configurable CSS class to hide debug buttons (opacity 0) with toggle for local development
## Current Goal
Update remaining PHP endpoints to use JS config
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
- [x] Conditionally show `share_code_info` message only when rewards unlocked (settings.html)
- [x] Fix debug buttons being still clickable despite display none
## Current Goal
Implement backend self-redeem protection & share link display
- Note: Frontend self-redeem protection implemented; users cannot redeem their own referral code.
- [x] Prevent users from redeeming their own referral code (backend & frontend)
- [x] Display shareable referral link with click count in UI
- Note: Referral link feature partially implemented; need to fix syntax errors and complete UI.
- [ ] Fix syntax errors in referral link feature
- [ ] Complete referral link UI and display click count
- [ ] Verify referral link feature works as expected
## Current Goal
Implement backend self-redeem protection & share link display
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
-   - [ ] Run build & verify no missing method errors
- Remove duplicate redeemFriendCode and verify build/tests pass
- [x] Remove duplicate redeemFriendCode (stubbed old version)
-   - [ ] Run build & verify no missing method errors
- [ ] Investigate missing user data in admin dashboard (DB insertion/query)
-   - [ ] Verify referral.php inserts user & referral rows on registration
-   - [ ] Fix issues and rerun admin dashboard tests
- [x] Investigate missing admin data: verify SQLite DB entry on registration and fix.
- Production deploy path issue: scripts requested from `https://lalumo.eu/` instead of `/app/`; need to set correct public path (e.g., webpack `publicPath` or `<base href="/app/">`).
- [x] Fix asset paths for subdirectory deploy (`/app`) – set webpack `publicPath` or base href
- webpack.config.js now sets `publicPath` to `/app/` when built with `--env deploy=subdirectory`; deploy.sh updated to pass this flag.
## Current Goal
Automatic username unlock & fix /app asset paths
- Production deploy path issue: scripts requested from `https://lalumo.eu/` instead of `/app/`; need to set correct public path (e.g., webpack `publicPath` or `<base href="/app/">`).
- [x] Fix asset paths for subdirectory deploy (`/app`) – set webpack `publicPath` or base href
- [x] Fix asset paths for subdirectory deploy (`/app`) – set webpack `publicPath` or base href
## Current Goal
Automatic username unlock feature & verify /app asset loading
- Asset paths for subdirectory deploy verified working after live deploy.
- Automatic username unlock implemented via `checkUsernameStillExists`; server check parameter `check_existing=1`.
- [x] Add frontend helper `checkUsernameStillExists(username)` calling `referral.php?check_existing=1&username=`
- [x] Invoke helper during `loadUserData()` when `isUsernameLocked` is true
- [x] If API indicates missing user, reset `isUsernameLocked` & `lockedUsername`, persist via `saveReferralData()`
- [x] Show toast informing user that account was reset (translation pending)
- Translation strings for username_reset are still missing in both English and German resources; must add them.
- [x] Add username_reset translation string to `values/strings.xml` (EN)
- [x] Add username_reset translation string to `values-de/strings.xml` (DE)
- [ ] Verify toast uses localized username_reset string at runtime
- Live deploy verified: assets load correctly from `/app/`.
## Current Goal
Add username_reset translations & verify toast
- Translation strings for username_reset are still missing in both English and German resources; must add them.
- Hard-coded localhost URLs found in multiple files (`referral.php`, `app.js`, playwright config). User requested a central config so domains can differ between local and production (lalumo.eu).
- [x] Create centralized config (e.g., `src/config.js` or `.env`) exposing `API_BASE_URL`, `APP_BASE_PATH`
- [x] Import and use config in `src/components/app.js` instead of hard-coded URLs
- [ ] Replace `$app_url` in `referral.php` with a value from config or environment variable
- [ ] Update `playwright.config.js` to consume central config for base URL
- [ ] Adjust deploy scripts if necessary to pass production values
## Current Goal
Add username_reset translations & finalize central URL config
- New `config.json` created to store dev/prod URLs; plan is to deprecate JS‐only `config.js` so both JS and PHP share one source of truth.
- [x] Add `config.json` with dev/prod URL settings
- [x] Import and use config in `src/components/app.js` instead of hard-coded URLs
- [ ] Replace `config.js` usage with runtime loading of `config.json` across JS
- [ ] Implement helper to fetch `config.json` before app init
- [ ] Replace `$app_url` in `referral.php` with value from `config.json` or environment variable
- [ ] Update `playwright.config.js` to consume central config for base URL
- [ ] Adjust deploy scripts if necessary to pass production values
- [ ] Replace `config.json` with `config.yaml` (YAML central config)
- [ ] Implement YAML loader in JS (webpack yaml-loader or js-yaml) and PHP (`yaml_parse_file` or fallback)
- [ ] Update app.js, referral.php, playwright.config.js, deploy scripts to read from `config.yaml`
- [ ] Remove deprecated `config.js` after YAML migration
## Current Goal
Migrate to YAML central config & add username_reset translations
- User prefers YAML over JSON for central config; migrate to `config.yaml` for single-source configuration across JS and PHP.
- js-yaml and yaml-loader dev dependencies installed to support YAML parsing in JS/Webpack.
- Note: Added webpack yaml-loader to support importing YAML configs.
- webpack.config.js updated to include yaml-loader rule for importing YAML configs.
- Dev build (direct webpack) now succeeds, confirming loader works when run manually.
- However, `npm run build:fast` still fails to parse config.yaml – likely different webpack invocation or path rules; must harmonize configs.
- [x] Install js-yaml and yaml-loader dev dependencies
- [x] Add yaml-loader rule in webpack.config.js (JS YAML loader enabled)
- [x] Implement YAML loader in PHP (`yaml_parse_file` or fallback)
- [x] Update app.js, referral.php, playwright.config.js, deploy scripts to read from `config.yaml`
- [x] Remove deprecated `config.js` after YAML migration
- [ ] Fix webpack yaml-loader error parsing config.yaml (adjust loader include or file location)  
  - [x] Verify dev build succeeds after fix  
  - [x] Ensure `npm run build:fast` compiles without YAML errors  
  - [x] Revert `config.js` to import YAML (remove hardcoded object)  
  - [ ] Run build to confirm config loads correctly in both envs
  - [ ] Investigate yaml-loader output (JSON string) and chain json parsing or adjust import syntax
- Decision reached with user: Abandon YAML approach entirely; use JS `src/config.js` as single source of truth and let PHP parse it directly.
- [x] Remove config.yaml and yaml-loader rule from webpack.config.js
- [ ] Delete utils/yaml.php and any YAML parsing code
- [ ] Update referral.php and other PHP files to parse values from src/config.js (regex or eval) instead of YAML
- [ ] Clean up build scripts and docs referencing YAML
## Current Goal
Remove YAML config & implement PHP parsing of JS config
- Dev build (direct webpack) now succeeds, confirming loader works when run manually.
- However, `npm run build:fast` still fails to parse config.yaml – likely different webpack invocation or path rules; must harmonize configs.
- [x] Fix webpack yaml-loader error parsing config.yaml (obsolete after YAML removal)
- [ ] Delete utils/yaml.php and update referral.php to parse JS config
## Current Goal
- Delete utils/yaml.php & update referral.php to parse JS config
- Decision reached with user: Abandon YAML approach entirely; use JS `src/config.js` as single source of truth and let PHP parse it directly.
- New PHP parser `utils/js_config.php` created to extract config from JS for backend use.
- [x] Remove config.yaml and yaml-loader rule from webpack.config.js
- [x] Create `utils/js_config.php` to parse JS config (completed)
- [ ] Update referral.php and other PHP files to use `getJsConfig()` instead of YAML
- [ ] Delete utils/yaml.php after migration
- [ ] Clean up build scripts and docs referencing YAML
## Current Goal
Update referral.php to use JS config parser & remove yaml.php
- New PHP parser `utils/js_config.php` created to extract config from JS for backend use.
- referral.php now imports `utils/js_config.php` and loads `src/config.js` (YAML removed)
- [x] Remove config.yaml and yaml-loader rule from webpack.config.js
- [x] Create `utils/js_config.php` to parse JS config (completed)
- [ ] Update remaining PHP files to use `getJsConfig()` instead of YAML
- [x] Update referral.php to use `getJsConfig()`
- [ ] Update other PHP endpoints (admin dashboard, etc.) to use `getJsConfig()`
## Current Goal
Delete utils/yaml.php & migrate remaining PHP files to JS config
- [x] Delete utils/yaml.php
- [x] Update referral.php to use getJsConfig()
- [ ] Update remaining PHP endpoints (admin dashboard, etc.) to use getJsConfig()
## Current Goal
Migrate remaining PHP endpoints to JS config
- YAML config fully removed; JS config is now the single source of truth; `utils/yaml.php` deleted.
- User requested using the shared `update_progress_display` in 2_5 character activity.
- [x] Remove local `update_progress_display` method from pitches.js and update calls to use shared helper
- [x] Ensure build passes after refactor
- [x] Integrate shared `update_progress_display` into 2_5 character activity (update index/chords logic)
## Current Goal
Migrate remaining PHP endpoints to JS config & address CORS/domain issue
- [x] Delete utils/yaml.php
- [x] Update referral.php to use getJsConfig()
- [ ] Update remaining PHP endpoints (admin dashboard, etc.) to use getJsConfig()
- [x] Investigate CORS issue and domain configuration for proper API calls
## Current Goal
Migrate remaining PHP endpoints to JS config
- Referral.php CORS headers refactored with explicit allowedOrigins and debug logging (`referral-debug.log`) to resolve cross-origin errors.
- Debug logging now uses PHP `error_log`; file permission issue resolved.
- `utils/js_config.php` now shows diagnostics (env & config) when accessed directly.
- PHP CORS headers removed in referral.php; Nginx now solely sets CORS, duplicate header issue resolved.
- `utils/js_config.php` now shows diagnostics (env & config) when accessed directly.
- [x] Investigate CORS issue and domain configuration for proper API calls
  - [x] Refactor CORS headers in referral.php with allowedOrigins list & debug log
- [x] Fix `referral-debug.log` permission error (switched to error_log)
- [x] Expose diagnostic endpoint in `utils/js_config.php` when accessed via browser (echo env + config)
- [ ] Update admin dashboard PHP endpoints to include getJsConfig if needed
## Current Goal
Update admin dashboard PHP endpoints to JS config
- [x] Fix `referral-debug.log` permission error (switched to error_log)
- [x] Expose diagnostic endpoint in `utils/js_config.php` when accessed via browser (echo env + config)
- [ ] Conditionally show `share_code_info` message only when rewards unlocked (settings.html)
- [ ] Update admin dashboard PHP endpoints to include getJsConfig if needed
- Production deploy still requests main bundle from root; need to adjust `base href` or webpack `publicPath` for live site.
- Debug-element CSS strengthened with `pointer-events:none` and `!important` to prevent clicks.
- deploy.sh now uploads PHP utils, admin directory and referral.php to `/app`, enabling backend endpoints in production.
- [x] Conditionally show `share_code_info` message only when rewards unlocked (settings.html)
- [ ] Fix production asset path issues (main JS loaded from root instead of /app)
- [ ] Deploy / configure utils/js_config.php and admin endpoints under /app path
- [ ] Verify production asset loading and endpoint accessibility after deploy
- [ ] Update admin dashboard PHP endpoints to include getJsConfig if needed
## Current Goal
- Fix production asset path issues & verify PHP endpoints