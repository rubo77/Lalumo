TODO
====

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
1_1 Listen to melodies:
- obsolet

1_4 Draw a melody:
- beim zeichnen ist in android der Strich zu weit links
- die box soll grösser sein (steht schon im TODO)
- ev. ein spiel draus machen: eine Melodie nachzeichnen

1_5 does this sound right:
 - es darf nicht 2x hintereinander die selbe melodie kommen
 - die animals sind zu klein in der pitch-card

# most important
- the sounds of notes does not work in adroid in any pitches activity but 1_4_does_this_sound_right does this sound right. the tts sound works fine. analyze the difference of 1_4 to the other, 1_2, 1_3 and 1_5 and extract the fix, that seems to exist iin 1_5 into a functin, that can be used by all the others

- the sounds of notes does not work in adroid in any pitches activity in git commit 52d266a5 it all worked, analyze, what was different especially in the activity 1_2, which was just match sounds in the old commit. show me what was the difference in the sound generation, and why it worked in the old commit and not now

