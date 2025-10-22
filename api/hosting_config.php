<?php
// Hosting configuration for VYGEO application
// Tento soubor obsahuje konfiguraci pro nasazení na hosting

// Database configuration - upravte podle vašeho hostingu
$hosting_config = [
    'db_host' => 'localhost', // nebo IP adresa vašeho databázového serveru
    'db_user' => 'your_database_user', // vaše databázové uživatelské jméno
    'db_pass' => 'your_database_password', // vaše databázové heslo
    'db_name' => 'your_database_name', // název vaší databáze
    
    // API klíče - získejte z příslušných služeb
    'openweather_api_key' => 'your_openweather_api_key',
    'mapy_cz_api_key' => 'your_mapy_cz_api_key',
    
    // URL vašeho hostingu
    'app_url' => 'https://yourdomain.com',
    
    // CORS domény
    'allowed_origins' => [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'http://localhost',
        'http://127.0.0.1'
    ]
];

// Export konfigurace
return $hosting_config;
?>
