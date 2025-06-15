/* still unused but planned functions from pitches.js */

/**
 * Refresh the animation for a pattern
 * @activity common
 * @used-by NOWHERE
 */
refreshAnimation(type) {
  // Get all relevant elements
  const card = document.querySelector(`.pitch-card:has(.pitch-icon.${type})`);
  const icon = document.querySelector(`.pitch-icon.${type}`);
  
  if (card) {
    // Remove and re-add active class to trigger CSS animations
    card.classList.remove('active');
    setTimeout(() => card.classList.add('active'), 10);
  }
  
  if (icon) {
    // Apply a pulse effect
    icon.style.transform = 'scale(1.1)';
    setTimeout(() => {
      icon.style.transform = 'scale(1)';
    }, 300);
  }
},

/**
 * Play a tone using Tone.js
 * @param {string} note - Note name (e.g., 'C4', 'D#3')
 * @param {number} duration - Duration in milliseconds
 * @activity common
 * @used_by NOWHERE
 * @returns {boolean} True if tone played successfully
 */
async playToneWithToneJs(note, duration = 800) {
  try {
    console.log(`TONE: Playing note ${note} for ${duration}ms`);
    
    // Make sure audio is initialized
    await this.ensureToneStarted();
    
    // Use the singleton synth instead of creating a new one each time
    // Convert duration from milliseconds to seconds for Tone.js
    const durationSeconds = duration / 1000;
    
    // Explicitly set the volume for this note
    this.synth.volume.value = -6; // in dB
    
    // Play the note with precise timing
    const now = Tone.now();
    this.synth.triggerAttackRelease(note, durationSeconds, now);
    
    // Log success
    console.log(`TONE: Successfully triggered note ${note} at time ${now}`);
    return true;
  } catch (error) {
    console.error('TONE: Error playing note with Tone.js:', error);
    return false;
  }
},

/**
 * Play a sequence of tones using Tone.js
 * @param {string[]} notes - Array of note names
 * @param {number[]} durations - Array of durations in milliseconds
 * @param {number} interval - Time between notes in seconds
 * 
 * @activity common
 * @used_by NOWHERE
 */
async playToneSequenceWithToneJs(notes, durations, interval = 0.5) {
  try {
    console.log(`TONE: Playing sequence of ${notes.length} notes`);
    
    // Make sure audio is initialized
    await this.ensureToneStarted();
    
    // Schedule each note using the singleton synth
    const now = Tone.now();
    
    // For better timing and performance
    Tone.Transport.bpm.value = 120;
    
    notes.forEach((note, i) => {
      const duration = durations[i] / 1000 || 0.5; // Convert ms to seconds
      const startTime = now + (i * interval);
      
      this.synth.triggerAttackRelease(note, duration, startTime);
      console.log(`TONE: Scheduled note ${note} with duration ${duration} at time ${startTime}`);
    });
    
    return true;
  } catch (error) {
    console.error('TONE: Error playing sequence with Tone.js:', error);
    return false;
  }
},

