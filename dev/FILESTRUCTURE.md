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

### Wichtige Fallstricke und Hinweise zur Modularisierung

#### Alpine.js-Integration und globaler Scope

1. **Globale Alpine-Variablen**: Alle Variablen, die in HTML-Templates via Alpine.js verwendet werden (z.B. `x-show="showMascot"`, `x-text="currentHighlightedNote"`), müssen im globalen Alpine-Komponenten-Objekt initialisiert werden, auch wenn sie nur in einem Modul verwendet werden.

2. **Alpine-Funktionen im globalen Scope**: Alle Funktionen, die direkt in HTML-Templates aufgerufen werden (z.B. `@click="checkHighOrLowAnswer('low')"`, `@click="setMode('main')"`) müssen im globalen Alpine-Objekt verfügbar sein. Dies erfordert Wrapper-Funktionen in der Haupt-Alpine-Komponente, die die modularisierten Funktionen aufrufen.

3. **Konsistenz zwischen HTML und JavaScript**: Parameter und Rückgabewerte müssen zwischen HTML-Template und JavaScript-Code konsistent sein. Beispiel: Wenn ein Button `checkHighOrLowAnswer('high')` aufruft, muss die Funktion mit `'high'` als korrekten Wert arbeiten, nicht mit `'first'`.

#### Audio-Integration

4. **Audio-Engine-Initialisierung**: Die Audio-Engine muss durch den richtigen Modul-Import initialisiert werden, bevor Töne abgespielt werden können.

5. **Lazy-Loading und Audio-Timing**: Durch das dynamische Laden von Modulen mit `import()` kann es zu Timing-Problemen kommen. Stellen Sie sicher, dass die Audio-Engine vollständig initialisiert ist, bevor Töne abgespielt werden.

#### Allgemeine Modularisierungsprobleme

6. **Zustandssynchronisation**: Wenn ein Modul den Zustand ändert (z.B. `highOrLowProgress`), muss dieser Zustand auch im globalen Alpine-Komponenten-Objekt aktualisiert werden, damit andere Module darauf zugreifen können.

7. **Circular Dependencies**: Vermeiden Sie zirkuläre Abhängigkeiten zwischen Modulen. Die Abhängigkeitsrichtung sollte immer von spezifischen Modulen zu allgemeinen Modulen verlaufen.

8. **Navigation**: Die `setMode`-Funktion ist kritisch für die Navigation zwischen Aktivitäten und muss alle Module dynamisch laden können.

#### CSS und Styling

9. **CSS-Scoping**: Bei modularisierten Komponenten sollten auch CSS-Definitionen entsprechend modularisiert oder klar dokumentiert werden.

10. **Dynamisches Styling**: Alpine-Templates mit dynamischen Styling-Direktiven (`x-bind:style`) müssen die entsprechenden Variablen im globalen Alpine-Scope haben.

#### Testbarkeit

11. **Test-Refactoring**: Playwright-Tests müssen möglicherweise angepasst werden, um mit der neuen Modulstruktur zu funktionieren.

12. **Debugging**: Fügen Sie ausführliche Konsolenausgaben hinzu, um die Initialisierung und Ausführung jedes Moduls zu verfolgen.

#### Migration-Schritte

1. Erstellen der neuen Dateistruktur
2. Extrahieren der gemeinsamen Funktionen in common.js
3. Schrittweise Migration jeder Aktivität in ihre eigene Datei
4. Umstellung der Imports in anderen Dateien
5. Für jede HTML-Funktionalität: Entsprechende Wrapper-Funktionen im globalen Alpine-Objekt hinzufügen
6. Vollständige Initialisierung aller Alpine-Variablen im globalen Scope
7. Testen der Navigation zwischen allen Aktivitäten
8. Testen der Audio-Funktionalität in allen Aktivitäten
9. Entfernen der alten pitches.js, sobald alle Funktionen migriert sind

Erinnern Sie sich: Es reicht nicht aus, nur Funktionen zu verschieben - Sie müssen sicherstellen, dass alle HTML-Alpine-Interaktionen weiterhin funktionieren, indem Sie die entsprechenden Wrapper-Funktionen und Variablen im globalen Scope bereitstellen.

eränze hier, was noch alles zu beachten war nach der umstellung