<?php
/**
 * Lalumo Referral System - Admin Dashboard
 * 
 * Simple admin interface to view registered users and their referral stats
 */

// Simple security check - this should be improved in production
session_start();
$validPassword = 'lalumo2024';

$errorMessage = '';
if(!isset($_SESSION['authenticated'])) {
    $_SESSION['authenticated'] = false;
}
if(isset($_GET['logout']) and $_GET['logout'] === 'true') {
    $_SESSION['authenticated'] = false;
    header("Location: admin.php");
    exit;
}
// Check for authentication
if (isset($_POST['password']) and !$_SESSION['authenticated']) {
    if ($_POST['password'] === $validPassword) {
        $_SESSION['authenticated'] = true;
    } else {
        $errorMessage = 'Invalid password';
    }
}

// Define log function for diagnostics
function logError($message) {
    error_log("[LALUMO_ADMIN] " . $message);
}

// Database connection function with improved error handling
function getDbConnection() {
    try {
        $dbPath = __DIR__ . '/../data/referrals.db';
        $dataDir = dirname($dbPath);
        
        // Create data directory if it doesn't exist
        if (!file_exists($dataDir)) {
            if (!mkdir($dataDir, 0755, true)) {
                throw new Exception("Failed to create data directory: $dataDir");
            }
            logError("Created data directory: $dataDir");
        }
        
        // Verify directory is writable
        if (!is_writable($dataDir)) {
            throw new Exception("Data directory is not writable: $dataDir");
        }
        
        // Open or create SQLite database
        try {
            $db = new SQLite3($dbPath);
        } catch (Exception $e) {
            throw new Exception("Failed to open SQLite database: " . $e->getMessage());
        }
        
        // Enable foreign keys
        $db->exec('PRAGMA foreign_keys = ON;');
        
        // Create tables if they don't exist
        $db->exec('
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                referral_code TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');
        
        $db->exec('
            CREATE TABLE IF NOT EXISTS referrals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                referrer_code TEXT,
                referral_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (referrer_code) REFERENCES users(referral_code)
            )
        ');
        
        return $db;
    } catch (Exception $e) {
        logError("Database connection error: " . $e->getMessage());
        throw $e; // Re-throw to handle in the calling function
    }
}

// Get user statistics with improved error handling
function getUserStats() {
    try {
        $db = getDbConnection();
        
        // Query to get users with their referral counts using actual schema from referral.php
        $query = '
            SELECT 
                u.username, 
                u.referral_code,
                u.created_at,
                r.click_count,
                r.registration_count
            FROM users u
            LEFT JOIN referrals r ON r.referrer_id = u.id
            ORDER BY u.created_at DESC
        ';
        
        $results = $db->query($query);
        if (!$results) {
            throw new Exception("Query failed: " . $db->lastErrorMsg());
        }
        
        $users = [];
        while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
            $users[] = $row;
        }
        
        return $users;
    } catch (Exception $e) {
        logError("Error getting user stats: " . $e->getMessage());
        return [];
    }
}

// Get summary statistics
function getSummaryStats($users) {
    $totalUsers = count($users);
    $totalClicks = 0;
    $totalRegistrations = 0;
    
    foreach ($users as $user) {
        $totalClicks += $user['click_count'];
        $totalRegistrations += $user['registration_count'];
    }
    
    return [
        'totalUsers' => $totalUsers,
        'totalClicks' => $totalClicks,
        'totalRegistrations' => $totalRegistrations,
        'conversionRate' => $totalClicks > 0 ? round(($totalRegistrations / $totalClicks) * 100, 1) : 0
    ];
}

// Handle API requests
if ($_SESSION['authenticated'] && isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json');
    
    try {
        $users = getUserStats();
        $stats = getSummaryStats($users);
        
        echo json_encode([
            'success' => true,
            'users' => $users,
            'statistics' => $stats
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Only refresh when already logged in -->
    <?php 
    if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true): ?>
    <meta http-equiv="refresh" content="5" name="refresh" />
    <?php 
    endif; ?>
    <title>Lalumo Referral Admin</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f7fa;
        }
        
        h1, h2 {
            color: #2c3e50;
        }
        
        .login-container {
            max-width: 400px;
            margin: 100px auto;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .error {
            color: #e74c3c;
            margin-bottom: 15px;
        }
        
        input[type="password"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        
        button:hover {
            background-color: #2980b9;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th, td {
            text-align: left;
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        tr:hover {
            background-color: #f1f5fa;
        }
        
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .summary-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            flex-grow: 1;
        }
        
        .stat-card h3 {
            margin-top: 0;
            color: #7f8c8d;
            font-size: 14px;
            text-transform: uppercase;
        }
        
        .stat-card p {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <?php if (!$_SESSION['authenticated']): ?>
        <div class="login-container">
            <h2>Lalumo Admin Login</h2>
            <?php if ($errorMessage): ?>
                <p class="error"><?php echo htmlspecialchars($errorMessage); ?></p>
            <?php endif; ?>
            
            <form method="post">
                <div>
                    <input type="password" name="password" placeholder="Admin Password" required>
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    <?php else: ?>
        <div class="dashboard-container">
            <div class="dashboard-header">
                <h1>Lalumo Referral System Dashboard</h1>
                <button type="button" onclick="window.location.href='admin.php'">:refresh:</button>
                <button type="button" onclick="logout()">Logout</button>
                <script>
                    
                    function logout() {
                        window.location.href = 'admin.php?logout=true';
                    }
                </script>

            </div>
            <?php
                $users = getUserStats();
                $totalUsers = count($users);
                $totalClicks = 0;
                $totalRegistrations = 0;
                
                foreach ($users as $user) {
                    $totalClicks += $user['click_count'];
                    $totalRegistrations += $user['registration_count'];
                }
            ?>
            
            <div class="summary-stats">
                <div class="stat-card">
                    <h3>Total Users</h3>
                    <p><?php echo $totalUsers; ?></p>
                </div>
                <div class="stat-card">
                    <h3>Total Link Clicks</h3>
                    <p><?php echo $totalClicks; ?></p>
                </div>
                <div class="stat-card">
                    <h3>Total Registrations</h3>
                    <p><?php echo $totalRegistrations; ?></p>
                </div>
                <div class="stat-card">
                    <h3>Average Conversion Rate</h3>
                    <p><?php echo $totalClicks > 0 ? round(($totalRegistrations / $totalClicks) * 100, 1) : 0; ?>%</p>
                </div>
            </div>
            
            <h2>Registered Users</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Referral Code</th>
                        <th>Link Clicks</th>
                        <th>Registrations</th>
                        <th>Conversion Rate</th>
                        <th>Registered On</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($users)): ?>
                        <?php foreach ($users as $user): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($user['username']); ?></td>
                                <td><?php echo htmlspecialchars($user['referral_code']); ?></td>
                                <td><?php echo $user['click_count']; ?></td>
                                <td><?php echo $user['registration_count']; ?></td>
                                <td>
                                    <?php 
                                    echo $user['click_count'] > 0 
                                        ? round(($user['registration_count'] / $user['click_count']) * 100, 1) . '%' 
                                        : '0%'; 
                                    ?>
                                </td>
                                <td><?php echo date('Y-m-d H:i', strtotime($user['created_at'])); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="6">No users found</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    <?php endif; ?>
</body>
</html>
