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

$method = $_SERVER['REQUEST_METHOD'];
$config = require __DIR__ . '/auth_config.php';

function issue_csrf_token() {
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
  }
  return $_SESSION['csrf'];
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
  $input = json_decode(file_get_contents('php://input'), true) ?: [];
  $user = $input['username'] ?? '';
  $pass = $input['password'] ?? '';
  $hash = $config['users'][$user] ?? null;
  if ($hash && password_verify($pass, $hash)) {
    $_SESSION['user'] = $user;
    echo json_encode(['ok' => true, 'user' => $user, 'csrf' => issue_csrf_token()]);
  } else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
  }
  exit;
}

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'logout') {
  session_destroy();
  echo json_encode(['ok' => true]);
  exit;
}

if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'status') {
  $logged = isset($_SESSION['user']);
  echo json_encode(['loggedIn' => $logged, 'user' => $logged ? $_SESSION['user'] : null, 'csrf' => $logged ? issue_csrf_token() : null]);
  exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);


