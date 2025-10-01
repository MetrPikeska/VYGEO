# 📁 VYGEO - Struktura projektu

## 🎯 Organizace souborů

Projekt byl reorganizován pro lepší přehlednost a údržbu. Všechny soubory jsou nyní logicky roztříděny do tematických složek.

## 📂 Struktura složek

```
vygeo/
├── index.html                 # Hlavní HTML soubor
├── README.md                  # Dokumentace projektu
├── PROJECT_STRUCTURE.md       # Tento soubor - popis struktury
├── prace.txt                  # Poznámky k práci
│
├── css/                       # Styly a CSS soubory
│   ├── visual.css            # Hlavní styly aplikace
│   ├── style.css             # Dodatečné styly
│   └── leaflet.css           # Leaflet mapové styly
│
├── assets/                    # Statické soubory
│   ├── images/               # Obrázky
│   │   ├── favicon.png       # Ikona stránky
│   │   ├── marker-icon.png   # Ikona markeru
│   │   └── opalena_ortofoto.jpg # Ortofoto mapy
│   ├── icons/                # SVG ikony
│   │   ├── marker-icon.svg   # SVG ikona markeru
│   │   ├── menu.svg          # Menu ikona
│   │   ├── webcam.svg        # Webcam ikona
│   │   └── bod_lokace.svg    # Ikona lokace
│   └── models/               # 3D modely
│       ├── dig_dvojce_opalena.glb  # GLB 3D model
│       ├── dig_dvojce_opalena.ply  # PLY 3D model
│       └── yolov8n.pt        # AI model pro detekci
│
├── api/                       # Backend API soubory (PHP)
│   ├── auth.php              # Autentizace
│   ├── auth_config.php       # Konfigurace autentizace
│   ├── features.php          # Správa geografických prvků
│   ├── get_features.php      # Získání prvků z DB
│   ├── save_features.php     # Uložení prvků do DB
│   ├── delete_features.php   # Mazání prvků z DB
│   ├── get_sheep.php         # API pro počet lyžařů
│   └── update.php            # Aktualizace dat
│
├── scripts/                   # Python skripty
│   ├── get_sheep.py          # Skript pro získání dat o lyžařích
│   ├── sheep_counter.py      # Počítač lyžařů
│   └── send_test.py          # Testovací skript
│
├── data/                      # Datové soubory
│   └── sheep.json            # JSON data o lyžařích
│
├── tiles/                     # Mapové dlaždice
│   ├── 16/                   # Zoom level 16
│   ├── 17/                   # Zoom level 17
│   ├── 18/                   # Zoom level 18
│   └── 19/                   # Zoom level 19
│
├── snow_calc/                 # Sněhová kalkulačka
│   ├── snowcalc.html         # HTML kalkulačky
│   └── snowcalc.js           # JavaScript kalkulačky
│
└── backup/                    # Zálohy
    └── zaloha/               # Stará záloha před reorganizací
```

## 🔧 Aktualizované cesty

Všechny odkazy v kódu byly aktualizovány:

### CSS soubory
- `href="visual.css"` → `href="css/visual.css"`
- `href="style.css"` → `href="css/style.css"`
- `href="leaflet.css"` → `href="css/leaflet.css"`

### Obrázky a ikony
- `href="favicon.png"` → `href="assets/images/favicon.png"`
- `iconUrl: 'marker-icon.svg'` → `iconUrl: 'assets/icons/marker-icon.svg'`
- `iconUrl: 'webcam.svg'` → `iconUrl: 'assets/icons/webcam.svg'`
- `iconUrl: 'bod_lokace.svg'` → `iconUrl: 'assets/icons/bod_lokace.svg'`

### API endpointy
- `fetch('get_sheep.php')` → `fetch('api/get_sheep.php')`
- `fetch('auth.php')` → `fetch('api/auth.php')`
- `fetch('save_features.php')` → `fetch('api/save_features.php')`
- `fetch('get_features.php')` → `fetch('api/get_features.php')`
- `fetch('delete_features.php')` → `fetch('api/delete_features.php')`

### 3D modely a textury
- `url: 'opalena_ortofoto.jpg'` → `url: 'assets/images/opalena_ortofoto.jpg'`
- `modelPath = 'dig_dvojce_opalena.glb'` → `modelPath = 'assets/models/dig_dvojce_opalena.glb'`
- `plyLoader.load('dig_dvojce_opalena.ply')` → `plyLoader.load('assets/models/dig_dvojce_opalena.ply')`

### Mapové dlaždice
- `L.tileLayer('./{z}/{x}/{y}.png')` → `L.tileLayer('./tiles/{z}/{x}/{y}.png')`

## ✅ Výhody nové struktury

1. **Přehlednost** - Každý typ souboru má svou složku
2. **Údržba** - Snadnější nalezení a úprava souborů
3. **Škálovatelnost** - Jednoduché přidávání nových souborů
4. **Týmová práce** - Jasné rozdělení odpovědností
5. **Deployment** - Snadnější nasazení na server
6. **Backup** - Jednodušší zálohování specifických částí

## 🚀 Spuštění

Aplikace funguje stejně jako předtím - stačí otevřít `index.html` v prohlížeči. Všechny cesty byly automaticky aktualizovány.

## 📝 Poznámky

- Stará záloha je uložena ve složce `backup/zaloha/`
- Všechny funkce zůstávají nezměněny
- Mobilní rozhraní funguje bez problémů
- 3D vizualizace a mapy jsou plně funkční
