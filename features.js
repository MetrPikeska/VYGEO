// features.js - Správa objektů a kreslení
class FeaturesManager {
  constructor(mapManager) {
    this.mapManager = mapManager;
    // Použijeme vrstvu "Moje objekty" z MapManageru
    this.drawnItems = mapManager.layers.overlayMaps["Moje objekty"];
    this.featureLayers = {};
    this.init();
  }

  init() {
    this.setupDrawingTools();
    this.setupEventListeners();
    this.loadFeaturesFromDB();
  }

  setupDrawingTools() {
    const drawControl = new L.Control.Draw({
      position: 'topleft',
      edit: { 
        featureGroup: this.drawnItems, 
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
    
    this.mapManager.getMap().addControl(drawControl);
  }

  setupEventListeners() {
    // Vytvoření nového objektu
    this.mapManager.getMap().on(L.Draw.Event.CREATED, (e) => {
      this.handleFeatureCreated(e);
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

  handleFeatureCreated(e) {
    const layer = e.layer;
    const layerType = e.layerType;

    let name = prompt("Zadej název objektu:", this.nameForLayerType(layerType));
    if (!name || !name.trim()) name = this.nameForLayerType(layerType);

    // Properties + popup
    layer.feature = layer.feature || { type: 'Feature', properties: {} };
    layer.feature.properties.name = name;
    layer.feature.properties.type = layerType;

    layer.bindPopup(this.createFeaturePopup(layer.feature, 'new'));
    this.drawnItems.addLayer(layer);

    // Uložit do DB
    this.saveFeature(layer, 'create');
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
      const response = await fetch('api/features.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          name: feature.properties.name || '',
          type: feature.geometry.type,
          geometry: feature.geometry
        })
      });

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
        statusIcon = '✅';
        statusText = 'Uloženo';
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

    return `
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
        </div>
      </div>
    `;
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
      this.drawnItems.clearLayers();
      this.featureLayers = {};
      
      fc.features.forEach((f, idx) => {
        const id = (f.properties && (f.properties.id || f.properties.ID)) || `f_${idx}`;
        const name = (f.properties && f.properties.name) || 'Bez názvu';
        
        try {
          const group = L.geoJSON(f);
          
          group.eachLayer(l => {
            l.bindPopup(this.createFeaturePopup(f, 'saved'));
            l.feature = f;
            this.drawnItems.addLayer(l);
          });
          
          this.featureLayers[id] = { layer: group, name };
        } catch (error) {
          console.error(`Chyba při načítání objektu ${id}:`, error);
        }
      });
      
      console.log('Načítání dokončeno. Celkem objektů:', Object.keys(this.featureLayers).length);
    } catch (error) {
      console.error('Chyba při načítání objektů:', error);
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeaturesManager;
} else {
  window.FeaturesManager = FeaturesManager;
}
