# 🔒 API klíče nyní chráněny!

## ✅ **Co bylo změněno:**

### **1. Mapové API klíče skryty**
- **Před:** API klíč viditelný v `config.js` (F12 → Sources)
- **Po:** API klíč na backendu v `api/map_proxy.php`
- **Výsledek:** Uživatel nevidí API klíč ani v Developer Tools

### **2. Počasí API klíč skryt**
- **Před:** API klíč viditelný v `config.js`
- **Po:** API klíč na backendu v `api/weather_proxy.php`
- **Výsledek:** Uživatel nevidí API klíč ani v Network tab

### **3. Jak to funguje:**

#### **Mapy:**
```javascript
// Před (nebezpečné):
L.tileLayer(`https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${CONFIG.MAPY_CZ_API_KEY}`)

// Po (bezpečné):
L.tileLayer('api/map_proxy.php?type=basic&z={z}&x={x}&y={y}')
```

#### **Počasí:**
```javascript
// Před (nebezpečné):
fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${CONFIG.OPENWEATHER_API_KEY}`)

// Po (bezpečné):
fetch(`api/weather_proxy.php?lat=${lat}&lon=${lon}`)
```

## 🛡️ **Bezpečnostní výhody:**

1. **API klíče nejsou viditelné** v Developer Tools
2. **API klíče nejsou v Git** repozitáři
3. **Kontrola přístupu** - můžete přidat autentizaci
4. **Rate limiting** - můžete omezit počet požadavků
5. **Logování** - můžete sledovat použití API

## 📋 **Co musíte udělat:**

### **1. Vytvořit .env soubor na hostingu:**
```env
MAPY_CZ_API_KEY=5ZtGuQEtvV37xyC_1IJnglc8ZgP53ehgvFqTiHuaFoI
OPENWEATHER_API_KEY=82bf6119dd0ae6ac5884ab9e60ad6fe0
DB_HOST=md397.wedos.net
DB_USER=w383750_vygeo
DB_PASS=7JAWfDdh
DB_NAME=d383750_vygeo
```

### **2. Nahrát nové soubory na hosting:**
- `api/map_proxy.php`
- `api/weather_proxy.php`
- `api/db_config.php`
- Upravený `map.js`
- Upravený `weather.js`
- Upravený `config.js`

### **3. Otestovat:**
- Otevřete F12 → Network tab
- Uživatel neuvidí API klíče v požadavcích
- Mapy a počasí fungují normálně

## 🎯 **Výsledek:**

**Před:** API klíče viditelné všem uživatelům  
**Po:** API klíče skryté na backendu ✅

Uživatelé nemohou zneužít vaše API klíče ani při otevření Developer Tools!
