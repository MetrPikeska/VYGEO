// graph.js - Graph and statistics functionality
class GraphManager {
  constructor() {
    this.isGraphModalOpen = false;
    this.sheepChart = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Graph button
    const showGraphBtn = document.getElementById('showGraphBtn');
    if (showGraphBtn) {
      showGraphBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleGraphModal();
      });
    }

    // Close graph button
    const closeGraphBtn = document.getElementById('closeGraphBtn');
    if (closeGraphBtn) {
      closeGraphBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleGraphModal();
      });
    }
  }

  toggleGraphModal() {
    const modal = document.getElementById('graphModal');
    if (this.isGraphModalOpen) {
      this.hideGraphModal();
    } else {
      this.showGraphModal();
    }
  }

  showGraphModal() {
    const modal = document.getElementById('graphModal');
    modal.style.display = 'block';
    this.isGraphModalOpen = true;
    // Načíst data až po zobrazení modalu
    setTimeout(() => {
      this.loadGraphData();
    }, 100);
  }

  hideGraphModal() {
    const modal = document.getElementById('graphModal');
    modal.style.display = 'none';
    this.isGraphModalOpen = false;
    
    if (this.sheepChart) {
      this.sheepChart.destroy();
      this.sheepChart = null;
    }
  }

  async loadGraphData() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`api/get_sheep.php?history=1&t=${timestamp}`);
      const result = await response.json();
      
      // API vrací objekt s polem dat, ne přímo pole
      let data = Array.isArray(result) ? result : result.data || result;
      console.log('Načteno dat z API:', data.length);
      
      // Filtrovat data podle vybraného časového rozsahu
      const timeRange = this.getSelectedTimeRange();
      console.log('Vybraný časový rozsah:', timeRange);
      data = this.filterDataByTimeRange(data, timeRange);
      console.log('Po filtrování:', data.length, 'záznamů');
      
      const labels = data.map(d => d.timestamp);
      const counts = data.map(d => parseInt(d.count));

      this.updateStats(counts, labels);
      this.createChart(labels, counts);
    } catch (error) {
      console.error("Chyba při načítání historie:", error);
      this.showErrorState();
    }
  }

  updateStats(counts, labels) {
    const statsElement = document.getElementById("stats");
    if (!statsElement) return;

    if (counts.length > 0) {
      const sum = counts.reduce((a, b) => a + b, 0);
      const avg = (sum / counts.length).toFixed(2);
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      const maxTime = labels[counts.indexOf(max)];
      const current = counts[counts.length - 1];
      
      // Zkontrolovat, jestli je uživatel přihlášený
      const isLoggedIn = this.isUserLoggedIn();
      
      let downloadSection = '';
      if (isLoggedIn) {
        downloadSection = `
          <div style="text-align: right;">
            <button id="downloadDataBtn" style="
              background: #007ddd; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 4px; 
              cursor: pointer;
              font-size: 12px;
              margin-bottom: 10px;
            ">📥 Stáhnout data</button>
            <div>
              <select id="timeRangeSelect" style="
                padding: 4px 8px; 
                border: 1px solid #ccc; 
                border-radius: 4px; 
                font-size: 11px;
                margin-right: 5px;
              ">
                <option value="1h">Poslední hodina</option>
                <option value="6h">Posledních 6 hodin</option>
                <option value="24h" selected>Posledních 24 hodin</option>
                <option value="7d">Posledních 7 dní</option>
                <option value="30d">Posledních 30 dní</option>
                <option value="all">Všechna data</option>
              </select>
            </div>
          </div>
        `;
      }
      
      statsElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
          <div>
            <p><b>Aktuálně na svahu:</b> ${current} ovcí</p>
            <p><b>Průměr dnes:</b> ${avg} ovcí</p>
            <p><b>Maximum dnes:</b> ${max} (v ${maxTime})</p>
          </div>
          <div style="text-align: right;">
            <div style="margin-bottom: 10px;">
              <label style="font-size: 12px; color: #666; margin-right: 5px;">Zobrazit:</label>
              <select id="graphTimeRangeSelect" style="
                padding: 4px 8px; 
                border: 1px solid #ccc; 
                border-radius: 4px; 
                font-size: 11px;
                margin-right: 5px;
              ">
                <option value="1h">Poslední hodina</option>
                <option value="6h">Posledních 6 hodin</option>
                <option value="24h" selected>Posledních 24 hodin</option>
                <option value="7d">Posledních 7 dní</option>
                <option value="30d">Posledních 30 dní</option>
                <option value="all">Všechna data</option>
              </select>
              <button id="refreshGraphBtn" style="
                background: #28a745; 
                color: white; 
                border: none; 
                padding: 4px 8px; 
                border-radius: 4px; 
                cursor: pointer;
                font-size: 11px;
              ">🔄 Obnovit</button>
            </div>
            ${downloadSection}
          </div>
        </div>
      `;
      
      // Přidat event listenery
      this.setupGraphControls();
      if (isLoggedIn) {
        this.setupDownloadButton();
      }
    } else {
      statsElement.innerHTML = "<p>Žádná data k zobrazení</p>";
    }
  }

  createChart(labels, counts) {
    const ctx = document.getElementById('sheepChart');
    if (!ctx) return;

    // Destroy existing chart
    if (this.sheepChart) {
      this.sheepChart.destroy();
    }

    this.sheepChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Počet ovcí na sjezdovce',
          data: counts,
          borderColor: '#007ddd',
          backgroundColor: 'rgba(0, 123, 221, 0.1)',
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#007ddd',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#0056b3',
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: { 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#007ddd',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: { 
              label: (c) => `${c.raw} ovcí`,
              title: (tooltipItems) => {
                const date = new Date(tooltipItems[0].label);
                return date.toLocaleString('cs-CZ');
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              parser: 'yyyy-MM-dd HH:mm:ss',
              tooltipFormat: 'dd.MM.yyyy HH:mm',
              displayFormats: { 
                minute: 'HH:mm', 
                hour: 'dd.MM HH:mm',
                day: 'dd.MM'
              }
            },
            title: { 
              display: true, 
              text: 'Čas', 
              font: { size: 12, weight: 'bold' },
              color: '#495057'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
              drawBorder: false
            },
            ticks: {
              font: { size: 10 },
              color: '#6c757d'
            }
          },
          y: {
            beginAtZero: true,
            title: { 
              display: true, 
              text: 'Počet ovcí', 
              font: { size: 12, weight: 'bold' },
              color: '#495057'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
              drawBorder: false
            },
            ticks: {
              font: { size: 10 },
              color: '#6c757d',
              stepSize: 1
            }
          }
        },
        elements: {
          line: {
            borderWidth: 3
          }
        }
      }
    });
  }

  getSelectedTimeRange() {
    const select = document.getElementById('graphTimeRangeSelect');
    return select ? select.value : '24h';
  }

  filterDataByTimeRange(data, timeRange) {
    if (timeRange === 'all') {
      return data;
    }

    const now = new Date();
    let fromDate;
    
    switch(timeRange) {
      case '1h':
        fromDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= fromDate;
    });
  }

  setupGraphControls() {
    // Počkat, až se elementy vytvoří
    setTimeout(() => {
      const graphTimeRangeSelect = document.getElementById('graphTimeRangeSelect');
      const refreshGraphBtn = document.getElementById('refreshGraphBtn');
      
      if (refreshGraphBtn) {
        refreshGraphBtn.addEventListener('click', () => {
          console.log('Obnovuji graf...');
          this.loadGraphData();
        });
      }
      
      if (graphTimeRangeSelect) {
        graphTimeRangeSelect.addEventListener('change', () => {
          console.log('Změna časového rozsahu:', graphTimeRangeSelect.value);
          this.loadGraphData();
        });
      }
    }, 200);
  }

  isUserLoggedIn() {
    // Zkontrolovat, jestli je uživatel přihlášený přes AuthManager
    if (window.vygeoApp && window.vygeoApp.getAuthManager()) {
      return window.vygeoApp.getAuthManager().isLoggedIn;
    }
    return false;
  }

  setupDownloadButton() {
    const downloadBtn = document.getElementById('downloadDataBtn');
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    
    if (downloadBtn && timeRangeSelect) {
      downloadBtn.addEventListener('click', () => {
        this.downloadData(timeRangeSelect.value);
      });
    }
  }

  async downloadData(timeRange) {
    try {
      // Vypočítat datum od kdy stahovat data
      const now = new Date();
      let fromDate;
      
      switch(timeRange) {
        case '1h':
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          fromDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          fromDate = new Date('2020-01-01'); // Staré datum pro všechna data
          break;
        default:
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Stáhnout data z API
      const timestamp = new Date().getTime();
      const response = await fetch(`api/get_sheep.php?history=1&t=${timestamp}`);
      const data = await response.json();
      
      // Filtrovat data podle časového rozsahu
      const filteredData = data.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= fromDate;
      });

      // Převést na CSV
      const csvContent = this.convertToCSV(filteredData);
      
      // Stáhnout soubor
      this.downloadCSV(csvContent, `ovce_data_${timeRange}_${now.toISOString().split('T')[0]}.csv`);
      
    } catch (error) {
      console.error("Chyba při stahování dat:", error);
      alert("Chyba při stahování dat. Zkuste to prosím znovu.");
    }
  }

  convertToCSV(data) {
    const headers = ['Datum a čas', 'Počet ovcí'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = [
        `"${row.timestamp}"`,
        row.count
      ];
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  showErrorState() {
    const statsElement = document.getElementById("stats");
    if (statsElement) {
      statsElement.innerHTML = "<p style='color: red;'>Chyba při načítání dat</p>";
    }
  }

  // Public methods
  isModalOpen() {
    return this.isGraphModalOpen;
  }

  closeModal() {
    this.hideGraphModal();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GraphManager;
} else {
  window.GraphManager = GraphManager;
}
