# Plan for Fixing Wave Sound Logic in Activity 1_2

## Notes
- In activity 1_2 "Match the Sounds", after 10 correct answers (progress), the wave sound should always play first after the switch, then revert to random selection among the three options.
- The frog logic (jumpy melody first after unlock, then random) is working as intended and should be used as a reference.
- Currently, after the wave unlock, the wave sound is not played first as required.
- No failsafes should be added; fix the actual logic.
- Add clear logging with unique tags if further diagnosis is needed.

## Task List
- [x] Analyze current logic for wave sound after 10 correct answers in activity 1_2
- [x] Compare with frog logic for jumpy melody after unlock
- [ ] Adjust code so wave sound always plays first after unlock, then randomizes
- [ ] Test to confirm correct behavior

## Current Goal
Fix wave sound trigger after 10 correct answers