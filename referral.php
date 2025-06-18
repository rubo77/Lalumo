<?php
/**
 * Referral Code API Endpoint
 * 
 * This script receives a username via POST request and generates a unique referral code
 * based on the username. It returns JSON with the generated referral code.
 */

header('Content-Type: application/json');

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate username
if (!isset($data['username']) || empty($data['username'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username is required']);
    exit;
}

$username = $data['username'];

// Generate a unique referral code based on username
function generateReferralCode($username) {
    // Create a base for the referral code
    $base = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $username), 0, 4));
    
    // Add a timestamp component
    $timestamp = substr(time(), -4);
    
    // Add a random component
    $random = strtoupper(substr(md5(uniqid()), 0, 4));
    
    // Combine components, ensuring length is 12 characters
    $code = $base . $timestamp . $random;
    $code = str_pad($code, 12, '0');
    
    // Format with dashes for better readability
    return substr($code, 0, 4) . '-' . substr($code, 4, 4) . '-' . substr($code, 8, 4);
}

// Generate referral code
$referralCode = generateReferralCode($username);

// In a real-world scenario, we would store this in a database
// For now, we'll just return the generated code

// Return response
echo json_encode([
    'success' => true,
    'username' => $username,
    'referralCode' => $referralCode,
    'message' => 'Referral code generated successfully'
]);
?>
