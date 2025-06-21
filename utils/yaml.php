<?php
/**
 * Simple YAML parser for PHP
 * Used for reading the central config.yaml file
 */

/**
 * Parse a YAML file and return the contents as an array
 * Very basic implementation that only handles the format we use in config.yaml
 * 
 * @param string $filePath Path to the YAML file
 * @return array Parsed YAML as associative array
 */
function parseYamlFile($filePath) {
    $contents = file_get_contents($filePath);
    $result = [];
    $currentSection = null;
    
    // Split file into lines
    $lines = explode("\n", $contents);
    
    foreach ($lines as $line) {
        // Skip comments and empty lines
        if (empty(trim($line)) || strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Section header (no indent)
        if (strpos($line, ':') !== false && substr($line, 0, 1) !== ' ') {
            $currentSection = trim(explode(':', $line)[0]);
            $result[$currentSection] = [];
        }
        // Key-value pair (indented)
        elseif (strpos($line, ':') !== false && $currentSection !== null) {
            $parts = explode(':', $line, 2);
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            $result[$currentSection][$key] = $value;
        }
    }
    
    return $result;
}

/**
 * Get configuration based on environment
 * 
 * @param string $configFile Path to the YAML config file
 * @return array Environment-specific configuration
 */
function getConfig($configFile) {
    // Parse config file
    $config = parseYamlFile($configFile);
    
    // Detect environment
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isProd = strpos($host, 'lalumo.eu') !== false || 
              strpos($host, 'lalumo.z11.de') !== false;
    
    // Return appropriate config
    return $isProd ? $config['production'] : $config['development'];
}
