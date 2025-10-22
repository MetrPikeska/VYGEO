// config.js - Konfigurace aplikace
const CONFIG = {
  // Mapové souřadnice
  HOME_POINT: [49.5535106, 18.3143814],
  WEBCAM_POINT: [49.55469, 18.31718],
  RESTAURANT_POINT: [49.554639465762186, 18.314282670706472],
  
  // API klíče - nyní skryté na backendu
  // MAPY_CZ_API_KEY: 'skryto na backendu',
  // OPENWEATHER_API_KEY: 'skryto na backendu - používá se weather_proxy.php',
  
  // URL adresy - automaticky detekce localhost vs produkce
  HLS_STREAM_URL: "https://stream.teal.cz/hls/cam273.m3u8",
  UPDATE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "api/update.php" 
    : "api/update.php", // Relativní cesta pro hosting
  GET_SHEEP_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "api/get_sheep.php" 
    : "api/get_sheep.php", // Relativní cesta pro hosting
  GET_FEATURES_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "api/get_features.php" 
    : "api/get_features.php", // Relativní cesta pro hosting
  
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
