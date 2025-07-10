# Asset Sync & Build Debug Plan (ARCHIVED)

## Notes
- Sound assets are synced for Android and iOS via general rsync from public/ to dist/; there is no filtering for unused sound files (all are included).
- Images are filtered and only used ones are copied to Android assets, but for the web build, all public/ assets should be available unless excluded or mishandled by the build process.
- .gitignore excludes /ios/App/App/public/ and /android/app/src/main/assets/public/ so these are not tracked by git.
- User reported that an image (2_5_chords_dog_cat_owl_no_squirrel_no_octopus.jpg) is missing from the webpack web build at /app/images/backgrounds/.
- Confirmed: image exists in public/, but is missing in dist/app/images/backgrounds/ after build.
- Webpack config includes a rule to copy backgrounds to app/images/backgrounds/, but the image is not present there after build; next step is to debug why this copy is not occurring as expected.
- Fixed error in ios-build.sh where it tried to copy to dist/app/ after deletion; script now only copies to dist/.
- ios-build.sh now runs successfully after fix (no errors).
- Confirmed: dist/app/images/backgrounds/ directory does not exist after build, even though image is present in dist/images/backgrounds/.
- Discovered: mobile-build.sh deletes dist/app/ after build (lines 217-218), causing loss of app/images/backgrounds/ and other assets copied there by webpack.
- Refactored mobile-build.sh to preserve dist/app/ and its assets after build (no deletion).
- Refactored ios-build.sh to preserve dist/app/ and its assets after build (no deletion).

## Task List
- [x] Confirm sound asset syncing for Android and iOS
- [x] Create iOS build script based on mobile-build.sh
- [x] Confirm image exists in public/images/backgrounds/
- [x] Check if image exists in dist/app/images/backgrounds/ after build
- [x] Investigate if image exists in dist/images/backgrounds/
- [x] Fix ios-build.sh script error and verify successful run
- [x] Identify that mobile-build.sh deletes dist/app/ after build
- [x] Refactor build process to ensure assets persist in dist/app/
- [x] Verify that assets now persist in dist/app/ after build
- [x] Confirm issue is resolved and close task

## Current Goal
Task complete: asset sync/build issue resolved

# Multi-Touch Handling for Android Chrome

## Notes
- User wants multi-touch handling: when multi-touch is detected, all other touches should be ignored and only the last touch should trigger the button.
- Target: Chrome on Android 15 (mobile web, possibly PWA or hybrid app context).
- Touch event handlers are found in index.html, app.js, pitches.js, chords.js, and other component files.
- No global addEventListener("touch...") found, but touchstart is handled in various places (including AlpineJS inline handlers).
- Debug logging is available via debugLog utility.
- Multi-touch handler utility (touch-handler.js) implemented to process only the last touch on Android Chrome.
- User wants multi-touch handler to run on all browsers, not just Android Chrome, and reports that browser detection may not be working as intended.
- Multi-touch handler refactored to run on all browsers (browser detection removed).
- Debug logging for multi-touch events improved and made consistent with app-wide debugLog usage.
- App initialization and multi-touch handler are both being called twice (double initialization bug observed in logs).
- Multi-touch handler throws an error when lastTouchTarget is null (needs null check). Null check implemented; error should be resolved.
- Investigating root cause of double initialization by reviewing HTML/app structure and AlpineJS usage.
- Alpine.js warning: "Alpine has already been initialized on this page. Calling Alpine.start() more than once can cause problems."
- Double initialization may be related to errors loading native-app-detector.js, Alpine component structure, or multiple x-data/x-init usage on main elements.
- New error: missing method `checkIOSAudio` ("is not a function") found in logs; may contribute to Alpine/app double initialization.
- Alpine.js double initialization is now prevented by a global flag (`window._alpineInitialized`) in index.js; debug logging added for Alpine startup.
- `checkIOSAudio` method implemented in app component to resolve missing function error.

## Task List
- [x] Identify all relevant touch event handlers for buttons/interactions
- [x] Implement logic to ignore all but the last touch when multi-touch is detected (Android Chrome)
- [x] Integrate multi-touch handler utility into main app.js
- [x] Refactor handler to run on all browsers and fix detection logic
- [x] Add debug logging for multi-touch events (optional)
- [ ] Test on all browsers to confirm correct behavior
- [x] Fix multi-touch handler crash when lastTouchTarget is null
- [x] Fix double initialization of app and multi-touch handler
  - [x] Analyze Alpine.js/component structure and resolve root cause
  - [x] Fix missing checkIOSAudio method or its invocation
- [ ] Test and confirm Alpine.js/app single initialization (no warnings)

## Current Goal
Test and confirm Alpine.js/app single initialization