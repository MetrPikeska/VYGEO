-- SQL skript pro vytvoření tabulek pro databázi d383750_vygeo
-- Spustit v phpMyAdmin nebo MySQL klientovi

-- Tabulka pro geografické objekty (map_features)
CREATE TABLE IF NOT EXISTS `map_features` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `geojson` JSON NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabulka pro log počtu lyžařů (sheep_log)
CREATE TABLE IF NOT EXISTS `sheep_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `count` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Vložení ukázkových dat pro sheep_log - vypnuto
-- INSERT INTO `sheep_log` (`timestamp`, `count`) VALUES
-- (NOW() - INTERVAL 1 HOUR, 15),
-- (NOW() - INTERVAL 30 MINUTE, 22),
-- (NOW(), 18);
