<?php
// Fehlerausgabe aktivieren für Debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Vollständiges Migrationsskript für Lalumo DB
 * - Fügt die created_at-Spalte zur referrals-Tabelle hinzu
 * - Fügt die referred_by-Spalte zur users-Tabelle hinzu
 */

require_once 'utils/common.php'; // für debug-Funktionen

// Bestimme Pfad zur Datenbank
function findDatabasePath() {
    $possiblePaths = [
        '../../data/referrals.db',  // Produktionspfad relativ
        '../data/referrals.db',      // Alternatives Verhältnis
        './data/referrals.db'        // Lokales Verhältnis
    ];

    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            return $path;
        }
    }
    
    die("Fehler: Datenbank nicht gefunden. Überprüfte Pfade: " . implode(", ", $possiblePaths));
}

$dbPath = findDatabasePath();
echo "Verwende Datenbank: $dbPath\n";

// Verbindung zur Datenbank herstellen
try {
    $db = new SQLite3($dbPath);
    $db->enableExceptions(true);
    echo "Verbindung zur Datenbank hergestellt.\n";
} catch (Exception $e) {
    die("Datenbankfehler: " . $e->getMessage());
}

// Funktion zum Prüfen, ob eine Spalte in einer Tabelle existiert
function columnExists($db, $table, $column) {
    $result = $db->query("PRAGMA table_info($table)");
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        if ($row['name'] === $column) {
            return true;
        }
    }
    return false;
}

// 1. Migration: created_at zur referrals-Tabelle hinzufügen
echo "\n== Migration 1: created_at in referrals ==\n";
$columnExists = columnExists($db, 'referrals', 'created_at');

if ($columnExists) {
    echo "Die Spalte 'created_at' existiert bereits in der Tabelle 'referrals'.\n";
} else {
    try {
        $db->exec("ALTER TABLE referrals ADD COLUMN created_at TEXT DEFAULT NULL");
        echo "Die Spalte 'created_at' wurde erfolgreich zur Tabelle 'referrals' hinzugefügt.\n";
        
        // Bestehende Einträge mit aktueller Zeit aktualisieren
        $db->exec("UPDATE referrals SET created_at = datetime('now') WHERE created_at IS NULL");
        echo "Bestehende Einträge wurden mit dem aktuellen Zeitstempel aktualisiert.\n";
    } catch (Exception $e) {
        echo "Fehler beim Hinzufügen der created_at-Spalte: " . $e->getMessage() . "\n";
    }
}

// 2. Migration: referred_by zur users-Tabelle hinzufügen
echo "\n== Migration 2: referred_by in users ==\n";
$columnExists = columnExists($db, 'users', 'referred_by');

if ($columnExists) {
    echo "Die Spalte 'referred_by' existiert bereits in der Tabelle 'users'.\n";
} else {
    try {
        $db->exec("ALTER TABLE users ADD COLUMN referred_by TEXT NULL");
        echo "Die Spalte 'referred_by' wurde erfolgreich zur Tabelle 'users' hinzugefügt.\n";
        
        // Liste vorhandene Benutzer für Berichtszwecke
        echo "\nVorhandene Benutzer in der Datenbank:\n";
        $result = $db->query("SELECT username, referral_code, referred_by FROM users");
        echo str_pad("Username", 20) . str_pad("Referral Code", 20) . "Referred By\n";
        echo str_repeat("-", 60) . "\n";
        
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            echo str_pad($row['username'] ?? 'NULL', 20) . 
                 str_pad($row['referral_code'] ?? 'NULL', 20) . 
                 ($row['referred_by'] ?? "NULL") . "\n";
        }
    } catch (Exception $e) {
        echo "Fehler beim Hinzufügen der referred_by-Spalte: " . $e->getMessage() . "\n";
    }
}

echo "\nMigration vollständig abgeschlossen.\n";
$db->close();
?>
