<?php
header('Content-Type: application/json; charset=utf-8');

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);

// fallback pro případ form-data
if (!$payload) { 
    $payload = $_POST; 
}

if (!isset($payload['count'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing count']);
    exit;
}

$data = [
    'timestamp' => $payload['timestamp'] ?? date('Y-m-d H:i:s'),
    'count'     => (int)$payload['count'],
];

// --- uložit poslední hodnotu do sheep.json ---
$file = __DIR__ . '/sheep.json';
if (file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Cannot write sheep.json']);
    exit;
}

// --- uložit i do logu sheep_log.csv ---
$logfile = __DIR__ . '/sheep_log.csv';
$line = $data['timestamp'] . "," . $data['count'] . "\n";
if (file_put_contents($logfile, $line, FILE_APPEND | LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Cannot write sheep_log.csv']);
    exit;
}

echo json_encode(['ok' => true, 'saved' => $data]);
