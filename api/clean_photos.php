<?php
// Clean up problematic photos from database
header('Content-Type: application/json; charset=utf-8');

$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo";
$db_pass = "7JAWfDdh";
$db_name = "d383750_vygeo";

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    
    // Delete all photos to start fresh
    $stmt = $pdo->prepare("DELETE FROM feature_photos");
    $result = $stmt->execute();
    
    echo json_encode([
        'ok' => true,
        'message' => 'All photos deleted successfully',
        'deleted_rows' => $stmt->rowCount()
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'ok' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
