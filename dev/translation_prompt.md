# Übersetzungsanleitung für Musici-App

## Übersicht

Dieses Dokument enthält Anweisungen zur Übersetzung aller noch nicht lokalisierten Strings in der Musici-App. Besonderes Augenmerk liegt auf JavaScript-Strings, die direkt im Code verwendet werden, anstatt über das `$store.strings`-System.

## Prinzipien für die Übersetzung

1. Alle benutzerorientierten Texte sollten in den entsprechenden `strings.xml`-Dateien lokalisiert werden:
   - Englisch: `/var/www/Musici/android/app/src/main/res/values/strings.xml`
   - Deutsch: `/var/www/Musici/android/app/src/main/res/values-de/strings.xml`

2. Beim Hinzufügen neuer Strings:
   - Nur die Default-strings.xml bearbeiten (nicht andere Varianten).
   - Eindeutige, beschreibende Schlüssel verwenden (snake_case).
   - Accessibility-Strings sollten mit `_a11y` enden.

3. Keine Fallbacks im Code implementieren - einzige erlaubte Fallbacks sind die für die strings in der form `this.$store.strings?.key_name || 'Fallback'`

4. nicht Übersetzen

   - Die Dateien im /dev/-Verzeichnis sollen nicht übersetzt werden
   - Shell-Skripte
   - Kommentare
   - nicht erreichbarer code
   - logeinträge
   - texte in code-Fallbacks, da diese nie eintreten sollen

## Bereits abgeschlossene Übersetzungen

1. **Referral-System**: Alle Strings im Zusammenhang mit dem Empfehlungssystem wurden lokalisiert.
2. **UI-Elemente der Pitch-Aktivitäten**: Tooltips, Alt-Texte und Aria-Labels für die Melodie-Challenge und Zeichnen-Funktionalität wurden zu strings.xml hinzugefügt.
3. **Aktivitätsnamen und -typen**: Namen aller Aktivitäten und damit verbundene Bestätigungsdialoge wurden lokalisiert.

## Zu übersetzende JavaScript-Strings

### 1. Alert- und Toast-Nachrichten

Folgende direkten String-Literale in Alert- und Toast-Nachrichten sollten übersetzt werden:

```javascript
"Copied to clipboard!"                                // → "In die Zwischenablage kopiert!"
"Could not copy automatically. Please select and copy the text manually."  // → "Konnte nicht automatisch kopieren. Bitte wähle den Text manuell aus und kopiere ihn."
"Error exporting progress: [dynamic error message]"   // → "Fehler beim Exportieren des Fortschritts: [dynamische Fehlermeldung]"
"Error exporting progress: encoded string is empty"   // → "Fehler beim Exportieren des Fortschritts: Kodierte Zeichenkette ist leer"
"Error importing progress. The provided string may be invalid."  // → "Fehler beim Importieren des Fortschritts. Die angegebene Zeichenkette könnte ungültig sein."
"Failed to copy"                                      // → "Kopieren fehlgeschlagen"
"Failed to copy. Please select and copy the text manually."  // → "Kopieren fehlgeschlagen. Bitte wähle den Text manuell aus und kopiere ihn."
"Invalid save code. Please check your progress string."  // → "Ungültiger Speichercode. Bitte überprüfe deine Fortschrittszeichenkette."
"No data to copy."                                    // → "Keine Daten zum Kopieren."
"Please enter a progress code first!"                 // → "Bitte gib zuerst einen Fortschrittscode ein!"
"Progress has been reset successfully"                // → "Fortschritt wurde erfolgreich zurückgesetzt"
```

### 2. Dynamisch zusammengesetzte Nachrichten

Diese Art von Strings wurde zuvor übersehen und muss ebenfalls übersetzt werden:

```javascript
// Beispiel aus app.js:1288-1289
message += '\n\nUnlocked features:';  // → '\n\nFreigeschaltete Funktionen:'
message += '\n\nNo special features unlocked yet.';  // → '\n\nNoch keine speziellen Funktionen freigeschaltet.'
message += '\n- ' + feature;  // → '\n- ' + feature;  (Strukturbeibehaltung mit übersetztem Label)

// Anderes Beispiel (Progress Import)
let message = `Progress imported successfully for ${this.username}!`;  // → `Fortschritt erfolgreich importiert für ${this.username}!`
```

### 3. Referral-System-Fallbacks

Wenn `$store.strings` nicht verfügbar ist, werden diese Fallback-Strings verwendet:

```javascript
"Invalid referral code format. Please check and try again."  // → "Ungültiges Format des Empfehlungscodes. Bitte überprüfe und versuche es erneut."
"You cannot redeem your own referral code!"  // → "Du kannst deinen eigenen Empfehlungscode nicht einlösen!"
"Friend code redeemed successfully!"  // → "Freundescode erfolgreich eingelöst!"
"Username is required to redeem a code."  // → "Benutzername ist erforderlich, um einen Code einzulösen."
"This username is already taken. Please choose another one."  // → "Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen."
"Failed to create user account. Please try again."  // → "Erstellung des Benutzerkontos fehlgeschlagen. Bitte versuche es erneut."
"A database error occurred. Please try again later."  // → "Ein Datenbankfehler ist aufgetreten. Bitte versuche es später erneut."
"Invalid request parameters."  // → "Ungültige Anfrageparameter."
"This request method is not allowed."  // → "Diese Anfragemethode ist nicht erlaubt."
"An unknown error occurred."  // → "Ein unbekannter Fehler ist aufgetreten."
```

## Vorgehensweise für die Übersetzung

1. **Für JavaScript-Strings**:
   - Erstellen Sie einen neuen String-Eintrag in `/var/www/Musici/android/app/src/main/res/values/strings.xml` (Englisch)
   - Erstellen Sie einen entsprechenden Eintrag in `/var/www/Musici/android/app/src/main/res/values-de/strings.xml` (Deutsch)
   - Ersetzen Sie das hardcodierte Literal im JavaScript-Code durch einen Zugriff auf den Store

2. **Zugriffsmöglichkeiten auf den Translations-Store**:
   - In Alpine.js Komponenten: `this.$store.strings.key_name || 'Fallback'`
   - In eigenständigen JS-Dateien: `window.Alpine?.store('strings')?.key_name || 'Fallback'`

3. **Namenskonvention**:
   - Für Strings: Verwenden Sie snake_case für Schlüsselnamen (z.B. `copied_to_clipboard`)

## Hinweise zur Konsistenz

- Verwenden Sie für angesprochene Benutzer die informelle Anrede ("Du/Dein/Dir" statt "Sie/Ihr/Ihnen").
- Behalten Sie Formatierungen (Markdown, HTML, etc.) aus der Originalsprache bei.
- Achten Sie auf die Länge übersetzter Texte, besonders bei Buttons und Labels mit begrenztem Platz.
- Bei Zweifeln über die Bedeutung eines technischen Begriffs, belassen Sie diesen auf Englisch.

## Nächste Schritte

1. **Systematische Codeprüfung**: Durchsuchen Sie alle JavaScript-Dateien in /src (außer in /src/api/) nach verbliebenen hardcodierten Strings mit einem der folgenden Muster:
   - Direkte isGerman-Prüfungen: `isGerman ? 'Deutscher Text' : 'Englischer Text'`
   - Alert- und Confirm-Aufrufe: `alert('Nachricht')`, `confirm('Bestätigungsfrage')`
   - Toast-Nachrichten: `showToast('Nachricht')`
   - Template-Strings mit dynamischen Inhalten: \`Text ${variable} mehr Text\`

2. **Migration zu strings.xml**: Für jeden gefundenen String:
   - Extrahieren Sie den String mit einem beschreibenden Key in beiden Sprachen
   - Erstellen Sie passende Einträge in den XML-Dateien
   - Refaktorieren Sie den Code, um auf den Store zuzugreifen

3. **Verifizierung**:
   - Testen Sie die App mit `cd /var/www/Musici && npm run build:fast`
   - Stellen Sie sicher, dass keine js fheler auftreten
