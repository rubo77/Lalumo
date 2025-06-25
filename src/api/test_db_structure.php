<?php
// Fehlerausgabe aktivieren für Debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Test-Script für Datenbankstruktur-Prüfung
 */
require_once 'utils/common.php'; // für debugging-Funktionen
require_once 'db_functions.php'; // für Datenbankstruktur-Funktionen

echo "<h1>Lalumo Datenbankstruktur-Test</h1>";
echo "<pre>";

// SQLite-Datenbank einrichten
$dbDir = '../data';
if(preg_match('/^\/var\/www/', __DIR__)){
    $dbDir = __DIR__ . '/../../data';
}
$dbFile = $dbDir . '/referrals.db';
echo "Datenbankpfad: $dbFile\n";

// Datenbank öffnen
try {
    $db = new SQLite3($dbFile);
    echo "Datenbankverbindung hergestellt.\n";
    
    // Vor dem Check: Tabellenstrukturen ausgeben
    echo "\n=== Vor dem Struktur-Check ===\n";
    
    echo "\nTabelle users:\n";
    $tableInfo = $db->query("PRAGMA table_info(users)");
    while ($column = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
        echo " - " . $column['name'] . " (" . $column['type'] . ")\n";
    }
    
    echo "\nTabelle referrals:\n";
    $tableInfo = $db->query("PRAGMA table_info(referrals)");
    while ($column = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
        echo " - " . $column['name'] . " (" . $column['type'] . ")\n";
    }
    
    // Struktur-Check ausführen
    echo "\n=== Führe Struktur-Check aus ===\n";
    ensureDatabaseStructure($db);
    
    // Nach dem Check: Tabellenstrukturen ausgeben
    echo "\n=== Nach dem Struktur-Check ===\n";
    
    echo "\nTabelle users:\n";
    $tableInfo = $db->query("PRAGMA table_info(users)");
    while ($column = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
        echo " - " . $column['name'] . " (" . $column['type'] . ")\n";
    }
    
    echo "\nTabelle referrals:\n";
    $tableInfo = $db->query("PRAGMA table_info(referrals)");
    while ($column = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
        echo " - " . $column['name'] . " (" . $column['type'] . ")\n";
    }
    
    echo "\nTest erfolgreich abgeschlossen.\n";
    
} catch (Exception $e) {
    echo "Fehler bei der Datenbankverbindung: " . $e->getMessage() . "\n";
}

echo "</pre>";
?>
