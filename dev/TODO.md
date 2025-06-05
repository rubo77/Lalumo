TODO
====

First finish pitches and melodies completely:

- Enhance Visual Experience
    - Improve animations and visual feedback
    - Add friendly character animations
    - Ensure rewarding visual feedback for all interactions

- das mascot soll immer beim öffnen einer activity den text vorlesen

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


Dies soll in allen aktionen:
- immer bei Misserfolg: das element, auf das man gedrückt hat etwas hin und her-wackeln

Listen to melodies:
- nix

Draw a melody:
- beim zeichnen ist in android der Strich zu weit links
- die box soll grösser sein (steht schon im TODO)
- ev. ein spiel draus machen: eine Melodie nachzeichnen

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

- does this sound right:
 - es darf nicht 2x hintereinander die selbe melodie kommen
 - die animals sind zu klein in der pitch-card

- die CSS-Organisation ist unstrukturiert. Ich sehe das Problem mit der Aufteilung zwischen main.css und pitch-cards.css. Lass uns das besser strukturieren. Ich schlage vor, die Stile aus beiden Dateien in einem logischeren System zu organisieren. Also:
    - Zusammenführen in einer strukturierten main.css:
    - Alle Stile in einer Datei mit klaren Abschnitten
    - Sektionenkommentare zur besseren Navigation

- mascot message
    - die einstellungen haben erst nach einem neuladen effekt, ohne bleibt die message bleibt verschwunden
    - die richtige zugehörige mascot message überall soll direkt wenn man das oeffnet kommen. im moment kommt die alte, wo man vorher war in dem mascot message container
    - es soll niemals eine mascot message starten, wenn man in irgendeiner activity auf den play button drückt
    - seltsam: Wenn man über den pith-view auswahlscreen eine activity oeffnet, dann kommt die mascot mesage auch beim start jeder activity

- each activity must be reachable via a hash-anchor-link. all chapters and activities are included in the sitemap. also, if you select another activity in the nav, the hash tag should change, so you can bookmark them

# most important
- Es ist notwendig, dass sich die Größe der Pitch-Cards in Activity 1_2 dynamisch an den Freischaltungs-Fortschritt des Spielers anpasst.

Spezifische Anforderungen
- Wenn weder Welle noch Zufall-Frosch freigeschaltet sind:
    - ALLE Pitch-Cards müssen doppelt so hoch sein
    - Insbesondere die Rutsche ("down" Pitch-Card) muss sich über zwei Zeilen erstrecken
- Wenn der Frosch noch nicht freigeschaltet ist:
    - Die Rutsche ("down" Pitch-Card) muss über zwei Zeilen gehen, also nach unten um die volle Höhe herausragen. Die Rutsche (down-Card) soll einen rowspan von 2 bekommen, damit sie sich über zwei Zeilen erstreckt, ohne die Wave-Karte nach unten zu schieben.
    - Die anderen Pitch-Cards müssen normale Größe haben
- Implementierung:
    - Die CSS-Klassen müssen abhängig vom Freischaltungs-Status im Spiel zugewiesen werden
    - Der Fortschritt muss korrekt ausgelesen werden
    - Die Anpassung muss nur in der Match Sounds Activity (1_2) funktionieren
Technische Vorgaben:
    - Keine Failsafes hinzufügen
    - Code sollte gut kommentiert sein
    - Konsistent mit dem bestehenden Stil der Anwendung

Activity 1_1 ist obsolet.
die Größenanpassung, die in Activity 1_1 implementiert wurde ist komplett falsch und wird später durch das Muster für Activity 1_2 ausgetauscht