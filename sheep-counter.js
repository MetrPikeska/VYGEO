// sheep-counter.js - Správa počítání ovcí
class SheepCounter {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.currentCount = 0;
    this.vlekyLayer = null;
    this.init();
  }

  init() {
    this.loadVlekyLayer();
    this.startPeriodicUpdate();
  }

  loadVlekyLayer() {
    $.getJSON('https://gist.githubusercontent.com/MetrPikeska/ca5795b2be4bddc3989b450284b1d8a9/raw/0485ce84414da1ee749439b051ef2ed3683f589a/vleky.geojson', (data) => {
      this.vlekyLayer = L.geoJSON(data, {
        style: () => ({ color: 'green', weight: 5 })
      });
      this.mapManager.addLayer(this.vlekyLayer);
      this.updateVlekyColor(this.currentCount);
    });
  }

  updateSheepCount(count) {
    this.currentCount = count;
    
    // Aktualizuj zobrazení v UI
    document.querySelector('.skiers-count').textContent = count;
    
    // Aktualizuj mobilní zobrazení
    const mobileElements = [
      'mobileSkiers', 'mobileInfoSkiers', 'mobileCurrentSkiers'
    ];
    
    mobileElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.textContent = count;
    });

    const mobileSkiersDisplay = document.getElementById('mobileSkiersDisplay');
    if (mobileSkiersDisplay) {
      mobileSkiersDisplay.textContent = count + ' ovcí';
    }

    // Aktualizuj barvu vleků
    this.updateVlekyColor(count);
  }

  updateVlekyColor(count) {
    if (!this.vlekyLayer) return;

    let color = CONFIG.LIFT_COLORS[0]; // výchozí zelená
    
    if (count >= 3) {
      color = CONFIG.LIFT_COLORS[3]; // červená
    } else if (count >= 1) {
      color = CONFIG.LIFT_COLORS[1]; // žlutá
    }

    this.vlekyLayer.setStyle({ color: color, weight: 5 });
  }

  async fetchSheepCount() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${CONFIG.GET_SHEEP_URL}?t=${timestamp}`);
      const data = await response.json();
      
      const count = data.count || 0;
      this.updateSheepCount(count);
    } catch (error) {
      console.error("Chyba při načítání počtu ovcí:", error);
    }
  }

  startPeriodicUpdate() {
    // Okamžitě načti data
    this.fetchSheepCount();
    
    // Pak každé 2 sekundy
    setInterval(() => {
      this.fetchSheepCount();
    }, CONFIG.SHEEP_UPDATE_INTERVAL);
  }

  // Public methods
  getCurrentCount() {
    return this.currentCount;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SheepCounter;
} else {
  window.SheepCounter = SheepCounter;
}
