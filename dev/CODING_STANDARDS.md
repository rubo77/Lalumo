# CODING_STANDARDS

## Activity Visual & Audio Feedback Standards

### Required Feedback Elements

Every activity MUST implement consistent feedback mechanisms:

#### 1. **Visual Success Feedback**
- **Rainbow Animation**: Full-screen rainbow arc animation for successful completion
- **CSS Class**: `.rainbow-success` 
- **Duration**: 3 seconds with `rainbow-expand` animation
- **Usage**: Major achievements, level completion, perfect scores

#### 2. **Visual Error Feedback**  
- **Shake Animation**: Element-specific shake animation for errors
- **CSS Class**: `.shake-error`
- **Duration**: 0.5 seconds with `shake` animation
- **Usage**: Wrong answers, incorrect interactions

#### 3. **Audio Success Feedback**
- **Success Melody**: Ascending arpeggio (C4, E4, G4, C5)
- **Function**: `playSuccessSound()`
- **Duration**: ~0.8 seconds total
- **Usage**: Correct answers, progress milestones

#### 4. **Audio Error Feedback**
- **Error Sound**: Descending minor third (E4, C4)  
- **Function**: `playErrorSound()`
- **Duration**: ~0.8 seconds total
- **Usage**: Wrong answers, failed attempts

#### 5. **Background Styling**
- Each activity chapter should have a distinct background image
- Use `lazyload-bg` class with `data-background-image` attribute
- Background should support the learning theme and age group

### Implementation Requirements

#### Feedback Utilities Location
- **Shared Module**: `/src/effects/feedback.js`
- **Purpose**: Centralized feedback functions used across all chapters
- **Exports**: `showRainbowSuccess()`, `showShakeError()`, `playSuccessSound()`, `playErrorSound()`

#### Activity Structure
```javascript
// Each activity should follow this pattern:
export class Activity {
  handleSuccess() {
    // 1. Update progress/localStorage
    // 2. Show visual feedback
    showRainbowSuccess();
    // 3. Play audio feedback  
    playSuccessSound();
    // 4. Provide user messaging
  }
  
  handleError() {
    // 1. Show visual feedback on specific element
    showShakeError(targetElement);
    // 2. Play audio feedback
    playErrorSound();
    // 3. Provide helpful guidance
  }
}
```

#### Consistency Rules
- **NO custom feedback variations** - use shared utilities only
- **NO silent failures** - always provide audio + visual feedback
- **NO inconsistent timing** - respect standard durations
- **ALL activities** must use the same success/error patterns
- **ALL audio implementations** must use Tone.js

### Chapter-Specific Guidelines

#### Background Images
- **Pitches**: Bird/nature themes (`pitches_bird_sings.jpg`)
- **Chords**: Landscape/mood themes
- **Rhythm**: Movement/dance themes  
- **Melody**: Drawing/creative themes

#### Progress Tracking
- Use descriptive localStorage keys: `lalumo_[chapter]_[activity]_progress`
- Include success counters, levels, and completion status
- Reset functions must clear ALL related progress variables:
 . in preferences
 - in the navigatin button  
- in- and export must include them

## Code Quality Standards

### Import Structure
- **NO barrel exports** (`index.js` files)
- **Direct imports only** from individual modules
- **Alphabetical ordering** of import statements
- **Grouped imports**: utilities, then activities, then assets

### Function Naming
- **Reset functions**: `reset_[id]_[Activity]_Progress`
- **Setup functions**: `setup[Activity]Mode_[id]`
- **Test functions**: `test[Module]ModuleImport`

### Error Handling
- **NO failsafes** - fix root causes
- **Extensive logging** with unique tags
- **Descriptive error messages** for debugging
- **Graceful degradation** only when absolutely necessary
