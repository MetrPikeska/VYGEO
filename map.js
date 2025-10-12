// map.js - Mapové funkcionality
class MapManager {
  constructor() {
    this.map = null;
    this.layers = {};
    this.controls = {};
    this.layersVisible = false; // Stav viditelnosti vrstev - výchozí je false (features nejsou viditelné)
    this.originalLayerStates = {}; // Uložení původních stavů vrstev
    this.featuresManager = null; // Reference na FeaturesManager
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
      "mapy.cz základní": L.tileLayer('api/map_proxy.php?type=basic&z={z}&x={x}&y={y}', {
        minZoom: 17, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      }),
      "mapy.cz zimní": L.tileLayer('api/map_proxy.php?type=winter&z={z}&x={x}&y={y}', {
        minZoom: 17, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      }),
      "mapy.cz ortofoto": L.tileLayer('api/map_proxy.php?type=aerial&z={z}&x={x}&y={y}', {
        minZoom: 17, maxZoom: 19,
        attribution: '<a href="https://api.mapy.cz/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
      }),
      "mapy.cz turistická": L.tileLayer('api/map_proxy.php?type=outdoor&z={z}&x={x}&y={y}', {
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
      "Ortofoto": this.createOrtofotoLayer(),
      "Vleky": this.createVlekyLayer(),
      "Potrubí": this.createPotrubiLayer()
    };

    // Přidat vrstvy na mapu - výchozí bude mapy.cz ortofoto
    // Nejdříve přidat základní vrstvu (mapy.cz ortofoto)
    this.layers.baseMaps["mapy.cz ortofoto"].addTo(this.map);
    
    // Přidat pouze vybrané vrstvy (Vleky, Potrubí, Webkamera)
    Object.keys(this.layers.overlayMaps).forEach(key => {
      const layer = this.layers.overlayMaps[key];
      if (layer) {
        if (key === "Vleky" || key === "Potrubí" || key === "Webkamery") {
          // Tyto vrstvy budou aktivní výchozí
          layer.addTo(this.map);
          this.originalLayerStates[key] = true;
        } else {
          // Ostatní vrstvy budou vypnuté výchozí
          this.originalLayerStates[key] = false;
        }
      }
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
      `<div style="width: 320px; height: 240px; display: flex; justify-content: center; align-items: center; padding: 0; margin: 0;">
         <video-js id="webcam-player" class="vjs-default-skin" controls autoplay muted preload="auto" style="width: 100%; height: 100%;"></video-js>
       </div>`,
       { 
         maxWidth: 320, 
         minWidth: 320, 
         maxHeight: 240,
         className: 'webcam-popup'
       }
    );
  }


  createOrtofotoLayer() {
    // Mikeska ortofoto s posunem
    const ortofotoVrstva = L.tileLayer('./tiles/{z}/{x}/{y}.png', {
      minZoom: 17,
      maxZoom: 19,
      tileSize: 256,
      attribution: '&copy; MIKESKA ORTOFOTO'
    }).on('load', function () {
      const ortoContainer = ortofotoVrstva.getContainer();
      ortoContainer.style.transform = 'translate(-15px, 10px)';
    });
    return ortofotoVrstva;
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
    // Layer control - překryvné vrstvy nahoře, základní dole
    this.controls.layerControl = L.control.layers(this.layers.baseMaps, this.layers.overlayMaps, {
      position: 'topleft',
      collapsed: false
    });
    
    // Přidat layer control do levého sidebaru
    this.addLayerControlToSidebar();
    
    // Scale control
    L.control.scale().addTo(this.map);
  }

  addLayerControlToSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const sidebarContent = sidebar.querySelector('.sidebar-content');
    
    // Vytvořit kontejner pro layer control
    const layerControlContainer = document.createElement('div');
    layerControlContainer.className = 'sidebar-section';
    layerControlContainer.innerHTML = '<h4>Podkladové vrstvy</h4><div id="layerControlContainer"></div>';
    
    // Přidat na začátek sidebaru
    sidebarContent.insertBefore(layerControlContainer, sidebarContent.firstChild);
    
    // Přidat layer control do kontejneru
    const layerControlDiv = document.getElementById('layerControlContainer');
    this.controls.layerControl.addTo(this.map);
    
    // Přesunout HTML element do sidebaru
    const layerControlElement = this.controls.layerControl.getContainer();
    layerControlDiv.appendChild(layerControlElement);
    
    // Upravit styly pro sidebar
    layerControlElement.style.position = 'static';
    layerControlElement.style.margin = '0';
    layerControlElement.style.maxWidth = 'none';
    layerControlElement.style.width = '100%';
    
    // Přidat funkčnost pro přetahování vrstev s delay
    setTimeout(() => {
      this.enableLayerDragAndDrop();
    }, 500);
  }

  enableLayerDragAndDrop() {
    const layerControlElement = this.controls.layerControl.getContainer();
    if (!layerControlElement) {
      console.log('Layer control element not found, retrying...');
      setTimeout(() => this.enableLayerDragAndDrop(), 200);
      return;
    }
    
    const overlayLayers = layerControlElement.querySelector('.leaflet-control-layers-overlays');
    if (!overlayLayers) {
      console.log('Overlay layers not found, retrying...');
      setTimeout(() => this.enableLayerDragAndDrop(), 200);
      return;
    }
    
    console.log('Enabling drag and drop for layers');
    
    // Přidat CSS pro drag and drop
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-control-layers-overlays label {
        cursor: move !important;
        user-select: none !important;
        position: relative !important;
        padding: 8px 15px !important;
        margin: 2px 0 !important;
        border-radius: 4px !important;
        min-height: 32px !important;
        display: flex !important;
        align-items: center !important;
        transition: all 0.2s ease !important;
      }
      .leaflet-control-layers-overlays label:hover {
        background-color: rgba(0, 0, 0, 0.05) !important;
        transform: translateX(2px) !important;
      }
      .leaflet-control-layers-overlays label.dragging {
        opacity: 0.7 !important;
        background-color: rgba(0, 0, 0, 0.1) !important;
        transform: rotate(1deg) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
      }
      .leaflet-control-layers-overlays label.drag-over {
        border-top: 2px solid #007ddd !important;
      }
      .leaflet-control-layers-overlays label::before {
        content: '⋮⋮' !important;
        color: #ccc !important;
        margin-right: 8px !important;
        font-size: 12px !important;
        line-height: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Implementovat drag and drop
    let draggedElement = null;
    let isDragging = false;
    
    overlayLayers.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'LABEL' && e.button === 0) { // pouze levé tlačítko
        draggedElement = e.target;
        isDragging = true;
        draggedElement.classList.add('dragging');
        e.preventDefault();
        e.stopPropagation();
        console.log('Started dragging:', draggedElement.textContent.trim());
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging && draggedElement) {
        e.preventDefault();
        e.stopPropagation();
        
        // Najít element pod kurzorem
        const rect = overlayLayers.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const labels = Array.from(overlayLayers.querySelectorAll('label'));
        
        // Odstranit všechny drag-over třídy
        labels.forEach(label => label.classList.remove('drag-over'));
        
        // Najít pozici pro vložení
        for (let label of labels) {
          if (label === draggedElement) continue;
          const labelRect = label.getBoundingClientRect();
          const labelY = labelRect.top - rect.top;
          if (y < labelY + labelRect.height / 2) {
            label.classList.add('drag-over');
            break;
          }
        }
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (isDragging && draggedElement) {
        console.log('Stopped dragging');
        draggedElement.classList.remove('dragging');
        
        // Odstranit všechny drag-over třídy
        const labels = Array.from(overlayLayers.querySelectorAll('label'));
        labels.forEach(label => label.classList.remove('drag-over'));
        
        // Najít novou pozici
        const rect = overlayLayers.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        let insertBefore = null;
        for (let label of labels) {
          if (label === draggedElement) continue;
          const labelRect = label.getBoundingClientRect();
          const labelY = labelRect.top - rect.top;
          if (y < labelY + labelRect.height / 2) {
            insertBefore = label;
            break;
          }
        }
        
        // Přesunout element
        if (insertBefore) {
          overlayLayers.insertBefore(draggedElement, insertBefore);
          console.log('Moved before:', insertBefore.textContent.trim());
        } else {
          overlayLayers.appendChild(draggedElement);
          console.log('Moved to end');
        }
        
        // Aktualizovat pořadí vrstev na mapě
        this.updateLayerOrder();
        
        draggedElement = null;
        isDragging = false;
      }
    });
  }

  updateLayerOrder() {
    // Aktualizovat pořadí vrstev podle nového pořadí v UI
    const layerControlElement = this.controls.layerControl.getContainer();
    const overlayLayers = layerControlElement.querySelector('.leaflet-control-layers-overlays');
    const labels = Array.from(overlayLayers.querySelectorAll('label'));
    
    // Získat názvy vrstev v novém pořadí
    const layerNames = labels.map(label => {
      const input = label.querySelector('input');
      return input ? input.value : null;
    }).filter(name => name);
    
    // Aktualizovat pořadí v this.layers.overlayMaps
    const newOverlayMaps = {};
    layerNames.forEach(name => {
      if (this.layers.overlayMaps[name]) {
        newOverlayMaps[name] = this.layers.overlayMaps[name];
      }
    });
    
    // Přidat zbývající vrstvy
    Object.keys(this.layers.overlayMaps).forEach(name => {
      if (!newOverlayMaps[name]) {
        newOverlayMaps[name] = this.layers.overlayMaps[name];
      }
    });
    
    this.layers.overlayMaps = newOverlayMaps;
    
    // Z-index se automaticky aktualizuje podle pořadí v DOM
    console.log('Pořadí vrstev aktualizováno:', Object.keys(this.layers.overlayMaps));
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

    // Tlačítko pro přepínání vrstev
    this.setupLayersToggleButton();

    // GeoJSON drag and drop functionality
    this.setupGeoJSONDragAndDrop();
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

  setupGeoJSONDragAndDrop() {
    // Přidat CSS pro drag and drop
    const style = document.createElement('style');
    style.textContent = `
      .map-drag-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 123, 255, 0.1);
        border: 3px dashed #007bff;
        z-index: 9999;
        display: none;
        pointer-events: none;
      }
      
      .map-drag-overlay.active {
        display: block;
      }
      
      .geojson-drop-zone {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        text-align: center;
        font-size: 18px;
        color: #007bff;
        border: 2px dashed #007bff;
      }
    `;
    document.head.appendChild(style);

    // Vytvořit overlay pro drag and drop
    const overlay = document.createElement('div');
    overlay.className = 'map-drag-overlay';
    overlay.innerHTML = '<div class="geojson-drop-zone">Přetáhněte GeoJSON soubor sem</div>';
    document.body.appendChild(overlay);

    // Event listeners pro drag and drop
    const mapContainer = this.map.getContainer();
    
    mapContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.classList.add('active');
    });

    mapContainer.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!mapContainer.contains(e.relatedTarget)) {
        overlay.classList.remove('active');
      }
    });

    mapContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.classList.remove('active');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleGeoJSONFile(files[0]);
      }
    });

    // Přidat event listenery i na mapu samotnou
    this.map.on('dragover', (e) => {
      e.originalEvent.preventDefault();
      overlay.classList.add('active');
    });

    this.map.on('dragleave', (e) => {
      e.originalEvent.preventDefault();
      if (!this.map.getContainer().contains(e.originalEvent.relatedTarget)) {
        overlay.classList.remove('active');
      }
    });

    this.map.on('drop', (e) => {
      e.originalEvent.preventDefault();
      overlay.classList.remove('active');
      
      const files = e.originalEvent.dataTransfer.files;
      if (files.length > 0) {
        this.handleGeoJSONFile(files[0]);
      }
    });
  }

  handleGeoJSONFile(file) {
    // Zkontrolovat, zda je soubor GeoJSON
    if (!file.name.toLowerCase().endsWith('.geojson') && !file.name.toLowerCase().endsWith('.json')) {
      alert('Prosím vyberte GeoJSON soubor (.geojson nebo .json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geoJsonData = JSON.parse(e.target.result);
        
        // Validovat GeoJSON
        if (!this.isValidGeoJSON(geoJsonData)) {
          alert('Neplatný GeoJSON soubor!');
          return;
        }

        // Přidat GeoJSON na mapu
        this.addGeoJSONToMap(geoJsonData, file.name);
        
        console.log('GeoJSON soubor úspěšně načten:', file.name);
      } catch (error) {
        console.error('Chyba při čtení GeoJSON souboru:', error);
        alert('Chyba při čtení souboru. Zkontrolujte, zda je soubor platný GeoJSON.');
      }
    };

    reader.readAsText(file);
  }

  isValidGeoJSON(data) {
    if (!data || typeof data !== 'object') return false;
    
    if (data.type === 'FeatureCollection') {
      return Array.isArray(data.features) && data.features.every(feature => 
        feature.type === 'Feature' && 
        feature.geometry && 
        feature.geometry.type && 
        feature.geometry.coordinates
      );
    } else if (data.type === 'Feature') {
      return data.geometry && 
             data.geometry.type && 
             data.geometry.coordinates;
    }
    
    return false;
  }

  addGeoJSONToMap(geoJsonData, fileName) {
    // Vytvořit novou vrstvu pro uživatelský GeoJSON
    if (!this.userGeoJSONLayer) {
      this.userGeoJSONLayer = new L.FeatureGroup();
      this.userGeoJSONLayer.addTo(this.map);
      
      // Přidat do layer controlu
      if (this.controls.layerControl) {
        this.controls.layerControl.addOverlay(this.userGeoJSONLayer, "Uživatelský GeoJSON");
      }
    }

    // Přidat GeoJSON na mapu
    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        // Výchozí styly podle typu geometrie
        const geometryType = feature.geometry.type;
        switch (geometryType) {
          case 'Point':
            return {
              color: '#dc3545',
              fillColor: '#dc3545',
              fillOpacity: 0.8,
              radius: 6
            };
          case 'LineString':
            return {
              color: '#ffc107',
              weight: 3,
              opacity: 0.8
            };
          case 'Polygon':
            return {
              color: '#28a745',
              fillColor: '#28a745',
              fillOpacity: 0.3,
              weight: 2
            };
          default:
            return {
              color: '#007bff',
              fillColor: '#007bff',
              fillOpacity: 0.3,
              weight: 2
            };
        }
      },
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 6,
          fillOpacity: 0.8
        });
      },
      onEachFeature: (feature, layer) => {
        // Přidat popup s informacemi
        let popupContent = `<div style="min-width: 200px;">`;
        popupContent += `<h4>${fileName}</h4>`;
        popupContent += `<p><strong>Typ:</strong> ${feature.geometry.type}</p>`;
        
        if (feature.properties) {
          popupContent += `<p><strong>Vlastnosti:</strong></p>`;
          popupContent += `<ul style="margin: 5px 0; padding-left: 15px;">`;
          Object.entries(feature.properties).forEach(([key, value]) => {
            popupContent += `<li><strong>${key}:</strong> ${value}</li>`;
          });
          popupContent += `</ul>`;
        }
        
        popupContent += `</div>`;
        layer.bindPopup(popupContent);
      }
    });

    this.userGeoJSONLayer.addLayer(geoJsonLayer);
    
    // Přesunout mapu na GeoJSON
    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds);
    }

    // Zobrazit notifikaci
    this.showNotification(`GeoJSON soubor "${fileName}" byl úspěšně načten!`, 'success');
  }

  showNotification(message, type = 'info') {
    // Vytvořit notifikaci
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Odstranit po 3 sekundách
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
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

  setupLayersToggleButton() {
    const toggleBtn = document.getElementById('toggleLayersBtn');
    const layersIcon = document.getElementById('layersIcon');
    
    if (!toggleBtn || !layersIcon) {
      console.warn('Tlačítko pro přepínání vrstev nebylo nalezeno');
      return;
    }

    // Inicializovat stav tlačítka podle skutečného stavu features
    // Zpozdit o malou chvilku, aby se stihlo načíst přihlášení
    setTimeout(() => {
      this.updateButtonState();
    }, 100);

    toggleBtn.addEventListener('click', () => {
      this.toggleAllLayers();
    });
  }

  toggleAllLayers() {
    // Zkontrolovat, zda je uživatel admin
    if (!this.isUserAdmin()) {
      console.log('Tlačítko pro přepínání features je dostupné pouze pro admina');
      return;
    }
    
    // Zkontrolovat skutečný stav features na mapě
    const areFeaturesVisible = this.areFeaturesVisible();
    
    if (areFeaturesVisible) {
      // Vypnout features
      this.hideAllLayers();
      this.layersVisible = false;
    } else {
      // Zapnout features
      this.showAllLayers();
      this.layersVisible = true;
    }
    
    // Aktualizovat stav tlačítka
    this.updateButtonState();
  }

  areFeaturesVisible() {
    // Zkontrolovat, zda jsou features skutečně na mapě
    if (!this.featuresManager) return false;
    
    return (this.map.hasLayer(this.featuresManager.polygonLayer) ||
            this.map.hasLayer(this.featuresManager.polylineLayer) ||
            this.map.hasLayer(this.featuresManager.markerLayer));
  }

  updateButtonState() {
    const toggleBtn = document.getElementById('toggleLayersBtn');
    const layersIcon = document.getElementById('layersIcon');
    
    if (!toggleBtn || !layersIcon) return;
    
    const isAdmin = this.isUserAdmin();
    const areVisible = this.areFeaturesVisible();
    
    if (!isAdmin) {
      // Skrýt tlačítko pro neadmin uživatele
      toggleBtn.style.display = 'none';
    } else {
      // Zobrazit tlačítko pro admina
      toggleBtn.style.display = 'flex';
      toggleBtn.disabled = false;
      toggleBtn.style.opacity = '1';
      toggleBtn.style.cursor = 'pointer';
      
      if (areVisible) {
        layersIcon.className = 'fas fa-eye';
        toggleBtn.classList.remove('layers-off');
        toggleBtn.title = 'Skrýt features z databáze';
      } else {
        layersIcon.className = 'fas fa-eye-slash';
        toggleBtn.classList.add('layers-off');
        toggleBtn.title = 'Zobrazit features z databáze';
      }
    }
  }

  isUserAdmin() {
    // Zkontrolovat, zda je uživatel přihlášen jako admin
    const authButton = document.getElementById('authButton');
    if (authButton) {
      return authButton.textContent.includes('Odhlásit');
    }
    return false;
  }

  hideAllLayers() {
    // Skrýt pouze feature vrstvy z databáze (ne ostatní vrstvy)
    if (this.featuresManager) {
      this.hideFeatureLayers();
    }
  }

  showAllLayers() {
    // Zobrazit pouze feature vrstvy z databáze (ne ostatní vrstvy)
    if (this.featuresManager) {
      this.showFeatureLayers();
    }
  }

  hideFeatureLayers() {
    // Skrýt všechny feature vrstvy z databáze
    if (this.featuresManager.polygonLayer && this.map.hasLayer(this.featuresManager.polygonLayer)) {
      this.map.removeLayer(this.featuresManager.polygonLayer);
    }
    if (this.featuresManager.polylineLayer && this.map.hasLayer(this.featuresManager.polylineLayer)) {
      this.map.removeLayer(this.featuresManager.polylineLayer);
    }
    if (this.featuresManager.markerLayer && this.map.hasLayer(this.featuresManager.markerLayer)) {
      this.map.removeLayer(this.featuresManager.markerLayer);
    }
  }

  showFeatureLayers() {
    // Zobrazit všechny feature vrstvy z databáze
    if (this.featuresManager.polygonLayer && !this.map.hasLayer(this.featuresManager.polygonLayer)) {
      this.map.addLayer(this.featuresManager.polygonLayer);
    }
    if (this.featuresManager.polylineLayer && !this.map.hasLayer(this.featuresManager.polylineLayer)) {
      this.map.addLayer(this.featuresManager.polylineLayer);
    }
    if (this.featuresManager.markerLayer && !this.map.hasLayer(this.featuresManager.markerLayer)) {
      this.map.addLayer(this.featuresManager.markerLayer);
    }
  }

  // Metoda pro nastavení reference na FeaturesManager
  setFeaturesManager(featuresManager) {
    this.featuresManager = featuresManager;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapManager;
} else {
  window.MapManager = MapManager;
}
