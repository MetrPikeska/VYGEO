# Implementace ukládání nadmořských výšek do databáze

## Přehled změn

Byla implementována funkcionalita pro ukládání informací o nadmořských výškách přímo do databáze, aby se při dalším načítání objektů nemusely znovu stahovat z API.

## Změny v databázi

### Nový sloupec
- **Název**: `elevation_data`
- **Typ**: `TEXT`
- **Popis**: JSON data s informacemi o nadmořských výškách
- **Index**: Vytvořen index pro lepší výkon

### SQL skript pro migraci
```sql
ALTER TABLE map_features 
ADD COLUMN elevation_data TEXT NULL 
COMMENT 'JSON data s informacemi o nadmořských výškách';

CREATE INDEX idx_elevation_data ON map_features(elevation_data(100));
```

## Změny v API

### api/features.php
- **CREATE**: Přidán parametr `elevation_data` pro ukládání elevation dat
- **UPDATE**: Podporuje aktualizaci elevation dat
- **GET**: Vrací elevation data v properties objektů

### api/get_features.php
- Upraveno pro vracení elevation dat z databáze
- Elevation data se přidávají do properties objektů

## Změny v JavaScript

### features.js

#### saveFeature()
- Ukládá elevation data do databáze při vytváření/aktualizaci objektů
- Připravuje elevation data pro odeslání do API

#### loadFeaturesFromDB()
- Načítá elevation data z databáze
- Kontroluje, zda objekty mají elevation data
- Načítá z API pouze objekty bez elevation dat

#### loadElevationsAsync()
- Po získání elevation dat z API je ukládá do databáze
- Volá novou metodu `saveElevationDataToDB()`

#### saveElevationDataToDB()
- Nová metoda pro ukládání elevation dat do databáze
- Odesílá elevation data přes API update endpoint

## Struktura elevation dat

```json
{
  "elevations": [500, 520, 540, 560],
  "minElevation": 500,
  "maxElevation": 560,
  "avgElevation": 530,
  "elevation": 530,
  "elevationGain": 60,
  "elevationLoss": 0,
  "totalElevationChange": 60
}
```

## Výhody implementace

1. **Rychlost**: Elevation data se načítají z databáze místo z API
2. **Úspora API volání**: Snížení počtu požadavků na OpenElevation API
3. **Offline dostupnost**: Elevation data jsou dostupná i bez internetu
4. **Konzistence**: Stejná elevation data při každém načtení
5. **Výkon**: Rychlejší načítání objektů s elevation daty

## Postup nasazení

1. **Spustit SQL migraci**:
   ```sql
   -- Spustit api/add_elevation_column.sql
   ```

2. **Nahradit soubory**:
   - `api/features.php`
   - `api/get_features.php`
   - `features.js`

3. **Otestovat API**:
   ```bash
   # Otestovat elevation data funkcionalitu
   curl http://your-domain.com/api/test_elevation.php
   ```

4. **Ověřit funkčnost**:
   - Vytvořit nový objekt
   - Zkontrolovat, zda se elevation data ukládají
   - Obnovit stránku a ověřit, zda se elevation data načítají z databáze

## Opravy problémů

### Opravené chyby
1. **Mapování typů geometrie**: Přidána podpora pro `Polygon`, `LineString`, `Point`
2. **featuresManager reference**: Opraveno použití `window.vygeoApp.getFeaturesManager()`
3. **API error handling**: Přidána kontrola content-type před parsováním JSON
4. **SQL migrace**: Bezpečná migrace s kontrolou existence sloupce

## Zpětná kompatibilita

- Existující objekty bez elevation dat se budou načítat z API při prvním načtení
- Po získání elevation dat se automaticky uloží do databáze
- Nové objekty budou mít elevation data uložena okamžitě

## Monitoring

V konzoli prohlížeče se zobrazují logy:
- `Feature X má elevation data z databáze`
- `Feature X nemá elevation data, bude načteno z API`
- `Elevation data uložena do databáze pro feature X`
