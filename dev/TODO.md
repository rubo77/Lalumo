TODO
====

First finish pitches and melodies completely:

- Enhance Visual Experience
    - Improve animations and visual feedback
    - Add friendly character animations
    - Ensure rewarding visual feedback for all interactions

- das mascot soll immer beim öffnen einer activity den text vorlesen

- Rules aus concept.md generieren

- each activity must be reachable via a hash-anchor-link. and all chapters and activities should be included in the sitemap

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
- beim zeichnen ist der Strich zu weit links

unter chrome auf dem handy android 15:
-Multi Touch: wenn mulititouch bemerkt wird, alle anderen touchs ignorieren und trotzdem den knopf drücken

- Die Melodien muss ein Vogel piepen
- Die Welle muss Sägezahn sein ohne Brandung 

Listen to melodies:
- 
- analysiere alle texte, wie sie in de und en angezeigt werden und auch alle, die noch nicht uebersetzt sind 
- alle texte in android-konformer strings.xml am richtigen ort speichern und die überrsetzung ins deutsche und englische vervollständigen. überall soll englisch als default sein

- ergänze ein debug flag, das die console logs nur ausgibt, wenn man die app  im debug mode startet, nicht aber wenn man diese deployed oder als android app startet (already started to be implemented with `debugLog`)

- in "chords" use the same piano as in "pitches" export the piano functionality to a shared component and reuse it


# most important
- zuerst soll man einfach auf die symbole für hoch und runter drücken können und dann wird eine melodie entsprechend abgespielt, jedes mal eine neue zufällige (dies entspricht dem bisherigen "Listen to melodies")
- wenn man auf den pay button drückt kommt man in den spiel modus (bisheriger "Match Sounds")
 - zuerst nur hoch und runter üben
 - wenn man 10x richtig gespielt hat, dann kommt wellen dazu
 - wenn man 20x richtig gespielt hat, dann kommt zufalls melody dazu (Frosch)
- ebenso soll "Memory Game" umgebaut werden:
 - zuerst kann man frei auf die Tasten drücken
 - wenn man den play button drückt, dann kommt der spiel modus wie bisher "Memory Game"