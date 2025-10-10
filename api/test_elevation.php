<?php
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Europe/Prague');

/**
 * Testovací skript pro ověření elevation_data funkcionality
 */

// === DB credentials ===
$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo";
$db_pass = "7JAWfDdh";
$db_name = "d383750_vygeo";

$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['ok'=>false, 'error'=>'DB connect fail: '.$mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Test 1: Zkontrolovat, zda sloupec elevation_data existuje
$result = $mysqli->query("SHOW COLUMNS FROM map_features LIKE 'elevation_data'");
$column_exists = $result->num_rows > 0;

// Test 2: Zkusit vložit testovací elevation data
$test_elevation_data = json_encode([
    'elevations' => [500, 520, 540],
    'minElevation' => 500,
    'maxElevation' => 540,
    'avgElevation' => 520
]);

$test_result = ['ok' => true, 'tests' => []];

// Test existence sloupce
$test_result['tests']['column_exists'] = $column_exists;

if ($column_exists) {
    // Test vložení dat
    $stmt = $mysqli->prepare("UPDATE map_features SET elevation_data = ? WHERE id = ? LIMIT 1");
    if ($stmt) {
        $test_id = 1; // Test s prvním záznamem
        $stmt->bind_param("si", $test_elevation_data, $test_id);
        if ($stmt->execute()) {
            $test_result['tests']['insert_test'] = 'success';
        } else {
            $test_result['tests']['insert_test'] = 'failed: ' . $stmt->error;
        }
        $stmt->close();
    } else {
        $test_result['tests']['insert_test'] = 'failed: prepare error - ' . $mysqli->error;
    }
    
    // Test čtení dat
    $result = $mysqli->query("SELECT elevation_data FROM map_features WHERE id = 1 LIMIT 1");
    if ($result && $row = $result->fetch_assoc()) {
        $test_result['tests']['read_test'] = 'success';
        $test_result['tests']['sample_data'] = $row['elevation_data'];
    } else {
        $test_result['tests']['read_test'] = 'failed';
    }
} else {
    $test_result['tests']['insert_test'] = 'skipped - column does not exist';
    $test_result['tests']['read_test'] = 'skipped - column does not exist';
}

$mysqli->close();

echo json_encode($test_result, JSON_UNESCAPED_UNICODE);
?>
