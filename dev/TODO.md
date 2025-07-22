TODO
====

## Chord Chapter Implementation

- enhance and Optimize Chord User Experience
  - Alle activities sollen bei erfolg den Regenbogen anzeigen (aus feedback.js)

  - **2_1_chords_color-matching**:
   - Implementiere Tone.js Audio-Engine-Integration für Akkord-Wiedergab
   - progression:
    - at first only minor or major
    - if 10 right level 2: add Diminished
    - if 10 right level 3: add Augmented
    - if 10 right level 4: add Sus4
    - if 10 right level 5: add Sus2 
   - add a free play mode where the user can play any chord by clicking on the color
    

  - **2_2_chords_stable_unstable**:
   - es spielt noch kein sound
    - Aktiviere Audio-Wiedergabe für Akkordprogressionen
    - schlage landschaften vor

  - **2_3_chords_chord-building**:
     - Füge einen neuen Button hinzu, um den vollständigen gebauten Akkord dann auch  abzuspielen

  - **2_4_chords_missing-note**:
    - Vereinfache die Aktivität für jüngere Kinder, so ist sie viel zu schwer
    - Stelle sicher, dass alle Akkordaktivitäten eine konsistente UI haben
    - Implementiere kindgerechtes visuelles Feedback bei Akkordwiedergabe
    - schlage etwas vor

  - **2_5_chords_characters**:
   
  - **2_6_chords_harmony-gardens**:
   - es spielt noch kein sound
   - Aktiviere Audio-Wiedergabe für Akkordsequenzen

dabei:
- Überprüfe ob alle mit tone.js umgesetzt wurden

- beachte FILESTRUCTURE.md und CODING_STANDARDS.md

- in "chords" use the same piano as in "pitches" export the piano functionality to a shared component and reuse it


## First finish pitches and melodies completely:

- Enhance Visual Experience
    - Improve animations and visual feedback
    - Add friendly character animations
    - Ensure rewarding visual feedback for all interactions

- Rules aus concept.md generieren

- Add Child-Friendly Guidance
    - Implement recurring character guides throughout chapters

- Wie sichere ich die Spieler Fortschritte? 
    - Backup auf Server

- Create unique visual spaces for each chapter

- Mobile Deployment
    - Ensure proper touch interactions for mobile
- AI Integration
    - Implement voice guidance with text-to-speech
    - Create adaptive exercise scenarios
    - Develop test cases for different child interactions

- Cookie Banner

## Code blockweise verschieben Für jede Aktivität:
- Identifizieren aller zugehörigen Funktionen in pitches.js (bzw. chords.js): 
- add `* @activity 1_1_high_or_low`, ... to function comments
- Verschieben dieser Funktionen in das entsprechende Modul (e.g. 1_1_high_or_low.js)
- Exportieren der Funktionen aus dem Modul:
  - füge `export` hinzu, e.g. `export function resetHighOrLow() { ... }`
  - falls `this` innerhalb der Funktionen verwendet wird:
     - füge als argument `component` hinzu, e.g. `export function resetHighOrLow(component) { ... }`
     - innerhalb der Funktionen ersetze `this` durch `component`
  - ersetze alle aufrufe in der app, e.g. `this.resetHighOrLow()` durch `resetHighOrLow()` bzw. `resetHighOrLow(this)`
- Ersetzen der Funktionen in pitches.js durch **direkte Imports**:
  e.g. `import { resetHighOrLow } from './pitches/1_1_high_or_low.js';`
- **WICHTIG**:
  - Imports sollen direkt von den Modulen kommen: `./pitches/1_1_high_or_low.js`
  - Nicht über Zwischenschichten wie `./pitches/index.js`
  - falls die methode im template index.html benutzt werden soll, muss am ende des modul-files dies ergänzt werden:
  e.g. `window.resetHighOrLow = resetHighOrLow;`

# TODOs
unter chrome auf dem handy android 15:
-Multi Touch: wenn mulititouch bemerkt wird, alle anderen touchs ignorieren und trotzdem den knopf drücken, also den letzten, der zählt

- Regenbogen ist im breiten screen zu weit links

- ergänze ein debug flag, das die console logs nur ausgibt, wenn man die app  im debug mode startet, nicht aber wenn man diese deployed oder als android app startet (already started to be implemented with `debugLog`)


- es kann passieren, dass der lock nicht mehr unlockbar ist, wenn man irgendwie den screen breiter zieht, dann lockt und dann wieder schmaler und dann den screen reloaded. ich weis aber noch n icht genau welche combo dazu führt. in dem fall kann man: localStorage.clear();

- nach der erfolgsmeldung wird die z-index erniedrigt, das soll aber auch on top bleiben also über der box mit dem Fortschritt

- dev/Concept_Referral-System.md TODOs

- main.css und pitch-cards.css zusammenführen in einer strukturierten main.css:
    - Alle Stile in einer Datei mit klaren Abschnitten
    - Sektionenkommentare zur besseren Navigation
    - nicht benutzte stile entfernen

# mascot message:
    - die richtige zugehörige mascot message überall soll direkt wenn man die activity öffnet kommen. im moment kommt die alte message, wo man vorher war in dem mascot message container
    - es soll niemals eine mascot message starten, wenn man in irgendeiner activity auf den play button drückt
    - die einstellungen haben erst nach einem neuladen effekt, ohne bleibt die message bleibt verschwunden
    - in preferences ein kleines mascot bild neben die einstellung zum hiden
    - hilfstexte selbst einsprechen oder einmal generieren lassen als mp3

- reachable via a hash-anchor-link: make this link go directly to the 1_1_pitches_high_or_low activity: https://lalumo.z11.de/#1_pitches-1_1_pitches_high_or_low

- all chapters and activities are included in the sitemap. also, if you select another activity in the nav, the hash tag should change, so you can bookmark them

Dies soll in allen aktionen:
- immer bei Misserfolg (error): den sound abspielen und den hintergrund hin und her-wackeln (.shake-error)


- "background-image: 1s ease" funktioniert noch nicht

- Verschiedene Instrumente

- übersetze Credits, ... @index.html#L912-935 dies und @index.html#L973 und @index.html#L963-964 @index.html#L883-893 @index.html#L896-908 @pitches.js#L3356-3359 

- überall den border-shadow focus nach dem click entfernen

reset-button:
- wenn der auto-detect immer geht, dann kann der parameter currentMode in der funktion ja weg in function resetCurrentActivity(currentMode)

- volume level einstellbar machen

- ganz viel ist noch strings hartkodiert mit `isGerman`

- Je höher der Ton, umso leiser machen



# play store:
- In die Texte dass der Bildschirm gesperrt ist
- "Images created with ChatGpt mindfull. Loving prompts" verbessern
- Finanzierung durch unlock button mit link zu Crowd funding

- referral count page aus den settings aufrufbar machen
- das template in dem partial refferer.html funktioniert nichdt, ev. templates werden in partials nicht gaufgelöst? in commit 4d82fbca wurde ein äjhnliches problem gelöst

- die meisten activities sollen einen free- und einen game-mode haben, in dem man die sounds ausprobieren kann (free) oder das game spielt, bei dem man die richtigen buttons drücken muss, der die richtigen effekte zeigt aus `feedback.js`

## nach kapitel

1_1 "High or Low?" (1_1_pitches_high_or_low) 
- # bereit zur veröffentlichung
- im master level dürfen die töne maximal 3 halbtöne auseinander sein und der erste ton muss nicht mehr C5 sein, sondern kann jeder beliebige sein, es wird nur getestet, ob der 2. ton dann höher oder tiefer ist
- die erfolgsmeldung muss sich ab level 3 aendern in "der ton war höher" anstatt "hoch" und "der ton war tiefer" anstatt "tief"
- die tiefen töne sollen ab level 3 eine oktave höher
- Die volle  bildschirmbreite Ausnutzen auf dem Handy

1_2 "Match the Sounds":
- reset current wird nicht sichtbar
- # bereit zur veröffentlichung
- die Welle muss Sägezahn sein ohne Brandung 
- der reset button in der navi muss auch den hintergrund und die anzeige unten triggern, dass die refresht wird, im moment wird der dann noch einfach weiss

1_3 Draw a Melody:
- [DRAW_MELODY_DEBUG] es wird zwei progress hochgezaehlt, wenn man eine melodie richtig trifft
- # bereit zur veröffentlichung
- Zeichnen geht nicht mehr auf den Handy, man schiebt den bildschirm hin und her, anstatt zu malen. könnte helfen: overflow hiddern
- play sound and rainbow exact after the painted melody is played (in case it is a longer melody)
- wenn der zeichenpfad spitze ecken hat, dann sollen noten, die nahe der spitze sind ganz in die spitze rutschen
- Wenn man einen Ton trifft, die Note aufleuchten verbessern, vielieicht den strich an der stelle dick machen oder so
- prevent level progression while current melody is still playing: wenn man noch zeichnet, whaehrend der noch spielt, dann kann schon auf den nächsten level wechseln (von 3 auf 4) und es werden 4 noten auf die linie gezeichnet, obwohl nur 3 waren, und drei davon richtig waren. das muss nicht passieren.

1_4 Does It Sound Right:
- Transposed melodies im höheren Level
- # bereit zur veröffentlichung
- when the "next melody" button is pressed in the "Does It Sound Right?" activity, the animal images should NOT change
- fix gebogenen text
- es kommt mehrmals in log "Generated sound judgment melody:..."
- im Game Modus alle drei instrumente zusammen
- eigene melodien hochladen

1_5 memory game:
  -  Klavier weiter runter auf kleinen bildschirmen
  - # bereit zur veröffentlichung

2_2_chords_stable_unstable:
  - # bereit zur veröffentlichung
 
2_5_chords_color_matching:
  - # bereit zur veröffentlichung
  - es soll der erfolgssound kommen
  - wenn man während der regenbogen läuft drückt, soll schon der neue akkord abgespielt werden und nicht der letzte


# mobile-build.sh:
- die find funktion, die nur das kopieren soll was benutzt wird passiert zu spät, es wird vorher schon mit rsync alles von public/ nach dist/ kopiert. ich habe den original folder da hinzugefügt, aber es wäre schöner, wenn das automatisch nicht gersnynct würde, wenn es nicht bnutzt wird
- option um die icons neu zu machen, defualt ausgeschaltet

-------------------------------------------
- Background-Bilder Lazy load testen

 - back button in android gesondert behandeln: der back-button soll da zurück ins menu gehen, aber nur, wenn die navigation nicht gelockt ist.

- exportProgress funktioniiert nicht merh, wenn man garbage importiert hat

- Webpack-Bundle-Analyzer verwenden um große Abhängigkeiten zu identifizieren

- Redeem refresh button einbauen
- "Reset current" Button soll nur sichtbar sein, wenn der Progress der aktuellen activity größer 0

# most important
- Alle Buttons für zwei Sekunden disable nach Klick
- 