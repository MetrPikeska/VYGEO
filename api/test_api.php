<?php
// Test API endpoint
header('Content-Type: application/json; charset=utf-8');

// Test data
$testData = [
    'action' => 'create',
    'name' => 'Test Feature',
    'type' => 'Point',
    'geometry' => [
        'type' => 'Point',
        'coordinates' => [18.313, 49.554]
    ]
];

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = $testData;

// Include the main API file
ob_start();
include 'features.php';
$output = ob_get_clean();

// Check if output is valid JSON
$json = json_decode($output, true);
if (json_last_error() === JSON_ERROR_NONE) {
    echo json_encode([
        'status' => 'success',
        'message' => 'API returns valid JSON',
        'response' => $json
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'API returns invalid JSON',
        'raw_output' => $output,
        'json_error' => json_last_error_msg()
    ]);
}
?>
