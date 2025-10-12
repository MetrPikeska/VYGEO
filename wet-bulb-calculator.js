// wet-bulb-calculator.js - Kalkulačka vlhkého teplomera TechnoAlpin
class WetBulbCalculator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.temperature = -12; // °C
    this.isCelsius = true;
    this.snowmakingThreshold = -2.5; // °C
    
    this.init();
  }

  init() {
    this.createHTML();
    this.setupEventListeners();
    this.updateDisplay();
    this.calculateResults();
  }

  createHTML() {
    this.container.innerHTML = `
      <div class="wet-bulb-calculator">
        <div class="calculator-header">
          <h3>Kalkulačka vlhkého teplomera</h3>
          <p class="calculator-subtitle">TechnoAlpin - Určenie správnych podmienok pre zasnežovanie</p>
        </div>
        
        <div class="temperature-section">
          <div class="temperature-label">Teplota vzduchu</div>
          <div class="temperature-display" id="wetBulbTempDisplay">-12 °C</div>
          <div class="temperature-controls">
            <button class="temp-btn" id="wetBulbDecreaseBtn">-</button>
            <button class="temp-btn" id="wetBulbIncreaseBtn">+</button>
          </div>
          <div class="unit-toggle">
            <button class="unit-btn active" id="wetBulbCelsiusBtn">Celsius</button>
            <button class="unit-btn" id="wetBulbFahrenheitBtn">Fahrenheit</button>
          </div>
        </div>

        <div class="results-section">
          <div class="results-title">Teplota vlhkého teplomera</div>
          <table class="results-table">
            <thead>
              <tr>
                <th>Relatívna vlhkosť</th>
                <th>Teplota vlhkého teplomera</th>
              </tr>
            </thead>
            <tbody id="wetBulbResultsTableBody">
              <!-- Výsledky sa vygenerujú dynamicky -->
            </tbody>
          </table>

          <div class="snowmaking-info">
            <h4>Informácie o zasnežovaní</h4>
            <p><strong>TechnoAlpin snehové delá:</strong> Produkujú sneh pri teplote vlhkého teplomera <span class="threshold">-2,5 °C</span> a nižšej.</p>
            <p id="wetBulbSnowmakingStatus"></p>
          </div>
        </div>
      </div>
    `;

    // Přidat CSS styly
    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .wet-bulb-calculator {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        overflow: hidden;
        margin: 20px 0;
        font-family: Arial, sans-serif;
      }

      .calculator-header {
        background: #2c3e50;
        color: white;
        padding: 20px;
        text-align: center;
      }

      .calculator-header h3 {
        margin: 0 0 10px 0;
        font-size: 20px;
      }

      .calculator-subtitle {
        margin: 0;
        font-size: 14px;
        opacity: 0.8;
      }

      .temperature-section {
        background: linear-gradient(135deg, #f39c12, #e67e22);
        padding: 20px;
        text-align: center;
        color: white;
      }

      .temperature-label {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .temperature-display {
        font-size: 36px;
        font-weight: bold;
        margin: 15px 0;
      }

      .temperature-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin: 15px 0;
      }

      .temp-btn {
        background: rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.3);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      .temp-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.1);
      }

      .temp-btn:active {
        background: rgba(255,255,255,0.4);
        transform: scale(0.95);
      }

      .unit-toggle {
        margin-top: 15px;
      }

      .unit-btn {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 12px;
        margin: 0 3px;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 12px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .unit-btn.active {
        background: rgba(255,255,255,0.4);
        border-color: rgba(255,255,255,0.6);
      }

      .unit-btn:active {
        background: rgba(255,255,255,0.5);
        transform: scale(0.95);
      }

      .results-section {
        padding: 20px;
      }

      .results-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #2c3e50;
      }

      .results-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        font-size: 14px;
      }

      .results-table th {
        background-color: #34495e;
        color: white;
        padding: 10px;
        text-align: left;
        font-weight: bold;
      }

      .results-table td {
        padding: 8px 10px;
        border-bottom: 1px solid #ecf0f1;
      }

      .results-table tr:nth-child(even) {
        background-color: #f8f9fa;
      }

      .results-table tr:hover {
        background-color: #e8f4f8;
      }

      .snowmaking-info {
        background-color: #e8f5e8;
        border-left: 4px solid #27ae60;
        padding: 15px;
        margin-top: 15px;
        border-radius: 0 5px 5px 0;
      }

      .snowmaking-info h4 {
        color: #27ae60;
        margin: 0 0 10px 0;
        font-size: 16px;
      }

      .snowmaking-info p {
        margin: 5px 0;
        line-height: 1.4;
        font-size: 14px;
      }

      .threshold {
        font-weight: bold;
        color: #e74c3c;
      }

      @media (max-width: 768px) {
        .temperature-display {
          font-size: 28px;
        }
        
        .temperature-controls {
          gap: 15px;
        }
        
        .temp-btn {
          width: 35px;
          height: 35px;
          font-size: 18px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    document.getElementById('wetBulbDecreaseBtn').addEventListener('click', () => this.adjustTemperature(-1));
    document.getElementById('wetBulbIncreaseBtn').addEventListener('click', () => this.adjustTemperature(1));
    document.getElementById('wetBulbCelsiusBtn').addEventListener('click', () => this.setUnit(true));
    document.getElementById('wetBulbFahrenheitBtn').addEventListener('click', () => this.setUnit(false));
  }

  adjustTemperature(delta) {
    this.temperature += delta;
    this.updateDisplay();
    this.calculateResults();
  }

  setUnit(isCelsius) {
    if (isCelsius && !this.isCelsius) {
      // Konverzia z Fahrenheit na Celsius
      this.temperature = (this.temperature - 32) * 5/9;
    } else if (!isCelsius && this.isCelsius) {
      // Konverzia z Celsius na Fahrenheit
      this.temperature = this.temperature * 9/5 + 32;
    }
    
    this.isCelsius = isCelsius;
    this.updateDisplay();
    this.calculateResults();
  }

  updateDisplay() {
    const temp = Math.round(this.temperature * 10) / 10;
    const unit = this.isCelsius ? '°C' : '°F';
    document.getElementById('wetBulbTempDisplay').textContent = `${temp} ${unit}`;
    
    // Aktualizovať tlačidlá jednotiek
    document.getElementById('wetBulbCelsiusBtn').classList.toggle('active', this.isCelsius);
    document.getElementById('wetBulbFahrenheitBtn').classList.toggle('active', !this.isCelsius);
  }

  calculateWetBulbTemperature(dryTemp, humidity) {
    // Konverzia na Celsius ak je potrebné
    let tempC = this.isCelsius ? dryTemp : (dryTemp - 32) * 5/9;
    
    // Zjednodušený výpočet teploty vlhkého teplomera
    // Používa aproximáciu pre rozsah teplôt -20°C až +20°C
    const wetBulbC = tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) + 
                    Math.atan(tempC + humidity) - Math.atan(humidity - 1.676331) + 
                    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) - 4.686035;
    
    // Konverzia späť na požadovanú jednotku
    return this.isCelsius ? wetBulbC : wetBulbC * 9/5 + 32;
  }

  calculateResults() {
    const humidities = [90, 80, 70, 60, 50, 40, 30, 20, 10];
    let html = '';
    
    humidities.forEach(humidity => {
      const wetBulbTemp = this.calculateWetBulbTemperature(this.temperature, humidity);
      const roundedTemp = Math.round(wetBulbTemp * 10) / 10;
      const unit = this.isCelsius ? '°C' : '°F';
      
      html += `
        <tr>
          <td>${humidity}%</td>
          <td>${roundedTemp} ${unit}</td>
        </tr>
      `;
    });
    
    document.getElementById('wetBulbResultsTableBody').innerHTML = html;
    this.updateSnowmakingStatus();
  }

  updateSnowmakingStatus() {
    // Zistiť najnižšiu teplotu vlhkého teplomera
    const humidities = [90, 80, 70, 60, 50, 40, 30, 20, 10];
    let minWetBulb = Infinity;
    
    humidities.forEach(humidity => {
      const wetBulbTemp = this.calculateWetBulbTemperature(this.temperature, humidity);
      if (wetBulbTemp < minWetBulb) {
        minWetBulb = wetBulbTemp;
      }
    });
    
    const threshold = this.isCelsius ? this.snowmakingThreshold : this.snowmakingThreshold * 9/5 + 32;
    const canSnow = minWetBulb <= threshold;
    
    if (canSnow) {
      document.getElementById('wetBulbSnowmakingStatus').innerHTML = `
        <strong style="color: #27ae60;">✅ Zasnežovanie je možné!</strong><br>
        Najnižšia teplota vlhkého teplomera: ${Math.round(minWetBulb * 10) / 10} ${this.isCelsius ? '°C' : '°F'} 
        (pod hranicou ${threshold} ${this.isCelsius ? '°C' : '°F'})
      `;
    } else {
      document.getElementById('wetBulbSnowmakingStatus').innerHTML = `
        <strong style="color: #e74c3c;">❌ Zasnežovanie nie je možné</strong><br>
        Najnižšia teplota vlhkého teplomera: ${Math.round(minWetBulb * 10) / 10} ${this.isCelsius ? '°C' : '°F'} 
        (nad hranicou ${threshold} ${this.isCelsius ? '°C' : '°F'})
      `;
    }
  }

  // Public metódy pre integráciu
  getTemperature() {
    return this.temperature;
  }

  getIsCelsius() {
    return this.isCelsius;
  }

  setTemperature(temp, isCelsius = null) {
    if (isCelsius !== null) {
      this.isCelsius = isCelsius;
    }
    this.temperature = temp;
    this.updateDisplay();
    this.calculateResults();
  }
}

// Export pre použitie v iných súboroch
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WetBulbCalculator;
} else {
  window.WetBulbCalculator = WetBulbCalculator;
}
