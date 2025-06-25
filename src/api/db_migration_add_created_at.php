<?php
// Fehlerausgabe aktivieren für Debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Migrationsskript um die created_at-Spalte zur referrals-Tabelle hinzuzufügen
 */

require_once 'utils/common.php'; // für debug-Funktionen

// Bestimme Pfad zur Datenbank
$dbPath = '../../data/referrals.db';
if (!file_exists($dbPath)) {
    // Fallback für lokale Entwicklung
    $dbPath = '../data/referrals.db';
    if (!file_exists($dbPath)) {
        // Weiterer Fallback
        $dbPath = './data/referrals.db';
        if (!file_exists($dbPath)) {
            die("Fehler: Datenbank nicht gefunden in: $dbPath");
        }
    }
}

echo "Verwende Datenbank: $dbPath\n";

// Verbindung zur Datenbank herstellen
try {
    $db = new SQLite3($dbPath);
    echo "Verbindung zur Datenbank hergestellt.\n";
} catch (Exception $e) {
    die("Datenbankfehler: " . $e->getMessage());
}

// Prüfen, ob die Spalte bereits existiert
$result = $db->query("PRAGMA table_info(referrals)");
$columnExists = false;
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    if ($row['name'] === 'created_at') {
        $columnExists = true;
        break;
    }
}

if ($columnExists) {
    echo "Die Spalte 'created_at' existiert bereits in der Tabelle 'referrals'.\n";
} else {
    // Spalte hinzufügen
    try {
        $db->exec("ALTER TABLE referrals ADD COLUMN created_at TEXT DEFAULT NULL");
        echo "Die Spalte 'created_at' wurde erfolgreich zur Tabelle 'referrals' hinzugefügt.\n";
        
        // Bestehende Einträge mit aktueller Zeit aktualisieren
        $db->exec("UPDATE referrals SET created_at = datetime('now') WHERE created_at IS NULL");
        echo "Bestehende Einträge wurden mit dem aktuellen Zeitstempel aktualisiert.\n";
    } catch (Exception $e) {
        die("Fehler beim Hinzufügen der Spalte: " . $e->getMessage());
    }
}

echo "Migration abgeschlossen.\n";
$db->close();
?>
