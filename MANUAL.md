# 📖 VYGEO OPALENA - Uživatelský manuál

## 🎯 O aplikaci

VYGEO OPALENA je webová aplikace pro monitoring lyžařského areálu Opálená v Beskydech. Aplikace poskytuje:

- **🗺️ Interaktivní mapu** s lyžařskými vleky a trasami
- **🌡️ Aktuální počasí** a teplotní podmínky
- **🐑 Počítání ovcí** na vlecích pro bezpečnost
- **📊 Statistiky** a grafy
- **📸 Správa fotografií** objektů
- **🔐 Administrátorské funkce** pro správu obsahu

## 🚀 Spuštění aplikace

### Lokální vývoj
```bash
# Spusťte lokální server
php -S localhost:8000

# Nebo použijte WAMP/XAMPP
# Otevřete http://localhost/vygeo/
```

### Produkční nasazení
1. Nahrajte soubory na hosting
2. Nakonfigurujte databázi
3. Nastavte API klíče
4. Otevřete v prohlížeči

## 🗺️ Hlavní funkce

### **Mapa a navigace**
- **Domů** - návrat na výchozí pozici
- **GPS** - zobrazení aktuální polohy
- **Vrstvy** - přepínání mezi mapovými vrstvami
- **Zoom** - přiblížení/oddálení

### **Počasí**
- Aktuální teplota a podmínky
- Předpověď na 3 dny
- Vlhkost, vítr, tlak
- Automatická aktualizace každých 5 minut

### **Počítání ovcí**
- Real-time monitoring ovcí na vlecích
- Barevné označení podle počtu:
  - 🟢 **Zelená** - žádné ovce (bezpečno)
  - 🟡 **Žlutá** - 1-2 ovce (opatrně)
  - 🔴 **Červená** - 3+ ovcí (nebezpečno)

### **Správa objektů** (pouze pro adminy)
- **Přidání** nových objektů (body, linie, polygony)
- **Editace** existujících objektů
- **Mazání** objektů
- **Upload fotografií** k objektům

## 🔐 Administrátorské funkce

### **Přihlášení**
- Uživatelské jméno: `admin`
- Heslo: `opalena`

### **Dostupné funkce pro adminy**
- ✅ Vytváření nových objektů
- ✅ Editace existujících objektů
- ✅ Mazání objektů
- ✅ Upload fotografií
- ✅ Správa vrstev mapy
- ✅ Přístup ke všem funkcím

## 📱 Použití aplikace

### **Základní navigace**
1. **Otevřete aplikaci** v prohlížeči
2. **Přihlaste se** (pokud jste admin)
3. **Prohlížejte mapu** a objekty
4. **Klikněte na objekty** pro detailní informace

### **Přidání objektu** (admin)
1. Přihlaste se jako admin
2. Klikněte na tlačítko **"Přidat objekt"**
3. Vyberte typ objektu (bod/linie/polygon)
4. Nakreslete objekt na mapě
5. Vyplňte název a uložte

### **Upload fotografie** (admin)
1. Klikněte na existující objekt
2. V popup okně klikněte **"Přidat foto"**
3. Vyberte obrázek z počítače
4. Nahrajte fotografii

## ⚙️ Technické požadavky

### **Prohlížeč**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **Funkce vyžadující HTTPS**
- GPS lokalizace
- Kamera (upload fotografií)
- WebRTC (video stream)

## 🛠️ Konfigurace

### **API klíče**
Aplikace používá tyto externí služby:
- **OpenWeatherMap** - data o počasí
- **Mapy.cz** - mapové dlaždice
- **Teal.cz** - video stream webkamery

### **Databáze**
- MySQL/MariaDB
- Tabulky: `map_features`, `feature_photos`, `sheep_log`

## 🐛 Řešení problémů

### **Aplikace se nenačte**
- Zkontrolujte internetové připojení
- Ověřte, že server běží
- Zkontrolujte konzoli prohlížeče (F12)

### **Mapa se nezobrazí**
- Zkontrolujte API klíč pro Mapy.cz
- Ověřte CORS nastavení
- Zkontrolujte síťové připojení

### **Počasí se nenačte**
- Zkontrolujte API klíč OpenWeatherMap
- Ověřte připojení k internetu
- Zkontrolujte konzoli prohlížeče

### **GPS nefunguje**
- Povolte lokalizaci v prohlížeči
- Použijte HTTPS (vyžadováno pro GPS)
- Zkontrolujte oprávnění prohlížeče

## 📞 Podpora

Pro technickou podporu kontaktujte:
- **Email**: [váš email]
- **GitHub**: [odkaz na repository]

## 🔄 Aktualizace

Aplikace se automaticky aktualizuje při změnách na serveru. Pro vynucení aktualizace:
- **Ctrl+F5** - tvrdé obnovení
- **Ctrl+Shift+R** - vymazání cache a obnovení

---

**VYGEO OPALENA v1.0** - Monitoring lyžařského areálu Opálená 🎿
