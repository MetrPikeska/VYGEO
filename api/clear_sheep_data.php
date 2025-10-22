<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
date_default_timezone_set('Europe/Prague');

$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo";
$db_pass = "7JAWfDdh";
$db_name = "d383750_vygeo";

$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB connect fail: ' . $mysqli->connect_error]);
    exit;
}

// Vymazat všechna data z tabulky sheep_log
$result = $mysqli->query("DELETE FROM sheep_log");
if (!$result) {
    echo json_encode(['ok' => false, 'error' => 'Failed to clear database: ' . $mysqli->error]);
    exit;
}

// Vymazat JSON soubor
$json_file = __DIR__ . '/sheep.json';
if (file_exists($json_file)) {
    unlink($json_file);
}

// Vytvořit nový prázdný JSON soubor s výchozí hodnotou
$default_data = [
    'timestamp' => date('Y-m-d H:i:s'),
    'count' => 0
];
file_put_contents($json_file, json_encode($default_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

$mysqli->close();

echo json_encode([
    'ok' => true, 
    'message' => 'Sheep data cleared successfully',
    'default_count' => 0
]);
?>
