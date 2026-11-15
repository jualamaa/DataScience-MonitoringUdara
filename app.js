// app.js

// Global Variables untuk Chart.js
let trendChart = null;
let activeParam = 'co2'; // Parameter default grafik: 'co2', 'temp', 'humidity'
let chartMeta = []; // tanggal+waktu tiap titik grafik (untuk tooltip)
let rawHistoryData = []; // Menyimpan data history mentah dari database

// 1. Evaluasi Kualitas Udara (MQ-135 CO2 PPM)
function evaluateAirQuality(co2Ppm) {
  const val = parseFloat(co2Ppm) || 0;

  if (val > 2000) {
    return {
      label: 'Buruk',
      badge: 'bg-rose-100 text-rose-700'
    };
  } else if (val >= 1000) {
    return {
      label: 'Sedang',
      badge: 'bg-amber-100 text-amber-700'
    };
  } else {
    return {
      label: 'Normal',
      badge: 'bg-emerald-100 text-emerald-700'
    };
  }
}

// 2. Evaluasi Kondisi Termal (Suhu Lingkungan)
function evaluateTemperature(tempVal) {
  const val = parseFloat(tempVal) || 0;

  if (val > 31) {
    return {
      label: 'Panas',
      badge: 'bg-rose-100 text-rose-700'
    };
  } else if (val >= 28) {
    return {
      label: 'Sedang',
      badge: 'bg-amber-100 text-amber-700'
    };
  } else {
    return {
      label: 'Normal',
      badge: 'bg-emerald-100 text-emerald-700'
    };
  }
}

// Inisialisasi Grafik Smooth Chart.js
function showChartError(msg) {
  const box = document.getElementById('airTrendChart')?.parentElement;
  if (box) box.innerHTML = '<div class="h-full flex items-center justify-center text-center text-sm text-rose-500 px-4">' + msg + '</div>';
}

function initChart() {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js tidak termuat (chart.js di server rusak/terpotong/tidak ada).');
    showChartError('Library grafik (chart.js) gagal dimuat. Upload ulang chart.js lalu tekan Ctrl+F5.');
    return;
  }
  const ctx = document.getElementById('airTrendChart').getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(14, 165, 233, 0.35)'); // sky-500
  gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'MQ Gas CO₂ (PPM)',
        data: [],
        borderColor: '#0284c7', // sky-600
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#0284c7',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#0284c7',
        pointHoverBorderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const m = chartMeta[items[0].dataIndex];
              return m ? (m.tanggal + ' ' + m.waktu) : items[0].label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: {
          border: { dash: [4, 4] },
          grid: { color: '#f1f5f9' },
          ticks: { color: '#94a3b8', font: { size: 11 } }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Memperbarui Data Grafik berdasarkan Tab Aktif
function updateChartData() {
  if (!trendChart || !rawHistoryData.length) return;

  const sortedData = [...rawHistoryData].reverse();

  chartMeta = sortedData;
  const labels = sortedData.map(item => item.waktu || '-');
  let dataValues = [];
  let labelName = '';
  let colorHex = '#0284c7';

  if (activeParam === 'co2') {
    labelName = 'MQ Gas CO₂ (PPM)';
    dataValues = sortedData.map(item => Math.round(parseFloat(item.co2) || 0));
    colorHex = '#0284c7';
  } else if (activeParam === 'temp') {
    labelName = 'Suhu (°C)';
    dataValues = sortedData.map(item => Number(parseFloat(item.temperature || 0).toFixed(1)));
    colorHex = '#f59e0b';
  } else if (activeParam === 'humidity') {
    labelName = 'Kelembapan (%)';
    dataValues = sortedData.map(item => Number(parseFloat(item.humidity || 0).toFixed(1)));
    colorHex = '#06b6d4';
  }

  const ctx = document.getElementById('airTrendChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, colorHex + '55');
  gradient.addColorStop(1, colorHex + '00');

  trendChart.data.labels = labels;
  trendChart.data.datasets[0].label = labelName;
  trendChart.data.datasets[0].data = dataValues;
  trendChart.data.datasets[0].borderColor = colorHex;
  trendChart.data.datasets[0].pointBorderColor = colorHex;
  trendChart.data.datasets[0].backgroundColor = gradient;
  trendChart.update();
}

// Global: Fungsi Pindah Tab Filter Parameter Grafik
window.switchChartParam = function (param) {
  activeParam = param;
  const btnCo2 = document.getElementById('btn-chart-co2');
  const btnTemp = document.getElementById('btn-chart-temp');
  const btnHum = document.getElementById('btn-chart-hum');

  const activeClass = "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-sky-600 shadow-sm transition whitespace-nowrap";
  const inactiveClass = "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition whitespace-nowrap";

  if (btnCo2) btnCo2.className = param === 'co2' ? activeClass : inactiveClass;
  if (btnTemp) btnTemp.className = param === 'temp' ? activeClass : inactiveClass;
  if (btnHum) btnHum.className = param === 'humidity' ? activeClass : inactiveClass;

  updateChartData();
};

// Global: Fungsi Mengirim Perintah Kontrol Manual Kipas ke API Server via POST
window.setFanControl = async function (mode, status) {
  try {
    const response = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: mode, status: status })
    });
    const res = await response.json();
    if (res.status === 'success') {
      fetchSensorData();
    }
  } catch (e) {
    console.error("Gagal mengirim perintah kontrol kipas:", e);
  }
};

// Update tampilan tombol aktif sakelar di UI (Auto, Manual ON, Manual OFF)
function updateFanControlUI(mode, status) {
  const btnAuto = document.getElementById('btn-fan-auto');
  const btnOn = document.getElementById('btn-fan-on');
  const btnOff = document.getElementById('btn-fan-off');

  const activeAuto = "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-sky-600 shadow-sm transition whitespace-nowrap";
  const activeOn = "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white shadow-sm transition whitespace-nowrap";
  const activeOff = "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white shadow-sm transition whitespace-nowrap";
  const inactive = "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition whitespace-nowrap";

  if (btnAuto) btnAuto.className = mode === 'auto' ? activeAuto : inactive;
  if (btnOn) btnOn.className = (mode === 'manual' && status == 1) ? activeOn : inactive;
  if (btnOff) btnOff.className = (mode === 'manual' && status == 0) ? activeOff : inactive;
}

// Fungsi utama mengambil data dari api.php via AJAX
async function fetchSensorData() {
  const dbStatusText = document.getElementById('db-status-text');
  const pingPulse = document.getElementById('ping-pulse');
  const pingDot = document.getElementById('ping-dot');

  try {
    const response = await fetch('api.php?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('Network error / API failure');

    const result = await response.json();

    if (result.status === 'success') {
      if (dbStatusText) dbStatusText.textContent = "MySQL Terhubung";
      if (pingPulse) pingPulse.className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75";
      if (pingDot) pingDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500";

      if (result.control) {
        updateFanControlUI(result.control.mode, result.control.status);
      }

      // 1. Render Card Data Utama (Current)
      if (result.current) {
        const cur = result.current;

        document.getElementById('co2-val').textContent = Math.round(cur.co2 || 0);
        document.getElementById('temp-val').textContent = parseFloat(cur.temperature || 0).toFixed(1);
        document.getElementById('humidity-val').textContent = parseFloat(cur.humidity || 0).toFixed(1);
        document.getElementById('last-update').textContent = cur.tanggal ? (cur.tanggal + ' ' + cur.waktu) : (cur.waktu || '--/--/---- --:--:--');

        // Status Kipas + Deteksi Alat Offline
        const umur = parseInt(cur.umur_detik);
        const alatOffline = !isNaN(umur) && umur > 60;

        const co2Val = parseFloat(cur.co2) || 0;
        const tempVal = parseFloat(cur.temperature) || 0;
        const isControlManual = result.control && result.control.mode === 'manual';

        let kipasOn = false;
        if (isControlManual) {
          kipasOn = !alatOffline && (parseInt(result.control.status) === 1);
        } else {
          // Mode Otomatis: Kipas ON jika (Kipas log = 1) ATAU (CO2 > 2000 PPM) ATAU (Suhu > 31°C)
          kipasOn = !alatOffline && (String(cur.kipas) === '1' || co2Val > 2000 || tempVal > 31.0);
        }

        const fanBanner = document.getElementById('fan-banner');
        if (fanBanner) {
          fanBanner.classList.toggle('fan-on', kipasOn);
          fanBanner.classList.toggle('fan-offline', alatOffline);

          let textStatus = 'Kipas mati (Udara Dalam Batas Aman)';
          if (alatOffline) {
            textStatus = 'Alat tidak mengirim data';
          } else if (kipasOn) {
            textStatus = isControlManual ? 'Kipas sedang menyala (Mode Manual)' : 'Kipas sedang menyala (Menyaring Udara / Pendinginan)';
          } else if (isControlManual) {
            textStatus = 'Kipas dimatikan (Mode Manual)';
          }

          document.getElementById('fan-status-text').textContent = textStatus;

          const badgeList = document.querySelectorAll('#fan-badge');
          badgeList.forEach(b => {
            b.textContent = alatOffline ? 'OFFLINE' : (kipasOn ? 'ON' : 'OFF');
          });
        }

        // Badge Kualitas Udara (CO2)
        const statusInfo = evaluateAirQuality(cur.co2);
        const statusBadge = document.getElementById('co2-status');
        if (statusBadge) {
          statusBadge.textContent = statusInfo.label;
          statusBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.badge}`;
        }

        // Badge Kondisi Termal (Suhu)
        const tempInfo = evaluateTemperature(cur.temperature);
        const tempStatusBadge = document.getElementById('temp-status');
        if (tempStatusBadge) {
          tempStatusBadge.textContent = tempInfo.label;
          tempStatusBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-bold ${tempInfo.badge}`;
        }
      }

      // 2. Render Grafik & Tabel Riwayat (History)
      if (result.history) {
        rawHistoryData = result.history;
        updateChartData();

        const tableBody = document.getElementById('sensor-table-body');
        if (tableBody) {
          if (result.history.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-slate-400 text-xs">Belum ada data di tabel sensor_logs.</td></tr>`;
          } else {
            tableBody.innerHTML = '';
            result.history.forEach(item => {
              const statusInfo = evaluateAirQuality(item.co2);
              const row = `
                <tr class="log-row hover:bg-slate-50 transition">
                  <td class="c-time py-3.5 px-6 text-slate-500 font-mono text-xs"><span class="tgl">${item.tanggal || ''}</span> <span class="jam">${item.waktu || '-'}</span></td>
                  <td class="c-metric py-3.5 px-6 font-semibold text-slate-800" data-label="CO₂">${Math.round(item.co2 || 0)} <small>PPM</small></td>
                  <td class="c-metric py-3.5 px-6" data-label="Suhu">${parseFloat(item.temperature || 0).toFixed(1)} <small>°C</small></td>
                  <td class="c-metric py-3.5 px-6" data-label="Lembap">${parseFloat(item.humidity || 0).toFixed(1)} <small>%</small></td>
                  <td class="c-status py-3.5 px-6">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusInfo.badge}">
                      ${statusInfo.label}
                    </span>
                  </td>
                </tr>
              `;
              tableBody.innerHTML += row;
            });
          }
        }
      }

    }
  } catch (err) {
    console.error("AJAX Error:", err);
    if (dbStatusText) dbStatusText.textContent = "Koneksi API / DB Gagal";
    if (pingPulse) pingPulse.className = "animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75";
    if (pingDot) pingDot.className = "relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500";
  }
}

// Inisialisasi Grafik saat DOM siap & Ambil data awal
document.addEventListener('DOMContentLoaded', () => {
  const fy = document.getElementById('footer-year');
  if (fy) fy.textContent = new Date().getFullYear();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const tabs = { 'btn-chart-co2': 'co2', 'btn-chart-temp': 'temp', 'btn-chart-hum': 'humidity' };
  Object.entries(tabs).forEach(([id, param]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => window.switchChartParam(param));
  });

  try { initChart(); } catch (e) { console.error('initChart gagal:', e); showChartError('Grafik gagal dibuat: ' + e.message); }
  fetchSensorData();
});

// Polling setiap 5 detik agar hosting InfinityFree stabil
setInterval(fetchSensorData, 5000);