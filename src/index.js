// Import Alpine.js
import Alpine from 'alpinejs';

// Import styles
import './styles/main.css';
import './styles/clickable-map.css';

// Import Capacitor initialization
import { initCapacitor } from './capacitor';

// Import components
import { app } from './components/app';
import { tonecolors } from './components/tonecolors';
import { pitches } from './components/pitches';
import { rhythms } from './components/rhythms';
import { chords } from './components/chords';
import { freeplay } from './components/freeplay';

// Initialize Alpine store for state management
Alpine.store('pitchMode', 'main'); // Default is the main selection screen with clickable image

// Register Alpine components
Alpine.data('app', app);
Alpine.data('tonecolors', tonecolors);
Alpine.data('pitches', pitches);
Alpine.data('rhythms', rhythms);
Alpine.data('chords', chords);
Alpine.data('freeplay', freeplay);

// Initialize Capacitor when device is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Capacitor and get platform info
  const capacitor = initCapacitor();
  
  // Store capacitor info in Alpine store for use throughout the app
  Alpine.store('platform', {
    isNative: capacitor.isNative,
    type: capacitor.getPlatform()
  });
  
  console.log('Lalumo app running on platform:', capacitor.getPlatform());
});

// Start Alpine
window.Alpine = Alpine;
Alpine.start();
