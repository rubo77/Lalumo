# Konzept für die Trennung zwischen F-Droid- und Play-Store-Version

## Zielsetzung
Eine Open-Source-Version der App für F-Droid, die keine bezahlten Inhalte oder deren Spuren in der Git-History enthält, während die Play-Store-Version alle Features inklusive der Bezahlfunktionen hat.

## Schritte

### 1. Separater Branch für F-Droid
- Erstelle einen neuen Branch, zum Beispiel `f-droid-version`, der von deinem Haupt-Branch (z. B. `main`) abgeleitet ist, aber keine Commits enthält, in denen die Bezahlfunktionen hinzugefügt wurden.

### 2. Entfernen der Bezahlfunktionen aus der Git-History
- Nutze ein Tool wie `git rebase -i` oder `git filter-repo`, um alle Commits, die die Bezahlfunktionen einführen, aus der History des `f-droid-version`-Branches zu entfernen.
- Achte darauf, dass in der Git-History des F-Droid-Branches keine Hinweise auf die entfernten Funktionen mehr zu finden sind.

### 3. Pflege der Branches
- Entwickle neue Features im Haupt-Branch und merge sie in den `f-droid-version`-Branch, ohne die Bezahlfunktionen. Achte darauf, dass die Bezahlfunktionen immer in einem separaten Branch oder über Feature-Flags integriert werden, die im F-Droid-Branch deaktiviert sind.

### 4. Automatisierung und Überprüfung
- Richte ein automatisiertes Skript ein, das sicherstellt, dass der `f-droid-version`-Branch keine Bezahlfunktionen oder deren Historie enthält.
- Überprüfe regelmäßig den `f-droid-version`-Branch, bevor du ihn auf GitHub veröffentlichst, um sicherzustellen, dass alles passt.

### 5. Veröffentlichung
- Stelle sicher, dass der `f-droid-version`-Branch auf GitHub öffentlich ist und keine sensiblen Informationen oder Bezahlfunktionen enthält.
- Für den Play Store nutzt du weiterhin den Haupt-Branch, der alle Features beinhaltet.

## Fazit
Mit dieser Vorgehensweise stellst du sicher, dass die F-Droid-Version wirklich frei von Bezahlfunktionen ist und auch in der Git-History keine Spuren davon zu finden sind.


Ich habe ja bisher noch keinerlei Bezahlfunktionen eingebaut, insofern ist der momentane Main-Branch für beide gültig. Ich könnte jetzt ja auch anfangen, die Bezahlfunktionen nur in einem Extra-Branch zu veröffentlichen. Also nicht zu veröffentlichen, sondern in einem Extra-Branch zu entwickeln. Und dann immer, wenn ich einen Playstore-Release machen will, die Bezahlfunktionen aus dem Extra-Branch in den Haupt-Branch einmerken, bevor ich ihn baue, als Map. Wäre das nicht eine praktikablere und übersichtlichere Methode?”
00:46
ChatGPT:

Das klingt auf jeden Fall nach einer sehr praktischen und übersichtlichen Lösung! Indem du die Bezahlfunktion in einem separaten Branch entwickelst und sie nur dann in den Haupt-Branch mergst, wenn du ein Release für den Play Store vorbereitest, behältst du den Haupt-Branch für beide Versionen übersichtlich und vermeidest, dass die Bezahlfunktionen in der Open-Source-Version für F-Droid auftauchen. So bleibt alles schön sauber getrennt und du hast die Flexibilität, genau zu steuern, welche Version wohin kommt. Klingt nach einem super Plan!
Du:
“Wie mache ich das am besten im Entwickeln mit AngularJS und dem Umstellen zwischen den Branches und zwischen den Einstellungen, ob man schon bezahlt hat oder ob man noch nicht bezahlt hat. Ich muss ja die verschiedenen Zustände testen, wo würdest du das am besten verankern.”
00:22
ChatGPT:

Am besten kannst du das über sogenannte Feature Flags oder Konfigurationsdateien lösen. In deinem Angular-Projekt könntest du zum Beispiel eine zentrale Konfigurationsdatei oder Umgebungsvariablen nutzen, in denen festgelegt ist, ob die Bezahlfunktionen aktiv sind oder nicht. So kannst du beim Wechseln zwischen den Branches einfach die entsprechende Konfiguration laden. Für das Testen kannst du auch Mock-Daten verwenden, um verschiedene Zustände zu simulieren. So bleibt dein Code sauber und du kannst problemlos zwischen den Versionen umschalten.
Du:
“Wo speichere ich diese Konfigurationsdatei? Die ist ja in Angular, JS, irgendwo im Unterordner wahrscheinlich, mit einer Punktdatei. Und in Android ist das ja eine Web-App. Und die muss ja auch auf die Konfigurationsdatei zugreifen, aber die ist wahrscheinlich dann am besten im www-Ordner, oder?”
00:24
ChatGPT:

Genau, bei einem Angular-Projekt kannst du die Konfigurationsdatei zum Beispiel im src/environments-Ordner ablegen. Dort kannst du unterschiedliche Environment-Dateien wie environment.ts für die Standardkonfiguration und zum Beispiel environment.prod.ts für die Produktionsumgebung anlegen. In diesen Dateien kannst du Flags oder Einstellungen für die Bezahlfunktionen festlegen.

Wenn du die App dann auf Android oder eine andere Plattform bringst, wird die Angular-App in den www-Ordner (bei einer hybriden App wie mit Cordova oder Capacitor) kompiliert. Dort kannst du dann die entsprechende Environment-Datei nutzen, um die richtigen Einstellungen zu laden. So stellst du sicher, dass die Konfiguration sowohl in der Web- als auch in der Android-Version konsistent bleibt.