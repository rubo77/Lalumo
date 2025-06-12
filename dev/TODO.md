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
-Multi Touch: wenn mulititouch bemerkt wird, alle anderen touchs ignorieren und trotzdem den knopf drücken

- Die Melodien muss ein Vogel piepen
- Die Welle muss Sägezahn sein ohne Brandung 


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
- immer bei Misserfolg: das element, auf das man gedrückt hat etwas hin und her-wackeln

- mobile-build.sh:
 - nur die bilder exportieren, die auch im code vorkommen

- Hinweis: /var/www/Musici/android/app/src/main/java/com/lalumo/app/MainActivity.java verwendet oder überschreibt eine veraltete API.

- "background-image: 1s ease" funktioniert noch nicht

- Verschiedene Instrumente

- Bei Android funktioniert die Sprache nicht. Nur die mascot messages gehen

- store username and language in export string in Preferences

# nach kapitel
1_1 "High or Low?" (1_1_pitches_high_or_low) 
- das game soll nicht automatisch starten, sondern wenn man noch nicht auf den play button gedrückt hat, soll einfach ein zufälliger hoher, bzw. tiefer ton kommen wenn man auf einen der buttons drckt
- wenn man erfolgreich war, soll nach 2s automatisch der neue ton kommen
- Entferne alle Überbleibsel der alten "Listen to melodies"-Funktionalität:
   - Lösche unnötige Melodie-Abspielfunktionen für die alte Aktivität

1_3 Draw a melody:
- when not in game mode, there should always be more notes on the line, depending on how long the line is painted. at the moment there are as many as the user is advanced, but it should vary on the painted line length instead, so eg. every 10px there is a note on the line played
- Wenn man nicht im spiel ist, das Einhorn auch zum spiel starten benutzen (oder einen vogel oben hin, und das einhorn verstecken, wenn man im siel modus ist)
- die Noten werden eierig im breiten screen
- reset all progress geht noch nicht
- die Noten sind ja verteilt auf die gezeichnete Linie, z.b. 3 Noten , die erste am Anfang, die 2. nach einem Drittel, die 3. nach 2/3. die Verteilung soll aber etwas verlängert werden, also die letzte Note soll dabei aber am Ende der Linie sein

1_4 does this sound right:
 - Manchmal zeigt er am anfang das falsche Lied an, die ton. Länger Stimmen noch nicht alle. 
 - fix gebogenen text
 - es kommt mehrmals in log "Generated sound judgment melody:..."
 - die tonlängen Stimmen noch nicht alle. 

1_5 memory game:
 - fertig

-------------------------------------------

- Background-Bilder Lazy load testen

 - back button in android gesondert handeln: der back-button soll da zurück ins menu gehen, aber nur, wenn die navigation nicht gelockt ist.

- Die Bilder müssen nach unten weiter expandet werden

- das importieren des exportierten spielstandes mit freigeschalteter welle bei 1_2, dann fortschritt zurücksetzen und den string importieren  führt nicht dazu, dass bei 1_2 die welle wieder freigeschaltet ist. füge eine message ein. beim importieren, was genau durch den string freigeschaltet wurde

- exportProgress funktioniiert nicht merh, wenn man garbage importiert hat

- add the activity ids 1_1, 1_2, 1_3, 1_4, 1_5 in all functions, that are only used in one activity in pitches.js

- why is the apk 30MB large?

# most important
