<?php
// Proxy pro mapové dlaždice - skrývá API klíč
header('Content-Type: image/png');
header('Cache-Control: public, max-age=86400'); // Cache na 24 hodin

// Načtení API klíče
$api_key = $_ENV['MAPY_CZ_API_KEY'] ?? '5ZtGuQEtvV37xyC_1IJnglc8ZgP53ehgvFqTiHuaFoI';

// Získání parametrů z URL
$z = $_GET['z'] ?? 1;
$x = $_GET['x'] ?? 0;
$y = $_GET['y'] ?? 0;
$type = $_GET['type'] ?? 'basic';

// Validace parametrů
if (!is_numeric($z) || !is_numeric($x) || !is_numeric($y)) {
    http_response_code(400);
    exit('Invalid parameters');
}

if ($z < 1 || $z > 19) {
    http_response_code(400);
    exit('Invalid zoom level');
}

// Povolené typy map
$allowed_types = ['basic', 'winter', 'aerial', 'outdoor'];
if (!in_array($type, $allowed_types)) {
    $type = 'basic';
}

// Sestavení URL pro mapy.cz
$url = "https://api.mapy.cz/v1/maptiles/{$type}/256/{$z}/{$x}/{$y}?apikey={$api_key}";

// Stáhnout dlaždici z mapy.cz
$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'user_agent' => 'VYGEO-Map-Proxy/1.0'
    ]
]);

$tile_data = file_get_contents($url, false, $context);

if ($tile_data === false) {
    // Fallback - vrátit prázdný obrázek
    http_response_code(404);
    exit();
}

// Vrátit dlaždici
echo $tile_data;
?>
