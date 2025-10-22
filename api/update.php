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

// === Zpracování vstupu ===
$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!$payload) { $payload = $_POST; }

if (!isset($payload['count'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing count']);
    exit;
}

$data = [
    'timestamp' => $payload['timestamp'] ?? date('Y-m-d H:i:s'),
    'count'     => (int)$payload['count'],
];

// === Uložit poslední hodnotu do JSON (pro rychlé čtení) ===
// --- Uložit poslední hodnotu do JSON (pro rychlé čtení) ---
$file = __DIR__ . '/sheep.json';
file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

// --- Uložit do databáze ---
$stmt = $mysqli->prepare("INSERT INTO sheep_log (`timestamp`, `count`) VALUES (?, ?)");
if (!$stmt) {
    echo json_encode(['ok' => false, 'error' => $mysqli->error]);
    exit;
}

$stmt->bind_param("si", $data['timestamp'], $data['count']);

if (!$stmt->execute()) {
    echo json_encode(['ok' => false, 'error' => $stmt->error]);
    exit;
}

$stmt->close();
$mysqli->close();

echo json_encode(['ok' => true, 'saved' => $data]);

