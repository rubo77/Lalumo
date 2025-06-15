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

### Migration-Strategie: Zerschneiden-Ansatz

Die Migration erfolgt durch Zerschneiden der monolithischen pitches.js in thematische Module:

1. Erstellen der Ordnerstruktur (src/components/pitches/)
2. Identifizieren der aktivitätsspezifischen Codeblöcke in pitches.js
3. Verschieben dieser Blöcke in separate Moduldateien ohne Funktionsumstrukturierung
4. Anpassen der Hauptdatei pitches.js als "Orchestrator"

Dieser Ansatz minimiert den Umstrukturierungsaufwand und das Fehlerrisiko, während er die Vorteile der Modularisierung bietet.

### Wichtige Hinweise zum Zerschneiden-Ansatz

#### Grundprinzipien

1. **Keine Funktionsumstrukturierung**: Funktionen werden als Blöcke verschoben, ohne ihre interne Struktur zu ändern.

2. **Alpine.js-Kompatibilität**: Die Alpine.js-Komponente bleibt vollständig erhalten, nur die Implementierungsdetails werden in Module ausgelagert.

3. **Globaler Zustand**: Der Zustand bleibt im Alpine.js-Objekt, Module greifen darauf zu, statt eigenen Zustand zu verwalten.

#### Praktische Umsetzung

1. **Modulexporte**: Module exportieren Funktionen, die von der Hauptkomponente importiert werden.

2. **Komponenten-Referenz**: Module erhalten eine Referenz auf die Alpine-Komponente, um auf den gemeinsamen Zustand zuzugreifen.

3. **Keine Wrapper-Funktionen**: Da die Funktionen direkt in der Hauptkomponente registriert werden, sind keine Wrapper-Funktionen nötig.

#### Migration-Schritte

1. [x] **Ordnerstruktur erstellen**: Anlegen des Verzeichnisses src/components/pitches/

2. [x] **Aktivitätsmodule anlegen**: Erstellen leerer Dateien für jede Aktivität
   - common.js (gemeinsame Funktionen)
   - 1_1_high_or_low.js
   - 1_2_match_sounds.js
   - 1_3_draw_melody.js
   - 1_4_sound_judgment.js
   - 1_5_memory_game.js

3. **Code blockweise verschieben**: Für jede Aktivität:
   - Identifizieren aller zugehörigen Funktionen in pitches.js: 
    - add `* @activity 1_1_high_or_low`, ... to function comments
   - Kopieren dieser Funktionen in das entsprechende Modul (e.g. 1_1_high_or_low.js)
   - Exportieren der Funktionen aus dem Modul:
      - füge `export` hinzu, e.g. `export function resetHighOrLow() { ... }`
      - falls `this` innerhalb der Funktionen verwendet wird:
         - füge als argument `component` hinzu, e.g. `export function resetHighOrLow(component) { ... }`
         - innerhalb der Funktionen ersetze `this` durch `component`
      - ersetze alle aufrufe in der app, e.g. `this.resetHighOrLow()` durch `resetHighOrLow()` bzw. `resetHighOrLow(this)`
   - Ersetzen der Funktionen in pitches.js durch **direkte Imports**:
      e.g. `import { resetHighOrLow } from './pitches/1_1_high_or_low.js';`
   - **WICHTIG**: Keine `index.js` "barrel exports" verwenden - diese sind unnötige Indirektion
      - Imports sollen direkt von den Modulen kommen: `./pitches/1_1_high_or_low.js`
      - Nicht über Zwischenschichten wie `./pitches/index.js`
      - Macht Code einfacher, debugging leichter, weniger Abstraktionsebenen

4. **Komponenten-Referenz übergeben**: Jedes Modul erhält Zugriff auf die Alpine-Komponente

5. **Testen**: Schrittweise Überprüfung jeder Aktivität nach der Migration

Dieser Ansatz ist deutlich einfacher als die feingranulare Extraktion einzelner Funktionen und minimiert das Risiko von Fehlern durch fehlende Referenzen oder falsche Aufrufe.

### Erfahrungen nach der Umstellung

Nach der Umstellung mit dem Zerschneiden-Ansatz wurden folgende wichtige Erkenntnisse gewonnen:

1. **Alpine.js-Variablen**: Alle in HTML-Templates verwendeten Variablen müssen im Alpine-Komponenten-Objekt initialisiert bleiben

2. **Funktionsaufrufe im Template**: Funktionen, die im HTML via Alpine.js aufgerufen werden, müssen im Alpine-Objekt registriert sein

3. **Zustandssynchronisation**: Bei Änderungen des Zustands in Modulen muss dieser mit dem Alpine-Komponenten-Objekt synchronisiert werden

4. **Debugging**: Ausführliche Logging-Statements mit eindeutigen Tags helfen, Probleme zu identifizieren

5. **Namenskonflikte**: Bei Exporten aus mehreren Modulen auf Namenskonflikte achten und eindeutige Namen verwenden