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

## Task List
- [x] Decide the correct destination directory for feedback utilities (`src/components/shared/` chosen).
- [x] Create the destination directory.
- [x] Move `src/effects/feedback.js` to the chosen destination.
- [x] Update every import/export statement that references `effects/feedback.js` (one manual fix applied).
- [ ] Scan `src/**/*.js` for files stored outside their intended directories per FILESTRUCTURE.md.
- [ ] Produce a list of mis-located files and agree on new paths with user if necessary.
- [ ] Relocate the additional mis-placed files and adjust corresponding imports.
- [ ] Update `dev/FILESTRUCTURE.md` sections to reflect the new file locations.
- [ ] Run build/tests to ensure no path errors remain.

## Current Goal
Scan for other misplaced files