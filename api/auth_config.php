<?php
// Jednoduchá konfigurace uživatele pro administraci editace prvků.
// Změň si prosím heslo i email podle potřeby.

return [
    'users' => [
        // username => password_hash
        'admin' => password_hash('opalena', PASSWORD_DEFAULT),
        'test' => password_hash('test123', PASSWORD_DEFAULT),
    ],
];


