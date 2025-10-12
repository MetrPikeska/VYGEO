# Nastavení API klíčů

## Bezpečnostní nastavení

Aby byly API klíče bezpečné, jsou nyní vyloučeny z Git repozitáře.

## Instrukce pro nastavení

1. **Zkopírujte příklad konfigurace:**
   ```bash
   cp config.example.js config.js
   ```

2. **Upravte `config.js` a vložte své API klíče:**
   ```javascript
   MAPY_CZ_API_KEY: 'VÁŠ_MAPY_CZ_API_KLÍČ',
   OPENWEATHER_API_KEY: 'VÁŠ_OPENWEATHER_API_KLÍČ',
   ```

3. **Soubor `config.js` je nyní v `.gitignore`** - nebude se nahrávat do Git repozitáře.

## API klíče

### Mapy.cz API
- Získejte klíč na: https://api.mapy.cz/
- Vložte do `MAPY_CZ_API_KEY`

### OpenWeather API  
- Získejte klíč na: https://openweathermap.org/api
- Vložte do `OPENWEATHER_API_KEY`

## Důležité upozornění

- **NIKDY** necommitněte soubor `config.js` s reálnými API klíči
- Používejte pouze `config.example.js` jako šablonu
- Při sdílení kódu vždy zkontrolujte, že `config.js` není v repozitáři
