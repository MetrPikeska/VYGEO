<?php
// Proxy pro počasí - skrývá API klíč
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Načtení konfigurace
$config = require_once __DIR__ . '/db_config.php';
$api_key = $_ENV['OPENWEATHER_API_KEY'] ?? '82bf6119dd0ae6ac5884ab9e60ad6fe0';

// Získání parametrů
$lat = $_GET['lat'] ?? 49.5535106;
$lon = $_GET['lon'] ?? 18.3143814;

// Validace
if (!is_numeric($lat) || !is_numeric($lon)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid coordinates']);
    exit;
}

// Sestavení URL pro OpenWeather
$url = "https://api.openweathermap.org/data/2.5/onecall?lat={$lat}&lon={$lon}&appid={$api_key}&units=metric&lang=cz";

// Stáhnout data z OpenWeather
$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'user_agent' => 'VYGEO-Weather-Proxy/1.0'
    ]
]);

$weather_data = file_get_contents($url, false, $context);

if ($weather_data === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Weather service unavailable']);
    exit;
}

// Vrátit data
echo $weather_data;
?>
