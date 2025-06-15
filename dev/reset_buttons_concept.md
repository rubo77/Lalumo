# Reset Button Concept - Musici/Lalumo

## Overview
Design and implementation concept for activity-specific reset functionality via navigation button.

## Current State Analysis

### Progress Variables by Activity

#### 1. High or Low Activity (`1_1_pitches_high_or_low`)
- **Component Variables:**
  - `highOrLowProgress` - Number of correct answers (determines difficulty stage)
  - `currentHighOrLowTone` - Current tone being played
  - `highOrLowSecondTone` - Second tone for comparison stages
  - `highOrLowPlayed` - Boolean flag for tone playback state
  - `gameStarted` - Boolean flag for game state
- **localStorage Keys:**
  - `'lalumo_progress_high_or_low'` - Stores progress count
- **Progress Object Key:** `progress['1_1_pitches_high_or_low']`

#### 2. Match Sounds Activity (`1_2_pitches_match-sounds`)
- **Component Variables:**
  - `correctAnswersCount` - Count of correct pattern matches
  - `unlockedPatterns` - Array of unlocked pattern types (default: ['up', 'down'])
  - `currentSequence` - Current melody sequence
  - `userSequence` - User's input sequence
- **localStorage Keys:**
  - `'lalumo_progress_match'` - Stores match progress
  - `'lalumo_difficulty'` - Stores unlocked patterns and correctAnswersCount
- **Progress Object Key:** `progress['1_2_pitches_match-sounds']`

#### 3. Draw Melody Activity (`1_3_pitches_draw-melody`)
- **Component Variables:**
  - `drawMelodyLevel` - Current difficulty level
  - `levelSuccessCounter` - Success counter for current level
  - `melodyChallengeMode` - Boolean for challenge vs free drawing mode
  - `drawPath` - Current drawing path coordinates
  - `previousDrawPath` - Previous drawing for comparison
  - `referenceSequence` - Reference melody for challenge mode
- **localStorage Keys:**
  - `'lalumo_draw_melody_level'` - Stores current level
  - `'lalumo_draw_melody_success_counter'` - Stores success counter
- **Progress Object Key:** `progress['1_3_pitches_draw-melody']`

#### 4. Does It Sound Right Activity (`1_4_pitches_does-it-sound-right`)
- **Component Variables:**
  - `soundJudgmentLevel` - Current difficulty level (1-7)
  - `soundJudgmentCorrectStreak` - Consecutive correct answers (0-10)
  - `melodyHasWrongNote` - Boolean flag for current melody state
  - `currentMelodyName` - Name of current melody being played
  - `currentMelodyId` - ID of current melody
- **localStorage Keys:**
  - `'lalumo_soundJudgmentLevel'` - Stores current level
  - `'lalumo_soundJudgmentStreak'` - Stores correct streak
- **Progress Object Key:** `progress['1_4_pitches_does-it-sound-right']`

#### 5. Memory Game Activity (`1_5_pitches_memory-game`)
- **Component Variables:**
  - `memorySuccessCount` - Count of successful memory rounds
  - `currentSequence` - Current sequence to remember
  - `userSequence` - User's input sequence
- **localStorage Keys:**
  - `'lalumo_memory_level'` - Stores memory level
- **Progress Object Key:** `progress['1_5_pitches_memory-game']`

### Global Progress Storage
- **Main Progress Object:** `progress` - Contains all activity progress values
- **localStorage Key:** `'lalumo_progress'` - JSON stringified progress object

## Reset Button Design

### Navigation Integration
- **Location:** Main navigation bar, visible on all activity screens
- **Icon:** Reset/refresh symbol (🔄 or similar)
- **Behavior:** Context-aware - resets only the currently active activity
- **Confirmation:** Show confirmation dialog to prevent accidental resets

### Activity Detection Logic
```javascript
getCurrentActivity() {
  // Use Alpine.js component mode to determine current activity
  const pitchesComponent = document.querySelector('[x-data="pitches()"]').__x.$data;
  return pitchesComponent.mode;
}
```

### Reset Implementation Strategy

#### Per-Activity Reset Functions
Each activity should have its own focused reset method:

```javascript
// Example for High or Low activity
resetHighOrLow() {
  // Reset component variables
  this.highOrLowProgress = 0;
  this.currentHighOrLowTone = null;
  this.highOrLowSecondTone = null;
  this.gameStarted = false;
  
  // Clear localStorage
  localStorage.removeItem('lalumo_progress_high_or_low');
  
  // Update progress object
  this.progress['1_1_pitches_high_or_low'] = 0;
  this.updateProgressPitches();
  
  // Show confirmation feedback
  this.showResetFeedback('High or Low progress reset!');
}
```

#### Navigation Reset Handler
```javascript
resetCurrentActivity() {
  const currentMode = this.getCurrentActivity();
  
  // Show confirmation dialog
  if (!confirm('Reset progress for current activity?')) {
    return;
  }
  
  // Map modes to reset methods
  const resetMethods = {
    '1_1_pitches_high_or_low': () => this.resetHighOrLow(),
    '1_2_pitches_match-sounds': () => this.resetMatchSounds(),
    '1_3_pitches_draw-melody': () => this.resetDrawMelody(),
    '1_4_pitches_does-it-sound-right': () => this.resetSoundJudgment(),
    '1_5_pitches_memory-game': () => this.resetMemoryGame()
  };
  
  const resetMethod = resetMethods[currentMode];
  if (resetMethod) {
    resetMethod();
  }
}
```

## Alpine.js `$data` Usage Analysis

### Current Usage Patterns
From codebase analysis, `$data` appears in several contexts:

1. **Mode Checking:** `x-show="$data.mode === '1_4_pitches_does-it-sound-right'"`
2. **Component Access:** `$data.setMode('main')`

### [x] Recommendation: Eliminate `$data`
**Conclusion:** `$data` is NOT necessary and should be removed for these reasons:

1. [x] **Direct Property Access:** Alpine.js allows direct access to component properties
   - Instead of `$data.mode`, use `mode`
   - Instead of `$data.setMode()`, use `setMode()`

2. [x] **Cleaner Syntax:** Removing `$data` makes templates more readable
   ```html
   <!-- Current (unnecessary) -->
   <div x-show="$data.mode === '1_4_pitches_does-it-sound-right'">
   
   <!-- Preferred -->
   <div x-show="mode === '1_4_pitches_does-it-sound-right'">
   ```

3. [x] **Consistency:** Most of the codebase already uses direct property access

### Migration Strategy
- [x] **Search and Replace:** Find all instances of `$data.` and remove the prefix
- [x] **Testing:** Verify functionality remains intact after removal
- [x] **Documentation:** Update any internal docs referencing `$data` usage

## Implementation Plan

### Phase 1: Reset Method Consolidation
1. Create individual reset methods for each activity
2. [x] Remove old global reset event listeners (already done)
3. Implement centralized reset dispatcher

### Phase 2: Navigation Integration
1. Add reset button to navigation bar
2. Implement activity detection logic
3. Add confirmation dialog system

### Phase 3: `$data` Cleanup
1. [x] Search for all `$data` usage
2. [x] Replace with direct property access
3. [x] Test all affected functionality

### Phase 4: Testing & Polish
1. Test reset functionality for each activity
2. Verify localStorage cleanup
3. Add logging for diagnostics (per project rules)

## Security & UX Considerations

### Prevent Accidental Resets
- **Confirmation Dialog:** Always confirm before resetting
- **Visual Feedback:** Clear indication of what will be reset
- [x][wontfix] **Undo Option:** Consider brief undo window for accidental resets

### Diagnostic Logging
Following project rules (no failsafes, focus on diagnostics):
```javascript
reset_1_1_Draw_Melody_Progress() {
  console.log('RESET_PROGRESS: Starting reset process', {
    currentLevel: this.drawMelodyLevel,
    successCounter: this.levelSuccessCounter,
    challengeMode: this.melodyChallengeMode
  });
  
  // Reset logic here
  
  console.log('RESET_PROGRESS: Reset completed successfully');
}
```

## Benefits of This Approach

1. **Context-Aware:** Only resets relevant data for current activity
2. **User-Friendly:** Clear, predictable reset behavior
3. **Maintainable:** Centralized reset logic with activity-specific handlers
4. **Consistent:** Follows existing code patterns and project rules
5. **Diagnostic-Friendly:** Proper logging for troubleshooting

## Next Steps

1. [x] Get user approval for this concept
2. [x] Implement reset methods for each activity
3. [ ] Add navigation reset button
4. [x] Clean up `$data` usage
5. [ ] Test thoroughly across all activities
