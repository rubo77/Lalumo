# Username Creation Info Box Plan

## Notes
- User wants an info box to appear after username creation.
- Info box should say: "dein name ist ... . Du kannst dies in den Einstellungen ändern"
- This should happen immediately after the username is created.
- Usernames should be editable in the settings.
- The toast notification system is used for the info box.
- The info box correctly displays the username via string replacement.
- The toast auto-dismisses after 5 seconds; no manual close needed.
- User requested: For local dev, referral URLs must be http://localhost:8080/referral.php (not /api/referral.php)
- Username info box and update messages are now localized in both English and German
- Update fallback message in setUsername to English unless localized in German
- Add 1s delay before memory game feedback sound
- Localize unlock_squirrel_message, unlock_octopus_message, and all_animals_unlocked in EN/DE

## Task List
- [x] Locate where username creation is handled in the codebase
- [x] Implement logic to trigger info box after username creation
- [x] Create the info box UI with the required message
- [x] Add/update localized string resources for username info box
- [x] Add username info string to strings.xml (EN/DE)
- [x] Ensure the info box displays the correct username
- [x] Add a way to dismiss/close the info box
- [x] Verify that username can be changed in settings
- [x] Localize username updated message in saveUsername method
- [x] Update fallback message in setUsername method
- [x] Update referral URL path for local development
- [x] Test the feature end-to-end
- [x] Add 1s delay before playing feedback sound in memory game
- [ ] Localize unlock_squirrel_message, unlock_octopus_message, and all_animals_unlocked in EN/DE

## Current Goal
Test and verify memory game feedback delay