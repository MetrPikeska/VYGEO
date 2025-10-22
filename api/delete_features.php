<?php
session_start([
  'cookie_httponly' => true,
  'cookie_samesite' => 'Lax',
  'cookie_secure' => isset($_SERVER['HTTPS'])
]);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

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

$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['id'])) {
    echo json_encode(["error" => "Missing id"]);
    exit;
}

$id = intval($input['id']);

// Omez: vlastník nebo admin
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

$stmt = $pdo->prepare("DELETE FROM map_features WHERE id=?");
$stmt->execute([$id]);

echo json_encode(["deleted" => $id]);
