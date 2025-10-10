<?php
// Local features API with SQLite database
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Europe/Prague');

// Debug mode - remove in production
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Use SQLite instead of MySQL
$db_file = __DIR__ . '/features.db';

try {
    $pdo = new PDO("sqlite:$db_file");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS map_features (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            geojson TEXT NOT NULL,
            elevation_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false, 'error'=>'DB connection error: '.$e->getMessage()]);
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
    try {
        $stmt = $pdo->query("SELECT id, name, type, geojson, elevation_data, created_at FROM map_features ORDER BY id ASC");
        $features = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $geom = json_decode($row['geojson'], true);
            if (!$geom) continue;
            
            $properties = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'type' => $row['type'],
                'created_at' => $row['created_at']
            ];
            
            // Add elevation data if available
            if ($row['elevation_data']) {
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
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]);
        exit;
    }
}

if ($method === 'POST') {
    try {
        $body = read_json_body();
        if (!$body) {
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
            $elevation_json = $elevation_data ? json_encode($elevation_data, JSON_UNESCAPED_UNICODE) : null;
            
            $stmt = $pdo->prepare("INSERT INTO map_features (name, type, geojson, elevation_data) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $type, $geojson, $elevation_json]);
            $newId = $pdo->lastInsertId();

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

            // Build dynamic SQL
            $updates = [];
            $params = [];

            if ($name !== null) {
                $updates[] = "name = ?";
                $params[] = $name;
            }

            if ($geometry !== null) {
                $geojson = json_encode($geometry, JSON_UNESCAPED_UNICODE);
                $updates[] = "geojson = ?";
                $params[] = $geojson;
            }

            if ($elevation_data !== null) {
                $elevation_json = json_encode($elevation_data, JSON_UNESCAPED_UNICODE);
                $updates[] = "elevation_data = ?";
                $params[] = $elevation_json;
            }

            $updates[] = "updated_at = CURRENT_TIMESTAMP";
            $params[] = $id;

            $sql = "UPDATE map_features SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

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
            
            $ids = array_values(array_filter(array_map('intval', $ids), fn($v)=>$v>0));
            if (empty($ids)) {
                http_response_code(400);
                echo json_encode(['ok'=>false, 'error'=>'No valid ids']);
                exit;
            }
            
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM map_features WHERE id IN ($placeholders)");
            $stmt->execute($ids);
            
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
?>
