// app.js - Main application orchestrator
class VYGEOApp {
  constructor() {
    this.mapManager = null;
    this.featuresManager = null;
    this.weatherManager = null;
    this.sheepCounter = null;
    this.authManager = null;
    this.graphManager = null;
    
    this.init();
  }

  async init() {
    console.log('Inicializace VYGEO OPALENA aplikace...');
    
    try {
      // Initialize managers in order
      this.mapManager = new MapManager();
      this.featuresManager = new FeaturesManager(this.mapManager);
      this.weatherManager = new WeatherManager();
      this.sheepCounter = new SheepCounter(this.mapManager);
      this.authManager = new AuthManager();
      this.graphManager = new GraphManager();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('Aplikace úspěšně inicializována');
    } catch (error) {
      console.error('Chyba při inicializaci aplikace:', error);
    }
  }

  setupEventListeners() {
    // Home button
    const homeButton = document.getElementById('homeButton');
    if (homeButton) {
      homeButton.addEventListener('click', () => {
        this.mapManager.setView(CONFIG.HOME_POINT, 17);
      });
    }

    // Find location button
    const findLocationButton = document.getElementById('findLocationButton');
    if (findLocationButton) {
      findLocationButton.addEventListener('click', () => {
        this.findMyLocation();
      });
    }

    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('leftSidebar');
        sidebar.classList.toggle('open');
      });
    }

    // Close sidebar
    const closeSidebar = document.getElementById('closeSidebar');
    if (closeSidebar) {
      closeSidebar.addEventListener('click', () => {
        const sidebar = document.getElementById('leftSidebar');
        sidebar.classList.remove('open');
      });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Auth button
    const authButton = document.getElementById('authButton');
    if (authButton) {
      authButton.addEventListener('click', () => {
        if (this.authManager.getIsLoggedIn()) {
          this.authManager.handleLogout();
        } else {
          document.getElementById('loginModal').style.display = 'block';
        }
      });
    }

    // Close modals and sidebar when clicking on map
    if (this.mapManager) {
      this.mapManager.getMap().on('click', () => {
        this.closeAllModals();
        this.closeSidebar();
      });
    }

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('graph-modal') || 
          e.target.classList.contains('modal-content')) {
        this.closeAllModals();
      }
    });

    // Snow calculator button
    const snowCalcBtn = document.getElementById('snowCalcBtn');
    if (snowCalcBtn) {
      snowCalcBtn.addEventListener('click', () => {
        this.openSnowCalculator();
      });
    }
  }

  async handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const result = await this.authManager.handleLogin(username, password);
    
    if (result.success) {
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    }
  }

  closeAllModals() {
    // Close weather dashboard
    const weatherDashboard = document.getElementById('weatherDashboard');
    if (weatherDashboard) {
      weatherDashboard.style.display = 'none';
    }
    
    // Close graph modal
    if (this.graphManager) {
      this.graphManager.closeModal();
    }
    
    // Close login modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.style.display = 'none';
    }
  }

  // Public getters for external access
  getMapManager() {
    return this.mapManager;
  }

  getFeaturesManager() {
    return this.featuresManager;
  }

  getWeatherManager() {
    return this.weatherManager;
  }

  getSheepCounter() {
    return this.sheepCounter;
  }

  getAuthManager() {
    return this.authManager;
  }

  getGraphManager() {
    return this.graphManager;
  }

  openSnowCalculator() {
    // Otevřít kalkulátor sněhu v novém okně
    window.open('snow_calc/snowcalc.html', 'snowcalc', 'width=600,height=700,scrollbars=yes,resizable=yes');
  }

  closeSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  }

  findMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolokace není podporována vaším prohlížečem.');
      return;
    }

    const findLocationButton = document.getElementById('findLocationButton');
    if (findLocationButton) {
      findLocationButton.style.opacity = '0.5';
      findLocationButton.style.pointerEvents = 'none';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Přesunout mapu na aktuální polohu
        this.mapManager.setView([lat, lng], 17);
        
        // Přidat marker na aktuální polohu
        if (this.userLocationMarker) {
          this.mapManager.getMap().removeLayer(this.userLocationMarker);
        }
        
        this.userLocationMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'assets/icons/bod_lokace.svg',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          })
        }).addTo(this.mapManager.getMap());
        
        this.userLocationMarker.bindPopup(`
          <div style="text-align: center;">
            <strong>Vaše poloha</strong><br>
            <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
          </div>
        `).openPopup();
        
        // Resetovat tlačítko
        if (findLocationButton) {
          findLocationButton.style.opacity = '1';
          findLocationButton.style.pointerEvents = 'auto';
        }
      },
      (error) => {
        console.error('Chyba při získávání polohy:', error);
        let errorMessage = 'Nepodařilo se získat vaši polohu.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Přístup k poloze byl odepřen.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informace o poloze není dostupná.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Požadavek na polohu vypršel.';
            break;
        }
        
        alert(errorMessage);
        
        // Resetovat tlačítko
        if (findLocationButton) {
          findLocationButton.style.opacity = '1';
          findLocationButton.style.pointerEvents = 'auto';
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.vygeoApp = new VYGEOApp();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VYGEOApp;
} else {
  window.VYGEOApp = VYGEOApp;
}
