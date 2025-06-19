<?php
/**
 * Referral Code API Endpoint für Lalumo
 * 
 * Dieses Skript verarbeitet verschiedene Referral-Code Anfragen:
 * - POST: Erstellt oder holt Referral-Code für einen Benutzernamen
 * - GET mit code parameter: Verfolgt einen Referral-Link-Klick
 * - GET mit username parameter: Liefert Anzahl der Referrals
 * - POST mit redeemCode: Löst einen Freundescode ein
 */

header('Content-Type: application/json');

// CORS-Header werden bereits auf Nginx-Ebene gesetzt

// Bei OPTIONS direkt antworten (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// SQLite-Datenbank einrichten
$dbDir = __DIR__ . '/data';
$dbFile = $dbDir . '/referrals.db';

// Erstelle data-Verzeichnis falls es nicht existiert
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
}

// Datenbank initialisieren
$initDb = !file_exists($dbFile);
$db = new SQLite3($dbFile);

// Tabellen erstellen, falls sie noch nicht existieren
if ($initDb) {
    $db->exec('
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            referral_code TEXT UNIQUE,
            created_at TEXT
        );
        CREATE TABLE referrals (
            id INTEGER PRIMARY KEY,
            referrer_id INTEGER,
            click_count INTEGER DEFAULT 0,
            registration_count INTEGER DEFAULT 0,
            FOREIGN KEY (referrer_id) REFERENCES users(id)
        );
    ');
}

// Request-Methode ermitteln
$method = $_SERVER['REQUEST_METHOD'];

// POST: Username registrieren und Referral-Code zurückgeben
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Prüfen ob Code-Einlösung
    if (isset($data['redeemCode'])) {
        $code = $data['redeemCode'];
        
        // Code-Format prüfen (ohne Bindestriche für Vergleich)
        $code = str_replace('-', '', $code);
        
        // Finde den Referrer anhand des Codes
        $stmt = $db->prepare('SELECT id FROM users WHERE referral_code = :code OR referral_code = :formatted_code');
        $stmt->bindValue(':code', $code, SQLITE3_TEXT);
        $stmt->bindValue(':formatted_code', formatCode($code), SQLITE3_TEXT);
        $result = $stmt->execute();
        $row = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($row) {
            // Registrierungszähler erhöhen
            $referrerId = $row['id'];
            $db->exec("UPDATE referrals SET registration_count = registration_count + 1 WHERE referrer_id = $referrerId");
            
            echo json_encode([
                'success' => true,
                'message' => 'Code successfully redeemed'
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'error' => 'Invalid referral code'
            ]);
        }
        exit;
    }
    
    // Username-Registrierung
    if (!isset($data['username']) || empty($data['username'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username is required']);
        exit;
    }
    
    $username = $data['username'];
    
    // Prüfen, ob der Benutzername bereits existiert
    $stmt = $db->prepare('SELECT referral_code FROM users WHERE username = :username');
    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
    $result = $stmt->execute();
    $existingUser = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($existingUser) {
        // Gib den vorhandenen Referral-Code zurück
        echo json_encode([
            'success' => true,
            'username' => $username,
            'referralCode' => $existingUser['referral_code'],
            'message' => 'Existing referral code retrieved'
        ]);
        exit;
    }
    
    // Erzeuge einen eindeutigen Referral-Code
    $referralCode = generateReferralCode($username);
    
    // In Datenbank speichern (formatierte Version)
    $stmt = $db->prepare('INSERT INTO users (username, referral_code, created_at) VALUES (:username, :referralCode, :timestamp)');
    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
    $stmt->bindValue(':referralCode', $referralCode, SQLITE3_TEXT);
    $stmt->bindValue(':timestamp', date('Y-m-d H:i:s'), SQLITE3_TEXT);
    $result = $stmt->execute();
    
    // Falls erfolgreich, erstelle Referrals-Eintrag
    if ($result) {
        $userId = $db->lastInsertRowID();
        $db->exec("INSERT INTO referrals (referrer_id, click_count, registration_count) VALUES ($userId, 0, 0)");
        
        echo json_encode([
            'success' => true,
            'username' => $username,
            'referralCode' => $referralCode,
            'message' => 'Referral code generated successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to create user'
        ]);
    }
}
// GET: Referral-Link-Klick oder Statistiken abrufen
elseif ($method === 'GET') {
    // Referral-Link-Klick verarbeiten
    if (isset($_GET['code'])) {
        $code = $_GET['code'];
        
        // Code-Format normalisieren (mit und ohne Bindestriche berücksichtigen)
        $plainCode = str_replace('-', '', $code);
        
        // Finde den Referrer anhand des Codes
        $stmt = $db->prepare('SELECT id FROM users WHERE referral_code = :code OR referral_code = :formatted_code');
        $stmt->bindValue(':code', $plainCode, SQLITE3_TEXT);
        $stmt->bindValue(':formatted_code', formatCode($plainCode), SQLITE3_TEXT);
        $result = $stmt->execute();
        $row = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($row) {
            // Klickzähler erhöhen
            $referrerId = $row['id'];
            $db->exec("UPDATE referrals SET click_count = click_count + 1 WHERE referrer_id = $referrerId");
            
            // Leite zur App mit dem Code in einem URL-Parameter weiter
            header('Location: /?ref=' . urlencode($code));
            exit;
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Invalid referral code']);
            exit;
        }
    }
    // Statistiken für einen Benutzer abrufen
    elseif (isset($_GET['username'])) {
        $username = $_GET['username'];
        
        try {
            // Zuerst prüfen, ob der Benutzer existiert
            $userStmt = $db->prepare('SELECT id FROM users WHERE username = :username');
            $userStmt->bindValue(':username', $username, SQLITE3_TEXT);
            $userResult = $userStmt->execute();
            $userRow = $userResult->fetchArray(SQLITE3_ASSOC);
            
            if ($userRow) {
                // Benutzer existiert, referral Daten abrufen
                $userId = $userRow['id'];
                
                // Referral-Daten abrufen, wenn vorhanden
                $refStmt = $db->prepare('SELECT click_count, registration_count FROM referrals WHERE referrer_id = :id');
                $refStmt->bindValue(':id', $userId, SQLITE3_INTEGER);
                $refResult = $refStmt->execute();
                $refRow = $refResult->fetchArray(SQLITE3_ASSOC);
                
                if ($refRow) {
                    // Referral-Eintrag gefunden
                    echo json_encode([
                        'success' => true,
                        'clickCount' => $refRow['click_count'],
                        'registrationCount' => $refRow['registration_count']
                    ]);
                } else {
                    // Benutzer existiert, aber keine Referral-Daten gefunden
                    // Erstelle einen Referral-Eintrag für den Benutzer
                    $db->exec("INSERT INTO referrals (referrer_id, click_count, registration_count) VALUES ($userId, 0, 0)");
                    
                    echo json_encode([
                        'success' => true,
                        'clickCount' => 0,
                        'registrationCount' => 0
                    ]);
                }
            } else {
                // Benutzer nicht gefunden
                echo json_encode([
                    'success' => false,
                    'clickCount' => 0,
                    'registrationCount' => 0
                ]);
            }
        } catch (Exception $e) {
            // Fehlerbehandlung: Bei einem Fehler geben wir eine hilfreiche Fehlermeldung zurück
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database error: ' . $e->getMessage(),
                'clickCount' => 0,
                'registrationCount' => 0
            ]);
        }
        exit;
    }
    // Ungültiger GET-Parameter
    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid GET parameters']);
        exit;
    }
}
// Methode nicht erlaubt
else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

/**
 * Erzeuge einen eindeutigen Referral-Code basierend auf dem Benutzernamen
 */
function generateReferralCode($username) {
    // Erstelle eine Basis für den Referral-Code
    $base = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $username), 0, 4));
    
    // Ergänze eine Zeitstempel-Komponente
    $timestamp = substr(time(), -4);
    
    // Ergänze eine zufällige Komponente
    $random = strtoupper(substr(md5(uniqid()), 0, 4));
    
    // Kombiniere sie zu einem 12-stelligen Code und formatiere
    $code = $base . $timestamp . $random;
    $code = str_pad($code, 12, '0');
    
    // Mit Bindestrichen formatieren für bessere Lesbarkeit
    return formatCode($code);
}

/**
 * Formatiere einen 12-stelligen Code mit Bindestrichen
 */
function formatCode($code) {
    $code = str_pad(substr($code, 0, 12), 12, '0');
    return substr($code, 0, 4) . '-' . substr($code, 4, 4) . '-' . substr($code, 8, 4);
}
?>
