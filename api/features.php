<?php
// Debug mode - remove in production
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS hlavičky pro produkční hosting
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Zpracování preflight OPTIONS požadavku
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
date_default_timezone_set('Europe/Prague');

/**
 * Simple GeoJSON features API
 * Methods:
 *   GET  ?action=list                      -> FeatureCollection of all features
 *   POST {action:create, name, type, geometry}     -> create feature
 *   POST {action:update, id, name?, geometry?}     -> update name and/or geometry
 *   POST {action:delete, ids: [1,2,3]}             -> delete multiple by ids
 */

// === DB credentials (Wedos - skript uživatel) ===
$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo";
$db_pass = "7JAWfDdh";
$db_name = "d383750_vygeo";

try {
    // Nastavit timeout pro připojení
    ini_set('default_socket_timeout', 10);
    
    $mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name, 3306);
    
    if ($mysqli->connect_error) {
        http_response_code(500);
        echo json_encode([
            'ok'=>false, 
            'error'=>'DB connect fail: '.$mysqli->connect_error,
            'error_code' => $mysqli->connect_errno,
            'host' => $db_host,
            'port' => 3306
        ]);
        exit;
    }
    
    $mysqli->set_charset('utf8mb4');
    
    // Nastavit timeout pro dotazy
    $mysqli->options(MYSQLI_OPT_CONNECT_TIMEOUT, 10);
    $mysqli->options(MYSQLI_OPT_READ_TIMEOUT, 10);
    
    // Test připojení
    if (!$mysqli->ping()) {
        http_response_code(500);
        echo json_encode(['ok'=>false, 'error'=>'DB connection lost after ping']);
        exit;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'ok'=>false, 
        'error'=>'DB connection error: '.$e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
}

// Helper: read JSON body
function read_json_body() {
    $raw = file_get_contents('php://input');
    if ($raw) {
        $json = json_decode($raw, true);
        if (is_array($json)) return $json;
    }
    return null;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

if ($method === 'GET' && $action === 'list') {
    // List all features as FeatureCollection
    // Zkontrolovat, zda sloupec elevation_data existuje
    $check_elevation = $mysqli->query("SHOW COLUMNS FROM map_features LIKE 'elevation_data'");
    $has_elevation_column = $check_elevation && $check_elevation->num_rows > 0;
    
    if ($has_elevation_column) {
        $sql = "SELECT id, name, type, geojson, elevation_data, created_at FROM map_features ORDER BY id ASC";
    } else {
        $sql = "SELECT id, name, type, geojson, created_at FROM map_features ORDER BY id ASC";
    }
    $res = $mysqli->query($sql);
    if (!$res) {
        http_response_code(500);
        echo json_encode(['ok'=>false, 'error'=>$mysqli->error]);
        exit;
    }

    $features = [];
    while ($row = $res->fetch_assoc()) {
        $geom = json_decode($row['geojson'], true);
        if (!$geom) continue;
        
        $properties = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'created_at' => $row['created_at']
        ];
        
        // Add elevation data if available
        if ($has_elevation_column && isset($row['elevation_data']) && $row['elevation_data']) {
            $elevation_data = json_decode($row['elevation_data'], true);
            if ($elevation_data) {
                $properties = array_merge($properties, $elevation_data);
            }
        }
        
        $features[] = [
            'type' => 'Feature',
            'id'   => (int)$row['id'],
            'properties' => $properties,
            'geometry' => $geom
        ];
    }

    echo json_encode([
        'type' => 'FeatureCollection',
        'features' => $features
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    try {
        $body = read_json_body();
        if (!$body) {
            // fallback for form-encoded
            $body = $_POST ?? [];
        }
        $action = $body['action'] ?? null;

    if ($action === 'create') {
        $name = trim($body['name'] ?? '');
        $type = trim($body['type'] ?? '');
        $geometry = $body['geometry'] ?? null;
        $elevation_data = $body['elevation_data'] ?? null;

        if ($name === '' || !$geometry || $type === '') {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'Missing name/type/geometry']);
            exit;
        }

        // Validate type
        $validTypes = ['Point','LineString','Polygon'];
        if (!in_array($type, $validTypes, true)) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'Invalid type']);
            exit;
        }

        $geojson = json_encode($geometry, JSON_UNESCAPED_UNICODE);
        // Zkontrolovat, zda sloupec elevation_data existuje
        $check_elevation = $mysqli->query("SHOW COLUMNS FROM map_features LIKE 'elevation_data'");
        $has_elevation_column = $check_elevation && $check_elevation->num_rows > 0;
        
        if ($has_elevation_column) {
            $elevation_json = $elevation_data ? json_encode($elevation_data, JSON_UNESCAPED_UNICODE) : null;
            $stmt = $mysqli->prepare("INSERT INTO map_features (name, type, geojson, elevation_data) VALUES (?, ?, ?, ?)");
        } else {
            $stmt = $mysqli->prepare("INSERT INTO map_features (name, type, geojson) VALUES (?, ?, ?)");
        }
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$mysqli->error]);
            exit;
        }
        if ($has_elevation_column) {
            $stmt->bind_param("ssss", $name, $type, $geojson, $elevation_json);
        } else {
            $stmt->bind_param("sss", $name, $type, $geojson);
        }
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$stmt->error]);
            exit;
        }
        $newId = $stmt->insert_id;
        $stmt->close();

        echo json_encode(['ok'=>true, 'id'=>$newId]);
        exit;
    }

    if ($action === 'update') {
        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'Missing id']);
            exit;
        }

        $name = isset($body['name']) ? trim($body['name']) : null;
        $geometry = $body['geometry'] ?? null;
        $elevation_data = $body['elevation_data'] ?? null;

        if ($name === null && $geometry === null && $elevation_data === null) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'Nothing to update']);
            exit;
        }

        // Build dynamic SQL based on what's being updated
        $updates = [];
        $params = [];
        $types = '';

        if ($name !== null) {
            $updates[] = "name = ?";
            $params[] = $name;
            $types .= 's';
        }

        if ($geometry !== null) {
            $geojson = json_encode($geometry, JSON_UNESCAPED_UNICODE);
            $updates[] = "geojson = ?";
            $params[] = $geojson;
            $types .= 's';
        }

        if ($elevation_data !== null) {
            // Zkontrolovat, zda sloupec elevation_data existuje
            $check_elevation = $mysqli->query("SHOW COLUMNS FROM map_features LIKE 'elevation_data'");
            $has_elevation_column = $check_elevation && $check_elevation->num_rows > 0;
            
            if ($has_elevation_column) {
                $elevation_json = json_encode($elevation_data, JSON_UNESCAPED_UNICODE);
                $updates[] = "elevation_data = ?";
                $params[] = $elevation_json;
                $types .= 's';
            }
        }

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE map_features SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $mysqli->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$mysqli->error]);
            exit;
        }
        $stmt->bind_param($types, ...$params);

        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$stmt->error]);
            exit;
        }
        $stmt->close();
        echo json_encode(['ok'=>true]);
        exit;
    }

    if ($action === 'delete') {
        $ids = $body['ids'] ?? [];
        if (!is_array($ids) || empty($ids)) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'Missing ids array']);
            exit;
        }
        // sanitize
        $ids = array_values(array_filter(array_map('intval', $ids), fn($v)=>$v>0));
        if (empty($ids)) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'No valid ids']);
            exit;
        }
        // Build IN (...)
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types = str_repeat('i', count($ids));
        $stmt = $mysqli->prepare("DELETE FROM map_features WHERE id IN ($placeholders)");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$mysqli->error]);
            exit;
        }
        $stmt->bind_param($types, ...$ids);
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$stmt->error]);
            exit;
        }
        $stmt->close();
        echo json_encode(['ok'=>true, 'deleted'=>count($ids)]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['ok'=>false, 'error'=>'Unknown action']);
    exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok'=>false, 'error'=>'Server error: '.$e->getMessage()]);
        exit;
    }
}

// default
http_response_code(400);
echo json_encode(['ok'=>false, 'error'=>'Unsupported request']);
