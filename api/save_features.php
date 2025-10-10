<?php
session_start([
  'cookie_httponly' => true,
  'cookie_samesite' => 'Lax',
  'cookie_secure' => isset($_SERVER['HTTPS'])
]);
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

// CSRF kontrola
$csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!$csrfHeader || !isset($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $csrfHeader)) {
  http_response_code(403);
  echo json_encode(['error' => 'CSRF invalid']);
  exit;
}

$pdo = new PDO(
    "mysql:host=md397.wedos.net;dbname=d383750_vygeo;charset=utf8mb4",
    "w383750_vygeo",
    "7JAWfDdh"
);

// Načíst vstup (GeoJSON objekt)
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['geometry'])) {
    echo json_encode(["error" => "Invalid input"]);
    exit;
}

$action = $input['properties']['action'] ?? 'create';
$name   = substr(trim($input['properties']['name'] ?? ''), 0, 100);
$type   = $input['geometry']['type'] ?? '';
$geojson = json_encode($input['geometry'], JSON_UNESCAPED_UNICODE);

// CREATE
if ($action === 'create') {
    $stmt = $pdo->prepare("INSERT INTO map_features (name, type, geojson, user_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $type, $geojson, $_SESSION['user']]);
    echo json_encode(["id" => $pdo->lastInsertId()]);
}
// UPDATE
elseif ($action === 'update' && !empty($input['properties']['id'])) {
    $id = intval($input['properties']['id']);
    // Omez: vlastník nebo admin (pro jednoduchost admin = 'admin')
    if ($_SESSION['user'] !== 'admin') {
      $check = $pdo->prepare("SELECT user_id FROM map_features WHERE id=?");
      $check->execute([$id]);
      $owner = $check->fetchColumn();
      if ($owner !== $_SESSION['user']) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
      }
    }
    $stmt = $pdo->prepare("UPDATE map_features SET name=?, type=?, geojson=? WHERE id=?");
    $stmt->execute([$name, $type, $geojson, $id]);
    echo json_encode(["id" => $id]);
}
else {
    echo json_encode(["error" => "Invalid action"]);
}
