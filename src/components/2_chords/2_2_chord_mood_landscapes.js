/**
 * 2_2_chord_mood_landscapes.js - Module for the "Chord Mood Landscapes" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Import Tone.js for audio processing
import Tone from 'tone';

// Import audio engine
import audioEngine from '../audio-engine.js';

// Import feedback utilities
import { showRainbowSuccess } from '../shared/feedback.js';

/**
 * Test function to verify module import is working correctly
 * @returns {boolean} True if import successful
 * @activity 2_2_chord_mood_landscapes
 */
export function testChordMoodLandscapesModuleImport() {
  debugLog('CHORDS', 'Chord Mood Landscapes module successfully imported');
  return true;
}

/**
 * Return the mapping of chord types to emotions and landscapes
 * @returns {Object} Object mapping chord types to emotions and landscapes
 * @activity 2_2_chord_mood_landscapes
 */
export function getMoodLandscapes() {
  return {
    major: {
      emotion: 'Happy / Bright',
      landscapes: [
        { src: './images/landscapes/sunny-field.jpg', name: 'Sunny Field' },
        { src: './images/landscapes/beach-sunrise.jpg', name: 'Beach Sunrise' },
        { src: './images/landscapes/flower-garden.jpg', name: 'Flower Garden' }
      ],
      description: 'Major chords sound bright, happy, and stable. They evoke feelings of joy and optimism.'
    },
    minor: {
      emotion: 'Sad / Melancholic',
      landscapes: [
        { src: './images/landscapes/rainy-forest.jpg', name: 'Rainy Forest' },
        { src: './images/landscapes/autumn-leaves.jpg', name: 'Autumn Leaves' },
        { src: './images/landscapes/foggy-lake.jpg', name: 'Foggy Lake' }
      ],
      description: 'Minor chords sound sad, melancholic, and introspective. They can create feelings of sadness or contemplation.'
    },
    diminished: {
      emotion: 'Tense / Mysterious',
      landscapes: [
        { src: './images/landscapes/misty-mountains.jpg', name: 'Misty Mountains' },
        { src: './images/landscapes/dark-cave.jpg', name: 'Dark Cave' },
        { src: './images/landscapes/abandoned-house.jpg', name: 'Abandoned House' }
      ],
      description: 'Diminished chords sound tense, unstable, and mysterious. They create a sense of suspense or unease.'
    },
    augmented: {
      emotion: 'Dreamy / Magical',
      landscapes: [
        { src: './images/landscapes/lightning-storm.jpg', name: 'Lightning Storm' },
        { src: './images/landscapes/starry-night.jpg', name: 'Starry Night' },
        { src: './images/landscapes/aurora-borealis.jpg', name: 'Aurora Borealis' }
      ],
      description: 'Augmented chords sound dreamy, floating, and magical. They create a sense of wonder or fantasy.'
    },
    sus4: {
      emotion: 'Open / Floating',
      landscapes: [
        { src: './images/landscapes/windy-plains.jpg', name: 'Windy Plains' },
        { src: './images/landscapes/ocean-waves.jpg', name: 'Ocean Waves' },
        { src: './images/landscapes/mountain-peak.jpg', name: 'Mountain Peak' }
      ],
      description: 'Suspended 4th chords sound open, floating, and unresolved. They create a feeling of anticipation.'
    },
    sus2: {
      emotion: 'Light / Airy',
      landscapes: [
        { src: './images/landscapes/meadow.jpg', name: 'Meadow' },
        { src: './images/landscapes/clouds.jpg', name: 'Clouds' },
        { src: './images/landscapes/light-forest.jpg', name: 'Light Forest' }
      ],
      description: 'Suspended 2nd chords sound light, airy, and open. They create a feeling of lightness or spaciousness.'
    }
    // Add more chord types as needed
  };
}

/**
 * Update the landscape visualization based on the chord type
 * @param {Object} component - Reference to the Alpine.js component
 * @param {string} chordType - The chord type to visualize
 * @activity 2_2_chord_mood_landscapes
 */
export async function updateLandscape(component, chordType) {
  // Update the visual landscape and play the chord
  const landscapeImage = document.getElementById('landscape-image');
  const emotionText = document.getElementById('emotion-text');
  const descriptionText = document.getElementById('chord-description');
  
  // Get mood data using the function from this module
  const moodData = getMoodLandscapes()[chordType];
  
  if (!moodData) {
    debugLog('CHORDS', `No mood data found for chord type: ${chordType}`);
    return;
  }
  
  // Show rainbow success when updating landscape
  showRainbowSuccess();
  
  // Update visual elements if they exist
  if (landscapeImage) {
    // Get a random landscape from the available options
    const landscape = moodData.landscapes[Math.floor(Math.random() * moodData.landscapes.length)];
    landscapeImage.src = landscape.src;
    landscapeImage.alt = landscape.name;
    
    // Add a title or caption if needed
    if (landscapeImage.parentElement) {
      const caption = landscapeImage.parentElement.querySelector('.landscape-caption') || 
                    document.createElement('div');
      if (!caption.classList.contains('landscape-caption')) {
        caption.classList.add('landscape-caption');
        landscapeImage.parentElement.appendChild(caption);
      }
      caption.textContent = `${landscape.name} - ${moodData.emotion}`;
    }
  }
  
  // Update emotion text if element exists
  if (emotionText) {
    emotionText.textContent = moodData.emotion;
  }
  
  // Update description if element exists
  if (descriptionText) {
    descriptionText.textContent = moodData.description;
  }
  
  // Play the chord using audio engine
  try {
    debugLog('CHORDS', `Playing chord for mood landscape: ${chordType}`);
    // Get and initialize audioEngine if needed
    if (!audioEngine._isInitialized) {
      await audioEngine.initialize();
    }
    
    // Use the component's playChordByType method if available
    if (component && typeof component.playChordByType === 'function') {
      await component.playChordByType(chordType, 'C4');
    } else {
      debugLog('CHORDS', 'Warning: component.playChordByType not available');
    }
  } catch (error) {
    debugLog('CHORDS', `Error playing chord for mood landscape: ${error.message}`);
  }
}
