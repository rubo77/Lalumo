TODO
====

## Chord Chapter Implementation

- Fix Audio in Chord Activities
  - **2_1_chords_color-matching**: Implementiere Audio-Engine-Integration für Akkord-Wiedergabe
  - **2_2_chords_mood-landscapes**: Aktiviere Audio-Wiedergabe für Akkordprogressionen
  - **2_3_chords_chord-building**: Füge Button hinzu, um den vollständigen gebauten Akkord abzuspielen
  - **2_5_chords_characters**: Implementiere Audio-Engine-Integration für Akkord-Wiedergabe
  - **2_6_chords_harmony-gardens**: Aktiviere Audio-Wiedergabe für Akkordsequenzen

- Optimize Chord User Experience
  - Alle activities sollen bei erfolg den Regenbogen anzeigen
  - **2_4_chords_missing-note**: Vereinfache die Aktivität für jüngere Kinder
  - Stelle sicher, dass alle Akkordaktivitäten eine konsistente UI haben
  - Implementiere kindgerechtes visuelles Feedback bei Akkordwiedergabe

- Überprüfe ob alle mit tone.js umgesetzt wurden

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


unter chrome auf dem handy android 15:
-Multi Touch: wenn mulititouch bemerkt wird, alle anderen touchs ignorieren und trotzdem den knopf drücken, also den letzten, der zählt

- Regenbogen ist im breiten screen zu weit links

- ergänze ein debug flag, das die console logs nur ausgibt, wenn man die app  im debug mode startet, nicht aber wenn man diese deployed oder als android app startet (already started to be implemented with `debugLog`)


- es kann passieren, dass der lock nicht mehr unlockbar ist, wenn man irgendwie den screen breiter zieht, dann lockt und dann wieder schmaler und dann den screen reloaded. ich weis aber noch n icht genau welche combo dazu führt. in dem fall kann man: localStorage.clear();

- nach der erfolgsmeldung wird die z-index erniedrigt, das soll aber auch on top bleiben also über der box mit dem Fortschritt


- main.css und pitch-cards.css zusammenführen in einer strukturierten main.css:
    - Alle Stile in einer Datei mit klaren Abschnitten
    - Sektionenkommentare zur besseren Navigation
    - nicht benutzte stile entfernen

- mascot message
    - die richtige zugehörige mascot message überall soll direkt wenn man die activity öffnet kommen. im moment kommt die alte message, wo man vorher war in dem mascot message container
    - es soll niemals eine mascot message starten, wenn man in irgendeiner activity auf den play button drückt
    - die einstellungen haben erst nach einem neuladen effekt, ohne bleibt die message bleibt verschwunden
    - in preferences ein kleines mascot bild neben die einstellung zum hiden

- reachable via a hash-anchor-link: make this link go directly to the 1_1_pitches_high_or_low activity: https://lalumo.z11.de/#1_pitches-1_1_pitches_high_or_low

- all chapters and activities are included in the sitemap. also, if you select another activity in the nav, the hash tag should change, so you can bookmark them

Dies soll in allen aktionen:
- immer bei Misserfolg (error): den sound abspielen und den hintergrund hin und her-wackeln (.shake-error)


- "background-image: 1s ease" funktioniert noch nicht

- Verschiedene Instrumente

- Bei Android funktioniert die Sprache nicht. Nur die mascot messages gehen

- store username and language in export string in Preferences


- when pressed on a button, the finger moves and is released, it should also trigger the buttons click event

- überall den border-shadow focus nach dem click entfernen

- alle activities sollen einen reset bekomen zum resetten nur des einen progresses

## nach kapitel

1_1 "High or Low?" (1_1_pitches_high_or_low) 
- # bereit zur veröffentlichung
- ändere, dass man immer 1s warten muss, bis man wählen kann, welche Taste man drückt. man soll sofort, wenn man den ton hört schon wählen dürfen
- die Welle muss Sägezahn sein ohne Brandung 
- die tiefen töne sind eine oktave zu tief
- im master level dürfen die töne maximal 3 halbtöne auseinander sein und der erste ton muss nicht mehr C5 sein, sondern kann jeder beliebige sein, es wird nur getestet, ob der 2. ton dann höher oder tiefer ist
- die erfolgsmeldung muss sich ab level 3 aendern in "der ton war höher" anstatt "hoch" und "der ton war tiefer" anstatt "tief"
- Entferne alle Überbleibsel der alten "Listen to melodies"-Funktionalität:
   - Lösche unnötige Melodie-Abspielfunktionen für die alte Aktivität

1_2 "Match the Sounds":
- # bereit zur veröffentlichung

1_3 Draw a Melody:
- # bereit zur veröffentlichung
- wenn der zeichenpfad spitze ecken hat, dann sollen noten, die nahe der spitze sind ganz in die spitze rutschen
- reset all progress geht noch nicht
- wenn man beim malen den rand des canvas überschreitet, sollte der strich weiter im canvas gemalt werden, an der kante entlang

1_4 Does It Sound Right:
- # bereit zur veröffentlichung
- when the "next melody" button is pressed in the "Does It Sound Right?" activity, the animal images should NOT change
- Manchmal zeigt er am anfang das falsche Lied an, die ton. Länger Stimmen noch nicht alle. 
- fix gebogenen text
- es kommt mehrmals in log "Generated sound judgment melody:..."
- die tonlängen Stimmen noch nicht alle. 
- die tiere müssen noch durchsichtigen rand haben:
 - ja@pitches.js#L78-94 write a script, das bei all diesen mages die bilder freistellt, also dass die farbe oben links im bild wählt und dann ausgehend von dem punkt sich ausdehnend die farben auf transparent setzt solange die nicht über einem bestimmten sthreshold abweichen. speichere die bilder dann unter s´dem selben namen, kopiere die bilder nach images/originals/ wenn sie noch nciht existieren
- baue die lieder im TODO block im pitches.js

1_5 memory game:
 - # bereit zur veröffentlichung

-------------------------------------------
@mobile-build.sh: die find funktion, die nur das kopieren soll was benutzt wird passiert zu spät, es wird vorher schon mit rsync alles von public/ nach dist/ kopiert. ich habe den original folder da hinzugefügt, aber es wäre schöner, wenn das automatisch nicht gersnynct würde, wenn es nicht bnutzt wird

- Background-Bilder Lazy load testen

 - back button in android gesondert handeln: der back-button soll da zurück ins menu gehen, aber nur, wenn die navigation nicht gelockt ist.

- exportProgress funktioniiert nicht merh, wenn man garbage importiert hat

- add the activity ids 1_1, 1_2, 1_3, 1_4, 1_5 in all functions, that are only used in one activity in pitches.js

- warum ist das laubncher icon nur ein weisser kreis?
- Webpack-Bundle-Analyzer verwenden um große Abhängigkeiten zu identifizieren

- erstelle ein concept, wie wir die app vermarkten können
- build for ios

# most important