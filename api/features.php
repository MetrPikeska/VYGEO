<?php
header('Content-Type: application/json; charset=utf-8');
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
$db_user = "w383750_opalena";
$db_pass = "65r9P7XW";
$db_name = "d383750_opalena";

$mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['ok'=>false, 'error'=>'DB connect fail: '.$mysqli->connect_error]);
    exit;
}
$mysqli->set_charset('utf8mb4');

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
    $sql = "SELECT id, name, type, geojson, created_at FROM map_features ORDER BY id ASC";
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
        $features[] = [
            'type' => 'Feature',
            'id'   => (int)$row['id'],
            'properties' => [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'type' => $row['type'],
                'created_at' => $row['created_at']
            ],
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
        $stmt = $mysqli->prepare("INSERT INTO map_features (name, type, geojson) VALUES (?, ?, ?)");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$mysqli->error]);
            exit;
        }
        $stmt->bind_param("sss", $name, $type, $geojson);
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

        if ($name === null && $geometry === null) {
            http_response_code(400);
            echo json_encode(['ok'=>false, 'error'=>'Nothing to update']);
            exit;
        }

        // Build dynamic SQL
        if ($name !== null && $geometry !== null) {
            $geojson = json_encode($geometry, JSON_UNESCAPED_UNICODE);
            $stmt = $mysqli->prepare("UPDATE map_features SET name=?, geojson=? WHERE id=?");
            if (!$stmt) { echo json_encode(['ok'=>false,'error'=>$mysqli->error]); exit; }
            $stmt->bind_param("ssi", $name, $geojson, $id);
        } elseif ($name !== null) {
            $stmt = $mysqli->prepare("UPDATE map_features SET name=? WHERE id=?");
            if (!$stmt) { echo json_encode(['ok'=>false,'error'=>$mysqli->error]); exit; }
            $stmt->bind_param("si", $name, $id);
        } else { // geometry only
            $geojson = json_encode($geometry, JSON_UNESCAPED_UNICODE);
            $stmt = $mysqli->prepare("UPDATE map_features SET geojson=? WHERE id=?");
            if (!$stmt) { echo json_encode(['ok'=>false,'error'=>$mysqli->error]); exit; }
            $stmt->bind_param("si", $geojson, $id);
        }

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
}

// default
http_response_code(400);
echo json_encode(['ok'=>false, 'error'=>'Unsupported request']);
