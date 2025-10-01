<?php
header('Content-Type: application/json; charset=utf-8');
$pdo = new PDO(
    "mysql:host=md397.wedos.net;dbname=d383750_opalena;charset=utf8mb4",
    "w383750_opalena",
    "65r9P7XW"
);


$stmt = $pdo->query("SELECT * FROM map_features ORDER BY id ASC");
$features = [];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $geometry = json_decode($row['geojson'], true);
    if (!$geometry) continue;

    $features[] = [
        "type" => "Feature",
        "geometry" => $geometry,
        "properties" => [
            "id" => (int)$row['id'],
            "name" => $row['name'],
            "type" => $row['type'],
            "created_at" => $row['created_at']
        ]
    ];
}

echo json_encode([
    "type" => "FeatureCollection",
    "features" => $features
], JSON_UNESCAPED_UNICODE);
