<?php
// Zkontrolovat sloupce v tabulce map_features
header('Content-Type: application/json; charset=utf-8');

$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo";
$db_pass = "7JAWfDdh";
$db_name = "d383750_vygeo";

try {
    $mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($mysqli->connect_error) {
        echo json_encode([
            'success' => false,
            'error' => 'Connection failed: ' . $mysqli->connect_error
        ]);
        exit;
    }
    
    $mysqli->set_charset('utf8mb4');
    
    // Získat strukturu tabulky
    $result = $mysqli->query("DESCRIBE map_features");
    if (!$result) {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to describe table: ' . $mysqli->error
        ]);
        exit;
    }
    
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row;
    }
    
    // Zkontrolovat specifické sloupce
    $has_color = false;
    $has_elevation_data = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'color') {
            $has_color = true;
        }
        if ($column['Field'] === 'elevation_data') {
            $has_elevation_data = true;
        }
    }
    
    echo json_encode([
        'success' => true,
        'columns' => $columns,
        'has_color_column' => $has_color,
        'has_elevation_data_column' => $has_elevation_data,
        'message' => 'Table structure retrieved successfully'
    ]);
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage()
    ]);
}
?>
