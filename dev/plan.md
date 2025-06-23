# Referral Feature Enhancement Plan

## Notes
- Referral system now increments `registration_count` for referrer during new user creation (completed).
- New requirement: when user arrives via referral link, frontend should display the referring username and promise extra rewards.
- Backend helper `getUsernameByReferralcode` is implemented inside `referral.php`, and a new API action (`?code=XXX&action=username`) now returns the referring username.
- Follow user global rules: no failsafes, add clear logging with unique tags, small files can be edited directly, avoid chmod +x.
- Initial frontend logic (`getUsernameByReferralCode`) added; referral link now fetches and stores `referrerUsername` in localStorage.
- `loadUserData` now retrieves and persists `referrerUsername` from localStorage (completed).
- referrals.html updated to show referring username info (completed).
- UI strings added to strings.xml (completed).
- Admin dashboard requires sortable columns and delete user button.
- Admin dashboard updated: sortable headers, delete button (JS), PHP deleteUser function, URL delete handler implemented; status message styles added.
- Duplicate "Registrations" label in referrals.html fixed.
- Bug identified: referralCount value not incrementing for referrers.
- Added detailed debug logging to fetchReferralCount in app.js to diagnose referralCount issue.
- Added backend debug logging to registration_count updates in referral.php for deeper diagnosis.
- Added backend debug logging to referral stats API to verify correct data retrieval.
- New requirement: API JSON responses must indicate if the referrer's registration_count was incremented.
- Backend JSON responses now include `registrationIncremented` and updated counts.
- Analysis shows referral entry may be created too late, preventing `registration_count` increment – logic needs adjustment.
- Backend logic now creates missing referral entry for referrer before increment, bug fixed.
- Possible cause of invalid JSON: stray output/whitespace before JSON header in PHP registration endpoint; needs investigation.
- New issue: first registration returns invalid/empty JSON (SyntaxError), needs fixing.
- Need additional frontend logging: when JSON parsing fails in lockUsername response, log the full raw response string for diagnostics.
- Added raw response logging in lockUsername to capture full server response for debugging invalid JSON.
- Invalid JSON response bug in registration endpoint fixed (user patch in referral.php).
- `referredBy` parameter now included in lockUsername request body; verify during manual test.
- `referredBy` parameter was initially added via POST body, but user now requests switching to a GET registration endpoint; frontend must log full GET URL and backend must accept it.
- Frontend lockUsername call converted from POST to GET and logs full request URL (completed).
- Draft GET handler for `action=lockUsername` added in referral.php and helper calls corrected; still needs parity with POST logic.
- Noticed `referredBy=null` being sent when no referrer; need conditional omission.
- Frontend URL param generation updated: `referredBy` only appended if a referral code exists; however variable mismatch (`referralCode` vs `referrerCode`) observed.
- Variable mismatch fixed: GET param now uses `this.referredBy`.
- Fallback param issue fixed: parameter now omitted when no code.
- Discovered saveReferralData does not persist `referredBy`/`referrerUsername`; needs addition.

## Task List
- [x] Increase `registration_count` after successful referred registration (backend done).
- [x] Implement `getUsernameByReferralcode` in `referral.php` returning username for given code with proper logging.
- [x] Add API route/parameter to call the new function securely (e.g., GET `?code=XXX&action=username`).
- [x] Add `getUsernameByReferralCode` function in `app.js` to retrieve referring username.
- [x] Update `public/partials/referrals.html` (and related JS) to fetch and show referring username when `ref` parameter is present.
- [x] Ensure `saveReferralData` persists `referrerUsername` field consistently.
- [x] Update `loadUserData` and startup flow to fetch and store `referrerUsername` when present.
- [x] Add sortable column functionality to admin table in admin.php.
- [x] Add delete user button with backend handling in admin.php.
- [x] Fix duplicate "Registrations" label in referrals.html.
- [x] Investigate and fix referralCount not incrementing (backend and frontend).
- [x] Extend referral.php JSON responses with flag showing if registration_count was incremented.
- [x] Adjust frontend handling to process new registrationIncremented flag.
- [x] Add new UI strings to default `strings.xml` for label and reward message.
- [x] Ensure referral entry is created before counting registration (backend logic).
- [x] Fix invalid JSON response on first user registration.
  - [x] Investigate source of invalid JSON (check for whitespace or accidental output before header/echo).
  - [x] Add raw response logging in app.js (lockUsername) when JSON parse fails.
- [x] Fix missing `referrerUsername` (send `referredBy` in lockUsername request body).
- [x] Convert lockUsername request to GET with full URL logging (frontend).
- [x] Replace undefined helpers (`generateUniqueReferralCode`, `generatePassword`) with existing `generateReferralCode`, `generateRandomPassword` or add wrappers.
- [x] Fix sending `referredBy=null` when no referrer (only include param if value present).
- [x] Remove fallback `referredBy=none`; omit parameter when absent.
- [ ] Finalize GET `action=lockUsername` handling in referral.php (align with POST logic).
- [ ] Ensure same referral increment logic and JSON response as POST path.
- [x] Verify and unify variable name for referral code in lockUsername (`referralCode` vs `referrerCode`).
- [ ] Persist `referredBy` and `referrerUsername` in saveReferralData and ensure load flow consistency.
- [ ] End-to-end manual test: referral click -> username display -> registration -> counters correct.

## Current Goal
- Persist referredBy storage & finalize GET handler parity