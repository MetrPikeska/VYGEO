<?php
// Hybrid features API - zkusí vzdálenou databázi, pokud selže, použije lokální
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Europe/Prague');

// Debug mode - remove in production
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Vzdálená databáze
$remote_db_host = "md397.wedos.net";
$remote_db_user = "w383750_vygeo";
$remote_db_pass = "7JAWfDdh";
$remote_db_name = "d383750_vygeo";

// Lokální databáze
$local_db_file = __DIR__ . '/features.db';

$use_remote = false;
$pdo = null;

// Zkusit připojení k vzdálené databázi
try {
    $mysqli = new mysqli($remote_db_host, $remote_db_user, $remote_db_pass, $remote_db_name);
    if (!$mysqli->connect_error && $mysqli->ping()) {
        $use_remote = true;
        $mysqli->set_charset('utf8mb4');
        echo json_encode(['debug' => 'Using remote MySQL database']);
    }
} catch (Exception $e) {
    // Vzdálená databáze nedostupná, použít lokální
}

// Pokud vzdálená databáze nefunguje, použít lokální SQLite
if (!$use_remote) {
    try {
        $pdo = new PDO("sqlite:$local_db_file");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Vytvořit tabulku pokud neexistuje
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
        echo json_encode(['ok'=>false, 'error'=>'Local DB error: '.$e->getMessage()]);
        exit;
    }
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
    if ($use_remote) {
        // Použít MySQL
        $sql = "SELECT id, name, type, geojson, elevation_data, created_at FROM map_features ORDER BY id ASC";
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
    } else {
        // Použít SQLite
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
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['ok'=>false, 'error'=>$e->getMessage()]);
        }
    }
    exit;
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

            $validTypes = ['Point','LineString','Polygon'];
            if (!in_array($type, $validTypes, true)) {
                http_response_code(400);
                echo json_encode(['ok'=>false, 'error'=>'Invalid type']);
                exit;
            }

            $geojson = json_encode($geometry, JSON_UNESCAPED_UNICODE);
            $elevation_json = $elevation_data ? json_encode($elevation_data, JSON_UNESCAPED_UNICODE) : null;
            
            if ($use_remote) {
                // Použít MySQL
                $stmt = $mysqli->prepare("INSERT INTO map_features (name, type, geojson, elevation_data) VALUES (?, ?, ?, ?)");
                if (!$stmt) {
                    http_response_code(500);
                    echo json_encode(['ok'=>false, 'error'=>$mysqli->error]);
                    exit;
                }
                $stmt->bind_param("ssss", $name, $type, $geojson, $elevation_json);
                if (!$stmt->execute()) {
                    http_response_code(500);
                    echo json_encode(['ok'=>false, 'error'=>$stmt->error]);
                    exit;
                }
                $newId = $stmt->insert_id;
                $stmt->close();
            } else {
                // Použít SQLite
                $stmt = $pdo->prepare("INSERT INTO map_features (name, type, geojson, elevation_data) VALUES (?, ?, ?, ?)");
                $stmt->execute([$name, $type, $geojson, $elevation_json]);
                $newId = $pdo->lastInsertId();
            }

            echo json_encode(['ok'=>true, 'id'=>$newId]);
            exit;
        }

        // Další akce (update, delete) - implementovat podle potřeby
        http_response_code(400);
        echo json_encode(['ok'=>false, 'error'=>'Action not implemented in hybrid mode']);
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
