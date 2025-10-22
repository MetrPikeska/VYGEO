// config.example.js - Příklad konfigurace aplikace
// Zkopírujte tento soubor jako config.js a vyplňte své API klíče

const CONFIG = {
  // Mapové souřadnice
  HOME_POINT: [49.5535106, 18.3143814],
  WEBCAM_POINT: [49.55469, 18.31718],
  RESTAURANT_POINT: [49.554639465762186, 18.314282670706472],
  
  // API klíče - ZMĚŇTE NA SVÉ KLÍČE!
  MAPY_CZ_API_KEY: 'YOUR_MAPY_CZ_API_KEY_HERE',
  OPENWEATHER_API_KEY: 'YOUR_OPENWEATHER_API_KEY_HERE',
  
  // URL adresy
  HLS_STREAM_URL: "https://stream.teal.cz/hls/cam273.m3u8",
  UPDATE_URL: "https://petrmikeska.cz/vygeo/api/update.php",
  GET_SHEEP_URL: "https://petrmikeska.cz/vygeo/api/get_sheep.php",
  GET_FEATURES_URL: "https://petrmikeska.cz/vygeo/api/get_features.php",
  
  // Intervaly
  SHEEP_UPDATE_INTERVAL: 2000, // 2 sekundy
  TEMP_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minut
  
  // YOLO model
  MODEL_PATH: "yolov8n.pt",
  CONFIDENCE_THRESHOLD: 0.3,
  
  // Barvy vleků podle počtu ovcí
  LIFT_COLORS: {
    0: "green",    // žádné ovce
    1: "yellow",   // 1-2 ovce
    2: "yellow",   // 1-2 ovce
    3: "red"       // 3+ ovcí
  }
};

// Export pro použití v jiných modulech
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
