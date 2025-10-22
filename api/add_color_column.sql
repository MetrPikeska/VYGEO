-- Přidání sloupce color do tabulky map_features
ALTER TABLE map_features 
ADD COLUMN color VARCHAR(7) NULL 
COMMENT 'Hex barva objektu (např. #007ddd)';

-- Zkontrolovat strukturu tabulky
DESCRIBE map_features;
