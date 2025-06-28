# Musici Referrals & Translation Plan

## Notes
- The checkmark (✓) in referrals.html is now green (CSS change completed).
- All referral-related strings have been translated to German and added to strings.xml (values-de).
- Specific string keys translated: "your_referral_code", "referred_by", and "referral_info".
- Extract all user-facing strings from referrals.html (lines 1-92) and add them to strings.xml (both English and German).
- Do not add fallbacks or failsafes; fix problems directly.
- Only update default strings.xml for new strings, not other variants.
- Next: Systematically scan all JavaScript files for user-facing strings not yet present in the translation system (strings.xml). List these untranslated strings for further localization.
- Initial scan found alert/confirm messages in JS not using $store.strings. Continue and complete the systematic listing.
- Systematic search for alert, confirm, and showToast messages in JS completed. Relevant untranslated strings have been listed for localization.
- Dynamically composed and multi-line user-facing strings (e.g., constructed with += or template literals) were previously overlooked; these must also be extracted for translation.
- Translation prompt markdown file created and refined. User clarified: do not translate /dev/ files, shell scripts, comments, unreachable code, or log entries.
- Translation prompt updated: Only fallback pattern `this.$store.strings?.key_name || 'Fallback'` is allowed; code-fallback texts are explicitly excluded from translation. Examples and instructions in translation_prompt.md are now more precise.
- translation_prompt.md reviewed and updated: examples improved, concrete next steps for systematic JS string migration and verification documented.
- Alert and toast messages from translation prompt have been added to both EN/DE XML files; ready for code refactor.
- Systematic JS code refactor and verification per translation_prompt.md is ongoing.
- Systematic JS string migration and verification is ongoing.
- Alert/toast message migration in app.js is underway, with more to follow.
- This pattern is now documented in the translation prompt; migration to strings.xml is planned for consistency.
- All isGerman-based strings from pitches/common.js have been added to English and German XML files; ready for code refactor.
- User clarified: the "no matching activity" fallback in resetCurrentActivity does not need to be translated or migrated, as it is unreachable by design.
- All isGerman-based UI strings from pitches.js have been added to English and German XML files; ready for code refactor.
- Dynamic error and import messages are now being migrated to $store.strings in app.js; process is ongoing.
- Copy error messages have been migrated to $store.strings in app.js.
- Invalid save code error messages have been migrated to $store.strings in app.js.
- No data to copy error messages have been migrated to $store.strings in app.js.
- Progress reset success messages have been migrated to $store.strings in app.js.
- New: Website must be generated from a single HTML template source for both English (/) and German (/de/), using adjacent <span lang="en"> and <span lang="de"> blocks. At build, filter for the target language. All assets/links must use absolute paths. Navigation and SEO (hreflang, canonical) must be correct. Webpack/html-loader/language-loader setup required. Integrate this into the existing main webpack config for both app and homepage, as per latest user feedback and inspection, to ensure seamless integration and avoid separate config duplication. The multilingual static website build system must be integrated into the existing main webpack config (not a separate config), per latest user feedback and inspection.
- New: All language-specific HTML outputs (e.g. index.html, agb.html, etc.) must be generated from a single source-template file (e.g. index-template.html, agb-template.html, etc.) containing both languages, following the same adjacent lang="en"/"de" markup convention. This means that each HTML output will have a corresponding source-template file that includes both English and German content, marked with lang="en" and lang="de" respectively, allowing for easy maintenance and updates.

## Task List
- [x] Change checkmark color to green in referrals.html (CSS)
- [x] Translate referral-related strings to German and add to strings.xml (values-de)
  - [x] "your_referral_code"
  - [x] "referred_by"
  - [x] "referral_info"
- [x] Extract all user-facing strings from referrals.html (lines 1-92) and add to strings.xml (both English and German)
- [x] List all untranslated user-facing strings still present in JavaScript code (systematic scan and list)
  - [x] Initial alert/confirm messages found
  - [x] Complete systematic listing of all untranslated JS strings
  - [x] Extract all dynamically composed and multi-line user-facing strings (e.g., message += ...) for translation
  - [x] Create a markdown file with a translation prompt for all such strings and filenames in /dev/
  - [x] Identify further untranslated user-facing strings in other files (e.g., pitches/common.js)
  - [x] Document isGerman-based translation pattern in translation prompt
  - [x] Add English referral/progress/copy/share strings to strings.xml
  - [x] Add German translations to values-de/strings.xml
  - [x] Localize JavaScript strings in app.js using strings.xml
  - [x] Add isGerman-based strings from pitches/common.js to strings.xml (EN/DE)
  - [x] Extract isGerman-based UI strings from pitches.js and add to strings.xml (EN/DE)
  - [x] Refactor isGerman-based translations in pitches/common.js to use $store.strings/strings.xml
  - [x] Refactor isGerman-based translations in pitches.js to use $store.strings/strings.xml
  - [x] Review and update translation_prompt.md examples for accuracy and completeness
  - [x] Define and document next translation steps (systematic JS string extraction, migration, and verification)
  - [x] Begin systematic JS code refactor and verification per translation_prompt.md
  - [x] Continue systematic JS string migration and verification per translation_prompt.md
  - [x] Migrate copy error messages to $store.strings in app.js
  - [x] Migrate invalid save code error messages to $store.strings in app.js
  - [x] Migrate no data to copy error messages to $store.strings in app.js
  - [x] Migrate progress reset success messages to $store.strings in app.js
  - [x] Complete systematic JS string migration and verification
- [ ] Refactor website HTML templates: adjacent lang="en"/"de" blocks for all translatable text
- [ ] Implement custom language-loader for HTML (filters by lang at build)
- [ ] Update webpack config for multi-language builds and correct output structure (integrate into existing main config)
- [ ] Adjust all asset and navigation links to use absolute paths and language-specific routing
- [ ] Add SEO tags (hreflang, canonical, meta) for both languages
- [ ] Test build: verify / and /de/ output, links, and SEO

## Current Goal
Implement multilingual static website build system