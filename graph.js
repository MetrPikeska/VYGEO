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
    this.loadGraphData();
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
      const data = await response.json();
      
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
      
      statsElement.innerHTML = `
        <p><b>Aktuálně na svahu:</b> ${current} ovcí</p>
        <p><b>Průměr dnes:</b> ${avg} ovcí</p>
        <p><b>Maximum dnes:</b> ${max} (v ${maxTime})</p>
      `;
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
