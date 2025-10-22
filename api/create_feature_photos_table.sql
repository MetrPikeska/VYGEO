-- Create table for feature photos
CREATE TABLE feature_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature_id INT NOT NULL,
    photo_data LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES map_features(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX idx_feature_photos_feature_id ON feature_photos(feature_id);

-- Check table structure
DESCRIBE feature_photos;
