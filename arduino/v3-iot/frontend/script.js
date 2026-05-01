/* ═══════════════════════════════════════════════════
   GreenMind Dashboard — script.js (V2 MELHORADO)
   ═══════════════════════════════════════════════════ */

const API_BASE = 'http://192.168.0.122:8000';

const ENDPOINTS = {
  dados:  `${API_BASE}/dados`,
  status: `${API_BASE}/status`,
};

const UPDATE_INTERVAL = 5000;
const MAX_CHART_POINTS = 20;

let apiOnline = false;

// ─────────────────────────────────────────
// 📊 GRÁFICO
// ─────────────────────────────────────────

const chartData = {
  labels: [],
  temperatura: [],
  umidade_ar: [],
};

const ctx = document.getElementById('mainChart');

const mainChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Temperatura',
        data: chartData.temperatura,
        borderColor: '#f97316',
        tension: 0.4,
      },
      {
        label: 'Umidade',
        data: chartData.umidade_ar,
        borderColor: '#38bdf8',
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
});

// ─────────────────────────────────────────
// 🔌 FETCH COM STATUS
// ─────────────────────────────────────────

async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    apiOnline = true;
    atualizarStatusAPI(true);

    return await res.json();
  } catch (err) {
    apiOnline = false;
    atualizarStatusAPI(false);
    return null;
  }
}

// ─────────────────────────────────────────
// 🟢 STATUS DA API
// ─────────────────────────────────────────

function atualizarStatusAPI(online) {
  const dot = document.querySelector('#api-status .status-dot');
  const text = document.getElementById('api-text');

  if (!dot || !text) return;

  if (online) {
    dot.classList.remove('offline');
    dot.classList.add('online');
    text.textContent = 'Online';
  } else {
    dot.classList.remove('online');
    dot.classList.add('offline');
    text.textContent = 'Offline';
  }
}

// ─────────────────────────────────────────
// 📊 UI
// ─────────────────────────────────────────

function setValor(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor.toFixed(1);
}

function atualizarSensores(d) {
  setValor('val-temperatura', d.temperatura);
  setValor('val-umidade_ar', d.umidade_ar);
  setValor('val-luminosidade', d.luminosidade);
  setValor('val-umidade_solo_1', d.umidade_solo_1);
  setValor('val-umidade_solo_2', d.umidade_solo_2);
}

function atualizarAtuador(nome, estado) {
  const badge = document.getElementById(`badge-${nome}`);
  const ind = document.getElementById(`ind-${nome}`);

  if (!badge) return;

  if (estado) {
    badge.textContent = 'ON';
    badge.classList.add('on');
    ind.classList.add('on');
  } else {
    badge.textContent = 'OFF';
    badge.classList.remove('on');
    ind.classList.remove('on');
  }
}

function atualizarHorario() {
  const el = document.getElementById('last-update-time');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('pt-BR');
  }
}

// ─────────────────────────────────────────
// 📈 GRÁFICO
// ─────────────────────────────────────────

function atualizarGrafico(temp, umid) {
  const hora = new Date().toLocaleTimeString();

  chartData.labels.push(hora);
  chartData.temperatura.push(temp);
  chartData.umidade_ar.push(umid);

  if (chartData.labels.length > MAX_CHART_POINTS) {
    chartData.labels.shift();
    chartData.temperatura.shift();
    chartData.umidade_ar.shift();
  }

  mainChart.update();
}

// ─────────────────────────────────────────
// ⚠ ALERTAS
// ─────────────────────────────────────────

function verificarAlertas(d) {
  const area = document.getElementById('alerts-section');
  area.innerHTML = '';

  if (d.temperatura > 30) {
    criarAlerta(area, '🔥 Temperatura alta');
  }

  if (d.umidade_solo_1 < 30) {
    criarAlerta(area, '🌱 Solo seco');
  }
}

function criarAlerta(area, texto) {
  const div = document.createElement('div');
  div.className = 'alert-item warning';
  div.textContent = texto;
  area.appendChild(div);
}

// ─────────────────────────────────────────
// 🔄 LOOP PRINCIPAL
// ─────────────────────────────────────────

async function loop() {
  const dados = await fetchAPI(ENDPOINTS.dados);
  const status = await fetchAPI(ENDPOINTS.status);

  if (dados) {
    atualizarSensores(dados);
    atualizarGrafico(dados.temperatura, dados.umidade_ar);
    verificarAlertas(dados);
  }

  if (status) {
    atualizarAtuador('cooler', status.cooler);
    atualizarAtuador('water_pump', status.water_pump);
    atualizarAtuador('nutr_pump', status.nutr_pump);
  }

  atualizarHorario();
}

// ─────────────────────────────────────────
// 🚀 INIT
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loop();
  setInterval(loop, UPDATE_INTERVAL);
});