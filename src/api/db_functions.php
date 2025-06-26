<?php
/**
 * Hilfsfunktionen für die Datenbankstruktur und Referral-Code-Verwaltung
 */

/**
 * Erstellt einen sicheren, nicht umkehrbaren Hash einer IP-Adresse
 * 
 * @param string $ip Die IP-Adresse
 * @return string Der sichere Hash der IP-Adresse
 */
function secureIpHash($ip) {
    // Verwende eine zufaellige, feste Zeichenkette als Salt, um das Reverse-Engineering zu erschweren
    $salt = 'lalumo-app-2025-secure-salt';
    
    // Kombiniere IP mit Salt und hashing-Algorithmus
    return hash('sha256', $ip . $salt);
}

/**
 * Extrahiert grundlegende Geräteinformationen aus dem User-Agent
 * 
 * @param string $userAgent Der vollständige User-Agent string
 * @return string Geräteklasse/Browser (Android, iPhone, Desktop Chrome, etc.)
 */
function extractDeviceInfo($userAgent) {
    $deviceInfo = 'Unbekanntes Gerät';
    
    // Einfache Erkennung der wichtigsten Gerätetypen
    if (stripos($userAgent, 'Android') !== false) {
        $deviceInfo = 'Android';
    } elseif (stripos($userAgent, 'iPhone') !== false) {
        $deviceInfo = 'iPhone';
    } elseif (stripos($userAgent, 'iPad') !== false) {
        $deviceInfo = 'iPad';
    } elseif (stripos($userAgent, 'Windows') !== false) {
        $deviceInfo = 'Windows';
    } elseif (stripos($userAgent, 'Macintosh') !== false || stripos($userAgent, 'Mac OS') !== false) {
        $deviceInfo = 'Mac';
    } elseif (stripos($userAgent, 'Linux') !== false) {
        $deviceInfo = 'Linux';
    }
    
    // Füge Browser-Information hinzu, aber nur grundlegend
    if (stripos($userAgent, 'Chrome') !== false && stripos($userAgent, 'Edg') === false) {
        $deviceInfo .= ' Chrome';
    } elseif (stripos($userAgent, 'Firefox') !== false) {
        $deviceInfo .= ' Firefox';
    } elseif (stripos($userAgent, 'Safari') !== false && stripos($userAgent, 'Chrome') === false) {
        $deviceInfo .= ' Safari';
    } elseif (stripos($userAgent, 'Edg') !== false) {
        $deviceInfo .= ' Edge';
    }
    
    return $deviceInfo;
}

/**
 * Generiert einen eindeutigen Referral-Code für einen Benutzer
 * 
 * @param string $username Der Benutzername
 * @return string Der generierte Referral-Code
 */
function generateReferralCode($username) {
    // Erstelle einen Basis-Code aus dem Benutzernamen (erste 4 Zeichen)
    $base = substr(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $username)), 0, 4);
    
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
 * 
 * @param string $code Der zu formatierende Code
 * @return string Der formatierte Code im Format XXXX-XXXX-XXXX
 */
function formatCode($code) {
    // Entferne alle vorhandenen Bindestriche und Leerzeichen
    $plainCode = preg_replace('/[-\\s]+/', '', $code);
    
    // Beschränke auf 12 Zeichen und fülle auf falls nötig
    $plainCode = strtoupper(substr($plainCode, 0, 12));
    $plainCode = str_pad($plainCode, 12, '0');
    
    // Formatiere mit Bindestrichen (XXXX-XXXX-XXXX)
    return substr($plainCode, 0, 4) . '-' . substr($plainCode, 4, 4) . '-' . substr($plainCode, 8, 4);
}

/**
 * Stellt sicher, dass die Datenbankstruktur korrekt ist
 * Prüft und erstellt bei Bedarf fehlende Tabellen und Spalten
 * 
 * @param SQLite3 $db Die Datenbankverbindung
 * @return array Statusmeldung mit erfolg oder Fehlermeldung
 */
function ensureDatabaseStructure($db) {
    debugLog("DB_MIGRATION: Prüfe Datenbankstruktur");
    
    // Ermittle den Datenbankpfad aus dem globalen $dbFile
    global $dbFile;
    if (!isset($dbFile)) {
        // Fallback, wenn $dbFile nicht global verfügbar ist
        $dbFile = __DIR__ . '/../../db/referrals.db';
        debugLog("DB_MIGRATION_WARNING: dbFile nicht global gefunden, benutze Fallback: {$dbFile}");
    }
    
    // Prüfe Schreibrechte auf der Datenbank
    if (file_exists($dbFile) && !is_writable($dbFile)) {
        $errorMsg = "Datenbank ist nur lesbar. Bitte setzen Sie die Berechtigungen: {$dbFile}"; 
        debugLog("DB_MIGRATION_ERROR: {$errorMsg}");
        return ['success' => false, 'error' => 'database_readonly', 'message' => $errorMsg];
    }
    
    // Prüfe Schreibrechte auf dem Datenbankverzeichnis (wichtig für Neuanlage)
    $dbDir = dirname($dbFile);
    if (!is_writable($dbDir)) {
        $errorMsg = "Datenbankverzeichnis ist nur lesbar. Bitte setzen Sie die Berechtigungen: {$dbDir}";
        debugLog("DB_MIGRATION_ERROR: {$errorMsg}");
        return ['success' => false, 'error' => 'directory_readonly', 'message' => $errorMsg];
    }
    
    try {
        // 1. Prüfe die users-Tabelle
        $usersResult = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        if (!$usersResult->fetchArray()) {
            debugLog("DB_MIGRATION: Erstelle users-Tabelle mit allen benötigten Spalten");
            $result = $db->exec(
                "CREATE TABLE users (" .
                "id INTEGER PRIMARY KEY," .
                "username TEXT UNIQUE," .
                "referral_code TEXT UNIQUE," .
                "password TEXT," .
                "referred_by TEXT," .
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" .
                ")"
            );
            
            if ($result === false) {
                return ['success' => false, 'error' => 'create_table_failed', 
                        'message' => "Fehler beim Erstellen der users-Tabelle: {$db->lastErrorMsg()}"];
            }
        } else {
            // Prüfe, ob die users-Tabelle die benötigten Spalten hat
            $hasReferredByColumn = false;
            $hasPasswordColumn = false;
            $columnsResult = $db->query("PRAGMA table_info(users)");
            while ($column = $columnsResult->fetchArray(SQLITE3_ASSOC)) {
                if ($column['name'] === 'referred_by') {
                    $hasReferredByColumn = true;
                }
                if ($column['name'] === 'password') {
                    $hasPasswordColumn = true;
                }
            }
            
            // Füge fehlende Spalten hinzu
            if (!$hasReferredByColumn) {
                debugLog("DB_MIGRATION: Füge referred_by-Spalte zur users-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE users ADD COLUMN referred_by TEXT");
                if ($result === false) {
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der referred_by-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasPasswordColumn) {
                debugLog("DB_MIGRATION: Füge password-Spalte zur users-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE users ADD COLUMN password TEXT");
                if ($result === false) {
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der password-Spalte: {$db->lastErrorMsg()}"];
                }
            }
        }
        
        // 2. Prüfe die referrals-Tabelle
        $referralsResult = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='referrals'");
        if (!$referralsResult->fetchArray()) {
            debugLog("DB_MIGRATION: Erstelle referrals-Tabelle mit allen benötigten Spalten");
            $result = $db->exec(
                "CREATE TABLE referrals (" .
                "id INTEGER PRIMARY KEY," .
                "referrer_id INTEGER," .
                "visitor_ip TEXT," .
                "visitor_agent TEXT," .
                "click_count INTEGER DEFAULT 0," .
                "registration_count INTEGER DEFAULT 0," .
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," .
                "FOREIGN KEY (referrer_id) REFERENCES users(id)" .
                ")"
            );
            
            if ($result === false) {
                return ['success' => false, 'error' => 'create_table_failed', 
                        'message' => "Fehler beim Erstellen der referrals-Tabelle: {$db->lastErrorMsg()}"];
            }
        } else {
            // Prüfe, ob die referrals-Tabelle alle benötigten Spalten hat
            $hasCreatedAtColumn = false;
            $hasVisitorIpColumn = false;
            $hasVisitorAgentColumn = false;
            $hasReferrerIdColumn = false;
            $hasReferrerCodeColumn = false;
            $hasClickCountColumn = false;
            $hasRegistrationCountColumn = false;
            $hasReferralTypeColumn = false;
            
            $columnsResult = $db->query("PRAGMA table_info(referrals)");
            while ($column = $columnsResult->fetchArray(SQLITE3_ASSOC)) {
                if ($column['name'] === 'created_at') {
                    $hasCreatedAtColumn = true;
                }
                if ($column['name'] === 'visitor_ip') {
                    $hasVisitorIpColumn = true; 
                }
                if ($column['name'] === 'visitor_agent') {
                    $hasVisitorAgentColumn = true;
                }
                if ($column['name'] === 'referrer_id') {
                    $hasReferrerIdColumn = true;
                }
                if ($column['name'] === 'referrer_code') {
                    $hasReferrerCodeColumn = true;
                }
                if ($column['name'] === 'click_count') {
                    $hasClickCountColumn = true;
                }
                if ($column['name'] === 'registration_count') {
                    $hasRegistrationCountColumn = true;
                }
                if ($column['name'] === 'referral_type') {
                    $hasReferralTypeColumn = true;
                }
            }
            
            // Füge fehlende Spalten hinzu
            if (!$hasCreatedAtColumn) {
                debugLog("DB_MIGRATION: Füge created_at-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der created_at-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der created_at-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasVisitorIpColumn) {
                debugLog("DB_MIGRATION: Füge visitor_ip-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN visitor_ip TEXT");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der visitor_ip-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der visitor_ip-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasVisitorAgentColumn) {
                debugLog("DB_MIGRATION: Füge visitor_agent-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN visitor_agent TEXT");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der visitor_agent-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der visitor_agent-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasReferrerIdColumn) {
                debugLog("DB_MIGRATION: Füge referrer_id-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN referrer_id INTEGER");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der referrer_id-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der referrer_id-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasReferrerCodeColumn) {
                debugLog("DB_MIGRATION: Füge referrer_code-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN referrer_code TEXT");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der referrer_code-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der referrer_code-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasClickCountColumn) {
                debugLog("DB_MIGRATION: Füge click_count-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN click_count INTEGER DEFAULT 0");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der click_count-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der click_count-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasRegistrationCountColumn) {
                debugLog("DB_MIGRATION: Füge registration_count-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN registration_count INTEGER DEFAULT 0");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der registration_count-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der registration_count-Spalte: {$db->lastErrorMsg()}"];
                }
            }
            
            if (!$hasReferralTypeColumn) {
                debugLog("DB_MIGRATION: Füge referral_type-Spalte zur referrals-Tabelle hinzu");
                $result = $db->exec("ALTER TABLE referrals ADD COLUMN referral_type TEXT");
                if ($result === false) {
                    debugLog("DB_MIGRATION_ERROR: Fehler beim Hinzufügen der referral_type-Spalte: {$db->lastErrorMsg()}");
                    return ['success' => false, 'error' => 'alter_table_failed', 
                            'message' => "Fehler beim Hinzufügen der referral_type-Spalte: {$db->lastErrorMsg()}"];
                }
            }
        }
        
        return ['success' => true, 'message' => 'Datenbankstruktur ist korrekt'];
    } catch (Exception $e) {
        $errorMsg = "Fehler bei der Datenbankstrukturprüfung: {$e->getMessage()}"; 
        debugLog("DB_MIGRATION_ERROR: {$errorMsg}");
        return ['success' => false, 'error' => 'db_structure_check_failed', 'message' => $errorMsg];
    }
}
?>
