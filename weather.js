// weather.js - Správa počasí a teploty
class WeatherManager {
  constructor() {
    this.weatherData = null;
    this.liveTemperature = 8;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadLiveTemperature();
    this.startPeriodicUpdate();
  }

  setupEventListeners() {
    const weatherWidget = document.getElementById('weatherWidget');
    if (weatherWidget) {
      weatherWidget.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleWeatherDashboard();
      });
    }

    const closeWeather = document.getElementById('closeWeather');
    if (closeWeather) {
      closeWeather.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideWeatherDashboard();
      });
    }
  }

  toggleWeatherDashboard() {
    const dashboard = document.getElementById('weatherDashboard');
    const isVisible = dashboard.style.display === 'block';
    
    if (isVisible) {
      this.hideWeatherDashboard();
    } else {
      this.showWeatherDashboard();
    }
  }

  showWeatherDashboard() {
    const dashboard = document.getElementById('weatherDashboard');
    dashboard.style.display = 'block';
    if (!this.weatherData) {
      this.loadWeatherData();
    }
  }

  hideWeatherDashboard() {
    const dashboard = document.getElementById('weatherDashboard');
    dashboard.style.display = 'none';
  }

  async loadWeatherData() {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${CONFIG.HOME_POINT[0]}&lon=${CONFIG.HOME_POINT[1]}&appid=${CONFIG.OPENWEATHER_API_KEY}&units=metric&lang=cz`);
      
      if (!response.ok) {
        throw new Error('Weather API not available');
      }
      
      this.weatherData = await response.json();
      this.updateWeatherDisplay();
    } catch (error) {
      console.error('Chyba při načítání počasí:', error);
      this.loadDemoWeatherData();
    }
  }

  loadDemoWeatherData() {
    this.weatherData = {
      current: {
        temp: 8,
        humidity: 75,
        wind_speed: 12,
        pressure: 1013,
        weather: [{ main: 'Clouds', description: 'oblačno', icon: '04d' }]
      },
      daily: [
        { temp: { day: 10, night: 4 }, weather: [{ icon: '01d' }], dt: Date.now() + 86400000 },
        { temp: { day: 7, night: 2 }, weather: [{ icon: '10d' }], dt: Date.now() + 172800000 },
        { temp: { day: 12, night: 6 }, weather: [{ icon: '02d' }], dt: Date.now() + 259200000 }
      ]
    };
    this.updateWeatherDisplay();
  }

  updateWeatherDisplay() {
    if (!this.weatherData) return;

    const current = this.weatherData.current;
    
    // Update current weather
    document.getElementById('temperature').textContent = Math.round(current.temp) + '°C';
    document.getElementById('weatherDesc').textContent = current.weather[0].description;
    document.getElementById('humidity').textContent = current.humidity + '%';
    document.getElementById('windSpeed').textContent = Math.round(current.wind_speed * 3.6) + ' km/h';
    document.getElementById('pressure').textContent = current.pressure + ' hPa';
    
    // Update weather icon
    const icon = this.getWeatherIcon(current.weather[0].icon);
    document.getElementById('weatherIcon').textContent = icon;
    
    // Update top bar weather icon
    const topBarWeatherIcon = document.querySelector('.weather-icon');
    if (topBarWeatherIcon) {
      topBarWeatherIcon.textContent = icon;
    }
    
    // Update forecast
    this.updateForecast();
    
    // Update last update time
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('cs-CZ');
  }

  async loadLiveTemperature() {
    try {
      // Použít teplotu z weather API místo simulace
      if (this.weatherData && this.weatherData.current) {
        this.liveTemperature = Math.round(this.weatherData.current.temp);
        this.updateLiveTemperatureButton();
        console.log('Teplota z API:', this.liveTemperature + '°C');
      } else {
        // Fallback na výchozí hodnotu
        this.liveTemperature = 8;
        this.updateLiveTemperatureButton();
        console.log('Používá se výchozí teplota:', this.liveTemperature + '°C');
      }
    } catch (error) {
      console.log('Chyba při načítání teploty, používá se výchozí');
      this.liveTemperature = 8;
      this.updateLiveTemperatureButton();
    }
  }

  updateLiveTemperatureButton() {
    const elements = [
      'liveTemp', 'liveTempDisplay', 'mobileTemp', 'mobileInfoTemp', 
      'mobileTempDisplay', 'mobileWeatherTemp'
    ];
    
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = this.liveTemperature + '°C';
      }
    });

    const tempTimeElement = document.getElementById('liveTempTime');
    if (tempTimeElement) {
      tempTimeElement.textContent = new Date().toLocaleTimeString('cs-CZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }

  updateForecast() {
    const forecastContainer = document.getElementById('forecastItems');
    if (!forecastContainer) return;
    
    forecastContainer.innerHTML = '';
    
    this.weatherData.daily.slice(0, 3).forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.style.cssText = 'flex:1; text-align:center; padding:8px; background:#f8f9fa; border-radius:6px; font-size:11px;';
      
      const date = new Date(day.dt);
      const dayName = date.toLocaleDateString('cs-CZ', { weekday: 'short' });
      const icon = this.getWeatherIcon(day.weather[0].icon);
      
      dayElement.innerHTML = `
        <div style="font-weight:bold; margin-bottom:4px;">${dayName}</div>
        <div style="font-size:20px; margin:4px 0;">${icon}</div>
        <div style="color:#2c3e50;">${Math.round(day.temp.day)}°</div>
        <div style="color:#7f8c8d; font-size:10px;">${Math.round(day.temp.night)}°</div>
      `;
      
      forecastContainer.appendChild(dayElement);
    });
  }

  getWeatherIcon(iconCode) {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '⛅';
  }

  startPeriodicUpdate() {
    setInterval(() => {
      this.loadWeatherData(); // Načíst kompletní weather data včetně teploty
    }, CONFIG.TEMP_UPDATE_INTERVAL);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherManager;
} else {
  window.WeatherManager = WeatherManager;
}
