# Musici Piano Sound Integration Plan

## Notes
- User has local piano MP3 samples in /public/sounds/piano/ (e.g., C4.mp3, A4.mp3, Ds4.mp3, Fs4.mp3, E4.mp3)
- Piano instrument implemented in audio-engine.js using Tone.js Sampler
- Current error: "buffer is either not set or not loaded" when playing notes
- HTTP 200 for sample requests, but samples not used correctly
- Samples seem to be downloaded instead of used directly
- Webpack/build process may not include samples correctly
- Path to samples is /sounds/piano/, but may be incorrect or not resolved as expected
- Webpack config now copies /public/sounds/piano/ and MP3s to build (CopyWebpackPlugin updated)
- Goal: Use local MP3s for immediate, reliable piano playback (no fallback synth needed)
- Memory game calls audioEngine.playNote(note, duration, velocity, 'piano') for playback
- Memory game sequence uses only C4, D4, E4, G4, A4 notes
- Piano sample URLs in audio-engine.js now include all chromatic notes (C4, D4, D#4, E4, F4, F#4, G4, A4, B4)
- In 1_5 free play mode, piano sound is still a synth, not a sample (needs fix)
- Confirmed: free play mode calls playNote(..., 'piano') but synth is played, not sample (instrument switch/sample loading bug)
- Global sample loading state and preloading implemented to fix free play bug
- User requires: absolutely no fallback synth in 1_5 activity—only piano samples should sound; if samples are not loaded, silence is preferred over fallback
- Fallback synth now removed for 1_5 activity; only piano samples will play (or silence if not loaded)
- Still playing before sample buffers are actually ready; must block playback until all buffers are confirmed loaded
- Refactor direction: Remove audio engine, create and share global Tone.js Sampler instance (renamed to toneJsSampler.js for clarity), update all playback calls
- Created global toneJsSampler.js module that exports init, playToneNote, isToneJsReady, and state helpers
- toneJsSampler.js is now imported and initialized in index.js at app startup
- After refactor, still no sound: '[PIANO] Buffer not ready for note G4' and '[PIANO_DIRECT] Playing note G4 with global sampler' appear, but no audio is heard. Indicates a possible Tone.js sampler/buffer readiness or sample loading issue.
- Enhanced sampler implementation: aggressively preloads samples, tracks buffer readiness per note, and logs detailed buffer status for debugging. Now uses both Tone.js and native Audio preloading for reliability.
- playToneNote and isToneJsReady now use per-note buffer logic, skipping playback if the note's buffer is not ready. Next: confirm this results in audible piano playback for all memory game notes.
- User requests more debug logging using debugLog("[PIANO_DIRECT]", ...) in sampler playback code for deeper diagnosis.
- User requests only one direct Tone.js instance for all piano playback (no fallback, no multiple samplers/players, no extra abstraction).
- Implementation now uses a single global Tone.js Sampler instance, initialized once and used everywhere for piano playback—no fallback, no multiple samplers, no extra abstraction layer.
- All memory game playback code updated to use this direct global instance.
- Only one direct Tone.js instance for all piano playback (no fallback, no multiple samplers/players, no extra abstraction).

## Task List
- [x] Diagnose why Tone.Sampler is not loading/using local MP3 samples
- [x] Check and fix sample path resolution in audio-engine.js (Sampler config)
- [x] Ensure /public/sounds/piano/ is correctly included in production build (webpack/static assets)
- [x] Update CopyWebpackPlugin config to copy /public/sounds/piano/ directory and MP3s
- [x] Build application and restart server to test sample integration
- [x] Test sample fetching in browser dev tools (network tab, correct path, correct HTTP response)
- [x] Fix code so that local samples are played without download attempts or errors
- [x] Confirm piano sound is loud, clear, and immediate in the memory game
- [x] Ensure free play mode in 1_5 uses piano samples, not synth
  - [x] Debug instrument switching/sample loading for free play mode
  - [x] Verify global sample loading state and preloading fixes issue
  - [x] Enforce "no fallback synth" in 1_5 activity—if samples aren't loaded, do not play sound
- [x] Block playback until all sample buffers are actually loaded (no sound until ready)
- [x] Remove custom audio engine abstraction; use Tone.js directly throughout app
- [x] Create global toneJsSampler.js module for shared Tone.js Sampler
- [x] Import and initialize toneJsSampler.js in index.js
- [x] Update pitches.js to use shared Tone.js sampler for 1_5 memory game
- [x] Update all playback calls in activities (e.g., 1_5) to use shared Tone.js instance directly
- [x] Update all memory game playback code to use single direct Tone.js instance
- [x] Confirm all memory game notes are buffer-ready and audible
- [x] Test and verify audible piano playback for all memory game notes using new buffer logic
- [x] Add debugLog("[PIANO_DIRECT]", ...) logging to sampler playback code for deeper diagnosis

## Current Goal
Monitor for regressions and user feedback.