# Musici Piano Sound Integration Plan

## Notes
- User has local piano MP3 samples in /public/sounds/piano/ (e.g., C4.mp3, A4.mp3, Ds4.mp3, Fs4.mp3, E4.mp3)
- Piano instrument implemented in audio-engine.js using Tone.js Sampler
- Current error: "buffer is either not set or not loaded" when playing notes
- HTTP 200 for sample requests, but samples not used correctly
- Samples seem to be downloaded instead of used directly
- Webpack/build process may not include samples correctly
- Path to samples is /sounds/piano/, but may be incorrect or not resolved as expected
- Goal: Use local MP3s for immediate, reliable piano playback (no fallback synth needed)

## Task List
- [ ] Diagnose why Tone.Sampler is not loading/using local MP3 samples
- [ ] Check and fix sample path resolution in audio-engine.js (Sampler config)
- [ ] Ensure /public/sounds/piano/ is correctly included in production build (webpack/static assets)
- [ ] Test sample fetching in browser dev tools (network tab, correct path, correct HTTP response)
- [ ] Fix code so that local samples are played without download attempts or errors
- [ ] Confirm piano sound is loud, clear, and immediate in the memory game

## Current Goal
Diagnose and fix Tone.Sampler sample loading