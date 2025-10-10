<?php
// Test databázového připojení
header('Content-Type: application/json; charset=utf-8');

$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo";
$db_pass = "7JAWfDdh";
$db_name = "d383750_vygeo";

echo json_encode([
    'host' => $db_host,
    'user' => $db_user,
    'database' => $db_name,
    'testing_connection' => true
]);

try {
    $mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($mysqli->connect_error) {
        echo json_encode([
            'success' => false,
            'error' => 'Connection failed: ' . $mysqli->connect_error,
            'error_code' => $mysqli->connect_errno
        ]);
        exit;
    }
    
    $mysqli->set_charset('utf8mb4');
    
    // Test ping
    if (!$mysqli->ping()) {
        echo json_encode([
            'success' => false,
            'error' => 'Connection lost after ping'
        ]);
        exit;
    }
    
    // Test query
    $result = $mysqli->query("SELECT COUNT(*) as count FROM map_features");
    if (!$result) {
        echo json_encode([
            'success' => false,
            'error' => 'Query failed: ' . $mysqli->error
        ]);
        exit;
    }
    
    $row = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'record_count' => $row['count'],
        'server_info' => $mysqli->server_info,
        'client_info' => $mysqli->client_info
    ]);
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
