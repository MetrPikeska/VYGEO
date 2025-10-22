<?php
// Database configuration for VYGEO application
function getDbConnection() {
    // Zkusit načíst konfiguraci z environment variables nebo použít výchozí
    $db_host = $_ENV['DB_HOST'] ?? "md397.wedos.net";
    $db_user = $_ENV['DB_USER'] ?? "w383750_vygeo";
    $db_pass = $_ENV['DB_PASS'] ?? "7JAWfDdh";
    $db_name = $_ENV['DB_NAME'] ?? "d383750_vygeo";
    
    $mysqli = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($mysqli->connect_error) {
        throw new Exception("Database connection failed: " . $mysqli->connect_error);
    }
    
    $mysqli->set_charset("utf8");
    return $mysqli;
}

// Funkce pro získání PDO připojení
function getPdoConnection() {
    $db_host = $_ENV['DB_HOST'] ?? "md397.wedos.net";
    $db_user = $_ENV['DB_USER'] ?? "w383750_vygeo";
    $db_pass = $_ENV['DB_PASS'] ?? "7JAWfDdh";
    $db_name = $_ENV['DB_NAME'] ?? "d383750_vygeo";
    
    return new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
}
?>
