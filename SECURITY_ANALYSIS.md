# 🔒 Analýza bezpečnosti projektu VYGEO

## 📊 Přehled bezpečnostních rizik

### 🚨 KRITICKÉ RIZIKO
- **Hardcoded databázové přihlašovací údaje** ve všech API souborech
- **Debug mód zapnutý v produkci** - zobrazuje chyby uživatelům

### ⚠️ VYSOKÉ RIZIKO  
- **Slabé heslo administrátora** - "opalena"
- **CORS nastaveno na `*`** - umožňuje přístup z jakékoliv domény
- **Chybějící validace vstupů** v některých API endpointech

### ⚡ STŘEDNÍ RIZIKO
- **Chybějící rate limiting** na API endpointy
- **Nedostatečné logování** bezpečnostních událostí
- **Chybějící HTTPS enforcement**

---

## 🔍 Detailní analýza

### 1. **Databázové připojení** 🚨 KRITICKÉ

**Problém:** Databázové přihlašovací údaje jsou hardcoded ve všech API souborech:

```php
// Vyskytuje se v 8+ souborech
$db_host = "md397.wedos.net";
$db_user = "w383750_vygeo"; 
$db_pass = "7JAWfDdh";  // ← HESLO VEŘEJNĚ V KÓDU!
$db_name = "d383750_vygeo";
```

**Dopad:** Kdokoliv s přístupem ke kódu má plný přístup k databázi.

**Řešení:**
- Přesunout do `.env` souboru
- Použít environment variables
- Implementovat rotaci hesel

### 2. **Debug mód v produkci** 🚨 KRITICKÉ

**Problém:** Ve všech API souborech je zapnutý debug mód:

```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

**Dopad:** Uživatelé vidí citlivé informace o chybách, stack trace, atd.

**Řešení:**
- Vypnout v produkci
- Použít logování místo zobrazování

### 3. **Autentizace a autorizace** ⚠️ VYSOKÉ

**Problémy:**
- Slabé heslo: `'opalena'` 
- Chybějící 2FA
- CSRF token implementován, ale ne všude používán

**Dopad:** Snadné prolomení účtu administrátora.

### 4. **CORS konfigurace** ⚠️ VYSOKÉ

**Problém:**
```php
header('Access-Control-Allow-Origin: *');
```

**Dopad:** Umožňuje přístup z jakékoliv domény.

### 5. **SQL Injection ochrana** ✅ DOBŘE

**Pozitivní:** Většina dotazů používá prepared statements:
```php
$stmt = $mysqli->prepare("INSERT INTO map_features (name, type, geojson) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $type, $geojson);
```

### 6. **XSS ochrana** ⚠️ STŘEDNÍ

**Problém:** Používá se `innerHTML` bez sanitizace:
```javascript
objectsList.innerHTML = '';  // Potenciální XSS
```

### 7. **Session management** ✅ DOBŘE

**Pozitivní:** Správně nakonfigurované session:
```php
session_start([
  'cookie_httponly' => true,
  'cookie_samesite' => 'Lax', 
  'cookie_secure' => isset($_SERVER['HTTPS'])
]);
```

---

## 🛠️ Doporučená opatření

### Okamžitá (do 24h)
1. **Vypnout debug mód** ve všech API souborech
2. **Změnit heslo administrátora** na silné
3. **Omezit CORS** na konkrétní domény

### Krátkodobá (do týdne)  
1. **Přesunout DB údaje** do `.env` souboru
2. **Implementovat rate limiting**
3. **Přidat input sanitizaci** pro XSS ochranu
4. **Nastavit HTTPS enforcement**

### Dlouhodobá (do měsíce)
1. **Implementovat 2FA**
2. **Přidat bezpečnostní logování**
3. **Provedení penetračního testu**
4. **Implementovat WAF (Web Application Firewall)**

---

## 📋 Checklist bezpečnosti

- [ ] Vypnout debug mód v produkci
- [ ] Změnit admin heslo na silné
- [ ] Omezit CORS na povolené domény  
- [ ] Přesunout DB údaje do .env
- [ ] Implementovat rate limiting
- [ ] Přidat input sanitizaci
- [ ] Nastavit HTTPS enforcement
- [ ] Přidat bezpečnostní logování
- [ ] Implementovat 2FA
- [ ] Provedení bezpečnostního auditu

---

## 🎯 Priorita oprav

1. **P1 (Kritické):** Debug mód, DB hesla
2. **P2 (Vysoké):** CORS, admin heslo  
3. **P3 (Střední):** Rate limiting, XSS ochrana
4. **P4 (Nízké):** 2FA, pokročilé funkce

---

*Analýza provedena: $(date)*
*Verze: 1.0*
