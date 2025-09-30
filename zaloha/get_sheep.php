<?php
// get_sheep.php – jednoduché API pro front-end

header('Content-Type: application/json; charset=utf-8');
// vypnout cache, ať se ti v prohlížeči/drátě nelepí stará hodnota
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$file = __DIR__ . '/sheep.json';

if (!file_exists($file)) {
    echo json_encode(['count' => 0, 'timestamp' => null, 'note' => 'sheep.json not found']);
    exit;
}

$raw = file_get_contents($file);
$data = json_decode($raw, true);
if (!is_array($data)) {
    echo json_encode(['count' => 0, 'timestamp' => null, 'note' => 'invalid JSON']);
    exit;
}

$count = isset($data['count']) ? (int)$data['count'] : 0;
$timestamp = $data['timestamp'] ?? null;

echo json_encode(['count' => $count, 'timestamp' => $timestamp], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
