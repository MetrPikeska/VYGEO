// auth.js - Authentication management
class AuthManager {
  constructor() {
    this.isLoggedIn = false;
    this.csrfToken = null;
    this.currentUser = null;
    this.init();
  }

  init() {
    this.fetchAuthStatus();
  }

  async fetchAuthStatus() {
    try {
      const response = await fetch('api/auth.php?action=status', { 
        credentials: 'include' 
      });
      const data = await response.json();
      
      this.isLoggedIn = !!data.loggedIn;
      this.csrfToken = data.csrf || null;
      this.currentUser = data.user || null;
      
      this.refreshAuthUI();
      
      // Aktualizovat měřicí nástroje po načtení stavu
      setTimeout(() => {
        if (window.vygeoApp && window.vygeoApp.getFeaturesManager()) {
          window.vygeoApp.getFeaturesManager().refreshDrawingTools();
        }
      }, 200);
    } catch (error) {
      console.error('Chyba při načítání auth status:', error);
      this.isLoggedIn = false;
      this.currentUser = null;
      this.refreshAuthUI();
      
      // Aktualizovat měřicí nástroje i při chybě
      setTimeout(() => {
        if (window.vygeoApp && window.vygeoApp.getFeaturesManager()) {
          window.vygeoApp.getFeaturesManager().refreshDrawingTools();
        }
      }, 200);
    }
  }

  refreshAuthUI() {
    const authBtn = document.getElementById('authButton');
    if (authBtn) {
      authBtn.textContent = this.isLoggedIn ? `Odhlásit (${this.currentUser})` : 'Přihlásit';
      authBtn.style.background = this.isLoggedIn ? '#dc3545' : '#007ddd';
    }
    
    // Zobrazit/skrýt administrátorské nástroje
    const adminTools = document.getElementById('adminTools');
    if (adminTools) {
      adminTools.style.display = this.isLoggedIn ? 'block' : 'none';
    }
    
    // Aktualizovat stav tlačítek (objects, GPS, layers)
    if (window.vygeoApp && window.vygeoApp.getMapManager() && window.vygeoApp.getMapManager().updateButtonState) {
      window.vygeoApp.getMapManager().updateButtonState();
    }
  }

  showLoginError(message) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  hideLoginError() {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  async handleLogin(username, password) {
    this.hideLoginError();
    
    try {
      const response = await fetch('api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        this.isLoggedIn = true;
        this.currentUser = data.user;
        this.csrfToken = data.csrf;
        this.refreshAuthUI();
        // Aktualizovat měřicí nástroje a viditelnost features
        if (window.vygeoApp && window.vygeoApp.getFeaturesManager()) {
          window.vygeoApp.getFeaturesManager().refreshDrawingTools();
          window.vygeoApp.getFeaturesManager().updateVisibilityOnAuthChange();
        }
        return { success: true };
      } else {
        this.showLoginError(data.error || 'Přihlášení se nezdařilo');
        return { success: false, error: data.error };
      }
    } catch (error) {
      this.showLoginError('Chyba připojení');
      return { success: false, error: 'Chyba připojení' };
    }
  }

  async handleLogout() {
    try {
      await fetch('api/auth.php?action=logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      this.isLoggedIn = false;
      this.currentUser = null;
      this.csrfToken = null;
      this.refreshAuthUI();
      // Aktualizovat měřicí nástroje a viditelnost features
      if (window.vygeoApp && window.vygeoApp.getFeaturesManager()) {
        window.vygeoApp.getFeaturesManager().refreshDrawingTools();
        window.vygeoApp.getFeaturesManager().updateVisibilityOnAuthChange();
      }
    } catch (error) {
      console.error('Chyba při odhlašování:', error);
    }
  }

  // Public getters
  getIsLoggedIn() {
    return this.isLoggedIn;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCsrfToken() {
    return this.csrfToken;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
} else {
  window.AuthManager = AuthManager;
}
