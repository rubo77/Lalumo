<?php
/**
 * JS Config parser for PHP
 * Used for reading the central config.js file
 */

// Debug-Modus aktivieren (auf false setzen für Produktion)
define('DEBUG', true);

// Hilfsfunktion zur Anzeige von Diagnoseinformationen bei direktem Aufruf
function showDiagnostics() {
    // Nur anzeigen, wenn direkt aufgerufen (nicht als Include)
    if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
        // Output als HTML statt JSON
        header('Content-Type: text/html');
        
        echo "<html><head><title>JS Config Parser Diagnostics</title>";        
        echo "<style>body { font-family: Arial, sans-serif; margin: 20px; }
               pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
               .env { color: #2c7873; }
               .config { color: #d33682; }</style>";
        echo "</head><body>";
        
        echo "<h1>JS Config Parser Diagnostics</h1>";
        
        // Umgebungsinformationen
        echo "<h2>Environment Detection:</h2>";
        $host = $_SERVER['HTTP_HOST'] ?? 'unknown';
        $isProd = strpos($host, 'lalumo.eu') !== false || 
                strpos($host, 'lalumo.z11.de') !== false;
        echo "<pre class='env'>";
        echo "Host: $host\n";
        echo "Environment: " . ($isProd ? "PRODUCTION" : "DEVELOPMENT") . "\n";
        echo "</pre>";
        
        // Config aus JS-Datei extrahieren und anzeigen
        echo "<h2>Extracted Configuration:</h2>";
        try {
            if(file_exists(__DIR__ . '/../config.js')) $config = getJsConfig(__DIR__ . '/../config.js');
            else $config = getJsConfig(__DIR__ . '/../app/config.js');
            echo "<pre class='config'>";
            print_r($config);
            echo "</pre>";
        } catch (Exception $e) {
            echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
        }
        
        echo "</body></html>";
        exit;
    }
}

/**
 * Parse a JavaScript config file and return the contents as an array
 * Extracts configuration from src/config.js using regex
 * 
 * @param string $filePath Path to the JavaScript config file
 * @return array Parsed config as associative array
 */
function parseJsConfigFile($filePath) {
    if (!file_exists($filePath)) {
        debugLog("[CONFIG_ERROR] File not found: $filePath");
        return [];
    }
    
    $contents = file_get_contents($filePath);
    if (!$contents) {
        debugLog("[CONFIG_ERROR] Could not read file: $filePath");
        return [];
    }
    
    debugLog("[CONFIG_DEBUG] Parsing file: $filePath");
    $result = [];
    
    // Pattern angepasst, um auch minifizierten Code zu unterstützen
    $pattern = '/const\s*configData\s*=\s*({.*?(?=\};|\},\s*is|\},\s*let))/s';
    if (preg_match($pattern, $contents, $matches)) {
        $configBlock = $matches[1];
        debugLog("[CONFIG_DEBUG] Found config block");
        
        // Pattern für Entwicklungsumgebung - angepasst für minifizierten Code
        $devPattern = '/development:\s*{([^}]*)}/s';
        if (preg_match($devPattern, $configBlock, $devMatches)) {
            $devSection = $devMatches[1];
            // Verbesserte Pattern für Key-Value-Paare (unterstützt minifizierten Code)
            preg_match_all('/([A-Za-z0-9_]+)\s*:\s*"([^"]*)"/', $devSection, $devKeyValues);
            
            $result['development'] = [];
            for ($i = 0; $i < count($devKeyValues[1]); $i++) {
                $key = $devKeyValues[1][$i];
                $value = $devKeyValues[2][$i];
                $result['development'][$key] = $value;
            }
            
            debugLog("[CONFIG_DEBUG] Found " . count($result['development']) . " development config items");
        } else {
            debugLog("[CONFIG_ERROR] Could not extract development section");
        }
        
        // Pattern für Produktionsumgebung - angepasst für minifizierten Code
        $prodPattern = '/production:\s*{([^}]*)}/s';
        if (preg_match($prodPattern, $configBlock, $prodMatches)) {
            $prodSection = $prodMatches[1];
            // Verbesserte Pattern für Key-Value-Paare (unterstützt minifizierten Code)
            preg_match_all('/([A-Za-z0-9_]+)\s*:\s*"([^"]*)"/', $prodSection, $prodKeyValues);
            
            $result['production'] = [];
            for ($i = 0; $i < count($prodKeyValues[1]); $i++) {
                $key = $prodKeyValues[1][$i];
                $value = $prodKeyValues[2][$i];
                $result['production'][$key] = $value;
            }
            
            debugLog("[CONFIG_DEBUG] Found " . count($result['production']) . " production config items");
        } else {
            debugLog("[CONFIG_ERROR] Could not extract production section");
        }
    } else {
        debugLog("[CONFIG_ERROR] Could not find config data in file");
    }
    
    return $result;
}

/**
 * Get configuration based on environment
 * 
 * @param string $configFile Path to the JavaScript config file
 * @return array Environment-specific configuration
 */
function getJsConfig($configFile) {
    // Parse config file
    $config = parseJsConfigFile($configFile);
    
    // Detect environment
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isProd = strpos($host, 'lalumo.eu') !== false || 
              strpos($host, 'lalumo.z11.de') !== false;
    
    // Return appropriate config
    if(!array_key_exists('production', $config)){
        debugLog("[LALUMO CONFIG] $configFile : ".json_encode($config));
    }
    return $isProd ? $config['production'] : $config['development'];
}

// Diagnosefunktion aufrufen, wenn diese Datei direkt aufgerufen wird
showDiagnostics();
