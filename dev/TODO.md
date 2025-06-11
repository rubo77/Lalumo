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

- Allgemeine Audio-Engine-Optimierungen für Chord-Kapitel
  - Überprüfe korrekte Initialisierung der Audio-Engine vor Akkordwiedergabe
  - Implementiere visuelle Anzeige, wenn Audio geladen/bereit ist
  - Verbessere Fehlerbehandlung bei Audio-Problemen

First finish pitches and melodies completely:

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

- in "chords" use the same piano as in "pitches" export the piano functionality to a shared component and reuse it

- es kann passieren, dass der lock nicht merh unlockbar ist, wenn man irgendwie den screen breiter zieht, dann lockt und dann wieder schmaler und dann den screen reloaded. ich weis aber noch n icht genau welche combo dazu führt. in dem fall kann man: localStorage.clear();

- neue Action; Eine Melodie nachzeichnen mit Progress

- die fläche muss , wenn die höhe des screens kleiner wird auch in der breite kleiner werden, so dass immer das ganze bild zu sehen ist

- nach der erfolgsmeldung wird die z-index erniedrigt, das soll aber auch on top bleiben also über der box mit dem Fortschritt


- die CSS-Organisation ist unstrukturiert. Ich sehe das Problem mit der Aufteilung zwischen main.css und pitch-cards.css. Lass uns das besser strukturieren. Ich schlage vor, die Stile aus beiden Dateien in einem logischeren System zu organisieren. Also:
    - Zusammenführen in einer strukturierten main.css:
    - Alle Stile in einer Datei mit klaren Abschnitten
    - Sektionenkommentare zur besseren Navigation

- mascot message
    - die richtige zugehörige mascot message überall soll direkt wenn man die activity öffnet kommen. im moment kommt die alte message, wo man vorher war in dem mascot message container
    - es soll niemals eine mascot message starten, wenn man in irgendeiner activity auf den play button drückt
    - die einstellungen haben erst nach einem neuladen effekt, ohne bleibt die message bleibt verschwunden
    - in preferences ein kleines mascot bild neben die einstellung zum hiden

- each activity must be reachable via a hash-anchor-link. all chapters and activities are included in the sitemap. also, if you select another activity in the nav, the hash tag should change, so you can bookmark them

Dies soll in allen aktionen:
- immer bei Misserfolg: das element, auf das man gedrückt hat etwas hin und her-wackeln

- mobile-build.sh:
 - soll keinen patch ebene haben, nur 1.1, 1.2, 2.0, 2.1, ....
 
# nach kapitel
1_1 "High or Low?" (1_1_pitches_high_or_low) 
- wenn man noch nciht auf den play button gedrückt hat, soll einfach ein zufälliger hoher, bzw. tiefer ton kommen wenn man auf einen der buttons drckt
- Entferne alle Überbleibsel der alten "Listen to melodies"-Funktionalität:
   - Lösche unnötige Melodie-Abspielfunktionen für die alte Aktivität

1_3 Draw a melody:
- beim zeichnen ist in android der Strich zu weit links
- bg: einen vogel zum spiel starten oben hin
- die noten werden eierig im breiten screen
- "background-image: 1s ease" funktioniert noch nicht
- Die buttons müssen mit der breite des bildschims wachsen

1_4 does this sound right:
 - Manchmal zeigt er am anfang das falsche Lied an, die ton. Länger Stimmen noch nicht alle. 
 - die animals dürfen sich nciht wiederholen, also es muss sich das letzte tier gemerkt werden, damit es nicht erneut ausgewählt wird im zufall
 - fix gebogenen text
 - es kommt mehrmals in log "Generated sound judgment melody:..."

1_5 memory game:
 - fertig

-------------------------------------------

- Background-Bilder Lazy load testen

 - back button in android gesondert handeln: der back-button soll da zurück ins menu gehen, aber nur, wenn die navigation nicht gelockt ist.

- Die Bilder müssen nach unten weiter expandet werden

- das impoertieren des exportierten spielstandes mit freigeschalteter welle bei 1_2, dann fortschritt zurücksetzen und den string importieren  führt nicht dazu, dass bei 1_2 die welle wieder freigeschaltet ist. füge eine message ein. beim importieren, was genau durch den string freigeschaltet wurde

- exportProgress funktioniiert nicht merh, wenn man garbage importiert hat
- import progress funktioniert nicht, zumindest bei 1_2 nicht

- add the activity ids 1_1, 1_2, 1_3, 1_4, 1_5 in all functions, that are only used in one activity in pitches.js

- why is the apk 30MB large?

# most important
