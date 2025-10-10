// features.js - Správa objektů a kreslení
class FeaturesManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    // Vytvořit samostatné vrstvy pro každý typ feature
    this.createFeatureLayers();
    this.featureLayers = {};
    this.elevationCache = new Map(); // Cache pro nadmořské výšky
    this.individualFeatures = new Map(); // Map pro jednotlivé features s jejich vlastnostmi
    this.legendContainer = null; // Kontejner pro dynamickou legendu
    this.objectsPanelVisible = false; // Stav panelu jednotlivých objektů
    // Inicializace asynchronně
    this.init().catch(error => {
      console.error('Chyba při inicializaci FeaturesManager:', error);
    });
  }

  createFeatureLayers() {
    // Vytvořit samostatné vrstvy pro každý typ feature
    this.polygonLayer = new L.FeatureGroup();
    this.polylineLayer = new L.FeatureGroup();
    this.markerLayer = new L.FeatureGroup();
    
    // Přidat vrstvy do mapManageru
    this.mapManager.layers.overlayMaps["Polygony"] = this.polygonLayer;
    this.mapManager.layers.overlayMaps["Čáry"] = this.polylineLayer;
    this.mapManager.layers.overlayMaps["Body"] = this.markerLayer;
    
    // Přidat vrstvy na mapu
    this.polygonLayer.addTo(this.mapManager.getMap());
    this.polylineLayer.addTo(this.mapManager.getMap());
    this.markerLayer.addTo(this.mapManager.getMap());
    
    // Aktualizovat layer control
    if (this.mapManager.controls.layerControl) {
      this.mapManager.controls.layerControl.addOverlay(this.polygonLayer, "Polygony");
      this.mapManager.controls.layerControl.addOverlay(this.polylineLayer, "Linie");
      this.mapManager.controls.layerControl.addOverlay(this.markerLayer, "Bod");
    }
  }

  async init() {
    this.setupEventListeners();
    await this.loadFeaturesFromDB();
    // Počkat na načtení stavu přihlášení
    this.waitForAuthAndSetupTools();
    // Dynamická legenda je nyní v panelu jednotlivých objektů
    // this.createDynamicLegend();
    // Nastavit event listenery pro panel jednotlivých objektů
    this.setupObjectsPanelEvents();
    // Nastavit GPS tlačítko
    this.setupGPSButton();
  }

  waitForAuthAndSetupTools() {
    // Zkusit načíst nástroje okamžitě
    this.updateDrawingToolsVisibility();
    
    // Pokud není auth manager dostupný, počkat
    if (!window.vygeoApp || !window.vygeoApp.getAuthManager()) {
      setTimeout(() => {
        this.waitForAuthAndSetupTools();
      }, 100);
      return;
    }
    
    // Pokud je auth manager dostupný, nastavit nástroje
    this.updateDrawingToolsVisibility();
  }

  setupDrawingTools() {
    // Měřicí nástroje jsou dostupné pouze pro přihlášené uživatele
    this.updateDrawingToolsVisibility();
  }

  updateDrawingToolsVisibility() {
    // Odstranit existující kontrolu
    if (this.drawControl) {
      this.mapManager.getMap().removeControl(this.drawControl);
    }

    // Zkontrolovat, zda je uživatel přihlášen
    const isLoggedIn = window.vygeoApp && window.vygeoApp.getAuthManager() && window.vygeoApp.getAuthManager().getIsLoggedIn();
    
    if (isLoggedIn) {
      // Vytvořit skupinu všech feature vrstev pro editaci
      const allFeatureLayers = new L.FeatureGroup();
      allFeatureLayers.addLayer(this.polygonLayer);
      allFeatureLayers.addLayer(this.polylineLayer);
      allFeatureLayers.addLayer(this.markerLayer);
      
      this.drawControl = new L.Control.Draw({
        position: 'topleft',
        edit: { 
          featureGroup: allFeatureLayers, 
          edit: true, 
          remove: true,
          selectedPathOptions: {
            color: '#007ddd',
            weight: 2
          }
        },
        draw: {
          marker: { icon: L.Icon.Default.prototype.options.icon },
          polygon: { allowIntersection: false, showArea: true },
          polyline: true,
          rectangle: true,
          circle: false,
          circlemarker: false
        }
      });
      
      // Zajistit, že je allFeatureLayers správně inicializovaná
      if (!allFeatureLayers || !allFeatureLayers.addLayer) {
        console.error('allFeatureLayers není správně inicializovaná');
        return;
      }

      this.mapManager.getMap().addControl(this.drawControl);
    }
  }

  setupEventListeners() {
    // Vytvoření nového objektu
    this.mapManager.getMap().on(L.Draw.Event.CREATED, async (e) => {
      await this.handleFeatureCreated(e);
    });

    // Editace existujících
    this.mapManager.getMap().on('draw:edited', (e) => {
      this.handleFeatureEdited(e);
    });

    // Smazání existujících
    this.mapManager.getMap().on('draw:deleted', (e) => {
      this.handleFeatureDeleted(e);
    });
  }

  async handleFeatureCreated(e) {
    const layer = e.layer;
    const layerType = e.layerType;

    let name = prompt("Zadej název objektu:", this.nameForLayerType(layerType));
    if (!name || !name.trim()) name = this.nameForLayerType(layerType);
    
    // Výběr barvy z palety
    const color = await this.showColorPicker("#007ddd");

    // Vytvořit GeoJSON feature z Leaflet layer
    const feature = layer.toGeoJSON();
    feature.properties = feature.properties || {};
    feature.properties.name = name;
    feature.properties.type = layerType;
    feature.properties.color = color;

    console.log('Vytvořen feature:', {
      type: feature.geometry.type,
      coordinates: feature.geometry.coordinates,
      layerType: layerType
    });

    // Získat nadmořskou výšku
    try {
      const enrichedFeature = await this.enrichFeatureWithElevation(feature);
      layer.feature = enrichedFeature;
      console.log('Feature obohacen o nadmořské výšky:', enrichedFeature.properties);
    } catch (error) {
      console.warn('Chyba při získávání nadmořské výšky:', error);
      layer.feature = feature;
    }

    // Nastavit barvu layeru
    layer.setStyle({ 
      color: color, 
      fillColor: color,
      weight: 2,
      fillOpacity: 0.3
    });
    
    layer.bindPopup(this.createFeaturePopup(layer.feature, 'new'));
    
    // Povolit interakce pro nově vytvořené objekty
    this.enableLayerInteractions(layer);
    
    // Přidat do správné vrstvy podle typu
    this.addToCorrectLayer(layer, layerType);

    // Uložit do DB (včetně elevation dat)
    this.saveFeature(layer, 'create');
    
    // Přidat do dynamické legendy po uložení
    setTimeout(() => {
      if (layer.feature && layer.feature.properties && layer.feature.properties.id) {
        this.addFeatureToLegend(layer.feature.properties.id, layer.feature);
      }
    }, 1000);
  }

  addToCorrectLayer(layer, layerType) {
    // Přidat do správné vrstvy podle typu
    switch(layerType) {
      case 'polygon':
      case 'rectangle':
      case 'Polygon':
        this.polygonLayer.addLayer(layer);
        break;
      case 'polyline':
      case 'LineString':
        this.polylineLayer.addLayer(layer);
        break;
      case 'marker':
      case 'Point':
        this.markerLayer.addLayer(layer);
        break;
      default:
        console.warn('Neznámý typ vrstvy:', layerType);
        // Fallback na základě typu geometrie
        if (layerType === 'Polygon') {
          this.polygonLayer.addLayer(layer);
        } else if (layerType === 'LineString') {
          this.polylineLayer.addLayer(layer);
        } else if (layerType === 'Point') {
          this.markerLayer.addLayer(layer);
        } else {
          this.polygonLayer.addLayer(layer);
        }
    }
  }

  handleFeatureEdited(e) {
    e.layers.eachLayer((layer) => {
      this.saveFeature(layer, 'update');
    });
  }

  handleFeatureDeleted(e) {
    e.layers.eachLayer((layer) => {
      const id = layer?.feature?.properties?.id;
      if (id) this.deleteFeatureById(id);
    });
  }

  nameForLayerType(type) {
    switch (type) {
      case 'marker': return 'Bod';
      case 'polyline': return 'Linie';
      case 'polygon': return 'Polygon';
      case 'rectangle': return 'Polygon';
      default: return type;
    }
  }

  async saveFeature(layer, action) {
    const feature = layer.toGeoJSON();
    feature.properties = feature.properties || {};
    feature.properties.action = action;
    
    const id = layer?.feature?.properties?.id;
    if (id) feature.properties.id = id;

    // Zobrazit loading stav
    layer.setStyle({ opacity: 0.7 });
    layer.bindPopup(this.createFeaturePopup(feature, 'loading'));

    try {
      // Prepare elevation data for saving
      let elevationData = null;
      if (layer.feature && layer.feature.properties) {
        const props = layer.feature.properties;
        elevationData = {
          elevations: props.elevations || null,
          minElevation: props.minElevation || null,
          maxElevation: props.maxElevation || null,
          avgElevation: props.avgElevation || null,
          elevation: props.elevation || null,
          elevationGain: props.elevationGain || null,
          elevationLoss: props.elevationLoss || null,
          totalElevationChange: props.totalElevationChange || null
        };
        
        // Remove null values
        Object.keys(elevationData).forEach(key => {
          if (elevationData[key] === null) {
            delete elevationData[key];
          }
        });
        
        // If no elevation data, set to null
        if (Object.keys(elevationData).length === 0) {
          elevationData = null;
        }
      }

      const response = await fetch('api/features.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          name: feature.properties.name || '',
          type: feature.geometry.type,
          geometry: feature.geometry,
          elevation_data: elevationData
        })
      });

      // Zkontrolovat, zda je response JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('API vrátilo HTML místo JSON:', text.substring(0, 500));
        throw new Error(`Server vrátil HTML místo JSON. Status: ${response.status}`);
      }

      const res = await response.json();
      
      if (res && res.id) {
        layer.feature = layer.feature || { type: 'Feature', properties: {} };
        layer.feature.properties.id = res.id;
        layer.feature.properties.name = feature.properties.name;
        layer.feature.properties.type = feature.geometry.type;
        layer.feature.properties.created_at = new Date().toISOString();
        this.featureLayers[res.id] = layer;
        
        // Zobrazit úspěšný stav
        layer.setStyle({ opacity: 1 });
        layer.bindPopup(this.createFeaturePopup(layer.feature, 'saved'));
      } else {
        throw new Error('Nepodařilo se uložit objekt');
      }
    } catch (error) {
      console.error('Chyba při ukládání prvku:', error);
      console.error('Feature data:', {
        action: action,
        name: feature.properties.name,
        type: feature.geometry.type,
        geometry: feature.geometry
      });
      layer.setStyle({ opacity: 0.3, color: 'red' });
      layer.bindPopup(this.createFeaturePopup(feature, 'error', error.message));
    }
  }

  async deleteFeatureById(id) {
    try {
      await fetch('api/features.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: [id] })
      });
    } catch (error) {
      console.error('Chyba při mazání prvku:', error);
    }
  }

  createFeaturePopup(feature, status, errorMessage = '') {
    const props = feature.properties || {};
    const geometry = feature.geometry || {};
    
    let statusIcon = '';
    let statusText = '';
    let statusColor = '';
    
    switch (status) {
      case 'loading':
        statusIcon = '<div class="loading-spinner"></div>';
        statusText = 'Ukládám...';
        statusColor = '#ffa500';
        break;
      case 'saved':
        statusIcon = '';
        statusText = '';
        statusColor = '#28a745';
        break;
      case 'error':
        statusIcon = '❌';
        statusText = 'Chyba';
        statusColor = '#dc3545';
        break;
      default:
        statusIcon = '📝';
        statusText = 'Nová';
        statusColor = '#6c757d';
    }

    const geometricData = this.calculateGeometricData(geometry);
    let popupContent = `
      <div class="feature-popup">
        <div class="popup-header">
          <h3>${props.name || 'Bez názvu'}</h3>
          <div class="status-indicator" style="color: ${statusColor}">
            ${statusIcon} ${statusText}
          </div>
        </div>
        
        <div class="popup-content">
          <table class="attribute-table">
            <tr><td class="attr-label">ID:</td><td class="attr-value">${props.id || 'N/A'}</td></tr>
            <tr><td class="attr-label">Typ:</td><td class="attr-value">${geometry.type || 'N/A'}</td></tr>
            <tr><td class="attr-label">Název:</td><td class="attr-value">${props.name || 'Bez názvu'}</td></tr>
            ${geometricData.length ? `<tr><td class="attr-label">Délka:</td><td class="attr-value">${geometricData.length}</td></tr>` : ''}
            ${geometricData.area ? `<tr><td class="attr-label">Plocha:</td><td class="attr-value">${geometricData.area}</td></tr>` : ''}
            ${geometricData.coordinates ? `<tr><td class="attr-label">Souřadnice:</td><td class="attr-value">${geometricData.coordinates}</td></tr>` : ''}
            <tr><td class="attr-label">Vytvořeno:</td><td class="attr-value">${props.created_at ? new Date(props.created_at).toLocaleString('cs-CZ') : 'N/A'}</td></tr>
            <tr><td class="attr-label">Aktualizováno:</td><td class="attr-value">${props.updated_at ? new Date(props.updated_at).toLocaleString('cs-CZ') : 'N/A'}</td></tr>
            ${errorMessage ? `<tr><td class="attr-label">Chyba:</td><td class="attr-value error-text">${errorMessage}</td></tr>` : ''}
          </table>
          
          <div class="popup-actions" style="margin-top: 15px; text-align: center;">
            <button onclick="window.vygeoApp.getFeaturesManager().downloadFeature('${props.id || 'unknown'}')" 
                    class="download-btn" 
                    style="background: #007ddd; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Stáhnout GeoJSON
            </button>
          </div>
        </div>
      </div>
    `;

    // Přidat informace o nadmořské výšce
    popupContent = this.updateFeaturePopupWithElevation(feature, popupContent);
    
    return popupContent;
  }

  calculateGeometricData(geometry) {
    if (!geometry || !geometry.coordinates) {
      return {};
    }

    const result = {};

    switch (geometry.type) {
      case 'Point':
        if (geometry.coordinates && geometry.coordinates.length >= 2) {
          const [lng, lat] = geometry.coordinates;
          if (lng !== null && lat !== null) {
            result.coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }
        }
        break;

      case 'LineString':
        if (geometry.coordinates && geometry.coordinates.length > 0) {
          const lineCoords = geometry.coordinates
            .filter(coord => coord && coord.length >= 2 && coord[0] !== null && coord[1] !== null)
            .map(coord => [coord[1], coord[0]]);
          if (lineCoords.length > 1) {
            const length = this.computePolylineLengthMeters(lineCoords);
            result.length = `${length.toFixed(1)} m`;
          }
        }
        break;

      case 'Polygon':
        // Převod z GeoJSON [lng, lat] na Leaflet L.latLng objekty
        if (geometry.coordinates && geometry.coordinates[0] && Array.isArray(geometry.coordinates[0])) {
          const polyCoords = geometry.coordinates[0]
            .filter(coord => coord && coord.length >= 2 && coord[0] !== null && coord[1] !== null)
            .map(coord => L.latLng(coord[1], coord[0]));
          if (polyCoords.length >= 3) {
            const area = this.computePolygonAreaSqm(polyCoords);
            result.area = `${area.toFixed(1)} m²`;
          }
        }
        break;

      case 'MultiLineString':
        let totalLength = 0;
        if (geometry.coordinates && Array.isArray(geometry.coordinates)) {
          geometry.coordinates.forEach(coord => {
            if (coord && Array.isArray(coord)) {
              const lineCoords = coord
                .filter(c => c && c.length >= 2 && c[0] !== null && c[1] !== null)
                .map(c => [c[1], c[0]]);
              if (lineCoords.length > 1) {
                totalLength += this.computePolylineLengthMeters(lineCoords);
              }
            }
          });
        }
        if (totalLength > 0) {
          result.length = `${totalLength.toFixed(1)} m`;
        }
        break;

      case 'MultiPolygon':
        let totalArea = 0;
        if (geometry.coordinates && Array.isArray(geometry.coordinates)) {
          geometry.coordinates.forEach(polygon => {
            if (polygon && Array.isArray(polygon) && polygon[0] && Array.isArray(polygon[0])) {
              const polyCoords = polygon[0]
                .filter(coord => coord && coord.length >= 2 && coord[0] !== null && coord[1] !== null)
                .map(coord => L.latLng(coord[1], coord[0]));
              if (polyCoords.length >= 3) {
                totalArea += this.computePolygonAreaSqm(polyCoords);
              }
            }
          });
        }
        if (totalArea > 0) {
          result.area = `${totalArea.toFixed(1)} m²`;
        }
        break;
    }

    return result;
  }

  computePolylineLengthMeters(latlngs) {
    if (!Array.isArray(latlngs)) return 0;
    if (latlngs.length > 0 && Array.isArray(latlngs[0])) {
      return latlngs.reduce((sum, seg) => sum + this.computePolylineLengthMeters(seg), 0);
    }
    
    let d = 0;
    for (let i = 1; i < latlngs.length; i++) {
      if (latlngs[i - 1] && latlngs[i] && 
          latlngs[i - 1].lat !== null && latlngs[i - 1].lat !== undefined &&
          latlngs[i].lat !== null && latlngs[i].lat !== undefined) {
        d += this.mapManager.getMap().distance(latlngs[i - 1], latlngs[i]);
      }
    }
    return d;
  }

  computePolygonAreaSqm(latlngs) {
    if (!latlngs || latlngs.length < 3) return 0;
    
    const rings = Array.isArray(latlngs[0]) ? latlngs : [latlngs];
    let area = 0;
    
    rings.forEach(ring => {
      if (!ring || ring.length < 3) return;
      
      const pts = ring.map(ll => {
        if (ll && ll.lat !== undefined && ll.lng !== undefined) {
          return L.latLng(ll.lat, ll.lng);
        } else if (Array.isArray(ll) && ll.length >= 2) {
          return L.latLng(ll[0], ll[1]);
        }
        return null;
      }).filter(pt => pt !== null);
      
      if (pts.length >= 3 && L.GeometryUtil && L.GeometryUtil.geodesicArea) {
        area += Math.abs(L.GeometryUtil.geodesicArea(pts));
      }
    });
    
    return area;
  }

  async loadFeaturesFromDB() {
    try {
      const response = await fetch('api/get_features.php');
      const fc = await response.json();
      
      if (!fc || !fc.features) {
        console.log('Žádné objekty k načtení');
        return;
      }
      
      console.log('Načítám', fc.features.length, 'objektů z databáze');
      
      // Vyčisti existující objekty
      this.polygonLayer.clearLayers();
      this.polylineLayer.clearLayers();
      this.markerLayer.clearLayers();
      this.featureLayers = {};
      
      // NAČTENÍ: Zobrazit všechny objekty s elevation daty z databáze
      for (const f of fc.features) {
        const id = (f.properties && (f.properties.id || f.properties.ID)) || `f_${fc.features.indexOf(f)}`;
        const name = (f.properties && f.properties.name) || 'Bez názvu';
        
        try {
          // Vytvořit feature s elevation daty z databáze
          const featureWithElevation = { ...f };
          
          // Zkontrolovat, zda má feature elevation data z databáze
          const hasElevationData = featureWithElevation.properties && (
            featureWithElevation.properties.elevations ||
            featureWithElevation.properties.minElevation ||
            featureWithElevation.properties.maxElevation ||
            featureWithElevation.properties.avgElevation ||
            featureWithElevation.properties.elevation
          );
          
          if (hasElevationData) {
            console.log(`Feature ${id} má elevation data z databáze`);
          } else {
            console.log(`Feature ${id} nemá elevation data, bude načteno z API`);
          }
          
          const group = L.geoJSON(featureWithElevation);
          
          group.eachLayer(l => {
            l.bindPopup(this.createFeaturePopup(featureWithElevation, 'saved'));
            l.feature = featureWithElevation;
            
            // Nastavit barvu podle properties
            const color = featureWithElevation.properties?.color || this.getDefaultColorForType(featureWithElevation.geometry?.type);
            l.setStyle({ 
              color: color, 
              fillColor: color,
              weight: 2,
              fillOpacity: 0.3
            });
            
            // Povolit interakce pro nově načtené objekty
            this.enableLayerInteractions(l);
            
            // Přidat do správné vrstvy podle typu geometrie
            const geometryType = featureWithElevation.geometry ? featureWithElevation.geometry.type : 'polygon';
            this.addToCorrectLayer(l, geometryType);
          });
          
          this.featureLayers[id] = { layer: group, name };
          
          // Přidat do dynamické legendy
          this.addFeatureToLegend(id, featureWithElevation);
        } catch (error) {
          console.error(`Chyba při načítání objektu ${id}:`, error);
        }
      }
      
      console.log('Načítání dokončeno. Celkem objektů:', Object.keys(this.featureLayers).length);
      
      // ASYNCHRONNÍ NAČTENÍ: Na pozadí načíst nadmořské výšky pouze pro objekty bez elevation dat
      const featuresWithoutElevation = fc.features.filter(f => {
        const props = f.properties || {};
        return !props.elevations && !props.minElevation && !props.maxElevation && 
               !props.avgElevation && !props.elevation;
      });
      
      if (featuresWithoutElevation.length > 0) {
        console.log(`Načítám elevation data z API pro ${featuresWithoutElevation.length} objektů`);
        this.loadElevationsAsync(featuresWithoutElevation);
      } else {
        console.log('Všechny objekty mají elevation data z databáze');
      }
      
    } catch (error) {
      console.error('Chyba při načítání objektů:', error);
    }
  }

  // Asynchronní načítání nadmořských výšek na pozadí
  async loadElevationsAsync(features) {
    console.log('Začínám asynchronní načítání nadmořských výšek...');
    
    for (const f of features) {
      const id = (f.properties && (f.properties.id || f.properties.ID)) || `f_${features.indexOf(f)}`;
      
      try {
        // Obohacit o nadmořskou výšku
        const enrichedFeature = await this.enrichFeatureWithElevation(f);
        
        // Uložit elevation data do databáze
        await this.saveElevationDataToDB(id, enrichedFeature.properties);
        
        // Aktualizovat existující vrstvu
        if (this.featureLayers[id]) {
          const group = this.featureLayers[id].layer;
          
          // Aktualizovat popup s novými daty
          group.eachLayer(l => {
            l.feature = enrichedFeature;
            l.bindPopup(this.createFeaturePopup(enrichedFeature, 'saved'));
          });
          
          // Aktualizovat legendu
          this.addFeatureToLegend(id, enrichedFeature);
        }
        
        // Krátká pauza pro lepší UX
        await this.delay(100);
        
      } catch (error) {
        console.error(`Chyba při načítání nadmořské výšky pro objekt ${id}:`, error);
      }
    }
    
    console.log('Asynchronní načítání nadmořských výšek dokončeno');
  }

  // Uložit elevation data do databáze
  async saveElevationDataToDB(featureId, properties) {
    try {
      const elevationData = {
        elevations: properties.elevations || null,
        minElevation: properties.minElevation || null,
        maxElevation: properties.maxElevation || null,
        avgElevation: properties.avgElevation || null,
        elevation: properties.elevation || null,
        elevationGain: properties.elevationGain || null,
        elevationLoss: properties.elevationLoss || null,
        totalElevationChange: properties.totalElevationChange || null
      };
      
      // Remove null values
      Object.keys(elevationData).forEach(key => {
        if (elevationData[key] === null) {
          delete elevationData[key];
        }
      });
      
      // If no elevation data, don't save
      if (Object.keys(elevationData).length === 0) {
        console.log(`Žádná elevation data k uložení pro feature ${featureId}`);
        return;
      }

      const response = await fetch('api/features.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: featureId,
          elevation_data: elevationData
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`API vrátilo HTML místo JSON pro feature ${featureId}:`, text.substring(0, 200));
        throw new Error(`Server vrátil HTML místo JSON. Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.ok) {
        console.log(`Elevation data uložena do databáze pro feature ${featureId}`);
      } else {
        console.error(`Chyba při ukládání elevation dat pro feature ${featureId}:`, result.error);
        throw new Error(`Chyba při ukládání elevation dat: ${result.error}`);
      }
    } catch (error) {
      console.error(`Chyba při ukládání elevation dat pro feature ${featureId}:`, error);
    }
  }

  // Public method pro aktualizaci nástrojů při změně přihlášení
  refreshDrawingTools() {
    this.updateDrawingToolsVisibility();
  }

  // Nastavení event listenerů pro panel jednotlivých objektů
  setupObjectsPanelEvents() {
    const objectsButton = document.getElementById('objectsButton');
    const objectsPanel = document.getElementById('objectsPanel');
    const closeObjectsPanel = document.getElementById('closeObjectsPanel');

    if (objectsButton) {
      objectsButton.addEventListener('click', () => {
        this.toggleObjectsPanel();
      });
    }

    if (closeObjectsPanel) {
      closeObjectsPanel.addEventListener('click', () => {
        this.hideObjectsPanel();
      });
    }

    // Zavřít panel při kliknutí mimo něj
    if (objectsPanel) {
      objectsPanel.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    document.addEventListener('click', (e) => {
      if (this.objectsPanelVisible && !objectsPanel.contains(e.target) && !objectsButton.contains(e.target)) {
        this.hideObjectsPanel();
      }
    });
  }

  // Přepnout zobrazení panelu jednotlivých objektů
  toggleObjectsPanel() {
    if (this.objectsPanelVisible) {
      this.hideObjectsPanel();
    } else {
      this.showObjectsPanel();
    }
  }

  // Zobrazit panel jednotlivých objektů
  showObjectsPanel() {
    const objectsPanel = document.getElementById('objectsPanel');
    if (objectsPanel) {
      objectsPanel.style.display = 'block';
      this.objectsPanelVisible = true;
      this.populateObjectsPanel();
    }
  }

  // Skrýt panel jednotlivých objektů
  hideObjectsPanel() {
    const objectsPanel = document.getElementById('objectsPanel');
    if (objectsPanel) {
      objectsPanel.style.display = 'none';
      this.objectsPanelVisible = false;
    }
  }

  // Naplnit panel jednotlivých objektů
  populateObjectsPanel() {
    const objectsList = document.getElementById('objectsList');
    if (!objectsList) return;

    objectsList.innerHTML = '';

    Object.entries(this.featureLayers).forEach(([id, featureData]) => {
      const feature = featureData.layer;
      const name = featureData.name || 'Bez názvu';
      const geometryType = feature.feature?.geometry?.type || 'unknown';
      
      // Určit barvu podle properties nebo typu geometrie
      let color = feature.feature?.properties?.color || this.getDefaultColorForType(geometryType);

      const objectItem = document.createElement('div');
      objectItem.className = 'object-item';
      objectItem.innerHTML = `
        <input type="checkbox" checked onchange="window.vygeoApp.getFeaturesManager().toggleObjectVisibility('${id}', this.checked)">
        <div class="object-color" style="background-color: ${color}"></div>
        <div class="object-name">${name}</div>
        <div class="object-actions">
          <button class="object-btn edit" onclick="window.vygeoApp.getFeaturesManager().editObject('${id}')" title="Upravit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="object-btn delete" onclick="window.vygeoApp.getFeaturesManager().deleteObject('${id}')" title="Smazat">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      objectsList.appendChild(objectItem);
    });
  }

  // Přepnout viditelnost objektu
  toggleObjectVisibility(id, visible) {
    const featureData = this.featureLayers[id];
    if (featureData && featureData.layer) {
      if (visible) {
        // Zobrazit - obnovit původní styly a povolit interakce
        featureData.layer.eachLayer(l => {
          l.setStyle({ 
            opacity: 1,
            fillOpacity: 1,
            weight: 2
          });
          // Povolit interakce
          this.enableLayerInteractions(l);
        });
        // Zajistit, že je layer na mapě
        if (!this.mapManager.getMap().hasLayer(featureData.layer)) {
          this.mapManager.getMap().addLayer(featureData.layer);
        }
      } else {
        // Skrýt - úplně odstranit z mapy (nejefektivnější řešení)
        if (this.mapManager.getMap().hasLayer(featureData.layer)) {
          this.mapManager.getMap().removeLayer(featureData.layer);
        }
        // Alternativně: skrýt a zakázat interakce
        // featureData.layer.eachLayer(l => {
        //   l.setStyle({ 
        //     opacity: 0,
        //     fillOpacity: 0,
        //     weight: 0
        //   });
        //   this.disableLayerInteractions(l);
        // });
      }
    }
  }

  // Upravit objekt
  editObject(id) {
    const featureData = this.featureLayers[id];
    if (featureData && featureData.layer) {
      // Zde by se měla otevřít editační modal nebo formulář
      console.log('Editovat objekt:', id);
      // Prozatím jen zobrazit popup
      featureData.layer.openPopup();
    }
  }

  // Smazat objekt
  deleteObject(id) {
    if (confirm('Opravdu chcete smazat tento objekt?')) {
      this.deleteFeatureById(id);
      this.populateObjectsPanel(); // Aktualizovat panel
    }
  }

  // OpenElevation API metody s fallback řešením
  async getElevationForCoordinates(lat, lng) {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    
    // Zkontrolovat cache
    if (this.elevationCache.has(cacheKey)) {
      return this.elevationCache.get(cacheKey);
    }

    // Fallback: použít přibližnou výšku na základě lokace (Opalena je v Beskydech)
    const fallbackElevation = this.getFallbackElevation(lat, lng);
    
    try {
      // Přidat delay pro rate limiting
      await this.delay(100);
      
      const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Přidat timeout
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const elevation = data.results[0].elevation;
        this.elevationCache.set(cacheKey, elevation);
        return elevation;
      }
    } catch (error) {
      console.warn('Chyba při získávání nadmořské výšky, používá se fallback:', error.message);
      // Použít fallback výšku
      this.elevationCache.set(cacheKey, fallbackElevation);
      return fallbackElevation;
    }
    
    return fallbackElevation;
  }

  // Fallback metoda pro přibližnou výšku
  getFallbackElevation(lat, lng) {
    // Opalena je v Beskydech, přibližná výška 500-700m
    // Jednoduchá aproximace na základě vzdálenosti od centra
    const centerLat = 49.554;
    const centerLng = 18.313;
    
    const distance = Math.sqrt(
      Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
    );
    
    // Základní výška + variace podle vzdálenosti
    const baseElevation = 600;
    const variation = Math.sin(distance * 100) * 50;
    
    return Math.round(baseElevation + variation);
  }

  // Pomocná metoda pro delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getElevationForGeometry(geometry) {
    const elevations = [];
    
    console.log('getElevationForGeometry called:', {
      type: geometry.type,
      coordinates: geometry.coordinates
    });
    
    if (geometry.type === 'Point') {
      const elevation = await this.getElevationForCoordinates(geometry.coordinates[1], geometry.coordinates[0]);
      elevations.push(elevation);
    } else if (geometry.type === 'LineString' || geometry.type === 'Polygon') {
      const coordinates = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates;
      
      console.log('Získávám nadmořské výšky pro', coordinates.length, 'bodů');
      
      // Omezit počet bodů pro lepší výkon
      const maxPoints = 20;
      const step = Math.max(1, Math.floor(coordinates.length / maxPoints));
      
      for (let i = 0; i < coordinates.length; i += step) {
        const coord = coordinates[i];
        const elevation = await this.getElevationForCoordinates(coord[1], coord[0]);
        elevations.push(elevation);
        console.log('Souřadnice:', coord, 'Výška:', elevation);
        
        // Přidat delay mezi požadavky pro rate limiting
        if (i + step < coordinates.length) {
          await this.delay(50);
        }
      }
    }
    
    console.log('Všechny nadmořské výšky:', elevations);
    return elevations;
  }

  async enrichFeatureWithElevation(feature) {
    if (!feature.geometry) return feature;
    
    // Zajistit, že properties existuje
    if (!feature.properties) {
      feature.properties = {};
    }
    
    const elevations = await this.getElevationForGeometry(feature.geometry);
    const validElevations = elevations.filter(e => e !== null);
    
    if (validElevations.length > 0) {
      // Přidat informace o nadmořské výšce do properties
      feature.properties.elevations = elevations;
      feature.properties.minElevation = Math.min(...validElevations);
      feature.properties.maxElevation = Math.max(...validElevations);
      feature.properties.avgElevation = validElevations.reduce((a, b) => a + b, 0) / validElevations.length;
      
      // Vypočítat převýšení
      feature.properties.elevationGain = this.calculateElevationGain(validElevations);
      feature.properties.elevationLoss = this.calculateElevationLoss(validElevations);
      feature.properties.totalElevationChange = feature.properties.elevationGain + feature.properties.elevationLoss;
      
      // Pro body přidat jednu výšku
      if (feature.geometry.type === 'Point' && validElevations.length === 1) {
        feature.properties.elevation = validElevations[0];
      }
      
      console.log('Nadmořské výšky přidány:', {
        type: feature.geometry.type,
        elevations: elevations,
        min: feature.properties.minElevation,
        max: feature.properties.maxElevation,
        avg: feature.properties.avgElevation
      });
    } else {
      console.warn('Žádné platné nadmořské výšky pro feature:', feature.geometry.type);
    }
    
    return feature;
  }

  calculateElevationGain(elevations) {
    if (elevations.length < 2) return 0;
    
    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1];
      if (diff > 0) {
        gain += diff;
      }
    }
    return gain;
  }

  calculateElevationLoss(elevations) {
    if (elevations.length < 2) return 0;
    
    let loss = 0;
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1];
      if (diff < 0) {
        loss += Math.abs(diff);
      }
    }
    return loss;
  }

  updateFeaturePopupWithElevation(feature, popupContent) {
    console.log('updateFeaturePopupWithElevation called:', {
      hasProperties: !!feature.properties,
      hasElevations: !!(feature.properties && feature.properties.elevations),
      properties: feature.properties
    });
    
    if (!feature.properties || !feature.properties.elevations) {
      console.log('Žádné nadmořské výšky k zobrazení');
      return popupContent;
    }
    
    const { minElevation, maxElevation, avgElevation, elevation, elevationGain, elevationLoss, totalElevationChange } = feature.properties;
    
    let elevationInfo = '';
    if (elevation !== undefined) {
      // Pro body
      elevationInfo = `<tr><td class="attr-label">Nadmořská výška:</td><td class="attr-value">${elevation.toFixed(1)} m n.m.</td></tr>`;
    } else if (minElevation !== undefined && maxElevation !== undefined) {
      // Pro linie a polygony
      elevationInfo = `<tr><td class="attr-label">Nadmořská výška:</td><td class="attr-value">`;
      elevationInfo += `Min: ${minElevation.toFixed(1)} m n.m.<br>`;
      elevationInfo += `Max: ${maxElevation.toFixed(1)} m n.m.<br>`;
      elevationInfo += `Průměr: ${avgElevation.toFixed(1)} m n.m.`;
      elevationInfo += `</td></tr>`;
      
      // Přidat převýšení pro linie a polygony
      if (elevationGain !== undefined && elevationLoss !== undefined) {
        elevationInfo += `<tr><td class="attr-label">Převýšení:</td><td class="attr-value">${totalElevationChange.toFixed(1)} m</td></tr>`;
      }
    }
    
    // Vložit před poslední řádek tabulky
    const lastRowIndex = popupContent.lastIndexOf('</table>');
    if (lastRowIndex !== -1) {
      return popupContent.slice(0, lastRowIndex) + elevationInfo + popupContent.slice(lastRowIndex);
    }
    
    return popupContent + elevationInfo;
  }

  // Dynamická legenda pro jednotlivé features
  createDynamicLegend() {
    const sidebar = document.getElementById('leftSidebar');
    if (!sidebar) return;

    const sidebarContent = sidebar.querySelector('.sidebar-content');
    if (!sidebarContent) return;

    // Vytvořit kontejner pro legendu
    this.legendContainer = document.createElement('div');
    this.legendContainer.className = 'sidebar-section';
    this.legendContainer.innerHTML = `
      <h4>Jednotlivé objekty</h4>
      <div id="featuresLegend" class="features-legend"></div>
    `;

    // Přidat do sidebaru
    sidebarContent.appendChild(this.legendContainer);

    // Přidat CSS pro legendu
    this.addLegendStyles();
  }

  addLegendStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .features-legend {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .feature-legend-item {
        display: flex;
        align-items: center;
        padding: 8px;
        margin: 4px 0;
        background: #f8f9fa;
        border-radius: 4px;
        border: 1px solid #e9ecef;
      }
      
      .feature-legend-item:hover {
        background: #e9ecef;
      }
      
      .feature-legend-checkbox {
        margin-right: 8px;
        transform: scale(1.1);
      }
      
      .feature-legend-color {
        width: 20px;
        height: 20px;
        border-radius: 3px;
        margin-right: 8px;
        border: 1px solid #ccc;
        cursor: pointer;
      }
      
      .feature-legend-name {
        flex: 1;
        font-size: 12px;
        font-weight: 500;
        color: #2c3e50;
      }
      
      .feature-legend-actions {
        display: flex;
        gap: 4px;
      }
      
      .feature-legend-btn {
        background: #007ddd;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
      }
      
      .feature-legend-btn:hover {
        background: #0056b3;
      }
      
      .feature-legend-btn.edit {
        background: #28a745;
      }
      
      .feature-legend-btn.edit:hover {
        background: #1e7e34;
      }
    `;
    document.head.appendChild(style);
  }

  addFeatureToLegend(featureId, feature) {
    if (!this.legendContainer) return;

    const legendDiv = document.getElementById('featuresLegend');
    if (!legendDiv) return;

    // Vytvořit element pro feature
    const featureElement = document.createElement('div');
    featureElement.className = 'feature-legend-item';
    featureElement.id = `legend-${featureId}`;

    // Výchozí barva podle typu
    let defaultColor = '#007ddd';
    if (feature.geometry.type === 'Point') defaultColor = '#dc3545';
    else if (feature.geometry.type === 'LineString') defaultColor = '#28a745';

    // Uložit do individualFeatures
    this.individualFeatures.set(featureId, {
      id: featureId,
      name: feature.properties.name || 'Bez názvu',
      color: defaultColor,
      visible: true,
      feature: feature
    });

    featureElement.innerHTML = `
      <input type="checkbox" class="feature-legend-checkbox" checked>
      <div class="feature-legend-color" style="background-color: ${defaultColor}" onclick="window.vygeoApp.getFeaturesManager().changeFeatureColor('${featureId}')"></div>
      <span class="feature-legend-name">${feature.properties.name || 'Bez názvu'}</span>
      <div class="feature-legend-actions">
        <button class="feature-legend-btn edit" onclick="window.vygeoApp.getFeaturesManager().editFeatureName('${featureId}')">✏️</button>
        <button class="feature-legend-btn" onclick="window.vygeoApp.getFeaturesManager().downloadFeature('${featureId}')">📥</button>
      </div>
    `;

    // Event listener pro checkbox
    const checkbox = featureElement.querySelector('.feature-legend-checkbox');
    checkbox.addEventListener('change', (e) => {
      this.toggleFeatureVisibility(featureId, e.target.checked);
    });

    legendDiv.appendChild(featureElement);
  }

  toggleFeatureVisibility(featureId, visible) {
    const featureData = this.individualFeatures.get(featureId);
    if (!featureData) return;

    featureData.visible = visible;

    // Najít layer v mapě a skrýt/zobrazit
    [this.polygonLayer, this.polylineLayer, this.markerLayer].forEach(layer => {
      layer.eachLayer(l => {
        if (l.feature && l.feature.properties && l.feature.properties.id === featureId) {
          if (visible) {
            // Zobrazit - obnovit původní styly a povolit interakce
            l.setStyle({ 
              opacity: 1,
              fillOpacity: 1,
              weight: 2
            });
            // Povolit interakce
            this.enableLayerInteractions(l);
            // Zajistit, že je layer na mapě
            if (!this.mapManager.getMap().hasLayer(l)) {
              layer.addLayer(l);
            }
          } else {
            // Skrýt - úplně odstranit z mapy (nejefektivnější řešení)
            if (this.mapManager.getMap().hasLayer(l)) {
              this.mapManager.getMap().removeLayer(l);
            }
            // Alternativně: skrýt a zakázat interakce
            // l.setStyle({ 
            //   opacity: 0,
            //   fillOpacity: 0,
            //   weight: 0
            // });
            // this.disableLayerInteractions(l);
          }
        }
      });
    });
  }

  // Povolit interakce pro layer
  enableLayerInteractions(layer) {
    // Obnovit původní event listenery
    layer.off('click');
    layer.off('mouseover');
    layer.off('mouseout');
    layer.off('mousedown');
    layer.off('mouseup');
    
    // Povolit interakce
    layer.options.interactive = true;
    layer.options.bubblingMouseEvents = true;
    
    // Přidat zpět event listenery
    layer.on('click', (e) => {
      e.originalEvent.stopPropagation();
      if (layer.feature && layer.feature.properties) {
        layer.openPopup();
      }
    });
    
    layer.on('mouseover', (e) => {
      e.originalEvent.stopPropagation();
      layer.setStyle({ weight: 3 });
    });
    
    layer.on('mouseout', (e) => {
      e.originalEvent.stopPropagation();
      layer.setStyle({ weight: 2 });
    });
  }

  // Zakázat interakce pro layer
  disableLayerInteractions(layer) {
    // Odstranit všechny event listenery
    layer.off('click');
    layer.off('mouseover');
    layer.off('mouseout');
    layer.off('mousedown');
    layer.off('mouseup');
    
    // Zakázat interakce
    layer.options.interactive = false;
    layer.options.bubblingMouseEvents = false;
    
    // Přidat prázdné event listenery, které blokují propagaci
    layer.on('click', (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    });
    
    layer.on('mouseover', (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    });
    
    layer.on('mouseout', (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    });
    
    layer.on('mousedown', (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    });
    
    layer.on('mouseup', (e) => {
      e.originalEvent.stopPropagation();
      e.originalEvent.preventDefault();
    });
  }

  async changeFeatureColor(featureId) {
    const featureData = this.individualFeatures.get(featureId);
    if (!featureData) return;

    const newColor = await this.showColorPicker(featureData.color);
    if (!newColor) return;

    featureData.color = newColor;

    // Aktualizovat barvu v legendě
    const colorDiv = document.querySelector(`#legend-${featureId} .feature-legend-color`);
    if (colorDiv) {
      colorDiv.style.backgroundColor = newColor;
    }

    // Aktualizovat barvu na mapě
    [this.polygonLayer, this.polylineLayer, this.markerLayer].forEach(layer => {
      layer.eachLayer(l => {
        if (l.feature && l.feature.properties && l.feature.properties.id === featureId) {
          l.setStyle({ color: newColor, fillColor: newColor });
          // Aktualizovat i properties
          l.feature.properties.color = newColor;
        }
      });
    });
  }

  editFeatureName(featureId) {
    const featureData = this.individualFeatures.get(featureId);
    if (!featureData) return;

    const newName = prompt('Zadejte nový název:', featureData.name);
    if (!newName || newName.trim() === '') return;

    featureData.name = newName.trim();

    // Aktualizovat název v legendě
    const nameSpan = document.querySelector(`#legend-${featureId} .feature-legend-name`);
    if (nameSpan) {
      nameSpan.textContent = newName.trim();
    }

    // Aktualizovat název v feature
    [this.polygonLayer, this.polylineLayer, this.markerLayer].forEach(layer => {
      layer.eachLayer(l => {
        if (l.feature && l.feature.properties && l.feature.properties.id === featureId) {
          l.feature.properties.name = newName.trim();
          l.bindPopup(this.createFeaturePopup(l.feature, 'saved'));
        }
      });
    });
  }

  // Nastavení GPS tlačítka
  setupGPSButton() {
    const gpsButton = document.getElementById('gpsButton');
    if (gpsButton) {
      gpsButton.addEventListener('click', () => {
        this.saveCurrentGPSPosition();
      });
    }
  }

  // Uložení aktuální GPS pozice
  async saveCurrentGPSPosition() {
    if (!navigator.geolocation) {
      alert('Geolokace není podporována v tomto prohlížeči.');
      return;
    }

    const gpsButton = document.getElementById('gpsButton');
    if (gpsButton) {
      gpsButton.style.opacity = '0.5';
      gpsButton.style.pointerEvents = 'none';
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      // Požádat o název pro GPS pozici
      const name = prompt(`GPS pozice uložena!\nPřesnost: ${Math.round(accuracy)}m\nZadejte název pro tuto pozici:`, `GPS pozice ${new Date().toLocaleString('cs-CZ')}`);
      if (!name || !name.trim()) {
        if (gpsButton) {
          gpsButton.style.opacity = '1';
          gpsButton.style.pointerEvents = 'auto';
        }
        return;
      }

      // Požádat o barvu z palety
      const color = await this.showColorPicker("#ff0000");

      // Vytvořit marker na GPS pozici
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'assets/icons/marker-icon.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        })
      });

      // Vytvořit GeoJSON feature
      const feature = {
        type: 'Feature',
        properties: {
          name: name.trim(),
          type: 'Point',
          color: color,
          gps_accuracy: accuracy,
          created_at: new Date().toISOString()
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      };

      marker.feature = feature;
      marker.setStyle({ color: color });

      // Přidat popup
      marker.bindPopup(this.createFeaturePopup(feature, 'new'));

      // Povolit interakce
      this.enableLayerInteractions(marker);

      // Přidat do marker vrstvy
      this.markerLayer.addLayer(marker);

      // Uložit do databáze
      this.saveFeature(marker, 'create');

      // Přidat do panelu jednotlivých objektů
      setTimeout(() => {
        if (marker.feature && marker.feature.properties && marker.feature.properties.id) {
          this.addFeatureToLegend(marker.feature.properties.id, marker.feature);
        }
      }, 1000);

      // Přesunout mapu na GPS pozici
      this.mapManager.getMap().setView([lat, lng], 18);

      alert(`GPS pozice "${name}" byla úspěšně uložena!`);

    } catch (error) {
      console.error('Chyba při získávání GPS pozice:', error);
      let errorMessage = 'Chyba při získávání GPS pozice.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Přístup k poloze byl zamítnut. Povolte geolokaci v nastavení prohlížeče.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Informace o poloze nejsou dostupné.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Vypršel časový limit pro získání polohy.';
          break;
      }
      
      alert(errorMessage);
    } finally {
      if (gpsButton) {
        gpsButton.style.opacity = '1';
        gpsButton.style.pointerEvents = 'auto';
      }
    }
  }

  // Zobrazit paletu barev pro výběr
  showColorPicker(defaultColor = "#007ddd") {
    return new Promise((resolve) => {
      // Vytvořit modal okno
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
      `;

      // Vytvořit obsah modalu
      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
      `;

      // Paleta barev - 5 základních, dobře rozlišitelných barev
      const colors = [
        '#007ddd', // Modrá
        '#28a745', // Zelená
        '#dc3545', // Červená
        '#ffc107', // Žlutá
        '#6c757d'  // Šedá
      ];

      let selectedColor = defaultColor;

      content.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">Vyberte barvu</h3>
        <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 15px;">
          ${colors.map(color => `
            <div class="color-option" 
                 style="width: 40px; height: 40px; border-radius: 8px; cursor: pointer; border: 3px solid transparent; background-color: ${color};"
                 data-color="${color}">
            </div>
          `).join('')}
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="cancelColor" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Zrušit</button>
          <button id="confirmColor" style="padding: 8px 16px; border: none; background: #007ddd; color: white; border-radius: 4px; cursor: pointer;">OK</button>
        </div>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      // Označit výchozí barvu
      const defaultOption = content.querySelector(`[data-color="${defaultColor}"]`);
      if (defaultOption) {
        defaultOption.style.border = '3px solid #333';
      }

      // Event listenery
      content.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
          // Odstranit označení z ostatních
          content.querySelectorAll('.color-option').forEach(opt => {
            opt.style.border = '3px solid transparent';
          });
          // Označit vybranou
          option.style.border = '3px solid #333';
          selectedColor = option.dataset.color;
        });
      });

      content.querySelector('#cancelColor').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(defaultColor);
      });

      content.querySelector('#confirmColor').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(selectedColor);
      });

      // Zavřít při kliknutí mimo modal
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(defaultColor);
        }
      });
    });
  }

  // Získat výchozí barvu pro typ geometrie
  getDefaultColorForType(geometryType) {
    switch (geometryType) {
      case 'Point':
        return '#dc3545'; // červená pro body
      case 'LineString':
        return '#28a745'; // zelená pro linie
      case 'Polygon':
        return '#007ddd'; // modrá pro polygony
      default:
        return '#007ddd'; // výchozí modrá
    }
  }

  // Metoda pro stažení GeoJSON feature
  downloadFeature(featureId) {
    try {
      console.log('Hledám feature s ID:', featureId, 'typ:', typeof featureId);
      
      // Najít feature podle ID
      let feature = null;
      
      // Hledat v featureLayers
      if (this.featureLayers[featureId]) {
        const layer = this.featureLayers[featureId].layer;
        if (layer && layer.feature) {
          feature = layer.feature;
          console.log('Feature nalezen v featureLayers');
        }
      }
      
      // Pokud se nenajde, hledat v aktuálních vrstvách
      if (!feature) {
        [this.polygonLayer, this.polylineLayer, this.markerLayer].forEach(layer => {
          layer.eachLayer(l => {
            if (l.feature && l.feature.properties) {
              const id = l.feature.properties.id;
              console.log('Kontroluji ID:', id, 'typ:', typeof id, 'hledám:', featureId);
              if (id == featureId || id === featureId || String(id) === String(featureId)) {
                feature = l.feature;
                console.log('Feature nalezen v vrstvách');
              }
            }
          });
        });
      }
      
      if (!feature) {
        console.error('Feature s ID', featureId, 'nenalezen');
        alert('Feature nenalezen!');
        return;
      }
      
      // Vytvořit GeoJSON soubor
      const geoJsonData = {
        type: "FeatureCollection",
        features: [feature]
      };
      
      // Vytvořit a stáhnout soubor
      const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feature_${featureId}_${feature.properties.name || 'unnamed'}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Feature stažen:', featureId);
    } catch (error) {
      console.error('Chyba při stahování feature:', error);
      alert('Chyba při stahování souboru!');
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeaturesManager;
} else {
  window.FeaturesManager = FeaturesManager;
}
