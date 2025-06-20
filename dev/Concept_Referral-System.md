# Lalumo Referral-System - Technische Dokumentation

## Überblick

Das Lalumo Referral-System ermöglicht es Benutzern, ihre Freunde zur App einzuladen und dafür Belohnungen zu erhalten. Die Implementierung umfasst Frontend-Komponenten in der Web-App (Alpine.js) und Backend-Services (PHP/SQLite).

## Belohnungsstruktur

- Nach 3 erfolgreichen Referrals: Premium-Level wird freigeschaltet
- Nach 5 Referrals: Alle zukünftigen Updates kostenlos

## Datenfluss

### 1. Benutzerregistrierung

1. **Frontend (app.js)**:
   - Benutzer klickt auf "Register" in der referral-view
   - `lockUsername()`-Funktion sendet POST-Request an `/referral.php` mit dem Benutzernamen
   - Frontend speichert Antwort in Alpine-State und localStorage
   - [x] Hinweis, dass beim erstellen des codes der username gelockt wird
   # TODO:
   - [ ] visuelles feedback der antwort: 
     - [ ] erfolg: das neue passwort des users anzeigen
     - [ ] error: 
       - [ ] user existiert schon: nach passwort fragen oder hinweis, dass man sich einen anderen usernamen wählen muss
       - [ ] sonstige errormeldung anzeigen
   - [ ] man darf sienen eigenen redeem code nicht redeemen
   - [ ] für die link clicks muss angezeigt werden, wie der link ist zum teilen
   - [ ] 
       

2. **Backend (referral.php)**:
   - [x] Empfängt Benutzername via POST-Request
   - [x] Generiert eindeutigen Referral-Code mittels `generateReferralCode()`
   - [x] Speichert Benutzer in der `users`-Tabelle der SQLite-Datenbank
   - Sendet JSON-Antwort mit generiertem Referral-Code zurück
   # TODO:
   - [x] checken ob der username schon existiert, wenn ja, errormeldung
   - [x] passwort zum user beim anlegen eines neuen users generieren (falls keins im post request), und in der db speichern und mit in der json antwort schicken
   - [ ] wenn änderungen an der datenbank nötig sind, dann nur mit migration

### 2. Referral-Link-Tracking

1. **Frontend**:
   - Referral-Links haben das Format: `index.html?ref=CODE`
   - Beim Laden der App prüft `loadUserData()`, ob ein Referral-Parameter vorhanden ist
   - Wenn ja, sendet GET-Request an `/referral.php?code=CODE`

2. **Backend (referral.php)**:
   - Empfängt Referral-Code via GET-Parameter
   - Erhöht Klick-Zähler in der `referrals`-Tabelle
   - Sendet JSON-Antwort mit Erfolgsbestätigung zurück

### 3. Einlösen eines Referral-Codes

1. **Frontend**:
   - [x] Benutzer gibt Referral-Code im Eingabefeld ein
   - [x] `redeemFriendCode()`-Funktion sendet POST-Request an `/referral.php`
   - [x] Bei Erfolg wird das UI aktualisiert und der Status im localStorage gespeichert
   - [x] visuelles feedback der antwort: erfolg/error, als js alert
   # TODO:
   - [x] Hinweis, dass beim einlösen des codes der codes der username gelockt wird

2. **Backend (referral.php)**:
   - Empfängt Einlösungs-Request via POST mit `redeemCode`-Parameter
   - Validiert Code gegen die Datenbank
   - Erhöht Registrierungszähler, wenn der Code gültig ist
   - Sendet JSON-Antwort mit Erfolgs- oder Fehlermeldung zurück
   # TODO:
   - [ ] checken auf doppeltes einlösen eines codes vom selben user

### 4. Statistik-Abfrage

1. **Frontend**:
   - Beim App-Start ruft `loadUserData()` die Funktion `fetchReferralCount()` auf
   - Diese sendet GET-Request an `/referral.php` mit Benutzernamen
   - Alpine-State und localStorage werden mit aktuellen Werten aktualisiert

2. **Backend (referral.php)**:
   - Empfängt Statistik-Request via GET mit `username`-Parameter
   - Fragt Klick- und Registrierungszahlen aus der Datenbank ab
   - Sendet JSON-Antwort mit den Zählern zurück

## Datenbankstruktur

### SQLite-Datenbank: `/data/referrals.db`

#### Tabelle: `users`
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    referral_code TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabelle: `referrals`
```sql
CREATE TABLE referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_code TEXT,
    referral_type TEXT, -- "click" oder "registration"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_code) REFERENCES users(referral_code)
);
```

## Referral-Code-Generierung

Der Referral-Code wird basierend auf dem Benutzernamen generiert und folgt diesem Format:
- Erste 4 Zeichen: Abgeleitete Buchstaben vom Benutzernamen (in Großbuchstaben)
- 4 zufällige Ziffern
- 4 zufällige hexadezimale Zeichen
- Format: `XXXX-YYYY-ZZZZ` (mit Bindestrichen für bessere Lesbarkeit)

## Frontend-Persistenz

Folgende Daten werden im localStorage gespeichert:
- `username`: Der registrierte Benutzername
- `isRegistered`: Boolean-Flag, ob der Benutzer registriert ist
- `referralCode`: Der generierte Referral-Code des Benutzers
- `referralClickCount`: Anzahl der Klicks auf den Referral-Link des Benutzers
- `referralRegCount`: Anzahl der erfolgreichen Registrierungen durch den Referral-Link
- `isUnlocked`: Boolean-Flag, ob Premium-Features freigeschaltet sind

## Admin-Dashboard

Ein passwortgeschütztes Admin-Dashboard ist unter `/admin.php` verfügbar:
- Zeigt alle registrierten Benutzer und deren Statistiken
- Bietet zusammengefasste Statistiken (Gesamtbenutzer, Klicks, Registrierungen)
- Unterstützt HTML- und JSON-Format (für API-Zugriff)
# TODO
- [ ] löschen einzelner user

## Sonstige Funktionen

- Automatisches Schließen des Hamburger-Menüs beim Öffnen der Referral-Ansicht
- Automatisches Laden der Referral-Statistiken beim App-Start
- End-to-End-Tests mit Playwright für die gesamte Referral-Funktionalität

## Deployment

Die PHP-Dateien (`referral.php`, `admin.php`) und die Datenbankdatei müssen auf den Server hochgeladen werden. Dies ist in der `deploy.sh` konfiguriert.

# TODO:

- [x] es muss in der localstorage gespeichert werden, dass man schon registriert ist.

- [x] wenn man registriert ist, muss beim aufruf der seite gecheckt werden, wieviele referrals man schon hat in der db


dabei gibt es 2 schritte: wenn ein user sixh nur auf den link geklickt hat, dann ist er ja noch nciht registriert, das tut er nur, wenn er auch einen referal link generieren will. 
- [x] der empfehlende bekommt einen referral punkt , wenn  mman auf den link klickt
- [x] einen weiteren, wenn man im game auch einen user anlegt



- [x] wenn man referral drückt, dann soll das hamburger menu sich schliessen

- [x] ich brauche einen admin mode, in dem ich sehen kann, welche user registriert sin d in der db und wieviele referrer punkte sie schon haben

- [x] teste selbst mit wegt http://localhost:9091/admin.php und mache node test und erstelle einen unittest um das alles zu testen und zu korrigieren. schau dir die bestehen den playwright tests an und baue einen  timeout von 10 s ein damit die seitenn nicht hängen bleiben

- [ ] wie soll das online laufen? die php files müssen dort ja auch gesynct werden in `deploy.sh`
- [ ] die db muss online sicher auch noch angelegt werden
- [ ] wenn man geworben wurde, durch einen link, dann soll das in den player settings sichtbar sein, durch wen, oder falls der username nicht bekannt ist, wenigstens, dass man durch einen referral link ddie seite besucht hat. (beachte dabei, db aenderungen nur mit migration)
- die datenbank soll gegen sql-attacks sicher sein
- das passwort muss in einer konfiguration gespeichert werden, die nicht im git repo liegt. am besten in einer globalen config, die nicht im git liegt, environment oder so

- Es darf im json reply keine sprache übergeben werden, sondern codifizierte sprache, damit diese in der app beim empfangen der antwort in die eingestellte sprache umgewandelt werden kann.


ergänze im konzept die häkchen bei den punkten die schon erledigt sind uund ergänue [ ] häkchen, was noch nciht erledigt ist. passe das konzept ggf an, so dass es einer dokumentation wird, wie das referral system funktioniert.

dann mach weiter im plan