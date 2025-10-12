// Dynamické načítání konfigurace z API
class ConfigLoader {
    constructor() {
        this.config = null;
        this.loadPromise = null;
    }

    async load() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._loadConfig();
        return this.loadPromise;
    }

    async _loadConfig() {
        try {
            const response = await fetch('api/config.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
            return this.config;
        } catch (error) {
            console.error('Chyba při načítání konfigurace:', error);
            // Fallback na lokální konfiguraci
            this.config = {
                MAPY_CZ_API_KEY: '5ZtGuQEtvV37xyC_1IJnglc8ZgP53ehgvFqTiHuaFoI',
                OPENWEATHER_API_KEY: '82bf6119dd0ae6ac5884ab9e60ad6fe0',
                HOME_POINT: [49.5535106, 18.3143814],
                WEBCAM_POINT: [49.55469, 18.31718],
                RESTAURANT_POINT: [49.554639465762186, 18.314282670706472],
                HLS_STREAM_URL: "https://stream.teal.cz/hls/cam273.m3u8",
                UPDATE_URL: "https://petrmikeska.cz/vygeo/api/update.php",
                GET_SHEEP_URL: "https://petrmikeska.cz/vygeo/api/get_sheep.php",
                GET_FEATURES_URL: "https://petrmikeska.cz/vygeo/api/get_features.php",
                SHEEP_UPDATE_INTERVAL: 2000,
                TEMP_UPDATE_INTERVAL: 5 * 60 * 1000,
                MODEL_PATH: "yolov8n.pt",
                CONFIDENCE_THRESHOLD: 0.3,
                LIFT_COLORS: {
                    0: "green",
                    1: "yellow",
                    2: "yellow", 
                    3: "red"
                }
            };
            return this.config;
        }
    }

    get(key) {
        return this.config ? this.config[key] : null;
    }

    async getAsync(key) {
        await this.load();
        return this.get(key);
    }
}

// Globální instance
window.configLoader = new ConfigLoader();

// Export pro kompatibilitu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
}
