# Progress Tracking Refactor Concept

## Current Problem

The app currently uses multiple different systems for tracking activity progress, leading to:
- Inconsistent behavior across activities
- Complex reset logic that needs to handle different storage mechanisms
- Difficulty in implementing features like the "Reset current" button
- Maintenance overhead with multiple progress tracking patterns

## Current Progress Storage Patterns

### Pattern 1: Central Progress Object (change This)
**Used by:** 1_1, 1_2, most chord activities, e.g.
```javascript
this.progress['1_1_pitches_high_or_low'] = 15
this.progress['2_2_chords_stable_unstable'] = 23
```
change to 
```javascript
this.progress['1_1'] = 15
this.progress['2_2'] = 23
```
- **Storage:** Component's progress object
- **Reset:** Simple `this.progress[mode] = 0`
- **Level calculation:** Derived from progress count (e.g., `Math.floor(progress / 10) + 1`)
  - where 10 is the standard, but some activities use different values:
  - 1_4: `Math.floor(progress / 7) + 1`
  - 1_5: no levels, just progress count which is used in @pitches.js#L3533-3543 to calculate the sequence length
  - 2_2: `Math.floor(progress / 10) + 1`
  - 2_5: `Math.floor(progress / 10) + 1`

### Pattern 2: Separate Level Variables + localStorage (❌ Remove This)
**Used by:** 1_4 (Sound Judgment)
```javascript
this.soundJudgmentLevel = 3  // Stored separately
localStorage.setItem('lalumo_soundJudgmentLevel', 3)
```
- **Storage:** Separate component variable + localStorage
- **Reset:** Must reset both variable and localStorage
- **Level:** Direct level storage (1-7)

### Pattern 3: Dual Storage (❌ Simplify This)
**Used by:** 1_3 (Draw Melody), 1_5 (Memory Game)
```javascript
this.progress['1_3'] = 12                     // Central
this.drawMelodyLevel = 3                       // Separate
localStorage.setItem('lalumo_draw_melody_level', 3)
```
- **Storage:** Both central progress AND separate variables
- **Reset:** Must reset multiple locations
- **Inconsistency:** Two sources of truth

### Pattern 4: Working Central Progress (✅ Already Correct, but change it )
**Used by:** 2_2 (Stable/Unstable), 2_5 (Chord Characters)
```javascript
this.progress['2_2_chords_stable_unstable'] = 23
this.progress['2_5_chords_characters'] = 15
```
change to
```javascript
this.progress['2_2'] = 23
this.progress['2_5'] = 15
```
- **Storage:** Central progress object (correct)
- **Issue:** `getCurrentActivityProgress()` doesn't find these activities
- **Problem:** Mode names don't match exactly between Alpine store and progress keys

## Proposed Unified System

### Single Source of Truth: Central Progress Object
All activities will use **only** the central progress object:
```javascript
// All activities store progress as a count
this.progress['1_1'] = 15
this.progress['1_2'] = 8
this.progress['1_3'] = 12
this.progress['1_4'] = 25
this.progress['1_5'] = 7
this.progress['2_2'] = 23
this.progress['2_5'] = 8
// etc.
```

### Level Calculation Functions
Each activity that needs levels will calculate them from the progress count:

```javascript
// Activity-specific level calculation functions
function getSoundJudgmentLevel(progress) {
  // Convert progress count to level (1-7)
  // Example: 0-4 = Level 1, 5-9 = Level 2, 10-14 = Level 3, etc.
  return Math.min(Math.floor(progress / 5) + 1, 7);
}

function getDrawMelodyLevel(progress) {
  // Convert progress count to level
  return Math.floor(progress / 3) + 1;
}

function getMemoryGameLevel(progress) {
  // Convert progress count to level
  return Math.floor(progress / 2) + 1;
}

// For activities that already work this way (like 2_2_chords_stable_unstable)
function getChordStableUnstableLevel(progress) {
  if (progress >= 50) return 6;
  if (progress >= 40) return 5;
  if (progress >= 30) return 4;
  if (progress >= 20) return 3;
  if (progress >= 10) return 2;
  return 1;
}
```

## Refactor Implementation Plan

### Phase 1: Activity 1_4 (Sound Judgment)
**Current:** Uses `this.soundJudgmentLevel` + localStorage
**Target:** Use only `this.progress['1_4']`

#### Changes needed:
1. **Remove separate variables:**
   - Remove `this.soundJudgmentLevel`
   - Remove localStorage operations for `lalumo_soundJudgmentLevel`

2. **Add level calculation:**
   ```javascript
   getSoundJudgmentLevel() {
     const progress = this.progress['1_4'] || 0;
     return Math.min(Math.floor(progress / 5) + 1, 7);
   }
   ```

3. **Update progress tracking:**
   - On correct answer: `this.progress['1_4_pitches_does-it-sound-right']++`
   - On level up: Calculate from progress, don't store level separately

4. **Update all references:**
   - Replace `this.soundJudgmentLevel` with `this.getSoundJudgmentLevel()`
   - Update difficulty calculation to use calculated level
   - Update UI display to use calculated level
   - Change progress key from long name to `'1_4'`

### Phase 2: Activity 1_3 (Draw Melody)
**Current:** Uses both `this.progress['1_3_pitches_draw-melody']` AND `this.drawMelodyLevel` + localStorage
**Target:** Use only `this.progress['1_3']`

#### Changes needed:
1. **Remove duplicate storage:**
   - Remove `this.drawMelodyLevel`
   - Remove localStorage operations for `lalumo_draw_melody_level`
   - Keep `this.levelSuccessCounter` but derive it from progress

2. **Add level calculation:**
   ```javascript
   getDrawMelodyLevel() {
     const progress = this.progress['1_3'] || 0;
     return Math.floor(progress / 3) + 1;
   }
   ```

3. **Update progress tracking:**
   - Use only central progress counter
   - Calculate level and success counter from progress

### Phase 3: Activity 1_5 (Memory Game)
**Current:** Uses both `this.progress['1_5_pitches_memory-game']` AND localStorage
**Target:** Use only `this.progress['1_5']`

#### Changes needed:
1. **Remove duplicate storage:**
   - Remove `this.memorySuccessCount` as separate variable
   - Remove localStorage operations for `lalumo_memory_level`

2. **Add level calculation:**
   ```javascript
   getMemoryGameLevel() {
     const progress = this.progress['1_5'] || 0;
     return Math.floor(progress / 2) + 1;
   }
   ```

### Phase 4: Fix getCurrentActivityProgress() for Chord Activities
**Current:** 2_2 and 2_5 chord activities use central progress but `getCurrentActivityProgress()` can't find them
**Issue:** Mode names in Alpine store don't exactly match progress object keys

#### Changes needed:
1. **Simplify all progress keys:**
   - Current: `2_2_chords_stable_unstable` → New: `2_2`
   - Current: `2_5_chords_characters` → New: `2_5`
   - Alpine store modes will also be simplified to match

2. **Solution:**
   - Rename all progress keys to simply use the activity ID, e.g. `this.progress['1_3_pitches_draw-melody']` => `this.progress['1_3']`

## Reset System Unification

### Current Reset Problems
- `resetCurrentActivity()` only uses the unified consistent storage patterns
- `resetAllProgress()` only uses the unified consistent storage patterns

### Unified Reset Solution

#### Single Activity Reset
```javascript
resetCurrentActivity(mode) {
  if (mode && this.progress && this.progress[mode] !== undefined) {
    this.progress[mode] = 0;
    this.saveProgress(); // Save to localStorage
    console.log(`Reset activity ${mode} to 0`);
  }
}
```

#### All Activities Reset
```javascript
resetAllProgress() {
  // Reset all progress in central object
  Object.keys(this.progress).forEach(key => {
    this.progress[key] = 0;
  });
  
  // No need to clear separate localStorage items anymore
  console.log('All progress reset to 0');
}
```

## Benefits of Unified System

### 1. Consistency
- All activities use the same progress tracking pattern
- Predictable behavior across the entire app
- Easier to understand and maintain

### 2. Simplified Reset Logic
- Single location to reset progress
- `getCurrentActivityProgress()` works for all activities
- No need to handle special cases

### 3. Easier Feature Implementation
- "Reset current" button works automatically for all activities
- Progress display is consistent
- New features can rely on standard progress tracking

### 4. Reduced Complexity
- No duplicate storage mechanisms
- No localStorage management for individual activities
- Fewer variables to track and maintain

### 5. Better Debugging
- Single source of truth for progress
- Easier to inspect and debug progress issues
- Consistent logging and error handling

## Migration Strategy

### Step 1: Create Helper Functions
Create level calculation functions for each activity that needs them.

### Step 2: Update Activities One by One
Refactor each activity to use only central progress, starting with 1_4.

### Step 3: Update Reset Functions
Simplify reset logic to only handle central progress object.

### Step 4: Clean Up
Remove all unused localStorage operations and separate variables.

### Step 5: Test
Ensure all activities work correctly with unified system.

## localStorage Standardization

### Current Problems
- Different activities use different localStorage keys:
  - `lalumo_chords_progress` (chord activities)
  - `lalumo_soundJudgmentLevel` (1_4 sound judgment)
  - `lalumo_drawMelodyLevel` (1_3 draw melody)
  - `lalumo_memorySuccessCount` (1_5 memory game)
- Inconsistent save/load logic across activities
- Reset functions must handle multiple localStorage keys
- Data scattered across multiple storage locations

### Solution: Unified localStorage
**Goal**: All activities use only the central `this.progress` object for persistence.

#### Legacy localStorage Keys to Remove
| Status | localStorage Key | Used by | Replacement |
|---|---|---|---|
| ✅ | `lalumo_soundJudgmentLevel` | 1_4 Sound Judgment | Calculated from `this.progress['1_4']` |
| ⏳ | `lalumo_drawMelodyLevel` | 1_3 Draw Melody | Calculated from `this.progress['1_3']` |
| ⏳ | `lalumo_memorySuccessCount` | 1_5 Memory Game | Use `this.progress['1_5']` directly |
| ⚠️ | `lalumo_chords_progress` | 2_2, 2_5 Chord activities | Use central `this.progress` object |
| ⏳ | Any other activity-specific keys | Various | Use central `this.progress` object |

#### Implementation Steps
1. **Update save functions**: All activities save to central progress object only
2. **Update load functions**: All activities load from central progress object only
3. **Update reset functions**: Reset only central progress object and persist to localStorage
4. **Remove legacy keys**: Clean up old localStorage entries
5. **Test persistence**: Ensure progress survives app reload for all activities

#### one common shared Reset Function
```javascript
export function resetActivityProgress(component, id) {
  // Reset in-memory progress
  component.progress[id] = 0;
  
  // Persist to central localStorage (NOT separate keys)
  localStorage.setItem('lalumo_progress', JSON.stringify(component.progress));
  
  debugLog(id + ' progress reset and persisted to central storage');
}
```

## Function Renaming Map

### Reset Functions
| Status | Old Function Name | New Function Name | Location |
|---|---|---|---|
| ⏳ | `reset_1_1_HighOrLow_Progress()` | `reset_1_1_Progress()` | `/src/components/pitches/1_1_high_or_low.js` |
| ⏳ | `reset_1_2_MatchSounds_Progress()` | `reset_1_2_Progress()` | `/src/components/pitches/1_2_match_sounds.js` |
| ⏳ | `reset_1_3_DrawMelody_Progress()` | `reset_1_3_Progress()` | `/src/components/pitches/1_3_draw_melody.js` |
| ✅ | `reset_1_4_SoundJudgment_Progress()` | `reset_1_4_Progress()` | `/src/components/pitches/1_4_sound_judgment.js` |
| ⏳ | `reset_1_5_MemoryGame_Progress()` | `reset_1_5_Progress()` | `/src/components/pitches/1_5_memory_game.js` |
| ✅ | `resetProgress_2_2()` | `reset_2_2_Progress()` | `/src/components/2_chords/2_2_chords_stable_unstable.js` |
| ⏳ | `resetProgress_2_5()` | `reset_2_5_Progress()` | `/src/components/2_chords/2_5_chord_characters.js` |

### Setup/Initialization Functions
| Old Function Name | New Function Name | Location |
|---|---|---|
| `setupHighOrLowMode_1_1()` | `setup_1_1()` | `/src/components/pitches/1_1_high_or_low.js` |
| `setupMatchingMode_1_2()` | `setup_1_2()` | `/src/components/pitches.js` |
| `setupDrawingMode_1_3()` | `setup_1_3()` | `/src/components/pitches.js` |
| `setupSoundHighOrLowMode_1_4()` | `setup_1_4()` | `/src/components/pitches.js` |
| `setupMemoryMode_1_5()` | `setup_1_5()` | `/src/components/pitches.js` |
| (new function needed) | `setup_2_2()` | `/src/components/chords.js` |
| (new function needed) | `setup_2_5()` | `/src/components/chords.js` |

### Game Start Functions
| Status | Old Function Name | New Function Name | Location | Notes |
|---|---|---|---|---|
| ✅ | `playCurrentMelody()` | `playCurrentMelody()` | `/src/components/pitches.js` | Used by 1_2, 1_4, 1_5 via index.html - no change needed |
| ⏳ | (new function needed) | `start_1_1_game()` | `/src/components/pitches.js` | Create if game mode exists |
| ⏳ | (new function needed) | `start_1_3_game()` | `/src/components/pitches.js` | Create if game mode exists |
| warning! maybe duplicate function? | `startSoundJudgmentGame()` | `start_1_4_game()` | `/src/components/pitches.js` | Rename existing function |
| warning! maybe duplicate function? | `startMemoryGame()` | `start_1_5_game()` | `/src/components/pitches.js` | Rename existing function |
| ⏳ | `startGameMode()` | `start_2_2_game()` | `/src/components/chords.js` | Rename existing function |
| ⏳ | (new function needed) | `start_2_5_game()` | `/src/components/chords.js` | Create if game mode exists |

### Level/Info Functions
| Status | Old Function Name | New Function Name | Location |
|---|---|---|---|
| ⏳ | (new function) | `get_1_1_level()` | `/src/components/pitches/1_1_high_or_low.js` |
| ⏳ | (new function) | `get_1_2_level()` | `/src/components/pitches/1_2_match_sounds.js` |
| ⏳ | `getDrawMelodyLevel()` (new) |`get_1_3_level()` | `/src/components/pitches/1_3_draw_melody.js` |
| ✅ | (new function) | `get_1_4_level()` | `/src/components/pitches/1_4_sound_judgment.js` |
| ⏳ | `getMemoryGameLevel()` (new) | `get_1_5_level()` | `/src/components/pitches/1_5_memory_game.js` |
| ⏳ | `get_1_3_level_info()` | `get_1_3_info()` | `/src/components/pitches.js` |
| ✅ | (new function) | `get_2_2_level()` | `/src/components/2_chords/2_2_chords_stable_unstable.js` |
| ⏳ | (new function needed) | `get_2_5_level()` | `/src/components/2_chords/2_5_chord_characters.js` |

### Progress Save Functions
| Old Function Name | New Function Name | Location |
|---|---|---|
| `saveProgress_1_1()` | `save_1_1_progress()` | `/src/components/pitches.js` |
{{ ... }}

### Progress Access Functions
| Old Function Name | New Function Name | Location |
|---|---|---|
| `getActivityProgress()` (in 1_4) | `get_1_4_progress()` | `/src/components/pitches/1_4_sound_judgment.js` |
| `getActivityProgress()` (in 2_5) | `get_2_5_progress()` | `/src/components/2_chords/2_5_chord_characters.js` |
| (new function needed) | `get_2_2_progress()` | `/src/components/2_chords/2_2_chords_stable_unstable.js` |

### Progress Key Changes
| Status | Old Progress Key | New Progress Key | Used In |
|---|---|---|---|
| ⏳ | `'1_1_pitches_high_or_low'` | `'1_1'` | All components |
| ⏳ | `'1_2_pitches_match-sounds'` | `'1_2'` | All components |
| ⏳ | `'1_3_pitches_draw-melody'` | `'1_3'` | All components |
| ✅ | `'1_4_pitches_does-it-sound-right'` | `'1_4'` | All components |
| ✅ | `'2_2_chords_stable_unstable'` | `'2_2'` | All components |
| ⏳ | `'1_5_pitches_memory-game'` | `'1_5'` | All components |
| ⏳ | `'2_1_chords_color-matching'` | `'2_1'` | All components |
| ⏳ | `'2_2_chords_stable_unstable'` | `'2_2'` | All components |
| ⏳ | `'2_3_chords_chord-building'` | `'2_3'` | All components |
| ⏳ | `'2_4_chords_missing-note'` | `'2_4'` | All components |
| ⏳ | `'2_5_chords_characters'` | `'2_5'` | All components |
| ⏳ | `'2_6_chords_harmony-gardens'` | `'2_6'` | All components |

### Variable References to Replace
| Status | Old Variable | New Function Call | Location |
|---|---|---|---|
| ✅ | `this.soundJudgmentLevel` | `get_1_4_level(this)` | `/src/components/pitches.js` |
| ⏳ | `this.drawMelodyLevel` | `get_1_3_level(this)` | `/src/components/pitches.js` |
| ⏳ | `this.memorySuccessCount` | `this.progress['1_5']` | `/src/components/pitches.js` |
| ⏳ | `this.levelSuccessCounter` (1_3) | Calculate from `this.progress['1_3']` | `/src/components/pitches.js` |

### localStorage Keys to Remove
| localStorage Key | Replacement |
|---|---|
| `lalumo_soundJudgmentLevel` | Use central progress only |
| `lalumo_draw_melody_level` | Use central progress only |
| `lalumo_draw_melody_success_counter` | Use central progress only |
| `lalumo_memory_level` | Use central progress only |

## Functions and Variables to Refactor

### Variables to Remove/Rename

#### In `/src/components/pitches.js`:
- **Remove:** `this.soundJudgmentLevel` → Use calculated level from progress
- **Remove:** `this.drawMelodyLevel` → Use calculated level from progress  
- **Remove:** `this.memorySuccessCount` → Use progress directly
- **Remove:** `this.levelSuccessCounter` (draw melody) → Calculate from progress

#### In `/src/components/chords.js`:
- **Rename:** All long progress keys to simple activity IDs:
  - `'2_1_chords_color-matching'` → `'2_1'`
  - `'2_2_chords_stable_unstable'` → `'2_2'`
  - `'2_3_chords_chord-building'` → `'2_3'`
  - `'2_4_chords_missing-note'` → `'2_4'`
  - `'2_5_chords_characters'` → `'2_5'`
  - `'2_6_chords_harmony-gardens'` → `'2_6'`

### Functions to Modify

#### In `/src/components/pitches.js`:
1. **Activity 1_4:**
   - `init_1_4()` - Remove localStorage loading
   - `update_progress_display()` - Use calculated level
   - `get_1_4_difficulty()` - Use calculated level
   - `handle_1_4_correct_answer()` - Increment `this.progress['1_4']`, not level
   - All references to `this.soundJudgmentLevel` → `this.get_1_4_level()`

2. **Activity 1_3:**
   - `init_1_3()` - Remove localStorage loading
   - `handle_1_3_correct_answer()` - Use only `this.progress['1_3']`
   - `get_1_3_level_info()` - Calculate level from `this.progress['1_3']`
   - All references to `this.drawMelodyLevel` → `this.get_1_3_level()`

3. **Activity 1_5:**
   - `init_1_5()` - Remove localStorage loading
   - `handle_1_5_correct_answer()` - Use only `this.progress['1_5']`
   - All references to `this.memorySuccessCount` → `this.progress['1_5']`

#### In `/src/components/chords.js`:
1. **Activity 2_2:**
   - All progress key references: `'2_2_chords_stable_unstable'` → `'2_2'`
   - `init_2_2()` - Use only `this.progress['2_2']`
   - `handle_2_2_correct_answer()` - Increment `this.progress['2_2']`
   - Level calculation: `this.get_2_2_level()` from `this.progress['2_2']`

2. **Activity 2_5:**
   - All progress key references: `'2_5_chords_characters'` → `'2_5'`
   - `resetProgressToCurrentLevel()` - Update progress key to `'2_5'`
   - `reset_2_5_Progress()` - Update progress key to `'2_5'`
   - `init_2_5()` - Use only `this.progress['2_5']`
   - `handle_2_5_correct_answer()` - Increment `this.progress['2_5']`

#### In Activity-Specific Files:
1. **`/src/components/pitches/1_3_draw_melody.js`:**
   - `reset_1_3_Progress()` - Remove localStorage operations, use only `this.progress['1_3'] = 0`

2. **`/src/components/pitches/1_4_sound_judgment.js`:**
   - `reset_1_4_Progress()` - Remove localStorage operations, use only `this.progress['1_4'] = 0`
   - `getActivityProgress()` - Return `this.progress['1_4']` only

3. **`/src/components/pitches/1_5_memory_game.js`:**
   - `reset_1_5_Progress()` - Remove localStorage operations, use only `this.progress['1_5'] = 0`

4. **`/src/components/2_chords/2_2_chords_stable_unstable.js`:**
   - `reset_2_2_Progress()` - Use only `this.progress['2_2'] = 0`
   - All progress key references to use `'2_2'`
   - `getActivityProgress()` - Return `this.progress['2_2']` only

5. **`/src/components/2_chords/2_5_chord_characters.js`:**
   - `reset_2_5_Progress()` - Use only `this.progress['2_5'] = 0`
   - All progress key references to use `'2_5'`
   - `getActivityProgress()` - Return `this.progress['2_5']` only

#### In `/src/components/app.js`:
1. **`getCurrentActivityProgress()`:**
   - Add special handling for mode name mismatches
   - Or remove after progress keys are standardized

2. **Cheat code functions:**
   - Remove localStorage operations for individual activities
   - Use only central progress setting

### localStorage Keys to Remove
- `lalumo_soundJudgmentLevel`
- `lalumo_draw_melody_level` 
- `lalumo_draw_melody_success_counter`
- `lalumo_memory_level`

### New Helper Functions to Add
```javascript
// In pitches.js
get_1_3_level() {
  const progress = this.progress['1_3'] || 0;
  return Math.floor(progress / 3) + 1;
}

get_1_4_level() {
  const progress = this.progress['1_4'] || 0;
  return Math.min(Math.floor(progress / 7) + 1, 7);
}

get_1_5_level() {
  const progress = this.progress['1_5'] || 0;
  return Math.floor(progress / 2) + 1;
}

// In chords.js
get_2_2_level() {
  const progress = this.progress['2_2'] || 0;
  return Math.floor(progress / 10) + 1;
}

get_2_5_level() {
  const progress = this.progress['2_5'] || 0;
  return Math.floor(progress / 10) + 1;
}
```

## File Changes Required

### Core Files
- `/src/components/pitches.js` - Main pitches component
- `/src/components/chords.js` - Main chords component
- `/src/components/pitches/common.js` - Reset functions
- `/src/components/app.js` - getCurrentActivityProgress function

### Activity-Specific Files
- `/src/components/pitches/1_1_pitches_introduction.js`
- `/src/components/pitches/1_2_pitches_introduction.js`
- `/src/components/pitches/1_3_draw_melody.js`
- `/src/components/pitches/1_4_sound_judgment.js`
- `/src/components/pitches/1_5_memory_game.js`
- `/src/components/2_chords/2_2_chords_stable_unstable.js`
- `/src/components/2_chords/2_5_chord_characters.js`

### Testing
- Verify all activities work with unified progress
- Test reset functionality
- Test progress persistence across sessions

## Conclusion

This refactor will significantly simplify the codebase by establishing a single, consistent way to track progress across all activities. The benefits include easier maintenance, more predictable behavior, and simplified implementation of features like the "Reset current" button.

The migration can be done incrementally, starting with the most problematic activities (1_4, 2_2, 2_5) and working through the others. No Backward compatibility neeeded, users will loose their progress, which is OK
