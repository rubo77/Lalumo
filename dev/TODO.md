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
- bei Erfolg Regenbogen soll sich noch weiter ausdehnen, sonst alles so lassen, perfekt!
- immer bei Misserfolg: das element, auf das man gedrückt hat etwas hin und her-wackeln

Draw a melody:
- beim zeichnen ist in android der Strich zu weit links
- die box soll grösser sein (steht schon im TODO)
- ev. ein spiel draus machen: eine Melodie nachzeichnen

unter chrome auf dem handy android 15:
-Multi Touch: wenn mulititouch bemerkt wird, alle anderen touchs ignorieren und trotzdem den knopf drücken

- Die Melodien muss ein Vogel piepen
- Die Welle muss Sägezahn sein ohne Brandung 

Listen to melodies:
- analysiere alle texte, wie sie in de und en angezeigt werden und auch alle, die noch nicht uebersetzt sind 
- alle texte in android-konformer strings.xml am richtigen ort speichern und die überrsetzung ins deutsche und englische vervollständigen. überall soll englisch als default sein
- die mascot message in match melody soll direkt wenn man das oeffnet kommen und nicht erst, wenn man den play button drückt

- ergänze ein debug flag, das die console logs nur ausgibt, wenn man die app  im debug mode startet, nicht aber wenn man diese deployed oder als android app startet (already started to be implemented with `debugLog`)

- in "chords" use the same piano as in "pitches" export the piano functionality to a shared component and reuse it

- wenn man in einer activity richtig oder falsch gespielt hat, dann soll die aktuelle melodie unterbrochen werden und der kurze sound von match-sounds auch in memory-game abgespielt werden


- es kann passieren, dass der lock nicht merh unlockbar ist, wenn man irgendwie den screen breiter zieht, dann lockt und dann wieder schmaler und dann den screen reloaded. ich weis aber noch n icht genau welche combo dazu führt. in dem fall kann man: localStorage.clear();

- neue Action; Eine Melodie nachzeichnen mit Progress

- die fläche muss , wenn die höhe des screens kleiner wird auch in der breite kleiner werden, so dass immer das ganze bild zu sehen ist

- nach der erfolgsmeldung wird die z-index erniedrigt, das soll aber auch on top bleiben also über der box mit dem Fortschritt

- activity1_2_matchSoundsPlaySequence-Funktion umbenennen in activity1_2_matchSoundsactivity1_2_matchSoundsPlaySequence


- does this sound right:
 - wenn man richtig antwortet, soll die melody unterbrochen werden und eine neue melody generiert werden
 - images als buttons
 - die sound funktion playAudioSequence() um die tonlänge erweitern
 
# most important
- each activity must be reachable via a hash-anchor-link. all chapters and activities are included in the sitemap.
also, if you select another activity in the nav, the hash tag should change, so you can bookmark them
