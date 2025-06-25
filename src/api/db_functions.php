<?php
/**
 * Hilfsfunktionen für die Datenbankstruktur und Referral-Code-Verwaltung
 */

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
    $plainCode = preg_replace('/[-\s]+/', '', $code);
    
    // Beschränke auf 12 Zeichen und fülle auf falls nötig
    $plainCode = strtoupper(substr($plainCode, 0, 12));
    $plainCode = str_pad($plainCode, 12, '0');
    
    // Formatiere mit Bindestrichen (XXXX-XXXX-XXXX)
    return substr($plainCode, 0, 4) . '-' . substr($plainCode, 4, 4) . '-' . substr($plainCode, 8, 4);
}

/**
 * Stellt sicher, dass die Datenbankstruktur korrekt ist
 * Prüft und erstellt bei Bedarf fehlende Tabellen und Spalten
 */
function ensureDatabaseStructure($db) {
    debugLog("DB_MIGRATION: Prüfe Datenbankstruktur");
    
    // 1. Prüfe die users-Tabelle
    $usersResult = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    if (!$usersResult->fetchArray()) {
        debugLog("DB_MIGRATION: Erstelle users-Tabelle");
        $db->exec(
            "CREATE TABLE users (" .
            "id INTEGER PRIMARY KEY AUTOINCREMENT," .
            "username TEXT UNIQUE," .
            "referral_code TEXT UNIQUE," .
            "password TEXT," .
            "referred_by TEXT," .
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" .
            ")"            
        );
    }
    
    // 2. Prüfe die referrals-Tabelle
    $referralsResult = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='referrals'");
    if (!$referralsResult->fetchArray()) {
        debugLog("DB_MIGRATION: Erstelle referrals-Tabelle");
        $db->exec(
            "CREATE TABLE referrals (" .
            "id INTEGER PRIMARY KEY," .
            "referrer_id INTEGER," .
            "click_count INTEGER DEFAULT 0," .
            "registration_count INTEGER DEFAULT 0," .
            "created_at TEXT," .
            "FOREIGN KEY (referrer_id) REFERENCES users(id)" .
            ")"            
        );
    }
    
    // 3. Prüfe und ergänze fehlende Spalten in der users-Tabelle
    $missingColumns = [];
    $requiredColumns = ['username', 'referral_code', 'password', 'referred_by', 'created_at'];
    $tableInfo = $db->query("PRAGMA table_info(users)");
    
    $existingColumns = [];
    while ($column = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
        $existingColumns[] = $column['name'];
    }
    
    foreach ($requiredColumns as $column) {
        if (!in_array($column, $existingColumns)) {
            $missingColumns[] = $column;
        }
    }
    
    if (!empty($missingColumns)) {
        debugLog("DB_MIGRATION: Fehlende Spalten in users-Tabelle: " . implode(", ", $missingColumns));
        
        foreach ($missingColumns as $column) {
            switch ($column) {
                case 'username':
                    $db->exec("ALTER TABLE users ADD COLUMN username TEXT UNIQUE");
                    break;
                case 'referral_code':
                    $db->exec("ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE");
                    break;
                case 'password':
                    $db->exec("ALTER TABLE users ADD COLUMN password TEXT");
                    break;
                case 'referred_by':
                    $db->exec("ALTER TABLE users ADD COLUMN referred_by TEXT");
                    break;
                case 'created_at':
                    $db->exec("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
                    break;
            }
        }
    }
    
    // 4. Prüfe und ergänze fehlende Spalten in der referrals-Tabelle
    $missingColumns = [];
    $requiredColumns = ['referrer_id', 'click_count', 'registration_count', 'created_at'];
    $tableInfo = $db->query("PRAGMA table_info(referrals)");
    
    $existingColumns = [];
    while ($column = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
        $existingColumns[] = $column['name'];
    }
    
    foreach ($requiredColumns as $column) {
        if (!in_array($column, $existingColumns)) {
            $missingColumns[] = $column;
        }
    }
    
    if (!empty($missingColumns)) {
        debugLog("DB_MIGRATION: Fehlende Spalten in referrals-Tabelle: " . implode(", ", $missingColumns));
        
        foreach ($missingColumns as $column) {
            switch ($column) {
                case 'referrer_id':
                    $db->exec("ALTER TABLE referrals ADD COLUMN referrer_id INTEGER");
                    break;
                case 'click_count':
                    $db->exec("ALTER TABLE referrals ADD COLUMN click_count INTEGER DEFAULT 0");
                    break;
                case 'registration_count':
                    $db->exec("ALTER TABLE referrals ADD COLUMN registration_count INTEGER DEFAULT 0");
                    break;
                case 'created_at':
                    $db->exec("ALTER TABLE referrals ADD COLUMN created_at TEXT");
                    break;
            }
        }
    }
    
    debugLog("DB_MIGRATION: Datenbankstrukturprüfung abgeschlossen");
}
?>
