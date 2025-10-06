// map.js - Mapové funkcionality
class MapManager {
  constructor() {
    this.map = null;
    this.layers = {};
    this.controls = {};
    this.init();
  }

  init() {
    this.createMap();
    this.setupLayers();
    this.setupControls();
    this.setupEventListeners();
  }

  createMap() {
    this.map = L.map('map', { 
      center: CONFIG.HOME_POINT, 
      zoom: 17 
    });
    
    // Nastavení výchozí ikony markeru
    L.Icon.Default.imagePath = '';
    L.Icon.Default.mergeOptions({
      iconUrl: 'assets/icons/marker-icon.svg',
      iconRetinaUrl: 'assets/icons/marker-icon.svg',
      shadowUrl: null
    });
  }

  setupLayers() {
    // Podkladové mapy
    this.layers.baseMaps = {
      "mapy.cz základní": L.tileLayer(`https://api.mapy.cz/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${CONFIG.MAPY_CZ_API_KEY}`, {
        minZoom: 17, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      }),
      "mapy.cz zimní": L.tileLayer(`https://api.mapy.cz/v1/maptiles/winter/256/{z}/{x}/{y}?apikey=${CONFIG.MAPY_CZ_API_KEY}`, {
        minZoom: 17, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      }),
      "mapy.cz ortofoto": L.tileLayer(`https://api.mapy.cz/v1/maptiles/aerial/256/{z}/{x}/{y}?apikey=${CONFIG.MAPY_CZ_API_KEY}`, {
        minZoom: 17, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      }),
      "mapy.cz turistická": L.tileLayer(`https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${CONFIG.MAPY_CZ_API_KEY}`, {
        minZoom: 17, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      }),
      "WMS Reliéf (5G)": L.tileLayer.wms('https://ags.cuzk.cz/arcgis2/services/dmr4g/ImageServer/WMSServer?', {
        layers: 'dmr4g:GrayscaleHillshade',
        format: 'image/png',
        transparent: true,
        attribution: '&copy; ČÚZK'
      }),
      "Katastr nemovitostí": L.tileLayer.wms('http://services.cuzk.cz/wms/local-KM-wms.asp', {
        layers: 'KN',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        attribution: '&copy; ČÚZK'
      })
    };

    // Překryvné vrstvy
    this.layers.overlayMaps = {
      "Webkamery": this.createWebcamMarker(),
      "Moje objekty": this.createDrawnItemsLayer(),
      "Vleky": this.createVlekyLayer(),
      "Potrubí": this.createPotrubiLayer()
    };

    // Přidat vrstvy na mapu - výchozí ortofoto z mapy.cz
    this.layers.baseMaps["mapy.cz ortofoto"].addTo(this.map);
    Object.values(this.layers.overlayMaps).forEach(layer => {
      if (layer) layer.addTo(this.map);
    });
  }

  createWebcamMarker() {
    const customIcon = L.icon({
      iconUrl: 'assets/icons/webcam.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    return L.marker(CONFIG.WEBCAM_POINT, { icon: customIcon }).bindPopup(
      `<div style="width: 500px; height: 300px; display: flex; justify-content: center; align-items: center;">
         <video-js id="webcam-player" class="vjs-default-skin" controls autoplay muted preload="auto"></video-js>
       </div>`,
       { maxWidth: 500, minWidth: 500, maxHeight: 300 }
    );
  }


  createDrawnItemsLayer() {
    // Vrstva pro kreslené objekty - bude přidána FeaturesManagerem
    return new L.FeatureGroup();
  }

  createVlekyLayer() {
    // Vleky se načtou asynchronně v SheepCounter
    return new L.FeatureGroup();
  }

  createPotrubiLayer() {
    // Potrubí se načte asynchronně
    const potrubiGroup = new L.FeatureGroup();
    
    // Načtení potrubí z GeoJSON
    fetch('https://gist.githubusercontent.com/MetrPikeska/c2970d584b33128b942c408d0e4a3cbc/raw/144f15981f8042078817e29d7ab4d2b989d902cc/.geojson')
      .then(response => response.json())
      .then(data => {
        const potrubi = L.geoJSON(data, {
          style: function () { 
            return { 
              color: 'blue', 
              weight: 2, 
              dashArray: '10, 10' 
            }; 
          }
        });
        potrubiGroup.addLayer(potrubi);
      })
      .catch(error => {
        console.error('Chyba při načítání potrubí:', error);
      });
    
    return potrubiGroup;
  }

  setupControls() {
    // Layer control
    this.controls.layerControl = L.control.layers(this.layers.baseMaps, this.layers.overlayMaps).addTo(this.map);
    
    // Scale control
    L.control.scale().addTo(this.map);
  }

  setupEventListeners() {
    // Webcam popup events
    this.map.on('popupopen', (e) => {
      const popupContent = e.popup.getContent();
      if (popupContent.includes('webcam-player')) {
        this.initWebcamPlayer();
        e.popup.videoPlayer = this.videoPlayer;
      }
    });

    this.map.on('popupclose', (e) => {
      if (e.popup.videoPlayer) {
        e.popup.videoPlayer.dispose();
        e.popup.videoPlayer = null;
      }
    });
  }

  initWebcamPlayer() {
    const player = videojs('webcam-player', {
      techOrder: ['html5'],
      autoplay: true,
      controls: true,
      muted: true,
      preload: 'auto'
    });

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(CONFIG.HLS_STREAM_URL);
      hls.attachMedia(player.tech_.el_);
    } else if (player.tech_.el_.canPlayType('application/vnd.apple.mpegurl')) {
      player.src({ src: CONFIG.HLS_STREAM_URL, type: 'application/vnd.apple.mpegurl' });
    }
    
    this.videoPlayer = player;
  }

  // Public methods
  getMap() {
    return this.map;
  }

  setView(center, zoom) {
    this.map.setView(center, zoom);
  }

  addLayer(layer) {
    this.map.addLayer(layer);
  }

  removeLayer(layer) {
    this.map.removeLayer(layer);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapManager;
} else {
  window.MapManager = MapManager;
}
