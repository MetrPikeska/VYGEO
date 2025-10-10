# VYGEO OPALENA - Interaktivní mapová aplikace

Interaktivní webová aplikace pro správu geografických dat s podporou nadmořských výšek, počasí a GPS funkcí.

## 🚀 Funkce

- **Mapová vrstva** - Interaktivní mapa s vlastními dlaždicemi
- **Správa objektů** - Vytváření, editace a mazání polygonů, linií a bodů
- **Nadmořské výšky** - Automatické získávání elevation dat z API
- **Počasí** - Zobrazení aktuální teploty a počasí
- **GPS funkce** - Uložení aktuální pozice zařízení
- **Správa barev** - Výběr barev pro objekty z předdefinované palety
- **Databáze** - Ukládání dat do MySQL databáze

## 🛠️ Technologie

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapa**: Leaflet.js
- **Backend**: PHP 7.4+
- **Databáze**: MySQL 5.7+
- **API**: RESTful API pro správu dat

## 📁 Struktura projektu

```
VYGEO/
├── api/                    # PHP API endpointy
│   ├── features.php        # Hlavní API pro features
│   ├── test_db_connection.php
│   └── add_elevation_column.sql
├── assets/                 # Statické soubory
│   ├── icons/             # Ikony
│   ├── images/            # Obrázky
│   └── models/            # 3D modely
├── css/                   # Styly
├── data/                  # Datové soubory
├── tiles/                 # Mapové dlaždice
├── features.js            # Správa mapových objektů
├── map.js                 # Mapová logika
├── weather.js             # Počasí
├── index.html             # Hlavní stránka
└── README.md
```

## 🚀 Instalace

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

### 3. Konfigurace API
Upravte `api/features.php` s vašimi databázovými údaji:
```php
$db_host = "localhost";
$db_user = "username";
$db_pass = "password";
$db_name = "vygeo";
```

### 4. Spuštění
```bash
# PHP server
php -S localhost:8000

# Nebo použijte Apache/Nginx
```

## 📖 Použití

1. **Otevřete** `index.html` v prohlížeči
2. **Vytvořte objekty** pomocí nástrojů vpravo
3. **Vyberte barvu** z palety při vytváření
4. **Uložte GPS pozici** pomocí tlačítka GPS
5. **Spravujte objekty** v panelu vlevo

## 🔧 API Endpointy

- `GET /api/features.php?action=list` - Seznam všech objektů
- `POST /api/features.php` - Vytvoření nového objektu
- `PUT /api/features.php` - Aktualizace objektu
- `DELETE /api/features.php?id=X` - Smazání objektu

## 📝 Licence

MIT License

## 👨‍💻 Autor

Petr Mikeška - [petrmikeska.cz](https://petrmikeska.cz)