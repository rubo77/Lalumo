Lalumo
======

Learn music with animal friends, melodies, and puzzles – playful and colorful!

# Description

Lalumo – Discover Music with Heart and Ear

With Lalumo, children dive into the colorful world of music! In a playful way and with lovingly designed animal characters, they learn about pitch, melody, timbre, and rhythm – all without any prior knowledge.

What can your child expect in Lalumo?

- Chapter 1: Pitch & Melody
  This is where it all begins! Children recognize pitches by listening and playing them back.

- Child-friendly activities
  - Listen to familiar children's songs and decide whether they sound right or "off"
  - Choose animal friends for good or strange-sounding tones
  - Play back simple melodies
  - Explore rising, falling, or jumping melodies

- Visuals that support understanding Colors, shapes, and motion help children intuitively grasp musical concepts.

Intuitive navigation
Lalumo is specially designed for young children – no complex menus, just a clear, image-based interface with a bird as the play button and more.

Beautiful illustrations
The scenes resemble hand-painted picture books: warm, calm, and full of charm.

No ads, no in-app purchases
Fully usable offline, with no distractions – just music, play, and joy.

Perfect for preschool-aged children, parents who want to support early musical learning, and educators looking to make sound worlds accessible to kids.


# Kurzbeschreibung

Lerne Musik mit Tierfreunden, Melodien und Rätseln – spielerisch & bunt!

# Beschreibung

Lalumo – Musik entdecken mit Herz und Ohr
Mit Lalumo tauchen Kinder ab in die bunte Welt der Musik! Spielerisch und mit liebevoll gestalteten Tiercharakteren lernen sie Tonhöhen, Melodien, Klangfarben und Rhythmen kennen – ganz ohne Vorkenntnisse.

🎶 Was erwartet dein Kind in Lalumo?

- Kapitel 1: Tonhöhen & Melodien
- Hier beginnt alles! Kinder erkennen Tonhöhen durch Hören, und Nachspielen.

- Kindgerechte Übungen
    ➤ Höre bekannte Kinderlieder und finde heraus, ob sie richtig oder „schräg“ gespielt wurden
    ➤ Wähle passende Tierfreunde für gute oder schräge Töne
    ➤ Spiele Melodien nach
    ➤ Erforsche aufsteigende, absteigende oder hüpfende Melodien

- Visualisierungen helfen beim Verstehen
- Farben, Formen und Bewegungen machen Musik intuitiv begreifbar.

🐦 Intuitive Bedienung
Lalumo ist speziell für kleine Kinder entwickelt – keine komplizierten Menüs, sondern eine klare, bildgestützte Navigation mit Play-Button-Vogel und Co.

🌸 Wunderschöne Illustrationen. Die Szenen erinnern an handgemalte Bilderbücher: liebevoll, ruhig, warm.

🎵 Keine Werbung, keine In-App-Käufe
Vollständig offline nutzbar, keine Ablenkung – nur Musik, Spiel und Freude.

Ideal für Kinder im Vorschulalter, für Eltern, die musikalische Früherziehung spielerisch begleiten möchten, und für Pädagog:innen, die Klangwelten zugänglich machen wollen.


# Requirements

* Node >= 12
* npm (or yarn)


# Installation

Clone the repo.
Initialize node_modules with:
```
npm install
```

# Development

Run the webpack-dev-server including live-reload with:
```
npm run watch
```

to start the app use 
```
run.sh
```

The application will be available at http://localhost:9091 in your browser.
- Main page: http://localhost:9091/index.html
- Card library: http://localhost:9091/cards.html
- Multiplayer mode: http://localhost:9091/multiplayer.html


# Production

Bundle and build with:
```
npm run build
```
All files are then in the /dist folder.
Full Optimization - Minification, Tree-shaking


## fast build

No Minification - Code stays readable

```
npm run build:fast
```

# Online Deployment

The application is deployed at: https://lalumo.z11.de/

To update the online version, follow these steps from the project's root directory:

```
# 1. Build the production files (this will create the /dist folder)
npm run build

# 2. Make sure the dist/ directory was created and contains all needed files
ls -la dist/

# 3. Upload to the server (make sure you're in the project root directory)
rsync -avz --no-perms --no-owner --no-group --delete dist/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.z11.de/

# 4. Resume development (optional)
npm run watch
```

## String Management

This app uses Android XML files as the single source of truth for all translations:

**Edit strings here:**
- English: `android/app/src/main/res/values/strings.xml`
- German: `android/app/src/main/res/values-de/strings.xml`

**After editing XML files:**
- Run `npm run sync-strings` 
- OR restart `npm run watch`

**Mobile builds:**
Use the XML files directly (no sync needed).

# Known bugs:

In certain scenarios, the menu lock button may become stuck in the locked state, especially when changing screen width, locking the menu, changing the width again, and then reloading the page. If this happens, you can fix it by opening the browser console and running: `localStorage.clear();`

# Development scripts

The following scripts are available to streamline development:

- `run.sh`: Starts the development server with hot reloading and updates mobile apps
  ```bash
  bash run.sh
  ```

- `mobile-build.sh`: Builds and deploys the app to connected Android/iOS devices
  ```bash
  bash mobile-build.sh
  ```

# Testing

This project uses Playwright for automated testing. Test files are located in the `tests/` directory.

To run the tests:

```bash
# Install Playwright if not already installed
npm install -D @playwright/test

# Run the tests
npx playwright test
```

The main test files include:
- `hash-navigation.spec.js`: Tests navigation between activities using URL hash changes
