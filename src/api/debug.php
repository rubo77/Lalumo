<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Debug information
$debug_info = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_working' => true,
    'server_path' => __FILE__,
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'not set',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'not set',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'not set',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'not set',
    'current_directory' => __DIR__,
    'config_path_attempt1' => __DIR__ . '/../../config.js',
    'config_path_attempt2' => __DIR__ . '/../config.js', 
    'config_path_attempt3' => __DIR__ . '/config.js',
    'config_file_exists_1' => file_exists(__DIR__ . '/../../config.js'),
    'config_file_exists_2' => file_exists(__DIR__ . '/../config.js'),
    'config_file_exists_3' => file_exists(__DIR__ . '/config.js'),
    'referral_file_exists' => file_exists(__DIR__ . '/referral.php'),
    'utils_dir_exists' => is_dir(__DIR__ . '/utils'),
    'js_config_file_exists' => file_exists(__DIR__ . '/utils/js_config.php'),
    'directory_listing' => array_slice(scandir(__DIR__), 0, 10) // Show first 10 files in current directory
];

echo json_encode($debug_info, JSON_PRETTY_PRINT);
?>
