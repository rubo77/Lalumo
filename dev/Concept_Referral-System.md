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
   - [ ] man darf seinen eigenen redeem code nicht redeemen
   - [x] für die link clicks muss angezeigt werden, wie der link ist zum teilen

2. **Backend (referral.php)**:
   - [x] Empfängt Benutzername via POST-Request
   - [x] Generiert eindeutigen Referral-Code mittels `generateReferralCode()`
   - [x] Speichert Benutzer in der `users`-Tabelle der SQLite-Datenbank
   - Sendet JSON-Antwort mit generiertem Referral-Code zurück
   # TODO:
   - [x] passwort zum user beim anlegen eines neuen users generieren (falls keins im post request), und in der db speichern und mit in der json antwort schicken
   - [x] wenn änderungen an der datenbank nötig sind, dann nur mit migration in ensureDatabaseStructure()

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
    `password` TEXT, -- Passwort für die Benutzeranmeldung
    referral_code TEXT UNIQUE,
    referred_by TEXT, -- Code des Referrers, der diesen User eingeladen hat
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabelle: `referrals`
```sql
CREATE TABLE referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER, -- ID des Einladenden
    referrer_code TEXT,
    click_count INTEGER DEFAULT 0,
    registration_count INTEGER DEFAULT 0,
    referral_type TEXT, -- "click" oder "registration"
    visitor_ip TEXT, -- Anonymisierter Hash der Besucher-IP
    visitor_agent TEXT, -- Grundlegende Geräteinformationen (nicht vollständig)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_code) REFERENCES users(referral_code),
    FOREIGN KEY (referrer_id) REFERENCES users(id)
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

## Sonstige Funktionen

- Automatisches Schließen des Hamburger-Menüs beim Öffnen der Referral-Ansicht
- Automatisches Laden der Referral-Statistiken beim App-Start
- End-to-End-Tests mit Playwright für die gesamte Referral-Funktionalität

## Deployment

Die PHP-Dateien (`referral.php`, `admin.php`) und die Datenbankdatei müssen auf den Server hochgeladen werden. Dies ist in der `deploy.sh` konfiguriert.

# TODO:

- [ ] admin mode:
 - [ ] delete referral button
 - [ ] referral js popup geht nicht, da steht nur "Array"
 - [ ] save sortable flag in session

- [x] teste selbst mit wegt http://localhost:9091/admin.php und mache node test und erstelle einen unittest um das alles zu testen und zu korrigieren. schau dir die bestehen den playwright tests an und baue einen  timeout von 10 s ein damit die seitenn nicht hängen bleiben

- die datenbank soll gegen sql-attacks sicher sein, SQL inject verhindern.

- wenn der username gelockt ist, dan darf der nicht mehr editierbar sein im player settings (grep "' => " referral.php )
- testen, das ist schon implementiert , aber ungetestet: 
   - wenn in der localStorage der username gelockt ist, aber auf dem server gelöscht, dann muss der wieder entlockt werden und die localStorage aktualisiert werden


----

ergänze im konzept die häkchen bei den punkten die schon erledigt sind uund ergänue [ ] häkchen, was noch nciht erledigt ist. passe das konzept ggf an, so dass es einer dokumentation wird, wie das referral system funktioniert.

dann mach weiter im plan