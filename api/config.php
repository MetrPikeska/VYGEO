<?php
// API endpoint pro konfiguraci aplikace
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Zpracování preflight OPTIONS požadavku
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Načtení environment variables nebo fallback hodnot
$config = [
    'HOME_POINT' => [49.5535106, 18.3143814],
    'WEBCAM_POINT' => [49.55469, 18.31718],
    'RESTAURANT_POINT' => [49.554639465762186, 18.314282670706472],
    
    // API klíče - načítají se z environment variables nebo fallback
    'MAPY_CZ_API_KEY' => $_ENV['MAPY_CZ_API_KEY'] ?? '5ZtGuQEtvV37xyC_1IJnglc8ZgP53ehgvFqTiHuaFoI',
    'OPENWEATHER_API_KEY' => $_ENV['OPENWEATHER_API_KEY'] ?? '82bf6119dd0ae6ac5884ab9e60ad6fe0',
    
    // URL adresy
    'HLS_STREAM_URL' => "https://stream.teal.cz/hls/cam273.m3u8",
    'UPDATE_URL' => "https://petrmikeska.cz/vygeo/api/update.php",
    'GET_SHEEP_URL' => "https://petrmikeska.cz/vygeo/api/get_sheep.php",
    'GET_FEATURES_URL' => "https://petrmikeska.cz/vygeo/api/get_features.php",
    
    // Intervaly
    'SHEEP_UPDATE_INTERVAL' => 2000,
    'TEMP_UPDATE_INTERVAL' => 5 * 60 * 1000,
    
    // YOLO model
    'MODEL_PATH' => "yolov8n.pt",
    'CONFIDENCE_THRESHOLD' => 0.3,
    
    // Barvy vleků podle počtu ovcí
    'LIFT_COLORS' => [
        0 => "green",
        1 => "yellow", 
        2 => "yellow",
        3 => "red"
    ]
];

echo json_encode($config);
?>
