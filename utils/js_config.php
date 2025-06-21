<?php
/**
 * JS Config parser for PHP
 * Used for reading the central config.js file
 */

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
            $config = getJsConfig(__DIR__ . '/../src/config.js');
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
    $contents = file_get_contents($filePath);
    $result = [];
    
    // Extract the configuration object using regex patterns
    // This assumes that the config object follows a specific structure in config.js
    $pattern = '/const\s+configData\s*=\s*({[^;]*});/s';
    if (preg_match($pattern, $contents, $matches)) {
        $configBlock = $matches[1];
        
        // Extract development section
        $devPattern = '/development:\s*{([^}]*)}/s';
        if (preg_match($devPattern, $configBlock, $devMatches)) {
            $devSection = $devMatches[1];
            preg_match_all('/(\w+):\s*[\'"]([^\'"]*)[\'"],?/s', $devSection, $devKeyValues);
            
            $result['development'] = [];
            for ($i = 0; $i < count($devKeyValues[1]); $i++) {
                $key = $devKeyValues[1][$i];
                $value = $devKeyValues[2][$i];
                $result['development'][$key] = $value;
            }
        }
        
        // Extract production section
        $prodPattern = '/production:\s*{([^}]*)}/s';
        if (preg_match($prodPattern, $configBlock, $prodMatches)) {
            $prodSection = $prodMatches[1];
            preg_match_all('/(\w+):\s*[\'"]([^\'"]*)[\'"],?/s', $prodSection, $prodKeyValues);
            
            $result['production'] = [];
            for ($i = 0; $i < count($prodKeyValues[1]); $i++) {
                $key = $prodKeyValues[1][$i];
                $value = $prodKeyValues[2][$i];
                $result['production'][$key] = $value;
            }
        }
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
    return $isProd ? $config['production'] : $config['development'];
}

// Diagnosefunktion aufrufen, wenn diese Datei direkt aufgerufen wird
showDiagnostics();
