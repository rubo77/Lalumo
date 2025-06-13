# Lalumo App Dateistruktur

## Aktuelle Struktur

```
/var/www/Musici/
├── dist/                  # Build-Output für Produktionsversion
├── dist/images/           # Build-Output für Bilder
├── node_modules/          # Node-Abhängigkeiten
├── public/                # Statische Assets
│   ├── fonts/             # Schriftarten
│   ├── images/            # Bilder und Grafiken (müssen immer nach dist/images/ kopiert werden)
│   │   ├── backgrounds/   # Hintergrundbilder für verschiedene Aktivitäten
│   │   └── original/      # Originale Bilddateien (nicht in die app kopieren)
├── src/                   # Quellcode
│   ├── components/        # JavaScript-Komponenten
│   │   ├── app.js         # Hauptanwendungslogik
│   │   ├── pitches.js     # Gesamte Pitch-Aktivitätslogik
│   │   └── ...
│   ├── images/            # Bildverwaltung (nur für Entwicklung)
│   ├── styles/            # CSS-Dateien
│   │   └── main.css       # Hauptstylesheets
│   │   └── ...
│   └── index.html         # Haupt-HTML-Datei
│   └── utils/             # Hilfsfunktion debug.js - for controlling console logs in different environments
│   │   └── debug.js       # Debug utility for controlling console logs in different environments
├── tools/                 # Hilfsskripte
└── dev/                   # Entwicklungsdokumentation
    ├── CONCEPT.md         # Konzept der App
    ├── TODO.md            # Aufgabenliste
    └── FILESTRUCTURE.md   # Dieses Dokument
```

## Empfohlene Änderungen



### 1. Komponentenstruktur

- Aufteilung großer Komponenten in kleinere, wiederverwendbare Module
- Einführung einer klaren Hierarchie für Komponenten

## Modulare Aufteilung von pitches.js

Die aktuelle pitches.js-Datei ist sehr umfangreich und enthält die Logik für alle fünf Tonhöhenaktivitäten. Eine modularisierung würde die Wartbarkeit und Übersichtlichkeit verbessern.

### Neue Struktur für Aktivitäten:

```
/var/www/Musici/
└── src/
    ├── components/
    │   ├── 1_pitches/
    │   │   ├── index.js                  # Exportiert alle Hauptfunktionen
    │   │   ├── common.js                 # Gemeinsame Funktionen für alle Aktivitäten
    │   │   ├── 1_1_high_or_low.js            # Spezifische Logik für "High or Low" (1_1)
    │   │   ├── 1_2_match_sounds.js           # Spezifische Logik für "Match Sounds" (1_2)
    │   │   ├── 1_3_draw_melody.js            # Spezifische Logik für "Draw Melody" (1_3)
    │   │   ├── 1_4_sound_judgment.js         # Spezifische Logik für "Sound Judgment" (1_4)
    │   │   └── 1_5_memory_game.js            # Spezifische Logik für "Memory Game" (1_5)
    │   ├── 2_chords/
    │   │   ├── index.js                  # Exportiert alle Hauptfunktionen
    │   │   ├── common.js                 # Gemeinsame Funktionen für alle Aktivitäten
    │   │   ├── 2_1_chord_color_matching.js   # Spezifische Logik für "Chord Color Matching" (2_1)
    │   │   ├── 2_2_chord_mood_landscapes.js  # Spezifische Logik für "Chord Mood Landscapes" (2_2)
    │   │   ├── 2_3_chord_building.js         # Spezifische Logik für "Chord Building" (2_3)
    │   │   ├── 2_4_missing_note.js           # Spezifische Logik für "Missing Note" (2_4)
    │   │   └── 2_5_chord_characters.js       # Spezifische Logik für "Chord Characters" (2_5)
    │   ├── ...
    │   └── shared/                       # Geteilte Komponenten
    │       ├── audio-player.js           # Audio-Wiedergabe
    │       ├── progress-tracker.js       # Fortschrittsverfolgung
    │       └── preferences.js            # Präferenzenverwaltung
```

### Aufteilung der pitches.js

1. **common.js**: Enthält gemeinsame Funktionen, die von mehreren Aktivitäten verwendet werden
   - `init()`
   - `resetProgress()`
   - `exportProgress()`
   - `importProgress()`
   - Grundlegende Audio-Funktionen
   - Note-Mapping und Konvertierungsfunktionen

2. **high-or-low.js** (1_1):
   - `generateHighOrLowPuzzle()`
   - `checkHighOrLowAnswer()`
   - `updateHighOrLowProgress()`

3. **match-sounds.js** (1_2):
   - `generateMatchSoundsExercise()`
   - `checkMatchSoundsAnswer()`
   - `updateMatchSoundsProgress()`

4. **draw-melody.js** (1_3):
   - `generateDrawMelodyExercise()`
   - `checkDrawMelodyAnswer()`
   - `updateDrawMelodyProgress()`
   - `drawMelodyShowFeedback()`

5. **sound-judgment.js** (1_4):
   - `generateSoundHighOrLowMelody()`
   - `checkSoundJudgmentAnswer()`
   - `updateSoundJudgmentLevelDisplay()`
   - `updateSoundJudgmentProgress()`

6. **memory-game.js** (1_5):
   - `generateMemoryGame()`
   - `checkMemoryGameAnswer()`
   - `updateMemoryGameProgress()`

### Modulare Import-Struktur

Die Module würden über eine zentrale `index.js`-Datei exportiert:

```javascript
// src/components/pitches/index.js
import * as common from './common';
import * as highOrLow from './high-or-low';
import * as matchSounds from './match-sounds';
import * as drawMelody from './draw-melody';
import * as soundJudgment from './sound-judgment';
import * as memoryGame from './memory-game';

export default {
  ...common,
  ...highOrLow,
  ...matchSounds,
  ...drawMelody,
  ...soundJudgment,
  ...memoryGame,
  
  // Falls benötigt, können hier spezifische Überschreibungen oder zusätzliche Exports stattfinden
};
```

### Migration-Strategie

Die Migration könnte schrittweise erfolgen:

1. Erstellen der neuen Dateistruktur
2. Extrahieren der gemeinsamen Funktionen in common.js
3. Schrittweise Migration jeder Aktivität in ihre eigene Datei
4. Umstellung der Imports in anderen Dateien
5. Entfernen der alten pitches.js, sobald alle Funktionen migriert sind

Diese Modularisierung würde die Wartbarkeit erheblich verbessern und die Entwicklung neuer Features erleichtern, da die Abhängigkeiten klarer definiert wären.
