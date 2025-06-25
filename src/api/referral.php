<?php
// Fehlerausgabe aktivieren für Debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Referral Code API Endpoint für Lalumo
 * 
 * Dieses Skript verarbeitet verschiedene Referral-Code Anfragen:
 * - POST: Erstellt oder holt Referral-Code für einen Benutzernamen
 * - GET mit code parameter: Verfolgt einen Referral-Link-Klick
 * - GET mit username parameter: Liefert Anzahl der Referrals
 * - POST mit redeemCode: Löst einen Freundescode ein
 */

require_once 'utils/common.php'; // für debugging-Funktionen


// Import JS Config laden
require_once 'utils/js_config.php';
$config = getJsConfig(__DIR__ . '/../config.js');
debugLog('Config loaded from primary path: ' . __DIR__ . '/config.js');

// Wenn die Konfiguration nicht geladen werden kann, versuche einen alternativen Pfad
if (empty($config) || !isset($config['API_BASE_URL'])) {
    debugLog('Config not found at primary path, trying fallback path');
    $config = getJsConfig(__DIR__ . '/config.js');
    debugLog('Config loaded from fallback path: ' . __DIR__ . '/config.js');
}
// Wenn die Konfiguration nicht geladen werden kann, versuche einen alternativen Pfad
if (empty($config) || !isset($config['API_BASE_URL'])) {
    debugLog('Config not found at primary path, trying fallback path');
    $config = getJsConfig(__DIR__ . '/../app/config.js');
    debugLog('Config loaded from fallback path: ' . __DIR__ . '/../config.js');
}

// Debugging: Konfiguration protokollieren
debugLog('Config loaded: ' . json_encode($config));
debugLog('Request from: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'unknown'));

// CORS-Header Logik für verschiedene Umgebungen
debugLog('Evaluating CORS headers for request');

// Ermittle Origin aus den Headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
debugLog('Request Origin: ' . $origin);

// Erkenne Server-Umgebung
$is_production = preg_match('/lalumo\.eu|lalumo\.z11\.de/', $_SERVER['HTTP_HOST'] ?? '');
$is_local_dev = preg_match('/localhost|127\.0\.0\.1/', $_SERVER['HTTP_HOST'] ?? '');
$is_mobile_app = preg_match('/capacitor:\/\/localhost|https:\/\/localhost/', $origin);

debugLog("Environment detection: Production=$is_production, LocalDev=$is_local_dev, MobileApp=$is_mobile_app");

// CORS-Header-Strategie basierend auf der Umgebung
if ($is_mobile_app) {
    // Mobile App braucht spezifische CORS-Header
    debugLog('Setting CORS headers for mobile app origin: ' . $origin);
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
} else if ($is_local_dev) {
    // Lokale Entwicklung - keine CORS-Header setzen
} else {
    // Für Produktion keine CORS-Header hier setzen (überlassen wir Nginx)
    debugLog('In production environment - letting Nginx handle CORS headers');
}

// Content-Type setzen
header('Content-Type: application/json');

// Bei OPTIONS direkt antworten (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// SQLite-Datenbank einrichten
$dbDir = '../data';
// if __DIR__ starts with /var/www/ it is local
if(preg_match('/^\/var\/www/', __DIR__)){
    $dbDir = __DIR__ . '/../../data';
}
$dbFile = $dbDir . '/referrals.db';
debugLog('Database path: ' . $dbFile);

// Erstelle data-Verzeichnis falls es nicht existiert
if (!is_dir($dbDir)) {
    debugLog('Database folder created: ' . $dbFile);
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
            password TEXT,
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

/**
 * Generiert ein zufälliges Passwort mit der angegebenen Länge
 * @param int $length Länge des Passworts
 * @return string Das generierte Passwort
 */
function generateRandomPassword($length = 8) {
    $chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 1, l, 0, O zur besseren Lesbarkeit
    $password = '';
    
    for ($i = 0; $i < $length; $i++) {
        $password .= $chars[mt_rand(0, strlen($chars) - 1)];
    }
    
    return $password;
}

// POST: Username registrieren und Referral-Code zurückgeben
if ($method === 'POST') { // aus _REQUEST
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Prüfen ob Code-Einlösung
    if (isset($data['redeemCode']) && isset($data['username'])) {
        $code = $data['redeemCode'];
        $username = $data['username'];
        
        // Code-Format prüfen (ohne Bindestriche für Vergleich)
        $code = str_replace('-', '', $code);
        
        // Prüfe, ob der Benutzer versucht, seinen eigenen Code einzulösen
        $stmtOwn = $db->prepare('SELECT referral_code FROM users WHERE username = :username');
        $stmtOwn->bindValue(':username', $username, SQLITE3_TEXT);
        $resultOwn = $stmtOwn->execute();
        $userRow = $resultOwn->fetchArray(SQLITE3_ASSOC);
        
        if ($userRow && (str_replace('-', '', $userRow['referral_code']) === $code || $userRow['referral_code'] === $code)) {
            http_response_code(403); // Forbidden
            echo json_encode([
                'success' => false,
                'error' => 'you_cannot_redeem_your_own_referral_code'
            ]);
            exit;
        }
        
        // Finde den Referrer anhand des Codes
        $stmt = $db->prepare('SELECT id FROM users WHERE referral_code = :code OR referral_code = :formatted_code');
        $stmt->bindValue(':code', $code, SQLITE3_TEXT);
        $stmt->bindValue(':formatted_code', formatCode($code), SQLITE3_TEXT);
        $result = $stmt->execute();
        $row = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($row) {
            // Registrierungszähler erhöhen
            $referrerId = $row['id'];
            debugLog("REFERRAL_INCREMENT: Incrementing registration_count for referrer ID: {$referrerId} (Code redemption)");
            $db->exec("UPDATE referrals SET registration_count = registration_count + 1 WHERE referrer_id = $referrerId");
            
            // Überprüfen, ob die Aktualisierung erfolgreich war
            $checkStmt = $db->prepare('SELECT registration_count FROM referrals WHERE referrer_id = :referrer_id');
            $checkStmt->bindValue(':referrer_id', $referrerId, SQLITE3_INTEGER);
            $checkResult = $checkStmt->execute();
            $checkRow = $checkResult->fetchArray(SQLITE3_ASSOC);
            debugLog("REFERRAL_INCREMENT: After update, registration_count is now: " . ($checkRow ? $checkRow['registration_count'] : 'no row found'));
            
            
            // Senden Sie einen Statuscode, ob die Erhöhung der registration_count erfolgreich war
            $registrationIncremented = false;
            if ($checkRow && $checkRow['registration_count'] > 0) {
                $registrationIncremented = true;
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'code_successfully_redeemed',
                'registrationIncremented' => $registrationIncremented,
                'currentRegistrationCount' => $checkRow ? $checkRow['registration_count'] : 0
            ]);
            debugLog("REFERRAL_API: Code redemption response includes registrationIncremented: {$registrationIncremented}");
        } else {
            http_response_code(400);
            echo json_encode([
                'error' => 'invalid_referral_code'
            ]);
        }
        exit;
    }
    
    // Username-Registrierung
    if (!isset($data['username']) || empty($data['username'])) {
        http_response_code(400);
        echo json_encode(['error' => 'username_required']);
        exit;
    }
    
    $username = $data['username'];
    
    // Prüfen, ob der Benutzername bereits existiert
    $stmt = $db->prepare('SELECT referral_code FROM users WHERE username = :username');
    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
    $result = $stmt->execute();
    $existingUser = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($existingUser) {
        // Benutzername existiert bereits
        http_response_code(409); // Conflict
        echo json_encode([
            'success' => false,
            'error' => 'username_exists'
        ]);
        exit;
    }
    
    // Neuen Referral-Code generieren
    $referralCode = generateReferralCode($username);
    
    // Generiere ein zufälliges Passwort für den Benutzer
    $password = generateRandomPassword(8);
    
    // Prüfen, ob ein Referral-Code mitgeliefert wurde
    $referredBy = isset($data['referredBy']) ? $data['referredBy'] : null;
    $referrerId = null;
    
    if ($referredBy) {
        // Code-Format normalisieren (mit und ohne Bindestriche berücksichtigen)
        $plainReferredBy = str_replace('-', '', $referredBy);
        
        // Finde den Referrer anhand des Codes
        $refStmt = $db->prepare('SELECT id FROM users WHERE referral_code = :code OR referral_code = :formatted_code');
        $refStmt->bindValue(':code', $plainReferredBy, SQLITE3_TEXT);
        $refStmt->bindValue(':formatted_code', formatCode($plainReferredBy), SQLITE3_TEXT);
        $refResult = $refStmt->execute();
        $refRow = $refResult->fetchArray(SQLITE3_ASSOC);
        
        if ($refRow) {
            $referrerId = $refRow['id'];
            debugLog("Found referrer with ID $referrerId for code $referredBy");
        }
    }
    
    // In die Datenbank einfügen
    $stmt = $db->prepare('INSERT INTO users (username, referral_code, password, created_at) VALUES (:username, :code, :password, datetime("now"))');
    $stmt->bindValue(':username', $username, SQLITE3_TEXT);
    $stmt->bindValue(':code', $referralCode, SQLITE3_TEXT);
    $stmt->bindValue(':password', $password, SQLITE3_TEXT);
    
    try {
        // Debug-Ausgabe für die SQL-Abfrage
        error_log("SQL statement being executed: INSERT INTO users (username, referral_code, password, created_at)");
        error_log("Username: {$username}, Code: {$referralCode}, Password: {$password}");
        
        $result = $stmt->execute();
        
        if ($result) {
            // Referral-Eintrag erstellen
            $userId = $db->lastInsertRowID();
            debugLog("User created with ID: {$userId}");
            
            // Erstelle einen passenden Eintrag in der referrals Tabelle
            $referralStmt = $db->prepare('INSERT INTO referrals (referrer_id, click_count, registration_count, created_at) VALUES (:referrer_id, 0, 0, datetime("now"))');
            $referralStmt->bindValue(':referrer_id', $userId, SQLITE3_INTEGER);
            $referralStmt->execute();
            
            debugLog("REFERRAL_TIMESTAMP: Created referrals entry with timestamp for user ID: {$userId}");
            
            // Debug-Ausgabe
            debugLog("Created matching referrals entry for user ID: {$userId}");
            
            // Wenn es einen Referrer gibt, stelle sicher dass ein Eintrag existiert und erhöhe dessen Registrierungszähler
            if ($referrerId) {
                debugLog("REFERRAL_INCREMENT: Processing referrer ID: {$referrerId} (Username registration)");
                
                // Prüfe ob der Referrer bereits einen Eintrag in der referrals Tabelle hat
                $checkExistsStmt = $db->prepare('SELECT id FROM referrals WHERE referrer_id = :referrer_id');
                $checkExistsStmt->bindValue(':referrer_id', $referrerId, SQLITE3_INTEGER);
                $checkExistsResult = $checkExistsStmt->execute();
                $referralEntryExists = $checkExistsResult->fetchArray(SQLITE3_ASSOC);
                
                if (!$referralEntryExists) {
                    // Erstelle einen Eintrag für den Referrer, wenn keiner existiert
                    debugLog("REFERRAL_INCREMENT: Creating new referrals entry for referrer ID: {$referrerId}");
                    $db->exec("INSERT INTO referrals (referrer_id, click_count, registration_count, created_at) VALUES ($referrerId, 0, 0, datetime('now'))");
                    debugLog("REFERRAL_TIMESTAMP: Added created_at timestamp for referrer ID: {$referrerId}");
                }
                
                // Jetzt können wir den Zähler sicher erhöhen
                debugLog("REFERRAL_INCREMENT: Incrementing registration count for referrer ID: {$referrerId}");
                $db->exec("UPDATE referrals SET registration_count = registration_count + 1 WHERE referrer_id = $referrerId");
                
                // Überprüfen, ob die Aktualisierung erfolgreich war
                $checkStmt = $db->prepare('SELECT registration_count FROM referrals WHERE referrer_id = :referrer_id');
                $checkStmt->bindValue(':referrer_id', $referrerId, SQLITE3_INTEGER);
                $checkResult = $checkStmt->execute();
                $checkRow = $checkResult->fetchArray(SQLITE3_ASSOC);
                debugLog("REFERRAL_INCREMENT: After update during registration, count is now: " . ($checkRow ? $checkRow['registration_count'] : 'no row found'));
            }else{
                $checkRow = null;
            }
            
            // Status der registration_count Erhöhung bestimmen
            $registrationIncremented = false;
            if ($referrerId && $checkRow && $checkRow['registration_count'] > 0) {
                $registrationIncremented = true;
            }
            
            // Erfolgreiche Rückmeldung
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'referralCode' => formatCode($referralCode),
                'password' => $password,
                'referrerFound' => !empty($referrerId),
                'registrationIncremented' => $registrationIncremented,
                'currentReferrerCount' => ($checkRow ? $checkRow['registration_count'] : 0)
            ]);
            
            debugLog("REFERRAL_API: Username registration response includes registrationIncremented: {$registrationIncremented}");
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'user_creation_failed'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'database_error: ' . $e->getMessage()
        ]);
    }
}
// GET: Referral-Link-Klick oder Statistiken abrufen
elseif ($method === 'GET') {
    // Username für einen Referral-Code abrufen
    if (isset($_REQUEST['code']) && isset($_REQUEST['action']) && $_REQUEST['action'] === 'username') {
        $code = $_REQUEST['code'];
        $username = getUsernameByReferralcode($db, $code);
        
        if ($username) {
            echo json_encode([
                'success' => true,
                'username' => $username
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'referral_code_not_found'
            ]);
        }
        exit;
    }
    // Username fixieren und Referral-Code generieren (ursprünglich POST-Request)
    elseif (isset($_REQUEST['action']) && $_REQUEST['action'] === 'lockUsername' && isset($_REQUEST['username'])) {
        debugLog("GET lockUsername Anfrage für Username: {$_REQUEST['username']}");
        
        $username = $_REQUEST['username'];
        $referredBy = isset($_REQUEST['referredBy']) && $_REQUEST['referredBy'] ? $_REQUEST['referredBy'] : null;
        
        // Prüfen, ob der Benutzername bereits existiert
        $stmt = $db->prepare('SELECT id FROM users WHERE username = :username');
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        if ($result->fetchArray(SQLITE3_ASSOC)) {
            http_response_code(409); // Conflict
            echo json_encode([
                'success' => false,
                'error' => 'username_exists'
            ]);
            exit;
        }
        
        // Referral-Code generieren (oder wiederbenutzen)
        $referralCode = generateReferralCode($username);
        
        // Passwort generieren
        $password = generateRandomPassword();
        
        // WICHTIG: Benutzer in der Datenbank erstellen
        debugLog("REGISTER_USER: Füge neuen Benutzer in die Datenbank ein: {$username}");
        
        // Standard-SQL mit referred_by Spalte (diese muss in der DB existieren)
        $insertUserStmt = $db->prepare('INSERT INTO users (username, password, referral_code, referred_by) VALUES (:username, :password, :referral_code, :referred_by)');
        $insertUserStmt->bindValue(':username', $username, SQLITE3_TEXT);
        $insertUserStmt->bindValue(':password', $password, SQLITE3_TEXT);
        $insertUserStmt->bindValue(':referral_code', $referralCode, SQLITE3_TEXT);
        $insertUserStmt->bindValue(':referred_by', $referredBy, $referredBy ? SQLITE3_TEXT : SQLITE3_NULL);
        
        $insertResult = $insertUserStmt->execute();
        if (!$insertResult) {
            debugLog("REGISTER_USER_ERROR: Fehler beim Erstellen des Nutzers: " . $db->lastErrorMsg());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'database_error',
                'message' => 'Could not create user'
            ]);
            exit;
        }
        
        $userId = $db->lastInsertRowID();
        debugLog("REGISTER_USER: Benutzer erfolgreich erstellt mit ID: {$userId}");
        
        // Referrer ID ermitteln, wenn referredBy gesetzt ist
        $referrerId = null;
        if ($referredBy) {
            debugLog("Suche Referrer für Code: {$referredBy}");
            $plainCode = str_replace('-', '', $referredBy);
            
            $refStmt = $db->prepare('SELECT id FROM users WHERE referral_code = :code OR referral_code = :formatted_code');
            $refStmt->bindValue(':code', $plainCode, SQLITE3_TEXT);
            $refStmt->bindValue(':formatted_code', formatCode($plainCode), SQLITE3_TEXT);
            $refResult = $refStmt->execute();
            $refRow = $refResult->fetchArray(SQLITE3_ASSOC);
            
            if ($refRow) {
                $referrerId = $refRow['id'];
                debugLog("Found referrer with ID $referrerId for code $referredBy");
                
                // Prüfen ob eine Referral-Zeile existiert, falls nicht, anlegen
                $checkReferralStmt = $db->prepare('SELECT id FROM referrals WHERE referrer_id = :referrer_id');
                $checkReferralStmt->bindValue(':referrer_id', $referrerId, SQLITE3_INTEGER);
                $checkResult = $checkReferralStmt->execute();
                if (!$checkResult->fetchArray(SQLITE3_ASSOC)) {
                    debugLog("REFERRAL_INCREMENT: Erstelle fehlenden Referral-Eintrag für Referrer ID: {$referrerId}");
                    $db->exec("INSERT INTO referrals (referrer_id, click_count, registration_count) VALUES ({$referrerId}, 0, 0)");
                }
                
                // Erhöhe registration_count für den Referrer
                debugLog("REFERRAL_INCREMENT: Incrementing registration_count for referrer ID: {$referrerId} (Code registration via GET)");
                $db->exec("UPDATE referrals SET registration_count = registration_count + 1 WHERE referrer_id = $referrerId");
                
                // Überprüfen, ob die Aktualisierung erfolgreich war
                $checkStmt = $db->prepare('SELECT registration_count FROM referrals WHERE referrer_id = :referrer_id');
                $checkStmt->bindValue(':referrer_id', $referrerId, SQLITE3_INTEGER);
                $checkResult = $checkStmt->execute();
                $checkRow = $checkResult->fetchArray(SQLITE3_ASSOC);
                debugLog("REFERRAL_INCREMENT: After update, registration_count is now: " . ($checkRow ? $checkRow['registration_count'] : 'no row found'));
            }
        }
        
        // Status der Aktualisierung ermitteln
        $registrationIncremented = false;
        $currentRegistrationCount = 0;
        if ($referrerId) {
            $countStmt = $db->prepare('SELECT registration_count FROM referrals WHERE referrer_id = :referrer_id');
            $countStmt->bindValue(':referrer_id', $referrerId, SQLITE3_INTEGER);
            $countResult = $countStmt->execute();
            $countRow = $countResult->fetchArray(SQLITE3_ASSOC);
            
            if ($countRow && $countRow['registration_count'] > 0) {
                $registrationIncremented = true;
                $currentRegistrationCount = $countRow['registration_count'];
            }
        }
        
        // Erstelle Referral-Eintrag für den neuen Benutzer
        $db->exec("INSERT INTO referrals (referrer_id, click_count, registration_count) VALUES ($userId, 0, 0)");
        debugLog("REGISTER_USER: Referral-Eintrag für neuen Benutzer erstellt: {$userId}");
        
        // Erfolgreiche Rückmeldung
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'referralCode' => formatCode($referralCode),
            'password' => $password,
            'referrerFound' => !empty($referrerId),
            'registrationIncremented' => $registrationIncremented,
            'currentRegistrationCount' => $currentRegistrationCount,
            'userId' => $userId
        ]);
        
        debugLog("Username {$username} erfolgreich fixiert und Referral-Code generiert via GET");
        exit;
    }
    // Referral-Link-Klick verarbeiten
    elseif (isset($_REQUEST['code'])) {
        $code = $_REQUEST['code'];
        
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
            $app_url = $config['APP_BASE_URL'];
            header ('Location: '.$app_url.'/#ref=' . urlencode($code));
            exit;
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'invalid_referral_code']);
            exit;
        }
    }
    // Statistiken für einen Benutzer abrufen
    elseif (isset($_REQUEST['username'])) {
        $username = $_REQUEST['username'];
        
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
                debugLog("REFERRAL_STATS: Fetching stats for user ID: {$userId} (username: {$username})");
                $refStmt = $db->prepare('SELECT click_count, registration_count FROM referrals WHERE referrer_id = :id');
                $refStmt->bindValue(':id', $userId, SQLITE3_INTEGER);
                $refResult = $refStmt->execute();
                $refRow = $refResult->fetchArray(SQLITE3_ASSOC);
                
                if ($refRow) {
                    debugLog("REFERRAL_STATS: Found data - click_count: {$refRow['click_count']}, registration_count: {$refRow['registration_count']}");
                } else {
                    debugLog("REFERRAL_STATS: No referral data found for user ID: {$userId}");
                }
                
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
                'error' => 'database_error: ' . $e->getMessage(),
                'clickCount' => 0,
                'registrationCount' => 0
            ]);
        }
        exit;
    }
    // Ungültiger GET-Parameter
    else {
        http_response_code(400);
        echo json_encode(['error' => 'invalid_request_parameters']);
        exit;
    }
}
// Methode nicht erlaubt
else {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
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
    // Entferne alle vorhandenen Bindestriche und Leerzeichen
    $plainCode = preg_replace('/[-\s]+/', '', $code);
    
    // Beschränke auf 12 Zeichen und fülle auf falls nötig
    $plainCode = strtoupper(substr($plainCode, 0, 12));
    $plainCode = str_pad($plainCode, 12, '0');
    
    // Formatiere mit Bindestrichen (XXXX-XXXX-XXXX)
    return substr($plainCode, 0, 4) . '-' . substr($plainCode, 4, 4) . '-' . substr($plainCode, 8, 4);
}

/**
 * Findet den Benutzernamen anhand eines Referral-Codes
 * 
 * @param SQLite3 $db Die Datenbankverbindung
 * @param string $code Der Referral-Code (mit oder ohne Bindestriche)
 * @return string|null Der Benutzername oder null, wenn nicht gefunden
 */
function getUsernameByReferralcode($db, $code) {
    debugLog("Looking up username for referral code: {$code}");
    
    // Code-Format normalisieren (mit und ohne Bindestriche berücksichtigen)
    $plainCode = str_replace('-', '', $code);
    
    // Suche nach passenden Einträgen
    $stmt = $db->prepare('SELECT username FROM users WHERE referral_code = :code OR referral_code = :formatted_code');
    $stmt->bindValue(':code', $plainCode, SQLITE3_TEXT);
    $stmt->bindValue(':formatted_code', formatCode($plainCode), SQLITE3_TEXT);
    
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    
    if ($row) {
        debugLog("Found username '{$row['username']}' for referral code: {$code}");
        return $row['username'];
    }
    
    debugLog("No username found for referral code: {$code}");
    return null;
}
?>
