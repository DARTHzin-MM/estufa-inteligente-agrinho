/* ═══════════════════════════════════════════════════ 
   SmartGreen Dashboard — script.js v2.0
   ═══════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────
// ⚙️ CONFIGURAÇÃO GLOBAL
// ─────────────────────────────────────────────────

const CONFIG = {
  API_BASE:         'http://192.168.0.122:8000',
  UPDATE_INTERVAL:  5000,  // ms entre atualizações automáticas da home
  MAX_CHART_POINTS: 20,    // pontos máximos no gráfico de tempo real
};

const ENDPOINTS = {
  dados:    `${CONFIG.API_BASE}/dados`,
  status:   `${CONFIG.API_BASE}/status`,
  historico:`${CONFIG.API_BASE}/historico`,
  controle: `${CONFIG.API_BASE}/controle`,
};

// Faixas de valores para cálculo das barras de progresso
const SENSOR_LIMITS = {
  temperatura:    { min: 0, max: 50  },
  umidade_ar:     { min: 0, max: 100 },
  luminosidade:   { min: 0, max: 100 },
  umidade_solo_1: { min: 0, max: 100 },
  umidade_solo_2: { min: 0, max: 100 },
};

// ─────────────────────────────────────────────────
// 🗂️ ESTADO DA APLICAÇÃO
// ─────────────────────────────────────────────────

const state = {
  paginaAtual:    'home',
  historicoAtivo: 'dia',
  controle: {
    modo_manual: false,
    cooler:      false,
    water_pump:  false,
    nutr_pump:   false,
  },
};

// ─────────────────────────────────────────────────
// 📊 GRÁFICO — TEMPO REAL (HOME)
// ─────────────────────────────────────────────────

const realtimeData = { labels: [], temperatura: [], umidade_ar: [] };

let mainChart;

// ─────────────────────────────────────────────────
// 📊 GRÁFICO — HISTÓRICO
// ─────────────────────────────────────────────────

let historicoChart;

// ─────────────────────────────────────────────────
// 🌐 COMUNICAÇÃO COM A API
// ─────────────────────────────────────────────────

/**
 * Requisição GET na API.
 * @returns {Object|null} dados ou null em caso de falha
 */
async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    atualizarStatusAPI(true);
    return await res.json();
  } catch (err) {
    atualizarStatusAPI(false);
    console.warn(`[SmartGreen] GET falhou — ${url} →`, err.message);
    return null;
  }
}

/**
 * Requisição POST na API com corpo JSON.
 * @returns {Object|null} resposta ou null em caso de falha
 */
async function postAPI(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[SmartGreen] POST falhou — ${url} →`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────
// 🟢 INDICADOR DE STATUS DA API (topbar)
// ─────────────────────────────────────────────────

function atualizarStatusAPI(online) {
  const dot  = document.querySelector('#api-status .status-dot');
  const text = document.getElementById('api-text');
  if (!dot || !text) return;

  dot.classList.toggle('online',  online);
  dot.classList.toggle('offline', !online);
  text.textContent = online ? 'Online' : 'Offline';
}

// ─────────────────────────────────────────────────
// 🧭 NAVEGAÇÃO ENTRE PÁGINAS
// ─────────────────────────────────────────────────

function navegarPara(pagina) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));

  const alvo = document.getElementById(`page-${pagina}`);
  if (alvo) alvo.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pagina);
  });

  const titulos = {
    home: 'Painel Principal',
    historico: 'Histórico de Dados',
    controle: 'Painel de Controle'
  };

  const titulo = document.getElementById('page-title');
  if (titulo) titulo.textContent = titulos[pagina] || '';

  state.paginaAtual = pagina;

  localStorage.setItem('paginaAtual', pagina);

  if (pagina === 'historico') carregarHistorico(state.historicoAtivo);
  if (pagina === 'controle')  carregarControle();
}

// ─────────────────────────────────────────────────
// 📟 SENSORES — HOME
// ─────────────────────────────────────────────────

/**
 * Atualiza o valor exibido em um card de sensor.
 */
function setValor(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = typeof valor === 'number' ? valor.toFixed(1) : '—';
}

/**
 * Atualiza a barra de progresso de um sensor com base nos limites definidos.
 */
function atualizarBarra(sensor, valor) {
  const bar = document.getElementById(`bar-${sensor}`);
  if (!bar) return;

  const { min, max } = SENSOR_LIMITS[sensor] ?? { min: 0, max: 100 };
  const pct = Math.min(100, Math.max(0, ((valor - min) / (max - min)) * 100));
  bar.style.width = `${pct.toFixed(1)}%`;
}

/**
 * Atualiza todos os cards de sensores com os dados recebidos da API.
 */
function atualizarSensores(d) {
  const sensores = ['temperatura', 'umidade_ar', 'luminosidade', 'umidade_solo_1', 'umidade_solo_2'];
  sensores.forEach(s => {
    setValor(`val-${s}`, d[s]);
    atualizarBarra(s, d[s]);
  });
}

// ─────────────────────────────────────────────────
// 🔵 ATUADORES — HOME (somente leitura)
// ─────────────────────────────────────────────────

/**
 * Atualiza badge e barra visual de um atuador no painel Home.
 */
function atualizarAtuador(nome, estado) {
  const badge = document.getElementById(`badge-${nome}`);
  const ind   = document.getElementById(`ind-${nome}`);
  if (!badge) return;

  badge.textContent = estado ? 'ON' : 'OFF';
  badge.classList.toggle('on', estado);
  if (ind) ind.classList.toggle('on', estado);
}

// ─────────────────────────────────────────────────
// 📈 GRÁFICO TEMPO REAL — HOME
// ─────────────────────────────────────────────────

function atualizarGrafico(temp, umid) {
  const hora = new Date().toLocaleTimeString('pt-BR');

  realtimeData.labels.push(hora);
  realtimeData.temperatura.push(temp);
  realtimeData.umidade_ar.push(umid);

  // Descarta pontos antigos além do limite
  if (realtimeData.labels.length > CONFIG.MAX_CHART_POINTS) {
    realtimeData.labels.shift();
    realtimeData.temperatura.shift();
    realtimeData.umidade_ar.shift();
  }

  mainChart.update();
}

// ─────────────────────────────────────────────────
// ⚠️ ALERTAS — HOME
// ─────────────────────────────────────────────────

/**
 * Avalia as leituras dos sensores e exibe alertas na tela.
 * As regras espelham a lógica do backend (logic.py) para feedback imediato.
 */
function verificarAlertas(d) {
  const area = document.getElementById('alerts-section');
  area.innerHTML = '';

  const alertas = [];

  if (d.temperatura > 30)    alertas.push({ tipo: 'danger',  icone: '🔥', texto: 'Temperatura alta — cooler acionado' });
  if (d.umidade_ar < 40)     alertas.push({ tipo: 'warning', icone: '💧', texto: 'Umidade do ar abaixo de 40%' });
  if (d.umidade_solo_1 < 30) alertas.push({ tipo: 'warning', icone: '🌱', texto: 'Solo 1 seco — bomba de água acionada' });
  if (d.umidade_solo_2 < 30) alertas.push({ tipo: 'warning', icone: '🌿', texto: 'Solo 2 seco — bomba de água acionada' });

  alertas.forEach(({ tipo, icone, texto }) => {
    const div = document.createElement('div');
    div.className = `alert-item ${tipo}`;
    div.innerHTML = `<span class="alert-icon">${icone}</span><span>${texto}</span>`;
    area.appendChild(div);
  });
}

// ─────────────────────────────────────────────────
// ⏰ HORÁRIO DE ATUALIZAÇÃO
// ─────────────────────────────────────────────────

function atualizarHorario() {
  const el = document.getElementById('last-update-time');
  if (el) el.textContent = new Date().toLocaleTimeString('pt-BR');
}

// ─────────────────────────────────────────────────
// 📜 HISTÓRICO
// ─────────────────────────────────────────────────

/**
 * Busca o histórico na API e popula o gráfico da página Histórico.
 * @param {string} periodo - 'dia' | 'semana' | 'mes'
 */
async function carregarHistorico(periodo) {
  const sub = document.getElementById('historico-sub');
  if (sub) sub.textContent = 'Carregando...';

  const resultado = await fetchAPI(`${ENDPOINTS.historico}?periodo=${periodo}`);

  if (!resultado || !resultado.dados) {
    if (sub) sub.textContent = 'Erro ao carregar dados. Verifique a conexão.';
    return;
  }

  const dados = resultado.dados;

  // Formata o timestamp de acordo com o período para melhor leitura
  const formatarLabel = (ts) => {
    const d = new Date(ts);
    if (periodo === 'dia') return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
           ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  historicoChart.data.labels            = dados.map(d => formatarLabel(d.timestamp));
  historicoChart.data.datasets[0].data  = dados.map(d => d.temperatura);
  historicoChart.data.datasets[1].data  = dados.map(d => d.umidade_ar);
  historicoChart.data.datasets[2].data  = dados.map(d => d.umidade_solo_1);
  historicoChart.data.datasets[3].data  = dados.map(d => d.umidade_solo_2);
  historicoChart.update();

  const nomes = { dia: 'último dia', semana: 'última semana', mes: 'último mês' };
  if (sub) sub.textContent = `${dados.length} registro(s) — ${nomes[periodo]}`;

  state.historicoAtivo = periodo;
}

/**
 * Atualiza o botão ativo e carrega o histórico do período selecionado.
 */
function filtrarHistorico(periodo, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  carregarHistorico(periodo);
}

// ─────────────────────────────────────────────────
// 🎛️ CONTROLE MANUAL
// ─────────────────────────────────────────────────

/**
 * Busca o estado atual de controle manual na API e renderiza a interface.
 */
async function carregarControle() {
  const config = await fetchAPI(ENDPOINTS.controle);
  if (!config) return;

  state.controle = { ...config };
  renderControle();
}

/**
 * Envia o estado atual de controle para a API (POST /controle).
 */
async function salvarControle() {
  const res = await postAPI(ENDPOINTS.controle, state.controle);

  if (res) {
    state.controle = { ...res };
  }
}

/**
 * Alterna entre modo automático e manual.
 * Chamado pelo onclick do botão toggle no HTML.
 */
async function toggleModo() {
  const novoModo = !state.controle.modo_manual;

  const novoEstado = {
    ...state.controle,
    modo_manual: novoModo,
    cooler: novoModo ? state.controle.cooler : false,
    water_pump: novoModo ? state.controle.water_pump : false,
    nutr_pump: novoModo ? state.controle.nutr_pump : false,
  };

  const res = await postAPI(ENDPOINTS.controle, novoEstado);

  if (res) {
    state.controle = res;
    renderControle();
  }
}

/**
 * Alterna o estado de um atuador específico (apenas em modo manual).
 * Chamado pelos botões de controle individual no HTML.
 * param {string} nome - 'cooler' | 'water_pump' | 'nutr_pump'
 */
async function toggleAtuador(nome) {
  if (!state.controle.modo_manual) return;

  const novoEstado = {
    ...state.controle,
    [nome]: !state.controle[nome],
  };

  const res = await postAPI(ENDPOINTS.controle, novoEstado);

  if (res) {
    state.controle = res;
    renderControle();
  }
}

/**
 * Atualiza a interface da página Controle com base no estado atual.
 * Chamado sempre que o estado muda.
 */
function renderControle() {
  const { modo_manual, cooler, water_pump, nutr_pump } = state.controle;
  const atuadores = { cooler, water_pump, nutr_pump };

  // ── Toggle de modo ──
  const modeCard    = document.querySelector('.mode-card');
  const toggle      = document.getElementById('mode-toggle');
  const modeTitle   = document.getElementById('mode-title');
  const modeDesc    = document.getElementById('mode-desc');
  const labelAuto   = document.getElementById('mode-label-auto');
  const labelManual = document.getElementById('mode-label-manual');

  if (toggle)    toggle.classList.toggle('manual', modo_manual);
  if (modeCard)  modeCard.classList.toggle('manual-mode', modo_manual);

  if (modeTitle) modeTitle.textContent = modo_manual ? 'Modo Manual Ativo' : 'Modo Automático';
  if (modeDesc)  modeDesc.textContent  = modo_manual
    ? 'Você está no controle — ajuste os atuadores manualmente'
    : 'Atuadores controlados pelas regras automáticas da estufa';

  if (labelAuto)   labelAuto.style.color   = !modo_manual ? 'var(--green-400)' : 'var(--text-muted)';
  if (labelManual) labelManual.style.color  =  modo_manual ? 'var(--green-400)' : 'var(--text-muted)';

  // ── Cards de atuadores ──
  Object.entries(atuadores).forEach(([nome, estado]) => {
    const card   = document.getElementById(`ctrl-${nome}`);
    const status = document.getElementById(`ctrl-status-${nome}`);
    const btn    = document.getElementById(`ctrl-btn-${nome}`);

    if (card)   card.classList.toggle('manual-active', modo_manual);

    if (status) {
      status.textContent = estado ? 'ON' : 'OFF';
      status.classList.toggle('on', estado);
    }

    if (btn) {
      btn.disabled     = !modo_manual;
      btn.textContent  = estado ? 'Desligar' : 'Ligar';
      btn.classList.toggle('btn-on', estado);
    }
  });
}

// ─────────────────────────────────────────────────
// 🔄 LOOP PRINCIPAL — HOME
// ─────────────────────────────────────────────────

/**
 * Busca dados e status da API e atualiza todos os elementos da Home.
 * Executa ao iniciar e repete a cada CONFIG.UPDATE_INTERVAL ms.
 */
async function loop() {

  if (state.paginaAtual !== 'home') return;

  const dados  = await fetchAPI(ENDPOINTS.dados);
  const status = await fetchAPI(ENDPOINTS.status);

  let atualizou = false;

  if (dados) {
    atualizarSensores(dados);
    if (dados.temperatura != null && dados.umidade_ar != null) {
      atualizarGrafico(dados.temperatura, dados.umidade_ar);
    }
    verificarAlertas(dados);
    atualizou = true;
  }

  if (status) {
    atualizarAtuador('cooler',     status.cooler);
    atualizarAtuador('water_pump', status.water_pump);
    atualizarAtuador('nutr_pump',  status.nutr_pump);
    atualizou = true;
  }

  // Só atualiza horário se realmente recebeu algo
  if (atualizou) {
    atualizarHorario();
  }
}

// ─────────────────────────────────────────────────
// 🚀 INICIALIZAÇÃO
// ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Navegação entre páginas
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navegarPara(item.dataset.page);
    });
  });

  // Botões de filtro de período do histórico
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => filtrarHistorico(btn.dataset.period, btn));
  });

  // Criar gráfico principal (HOME)
  mainChart = new Chart(document.getElementById('mainChart'), {
    type: 'line',
    data: {
      labels: realtimeData.labels,
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: realtimeData.temperatura,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.08)',
          tension: 0.4,
          pointRadius: 3,
          fill: true,
        },
        {
          label: 'Umidade (%)',
          data: realtimeData.umidade_ar,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          tension: 0.4,
          pointRadius: 3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  // Criar gráfico de histórico
  historicoChart = new Chart(document.getElementById('historicoChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Temperatura (°C)', data: [] },
        { label: 'Umidade Ar (%)', data: [] },
        { label: 'Solo 1 (%)', data: [] },
        { label: 'Solo 2 (%)', data: [] },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  const paginaSalva = localStorage.getItem('paginaAtual');

  if (paginaSalva) {
    navegarPara(paginaSalva);
  } else {
    navegarPara('home');
  }

  // Inicia loop de atualização
  loop();
  setInterval(loop, CONFIG.UPDATE_INTERVAL);

  // Botão de modo manual
  const toggleBtn = document.getElementById('mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleModo();
    });
  }
});