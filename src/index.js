// Import Alpine.js
import Alpine from 'alpinejs';

// Import styles
import './styles/main.css';

// Import components
import { app } from './components/app';
import { tonecolors } from './components/tonecolors';
import { pitches } from './components/pitches';
import { rhythms } from './components/rhythms';
import { chords } from './components/chords';
import { freeplay } from './components/freeplay';

// Initialize Alpine store for state management
Alpine.store('pitchMode', 'listen'); // Default is listen mode

// Register Alpine components
Alpine.data('app', app);
Alpine.data('tonecolors', tonecolors);
Alpine.data('pitches', pitches);
Alpine.data('rhythms', rhythms);
Alpine.data('chords', chords);
Alpine.data('freeplay', freeplay);

// Start Alpine
window.Alpine = Alpine;
Alpine.start();
