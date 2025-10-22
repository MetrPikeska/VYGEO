# VYGEO OPALENA - Interaktivní mapová aplikace

Interaktivní webová aplikace pro správu geografických dat s podporou nadmořských výšek, počasí a GPS funkcí.

## Funkce

- **Mapová vrstva** - Interaktivní mapa s vlastními dlaždicemi
- **Správa objektů** - Vytváření, editace a mazání polygonů, linií a bodů
- **Nadmořské výšky** - Automatické získávání elevation dat z API
- **Počasí** - Zobrazení aktuální teploty a počasí
- **GPS funkce** - Uložení aktuální pozice zařízení
- **Správa barev** - Výběr barev pro objekty z předdefinované palety
- **Databáze** - Ukládání dat do MySQL databáze
- **Kalkulačka vlhké teploty** - Nástroj pro určení podmínek zasněžování
- **Správa vrstev** - Přepínání viditelnosti mapových vrstev
- **Autentizace** - Admin přístup k pokročilým funkcím
- **Foto galerie** - Nahrávání a zobrazování fotografií k mapovým objektům

## Technologie

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapa**: Leaflet.js
- **Backend**: PHP 7.4+
- **Databáze**: MySQL 5.7+
- **API**: RESTful API pro správu dat
- **Bezpečnost**: Chráněné API klíče, CORS omezení

## Struktura projektu

```
VYGEO/
├── api/                    # PHP API endpointy
│   ├── features.php        # Hlavní API pro features
│   ├── map_proxy.php       # Proxy pro mapové API
│   ├── weather_proxy.php   # Proxy pro počasí API
│   ├── auth.php            # Autentizace
│   ├── upload_photo.php    # API pro nahrávání fotografií
│   ├── create_feature_photos_table.sql # SQL pro vytvoření tabulky fotografií
│   └── db_config.php       # Databázová konfigurace
├── assets/                 # Statické soubory
│   ├── icons/             # Ikony
│   ├── images/            # Obrázky
│   └── models/            # 3D modely
├── css/                   # Styly
├── data/                  # Datové soubory
├── tiles/                 # Mapové dlaždice
├── features.js            # Správa mapových objektů (s foto funkcionalitou)
├── map.js                 # Mapová logika
├── weather.js             # Počasí
├── wet-bulb-calculator.js # Kalkulačka vlhké teploty
├── auth.js                # Autentizační logika
├── app.js                 # Hlavní aplikace
├── test_photo_upload.html # Testovací rozhraní pro foto upload
├── index.html             # Hlavní stránka
└── README.md
```

## Instalace

### 1. Klonování repozitáře
```bash
git clone https://github.com/vasusername/VYGEO.git
cd VYGEO
```

### 2. Nastavení databáze
```sql
CREATE DATABASE vygeo;
CREATE TABLE map_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    geojson TEXT,
    elevation_data TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Konfigurace prostředí
Vytvořte `.env` soubor s vašimi údaji:
```env
DB_HOST=localhost
DB_USER=username
DB_PASS=password
DB_NAME=vygeo
MAPY_CZ_API_KEY=your_api_key
OPENWEATHER_API_KEY=your_api_key
```

### 4. Spuštění
```bash
# PHP server
php -S localhost:8000

# Nebo použijte Apache/Nginx
```

## Použití

1. **Otevřete** `index.html` v prohlížeči
2. **Vytvořte objekty** pomocí nástrojů vpravo
3. **Vyberte barvu** z palety při vytváření
4. **Uložte GPS pozici** pomocí tlačítka GPS
5. **Spravujte objekty** v panelu vlevo
6. **Přihlaste se jako admin** pro pokročilé funkce
7. **Použijte kalkulačku vlhké teploty** pro zasněžování

## API Endpointy

- `GET /api/features.php?action=list` - Seznam všech objektů
- `POST /api/features.php` - Vytvoření nového objektu
- `PUT /api/features.php` - Aktualizace objektu
- `DELETE /api/features.php?id=X` - Smazání objektu
- `POST /api/auth.php` - Autentizace
- `GET /api/map_proxy.php` - Proxy pro mapové dlaždice
- `GET /api/weather_proxy.php` - Proxy pro počasí

## Bezpečnost

- API klíče jsou chráněny proxy servery
- CORS je omezeno na povolené domény
- Debug mód je vypnut v produkci
- Databázové údaje jsou v .env souboru

## Licence

MIT License

## Autor

Petr Mikeska - [petrmikeska.cz](https://petrmikeska.cz)