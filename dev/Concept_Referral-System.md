# Referral-System 

1. **Serverlose Referral-Codes implementieren**
   - Code-Generierung in der App
   - Lokale Validierung programmieren
   - Ping-Pong-Bestätigungssystem entwickeln

2. **Belohnungsstruktur definieren**
   - Nach 3 erfolgreichen Referrals: Premium-Level freischalten
   - Nach 5 Referrals: Alle zukünftigen Updates kostenlos

## Umsetzung

 index.html erweitern, um unter den Pitches-Punkten einen Button hinzuzufügen, der wie der Chords-Button aussieht, aber mit einem Schloss-Symbol. Wenn der Benutzer darauf klickt, soll sich eine Ansicht öffnen, ähnlich wie bei den Playereinstellungen, wo man einen Referral-Code kopieren kann.

### referral-view

referral-view soll ähnlich aussehen wie die player-settings-view, aber mit einem anderen Layout und anderen Funktionen.

Der username ist ja bisher nur lokal gespeichert, wenn man am referral-system teilnehmen will, muss man erstmal den user auf dem server speichern. dauzu einen button in der referral-view:
- hiinweis, dass man den usernamen dann nicht mehr ändern kann. also soll man den in denn settings erstmal so einstellen, wei man ihn haben will.

1. auf dem server speichern

- in der homepage ist ein `referal.php` script, das den usernamen empfängt per post-request und json zurückgibt

2. im referral view, den json empfangen und anzeigen, dass man den user fixiert hat

- username anzeigen
- referral code, den man aus dem json vom server empfangen hat anzeigen
- Es soll ein Referral-Code generiert werden, der dann in der referral-view angezeigt wird. 
- Es soll ein Button geben, der den Referral-Code kopiert.
- Es soll ein Button geben, der den Referral-Code teilt.

### `referal.php` script 

- den usernamen empfangen und per post-request und json zurückgeben

- die usernamen sollen in einer sqlite db gespeichert werden, und es muss geloggt werden, wieviele user schon den referral code benutzt haben und sich darüber eingeloggt haben.

dabei gibt es 2 schritte: wenn ein user sixh nur auf den link geklickt hat, dann ist er ja noch nciht registriert, das tut er nur, wenn er auch einen referal link generieren will. 
- der empfehlende bekommt einen referral punkt , wenn  mman auf den link klickt
- einen weiteren, wenn man im game auch einen user anlegt

# zu klären:
muss nginx configuriert werden, dass das php script erreichbar ist lokal? oder kann man das mit webpack erreichen?

nginx php-fpm php-sqlite3 ist installiert 

sudo touch /etc/nginx/sites-available/lalumo
sudo ln -s /etc/nginx/sites-available/lalumo /etc/nginx/sites-enabled/lalumo
sudo chown ruben:ruben /etc/nginx/sites-available/lalumo

