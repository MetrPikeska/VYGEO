-- Přidání sloupce elevation_data do tabulky map_features
ALTER TABLE map_features 
ADD COLUMN elevation_data TEXT NULL 
COMMENT 'JSON data s nadmořskými výškami pro každý bod geometrie';

-- Zkontrolovat strukturu tabulky
DESCRIBE map_features;