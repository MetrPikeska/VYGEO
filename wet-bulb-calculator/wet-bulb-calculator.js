// wet-bulb-calculator.js - Kalkulačka vlhkého teplomera TechnoAlpin
class WetBulbCalculator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.temperature = -12; // °C
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
          <h3>Kalkulačka vlhké teploty</h3>
        </div>
        
        <div class="temperature-section">
          <div class="temperature-label">TEPLOTA VZDUCHU</div>
          <div class="temperature-display" id="wetBulbTempDisplay">-12 °C</div>
          <div class="temperature-controls">
            <button class="temp-btn" id="wetBulbDecreaseBtn">-</button>
            <button class="temp-btn" id="wetBulbIncreaseBtn">+</button>
          </div>
        </div>

        <div class="results-section">
          <table class="results-table">
            <thead>
              <tr>
                <th>vlhkost</th>
                <th>teplota vlhkého teplomera</th>
              </tr>
            </thead>
            <tbody id="wetBulbResultsTableBody">
              <!-- Výsledky se vygenerují dynamicky -->
            </tbody>
          </table>
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
        padding: 15px;
        text-align: center;
      }

      .calculator-header h3 {
        margin: 0;
        font-size: 18px;
      }

      .temperature-section {
        background: #f39c12;
        padding: 15px;
        text-align: center;
        color: white;
        min-height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .temperature-label {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .temperature-display {
        font-size: 28px;
        font-weight: bold;
        margin: 10px 0;
      }

      .temperature-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        margin: 10px 0;
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

      .results-section {
        padding: 15px;
        max-height: 400px;
        overflow-y: auto;
      }

      .results-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .results-table th {
        background-color: #34495e;
        color: white;
        padding: 12px 8px;
        text-align: left;
        font-weight: bold;
        font-size: 13px;
      }

      .results-table td {
        padding: 10px 8px;
        border-bottom: 1px solid #ecf0f1;
        font-size: 13px;
      }

      .results-table tr:nth-child(even) {
        background-color: #f8f9fa;
      }

      .results-table tr:hover {
        background-color: #e8f4f8;
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
  }

  adjustTemperature(delta) {
    this.temperature += delta;
    this.updateDisplay();
    this.calculateResults();
  }

  updateDisplay() {
    const temp = Math.round(this.temperature * 10) / 10;
    document.getElementById('wetBulbTempDisplay').textContent = `${temp} °C`;
  }

  calculateWetBulbTemperature(dryTemp, humidity) {
    // Zjednodušený výpočet teploty vlhkého teplomera
    // Používá aproximaci pro rozsah teplot -20°C až +20°C
    const wetBulbC = dryTemp * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) + 
                    Math.atan(dryTemp + humidity) - Math.atan(humidity - 1.676331) + 
                    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) - 4.686035;
    
    return wetBulbC;
  }

  calculateResults() {
    const humidities = [90, 80, 70, 60, 50, 40, 30, 20, 10];
    let html = '';
    
    humidities.forEach(humidity => {
      const wetBulbTemp = this.calculateWetBulbTemperature(this.temperature, humidity);
      const roundedTemp = Math.round(wetBulbTemp * 10) / 10;
      
      html += `
        <tr>
          <td>${humidity}%</td>
          <td>${roundedTemp} °C</td>
        </tr>
      `;
    });
    
    document.getElementById('wetBulbResultsTableBody').innerHTML = html;
  }


  // Public metody pro integraci
  getTemperature() {
    return this.temperature;
  }

  setTemperature(temp) {
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
