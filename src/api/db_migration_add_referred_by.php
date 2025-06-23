<?php
require_once 'utils/common.php'; // für debugging-Funktionen

// Verbindung zur SQLite-Datenbank herstellen
function connectToDatabase() {
    $dbPath = '../data/referrals.db'; // Produktionspfad relativ
    
    // Lokale Entwicklungsumgebung erkennen
    if(preg_match('/^\/var\/www/', __DIR__)){
        $dbPath = __DIR__ . '/../../data/referrals.db'; // Vollständiger lokaler Pfad
        debugLog("DB Migration: Verwende lokalen Datenbank-Pfad: $dbPath");
    } else {
        debugLog("DB Migration: Verwende Produktions-Datenbank-Pfad: $dbPath");
    }
    
    // Prüfen, ob die Datei existiert
    if (!file_exists($dbPath)) {
        die("Datenbank nicht gefunden: $dbPath");
    }
    
    try {
        $db = new SQLite3($dbPath);
        $db->enableExceptions(true);
        debugLog("DB Migration: Datenbankverbindung erfolgreich hergestellt");
        return $db;
    } catch (Exception $e) {
        die("Datenbankverbindung fehlgeschlagen: " . $e->getMessage());
    }
}

// Prüfen, ob die Spalte bereits existiert
function columnExists($db, $table, $column) {
    $tableInfo = $db->query("PRAGMA table_info($table)");
    while ($row = $tableInfo->fetchArray(SQLITE3_ASSOC)) {
        if ($row['name'] === $column) {
            return true;
        }
    }
    return false;
}

// Hauptfunktion zur Migration
function migrateDatabase() {
    echo "<h1>Referral System Datenbank-Migration</h1>";
    echo "<pre>";
    
    $db = connectToDatabase();
    
    // 1. Prüfen, ob referred_by bereits existiert
    $hasColumn = columnExists($db, 'users', 'referred_by');
    echo "Prüfe, ob Spalte 'referred_by' existiert: " . ($hasColumn ? "JA" : "NEIN") . "\n";
    
    if ($hasColumn) {
        echo "Spalte 'referred_by' existiert bereits. Keine Änderung notwendig.\n";
    } else {
        echo "Spalte 'referred_by' fehlt. Führe Migration durch...\n";
        
        try {
            // 2. Spalte hinzufügen (SQLite unterstützt keine DEFAULT-Werte in ALTER TABLE)
            $db->exec("ALTER TABLE users ADD COLUMN referred_by TEXT NULL");
            echo "Spalte 'referred_by' erfolgreich zur Tabelle 'users' hinzugefügt.\n";
            
            // 3. Liste vorhandene Benutzer für Berichtszwecke
            echo "\nVorhandene Benutzer in der Datenbank:\n";
            $result = $db->query("SELECT username, referral_code, referred_by FROM users");
            echo str_pad("Username", 20) . str_pad("Referral Code", 20) . "Referred By\n";
            echo str_repeat("-", 60) . "\n";
            
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                echo str_pad($row['username'], 20) . str_pad($row['referral_code'], 20) . ($row['referred_by'] ?? "NULL") . "\n";
            }
            
            echo "\nMigration erfolgreich abgeschlossen.\n";
        } catch (Exception $e) {
            echo "FEHLER bei Migration: " . $e->getMessage() . "\n";
        }
    }
    
    echo "</pre>";
    $db->close();
}

// Migration starten
migrateDatabase();
