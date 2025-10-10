<?php
header('Content-Type: application/json; charset=utf-8');
$pdo = new PDO(
    "mysql:host=md397.wedos.net;dbname=d383750_vygeo;charset=utf8mb4",
    "w383750_vygeo",
    "7JAWfDdh"
);


$stmt = $pdo->query("SELECT * FROM map_features ORDER BY id ASC");
$features = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $geometry = json_decode($row['geojson'], true);
    if (!$geometry) continue;

    $properties = [
        "id" => (int)$row['id'],
        "name" => $row['name'],
        "type" => $row['type'],
        "created_at" => $row['created_at']
    ];
    
    // Add elevation data if available
    if (!empty($row['elevation_data'])) {
        $elevation_data = json_decode($row['elevation_data'], true);
        if ($elevation_data) {
            $properties = array_merge($properties, $elevation_data);
        }
    }

    $features[] = [
        "type" => "Feature",
        "geometry" => $geometry,
        "properties" => $properties
    ];
}

echo json_encode([
    "type" => "FeatureCollection",
    "features" => $features
], JSON_UNESCAPED_UNICODE);
