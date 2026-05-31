/* ═══════════════════════════════════════════════════
   SmartGreen Dashboard — script.js v3.0
   ═══════════════════════════════════════════════════ */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURAÇÃO GLOBAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONFIG = {
  API_BASE:         localStorage.getItem('api_base') || 'http://(colocar seu ip):8000',
  UPDATE_INTERVAL:  5000,
  MAX_CHART_POINTS: 20,
  STALE_THRESHOLD_MS: 15000,
};

const ENDPOINTS = {
  dados:    `${CONFIG.API_BASE}/dados`,
  status:   `${CONFIG.API_BASE}/status`,
  historico:`${CONFIG.API_BASE}/historico`,
  export:   (periodo) => `${CONFIG.API_BASE}/historico/export?periodo=${periodo}`,
  controle: `${CONFIG.API_BASE}/controle`,
  plantas:  `${CONFIG.API_BASE}/plantas`,
  regras:   `${CONFIG.API_BASE}/config/regras`,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌡️ FAIXAS IDEAIS DOS SENSORES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let SENSOR_RANGES = {
  temperatura:    { min: 0,  max: 50,  good: [18, 30], warning: [10, 35] },
  umidade_ar:     { min: 0,  max: 100, good: [50, 80], warning: [30, 90] },
  luminosidade:   { min: 0,  max: 100, good: [20, 90], warning: [5,  95] },
  umidade_solo_1: { min: 0,  max: 100, good: [35, 70], warning: [20, 80] },
  umidade_solo_2: { min: 0,  max: 100, good: [35, 70], warning: [20, 80] },
};

const STATUS_LABELS = { good: 'Ideal', warning: 'Atenção', critical: 'Crítico' };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗂️ ESTADO DA APLICAÇÃO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const state = {
  paginaAtual:    'home',
  historicoAtivo: 'dia',
  ultimaLeitura:  null,
  controle: { modo_manual: false, cooler: false, water_pump: false, nutr_pump: false },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 DADOS DO GRÁFICO EM TEMPO REAL (4 datasets)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const realtimeData = {
  labels:      [],
  temperatura: [],
  umidade_ar:  [],
  solo_1:      [],
  solo_2:      [],
};

let mainChart;
let historicoChart;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌗 TEMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getTema() { return localStorage.getItem('tema') || 'dark'; }

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = tema === 'light' ? '🌙' : '☀️';
  localStorage.setItem('tema', tema);
  atualizarCoresGraficos();
}

function toggleTema() { aplicarTema(getTema() === 'dark' ? 'light' : 'dark'); }

function getCoresGrafico() {
  const claro = getTema() === 'light';
  return {
    grid:  claro ? 'rgba(0,0,0,0.06)'  : 'rgba(255,255,255,0.06)',
    texto: claro ? '#7a95ab'            : '#4d6278',
  };
}

function atualizarCoresGraficos() {
  const cores = getCoresGrafico();
  const aplicar = (chart) => {
    if (!chart) return;
    ['x','y'].forEach(ax => {
      chart.options.scales[ax].grid.color  = cores.grid;
      chart.options.scales[ax].ticks.color = cores.texto;
    });
    chart.update('none');
  };
  aplicar(mainChart);
  aplicar(historicoChart);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍞 TOAST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showToast(mensagem, tipo = 'error', duracao = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  const icones = { error: '⚠️', warning: '⚠️', success: '✅' };
  toast.innerHTML = `<span>${icones[tipo] || '⚠️'}</span><span>${mensagem}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

let toastApiOfflineMostrado = false;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 COMUNICAÇÃO COM A API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    atualizarStatusAPI(true);
    toastApiOfflineMostrado = false;
    return await res.json();
  } catch (err) {
    atualizarStatusAPI(false);
    if (!toastApiOfflineMostrado) {
      showToast('API offline — verifique a conexão', 'error');
      toastApiOfflineMostrado = true;
    }
    return null;
  }
}

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
    showToast('Erro ao enviar comando', 'error', 3000);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 STATUS DA API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function atualizarStatusAPI(online) {
  const dot  = document.querySelector('#api-status .status-dot');
  const text = document.getElementById('api-text');
  if (!dot || !text) return;
  dot.classList.toggle('online',  online);
  dot.classList.toggle('offline', !online);
  text.textContent = online ? 'Online' : 'Offline';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕐 DADO ATRASADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function marcarLeituraFresca() {
  state.ultimaLeitura = Date.now();
  const el = document.querySelector('.last-update');
  if (el) el.classList.remove('stale');
}

function verificarAtraso() {
  if (!state.ultimaLeitura) return;
  const atraso = Date.now() - state.ultimaLeitura;
  const el = document.querySelector('.last-update');
  if (el) el.classList.toggle('stale', atraso > CONFIG.STALE_THRESHOLD_MS);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧭 NAVEGAÇÃO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function navegarPara(pagina) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  const alvo = document.getElementById(`page-${pagina}`);
  if (alvo) alvo.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.page === pagina)
  );

  const titulos = {
    home:     'Painel Principal',
    historico:'Histórico de Dados',
    plantas:  'Perfis de Plantas',
    nutricao: 'Guia de Nutrição',
    controle: 'Painel de Controle',
  };
  const titulo = document.getElementById('page-title');
  if (titulo) titulo.textContent = titulos[pagina] || '';

  state.paginaAtual = pagina;
  localStorage.setItem('paginaAtual', pagina);

  if (pagina === 'historico') carregarHistorico(state.historicoAtivo);
  if (pagina === 'plantas')   carregarPlantas();
  if (pagina === 'controle')  carregarControle();
  if (pagina === 'nutricao')  renderNutricao();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💧 RESERVATÓRIOS — cards de nível
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function atualizarReservatorio(nome, temLiquido) {
  const card   = document.getElementById(`res-${nome}`);
  const status = document.getElementById(`res-status-${nome}`);
  const ind    = document.getElementById(`res-ind-${nome}`);
  if (!card) return;

  card.classList.toggle('vazio', !temLiquido);
  card.classList.toggle('cheio', temLiquido);

  if (status) status.textContent = temLiquido ? 'Nível adequado' : '⚠️ Reservatório vazio!';
  if (ind)    ind.classList.toggle('vazio', !temLiquido);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📟 SENSORES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getEstadoSensor(sensor, valor) {
  const range = SENSOR_RANGES[sensor];
  if (!range) return 'good';
  const [goodMin, goodMax] = range.good;
  const [warnMin, warnMax] = range.warning;
  if (valor >= goodMin && valor <= goodMax) return 'good';
  if (valor >= warnMin && valor <= warnMax) return 'warning';
  return 'critical';
}

function setValor(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = typeof valor === 'number' ? valor.toFixed(1) : '—';
}

function atualizarBarra(sensor, valor) {
  const bar = document.getElementById(`bar-${sensor}`);
  if (!bar) return;
  const { min, max } = SENSOR_RANGES[sensor] ?? { min: 0, max: 100 };
  const pct = Math.min(100, Math.max(0, ((valor - min) / (max - min)) * 100));
  bar.style.width = `${pct.toFixed(1)}%`;
}

function atualizarEstadoCard(sensor, valor) {
  const card  = document.getElementById(`card-${sensor}`);
  const badge = card ? card.querySelector('.card-status-badge') : null;
  if (!card) return;
  const estado = getEstadoSensor(sensor, valor);
  card.classList.remove('status-good', 'status-warning', 'status-critical');
  card.classList.add(`status-${estado}`);
  if (badge) badge.textContent = STATUS_LABELS[estado] || '';
}

function atualizarSensores(d) {
  const sensores = ['temperatura', 'umidade_ar', 'luminosidade', 'umidade_solo_1', 'umidade_solo_2'];
  sensores.forEach(s => {
    setValor(`val-${s}`, d[s]);
    atualizarBarra(s, d[s]);
    atualizarEstadoCard(s, d[s]);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔵 ATUADORES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function atualizarAtuador(nome, estado) {
  const badge = document.getElementById(`badge-${nome}`);
  const ind   = document.getElementById(`ind-${nome}`);
  if (!badge) return;
  badge.textContent = estado ? 'ON' : 'OFF';
  badge.classList.toggle('on', estado);
  if (ind) ind.classList.toggle('on', estado);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📈 GRÁFICO TEMPO REAL — 4 datasets
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function atualizarGrafico(temp, umid, solo1, solo2) {
  const hora = new Date().toLocaleTimeString('pt-BR');

  realtimeData.labels.push(hora);
  realtimeData.temperatura.push(temp);
  realtimeData.umidade_ar.push(umid);
  realtimeData.solo_1.push(solo1);
  realtimeData.solo_2.push(solo2);

  if (realtimeData.labels.length > CONFIG.MAX_CHART_POINTS) {
    realtimeData.labels.shift();
    realtimeData.temperatura.shift();
    realtimeData.umidade_ar.shift();
    realtimeData.solo_1.shift();
    realtimeData.solo_2.shift();
  }

  mainChart.update();

  const emptyState = document.getElementById('chart-empty-main');
  if (emptyState) emptyState.classList.remove('visible');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️ ALERTAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verificarAlertas(d, status) {
  const area = document.getElementById('alerts-section');
  area.innerHTML = '';

  const alertas = [];

  // Reservatório vazio — alerta crítico
  if (d.nivel_agua === false)
    alertas.push({ tipo: 'danger', icone: '🚰', texto: 'Reservatório de água VAZIO — bomba bloqueada automaticamente' });
  if (d.nivel_nutriente === false)
    alertas.push({ tipo: 'danger', icone: '🧪', texto: 'Reservatório de nutrientes VAZIO — reabasteça antes de irrigar' });

  // Sensores climáticos
  if (d.temperatura > 30)
    alertas.push({ tipo: 'danger',  icone: '🔥', texto: `Temperatura em ${d.temperatura.toFixed(1)}°C — cooler acionado` });
  if (d.temperatura < 10)
    alertas.push({ tipo: 'danger',  icone: '🧊', texto: `Temperatura muito baixa: ${d.temperatura.toFixed(1)}°C` });
  if (d.umidade_ar < 40)
    alertas.push({ tipo: 'warning', icone: '💧', texto: `Umidade do ar em ${d.umidade_ar.toFixed(1)}% — abaixo do ideal` });
  if (d.umidade_solo_1 < 30)
    alertas.push({ tipo: 'warning', icone: '🌱', texto: `Solo 1 seco (${d.umidade_solo_1}%) — irrigação necessária` });
  if (d.umidade_solo_2 < 30)
    alertas.push({ tipo: 'warning', icone: '🌿', texto: `Solo 2 seco (${d.umidade_solo_2}%) — irrigação necessária` });

  alertas.forEach(({ tipo, icone, texto }) => {
    const div = document.createElement('div');
    div.className = `alert-item ${tipo}`;
    div.innerHTML = `<span class="alert-icon">${icone}</span><span>${texto}</span>`;
    area.appendChild(div);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏰ HORÁRIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function atualizarHorario() {
  const el = document.getElementById('last-update-time');
  if (el) el.textContent = new Date().toLocaleTimeString('pt-BR');
  marcarLeituraFresca();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📜 HISTÓRICO + EXPORTAR CSV
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function carregarHistorico(periodo) {
  const sub = document.getElementById('historico-sub');
  const emptyState = document.getElementById('chart-empty-historico');
  if (sub) sub.textContent = 'Carregando...';

  const resultado = await fetchAPI(`${ENDPOINTS.historico}?periodo=${periodo}`);

  if (!resultado || !resultado.dados || resultado.dados.length === 0) {
    if (sub) sub.textContent = 'Nenhum dado encontrado para este período.';
    historicoChart.data.labels = [];
    historicoChart.data.datasets.forEach(ds => ds.data = []);
    historicoChart.update();
    if (emptyState) emptyState.classList.add('visible');
    return;
  }

  const dados = resultado.dados;
  if (emptyState) emptyState.classList.remove('visible');

  const formatarLabel = (ts) => {
    const d = new Date(ts);
    if (periodo === 'dia') return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) + ' ' +
           d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  };

  historicoChart.data.labels           = dados.map(d => formatarLabel(d.timestamp));
  historicoChart.data.datasets[0].data = dados.map(d => d.temperatura);
  historicoChart.data.datasets[1].data = dados.map(d => d.umidade_ar);
  historicoChart.data.datasets[2].data = dados.map(d => d.umidade_solo_1);
  historicoChart.data.datasets[3].data = dados.map(d => d.umidade_solo_2);
  historicoChart.update();

  const nomes = { dia: 'último dia', semana: 'última semana', mes: 'último mês' };
  if (sub) sub.textContent = `${dados.length} registro(s) — ${nomes[periodo]}`;
  state.historicoAtivo = periodo;
}

function filtrarHistorico(periodo, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  carregarHistorico(periodo);
}

function exportarCSV() {
  window.open(ENDPOINTS.export(state.historicoAtivo), '_blank');
  showToast(`Exportando ${state.historicoAtivo}...`, 'success', 2500);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ CONTROLE MANUAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function carregarControle() {
  const config = await fetchAPI(ENDPOINTS.controle);
  if (!config) return;
  state.controle = { ...config };
  renderControle();
}

async function toggleModo() {
  const novoModo = !state.controle.modo_manual;
  const novoEstado = {
    ...state.controle,
    modo_manual: novoModo,
    cooler:     novoModo ? state.controle.cooler     : false,
    water_pump: novoModo ? state.controle.water_pump : false,
    nutr_pump:  novoModo ? state.controle.nutr_pump  : false,
  };
  const res = await postAPI(ENDPOINTS.controle, novoEstado);
  if (res) {
    state.controle = res;
    renderControle();
    showToast(novoModo ? 'Modo manual ativado' : 'Modo automático ativado', 'success', 3000);
  }
}

async function toggleAtuador(nome) {
  if (!state.controle.modo_manual) return;
  const novoEstado = { ...state.controle, [nome]: !state.controle[nome] };
  const res = await postAPI(ENDPOINTS.controle, novoEstado);
  if (res) { state.controle = res; renderControle(); }
}

function renderControle() {
  const { modo_manual, cooler, water_pump, nutr_pump } = state.controle;
  const atuadores = { cooler, water_pump, nutr_pump };

  const modeCard  = document.querySelector('.mode-card');
  const toggle    = document.getElementById('mode-toggle');
  const modeTitle = document.getElementById('mode-title');
  const modeDesc  = document.getElementById('mode-desc');
  const lAuto     = document.getElementById('mode-label-auto');
  const lManual   = document.getElementById('mode-label-manual');

  if (toggle)   toggle.classList.toggle('manual', modo_manual);
  if (modeCard) modeCard.classList.toggle('manual-mode', modo_manual);
  if (modeTitle) modeTitle.textContent = modo_manual ? 'Modo Manual Ativo' : 'Modo Automático';
  if (modeDesc)  modeDesc.textContent  = modo_manual
    ? 'Você está no controle — ajuste os atuadores manualmente'
    : 'Atuadores controlados pelas regras automáticas da estufa';
  if (lAuto)   lAuto.style.color   = !modo_manual ? 'var(--green-500)' : 'var(--text-muted)';
  if (lManual) lManual.style.color =  modo_manual ? 'var(--green-500)' : 'var(--text-muted)';

  Object.entries(atuadores).forEach(([nome, estado]) => {
    const card   = document.getElementById(`ctrl-${nome}`);
    const status = document.getElementById(`ctrl-status-${nome}`);
    const btn    = document.getElementById(`ctrl-btn-${nome}`);
    if (card)   card.classList.toggle('manual-active', modo_manual);
    if (status) { status.textContent = estado ? 'ON' : 'OFF'; status.classList.toggle('on', estado); status.classList.toggle('off', !estado); }
    if (btn)    { btn.disabled = !modo_manual; btn.textContent = estado ? 'Desligar' : 'Ligar'; btn.classList.toggle('btn-on', estado); }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 LOOP PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loop() {
  if (state.paginaAtual !== 'home') return;

  const dados  = await fetchAPI(ENDPOINTS.dados);
  const status = await fetchAPI(ENDPOINTS.status);
  let atualizou = false;

  if (dados) {
    atualizarSensores(dados);
    atualizarGrafico(
      dados.temperatura    ?? 0,
      dados.umidade_ar     ?? 0,
      dados.umidade_solo_1 ?? 0,
      dados.umidade_solo_2 ?? 0
    );
    verificarAlertas(dados, status);

    // Reservatórios
    atualizarReservatorio('agua',      dados.nivel_agua      !== false);
    atualizarReservatorio('nutriente', dados.nivel_nutriente !== false);

    atualizou = true;
  }

  if (status) {
    atualizarAtuador('cooler',     status.cooler);
    atualizarAtuador('water_pump', status.water_pump);
    atualizarAtuador('nutr_pump',  status.nutr_pump);
    atualizou = true;
  }

  if (atualizou) atualizarHorario();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏗️ GRÁFICOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getChartOptions() {
  const cores = getCoresGrafico();
  return {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13, 20, 30, 0.92)',
        titleColor: '#e8f0fe', bodyColor: '#8ca0bb',
        borderColor: 'rgba(255,255,255,0.10)', borderWidth: 1,
        padding: 10, cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { color: cores.grid, drawBorder: false }, ticks: { color: cores.texto, maxTicksLimit: 6, maxRotation: 0 } },
      y: { grid: { color: cores.grid, drawBorder: false }, ticks: { color: cores.texto, padding: 8 }, beginAtZero: false },
    },
  };
}

function criarGraficoMain() {
  mainChart = new Chart(document.getElementById('mainChart'), {
    type: 'line',
    data: {
      labels: realtimeData.labels,
      datasets: [
        { label: 'Temperatura (°C)',  data: realtimeData.temperatura, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.08)',  borderWidth: 2, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, fill: true },
        { label: 'Umidade Ar (%)',    data: realtimeData.umidade_ar,  borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)',  borderWidth: 2, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, fill: false },
        { label: 'Umidade Solo 1 (%)',data: realtimeData.solo_1,      borderColor: '#84cc16', backgroundColor: 'rgba(132,204,22,0.06)',  borderWidth: 2, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, fill: false },
        { label: 'Umidade Solo 2 (%)',data: realtimeData.solo_2,      borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.06)',  borderWidth: 2, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, fill: false },
      ],
    },
    options: getChartOptions(),
  });
}

function criarGraficoHistorico() {
  historicoChart = new Chart(document.getElementById('historicoChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Temperatura (°C)',  data: [], borderColor: '#f97316', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false },
        { label: 'Umidade Ar (%)',    data: [], borderColor: '#38bdf8', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false },
        { label: 'Solo 1 (%)',        data: [], borderColor: '#84cc16', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false },
        { label: 'Solo 2 (%)',        data: [], borderColor: '#4ade80', borderWidth: 2, tension: 0.3, pointRadius: 2, fill: false },
      ],
    },
    options: getChartOptions(),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌿 PLANTAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let plantaAtiva = null;

function calcBarIdeal(min, idealMin, idealMax, max) {
  const total = max - min;
  if (total <= 0) return { left: 0, width: 100 };
  return { left: Math.max(0, ((idealMin - min) / total) * 100), width: Math.min(100, ((idealMax - idealMin) / total) * 100) };
}

function criarCardPlanta(planta) {
  const ativo = planta.id === plantaAtiva;
  const bT = calcBarIdeal(planta.temp.min, planta.temp.ideal[0], planta.temp.ideal[1], planta.temp.max);
  const bA = calcBarIdeal(planta.umidade_ar.min, planta.umidade_ar.ideal[0], planta.umidade_ar.ideal[1], planta.umidade_ar.max);
  const bS = calcBarIdeal(planta.solo.min, planta.solo.ideal[0], planta.solo.ideal[1], planta.solo.max);
  const card = document.createElement('div');
  card.className = `planta-card${ativo ? ' ativo' : ''}`;
  card.dataset.categoria = planta.categoria;
  card.dataset.id = planta.id;
  card.innerHTML = `
    <div class="planta-header">
      <span class="planta-emoji">${planta.emoji}</span>
      <div class="planta-info">
        <span class="planta-nome">${planta.nome}</span>
        <span class="planta-categoria cat-${planta.categoria}">${planta.categoria}</span>
      </div>
    </div>
    <p class="planta-descricao">${planta.descricao}</p>
    <div class="planta-params">
      <div class="param-row">
        <div class="param-header"><span class="param-label">🌡 Temperatura</span><span class="param-valor">${planta.temp.ideal[0]}–${planta.temp.ideal[1]}°C</span></div>
        <div class="param-bar-wrap"><div class="param-bar-ideal param-bar-temp" style="left:${bT.left.toFixed(1)}%;width:${bT.width.toFixed(1)}%;"></div></div>
      </div>
      <div class="param-row">
        <div class="param-header"><span class="param-label">💧 Umidade Ar</span><span class="param-valor">${planta.umidade_ar.ideal[0]}–${planta.umidade_ar.ideal[1]}%</span></div>
        <div class="param-bar-wrap"><div class="param-bar-ideal param-bar-ar" style="left:${bA.left.toFixed(1)}%;width:${bA.width.toFixed(1)}%;"></div></div>
      </div>
      <div class="param-row">
        <div class="param-header"><span class="param-label">🌱 Solo</span><span class="param-valor">${planta.solo.ideal[0]}–${planta.solo.ideal[1]}%</span></div>
        <div class="param-bar-wrap"><div class="param-bar-ideal param-bar-solo" style="left:${bS.left.toFixed(1)}%;width:${bS.width.toFixed(1)}%;"></div></div>
      </div>
    </div>
    <button class="planta-btn" data-id="${planta.id}">${ativo ? '✅ Perfil ativo' : 'Aplicar perfil'}</button>
  `;
  card.querySelector('.planta-btn').addEventListener('click', () => {
    if (planta.id !== plantaAtiva) aplicarPerfilPlanta(planta);
  });
  return card;
}

function filtrarCategorias(cat) {
  document.querySelectorAll('.categoria-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  document.querySelectorAll('.planta-card').forEach(card => {
    card.style.display = (cat === 'Todos' || card.dataset.categoria === cat) ? '' : 'none';
  });
}

async function carregarPlantas() {
  const grid = document.getElementById('plantas-grid');
  if (!grid) return;
  grid.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">Carregando plantas...</p>';
  const resultado = await fetchAPI(ENDPOINTS.plantas);
  if (!resultado) { grid.innerHTML = '<p style="color:var(--text-muted);">Erro ao carregar plantas.</p>'; return; }
  const plantas = resultado.plantas || [];
  plantaAtiva = resultado.planta_ativa || null;
  atualizarBannerAtiva(plantaAtiva, plantas);
  const filterEl = document.getElementById('categoria-filter');
  if (filterEl) {
    const cats = ['Todos', ...new Set(plantas.map(p => p.categoria))];
    filterEl.innerHTML = cats.map(c => `<button class="categoria-btn${c==='Todos'?' active':''}" data-cat="${c}">${c}</button>`).join('');
    filterEl.querySelectorAll('.categoria-btn').forEach(btn => btn.addEventListener('click', () => filtrarCategorias(btn.dataset.cat)));
  }
  grid.innerHTML = '';
  plantas.forEach(p => grid.appendChild(criarCardPlanta(p)));
}

function atualizarBannerAtiva(id, plantas) {
  const banner = document.getElementById('planta-ativa-banner');
  const nomeEl = document.getElementById('planta-ativa-nome');
  const emojiEl = document.getElementById('planta-ativa-emoji');
  if (!banner) return;
  if (!id) { banner.classList.add('oculto'); return; }
  const planta = plantas.find(p => p.id === id);
  if (planta) {
    banner.classList.remove('oculto');
    if (nomeEl)  nomeEl.textContent  = planta.nome;
    if (emojiEl) emojiEl.textContent = planta.emoji;
  }
}

async function aplicarPerfilPlanta(planta) {
  const res = await postAPI(ENDPOINTS.regras, { temp_max: planta.temp_max, solo_min: planta.solo_min, planta_id: planta.id });
  if (!res) return;
  plantaAtiva = planta.id;
  SENSOR_RANGES.temperatura.good    = [planta.temp.ideal[0],       planta.temp.ideal[1]];
  SENSOR_RANGES.temperatura.warning = [planta.temp.min,            planta.temp.max];
  SENSOR_RANGES.umidade_ar.good     = [planta.umidade_ar.ideal[0], planta.umidade_ar.ideal[1]];
  SENSOR_RANGES.umidade_ar.warning  = [planta.umidade_ar.min,      planta.umidade_ar.max];
  SENSOR_RANGES.umidade_solo_1.good    = [planta.solo.ideal[0], planta.solo.ideal[1]];
  SENSOR_RANGES.umidade_solo_1.warning = [planta.solo.min,      planta.solo.max];
  SENSOR_RANGES.umidade_solo_2.good    = [planta.solo.ideal[0], planta.solo.ideal[1]];
  SENSOR_RANGES.umidade_solo_2.warning = [planta.solo.min,      planta.solo.max];
  const grid = document.getElementById('plantas-grid');
  if (grid) {
    const res2 = await fetchAPI(ENDPOINTS.plantas);
    if (res2) { grid.innerHTML = ''; (res2.plantas || []).forEach(p => grid.appendChild(criarCardPlanta(p))); atualizarBannerAtiva(planta.id, res2.plantas || []); }
  }
  showToast(`Perfil "${planta.nome}" aplicado com sucesso`, 'success', 4000);
}

async function carregarRegrasIniciais() {
  const regras = await fetchAPI(ENDPOINTS.regras);
  if (!regras || !regras.planta_id) return;
  const resultado = await fetchAPI(ENDPOINTS.plantas);
  if (!resultado) return;
  const planta = (resultado.plantas || []).find(p => p.id === regras.planta_id);
  if (!planta) return;
  plantaAtiva = planta.id;
  SENSOR_RANGES.temperatura.good    = [planta.temp.ideal[0],       planta.temp.ideal[1]];
  SENSOR_RANGES.temperatura.warning = [planta.temp.min,            planta.temp.max];
  SENSOR_RANGES.umidade_ar.good     = [planta.umidade_ar.ideal[0], planta.umidade_ar.ideal[1]];
  SENSOR_RANGES.umidade_ar.warning  = [planta.umidade_ar.min,      planta.umidade_ar.max];
  SENSOR_RANGES.umidade_solo_1.good = SENSOR_RANGES.umidade_solo_2.good = [planta.solo.ideal[0], planta.solo.ideal[1]];
  SENSOR_RANGES.umidade_solo_1.warning = SENSOR_RANGES.umidade_solo_2.warning = [planta.solo.min, planta.solo.max];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧪 NUTRIÇÃO — dados e renderização
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SOLUCOES = [
  {
    id: 'npk-comercial',
    nome: 'NPK Comercial Hidropônico',
    emoji: '🧴',
    dificuldade: 'easy',
    difLabel: 'Fácil',
    paraQuem: 'Qualquer hortaliça em qualquer fase',
    badge: 'Recomendado para o SmartGreen',
    descricao: 'Fertilizante solúvel pronto, balanceado com NPK + micronutrientes quelatos. Não entope bicos de bomba, tem concentração previsível e resultados consistentes. É a melhor opção para uso com o sistema automático.',
    ingredientes: [
      { qtd: '5–10 ml', item: 'Fertilizante NPK hidropônico solúvel (ex: Forth Jardim, Ouro Verde, MaxGreen Hidro)' },
      { qtd: '1 litro',  item: 'Água limpa (filtrada ou de torneira reposada 30 min)' },
    ],
    preparo: [
      'Meça 5 ml do fertilizante por litro para folhosas ou 10 ml por litro para frutas/legumes.',
      'Dissolva completamente na água antes de colocar no reservatório.',
      'Verifique o pH (ideal 5.5–6.5). Ajuste com bicarbonato (subir) ou limão/vinagre diluído (baixar).',
      'Troque a solução a cada 7–10 dias.',
    ],
    dica: 'Encontre em agropecuárias ou lojas online por R$15–30 para 100g. Esta quantidade dura meses para uma estufa pequena.',
    aviso: null,
  },
  {
    id: 'caseira-basica',
    nome: 'Solução Caseira Básica',
    emoji: '♻️',
    dificuldade: 'medium',
    difLabel: 'Médio',
    paraQuem: 'Alface, rúcula, espinafre — demonstrações escolares',
    badge: 'Educacional',
    descricao: 'Fórmula sustentável feita com resíduos orgânicos domésticos. Ótima para explicar o ciclo de nutrientes em apresentações, pois usa materiais que todos conhecem. Concentração variável mas funcional para folhosas.',
    ingredientes: [
      { qtd: '10 partes', item: 'Água limpa' },
      { qtd: '5 partes',  item: 'Cinza de madeira (fornece K, Ca, Mg)' },
      { qtd: '3–4 partes',item: 'Borra de café coado (fornece N, P, K)' },
      { qtd: '1–2 partes',item: 'Casca de ovo em pó (fornece Ca)' },
    ],
    preparo: [
      'Moa as cascas de ovo até virar pó fino.',
      'Misture todos os ingredientes em recipiente fechado.',
      'Deixe macerar por 2–3 dias, agitando uma vez ao dia.',
      'Coe com pano fino ou coador de café.',
      'Dilua na proporção 1:5 (1 parte de extrato para 5 partes de água).',
      'Use imediatamente ou armazene por no máximo 5 dias.',
    ],
    dica: 'Ótima para apresentar o conceito de nutrição vegetal de forma tangível. Use cinza de fogueira limpa, sem resíduos de carvão.',
    aviso: '⚠️ Pode entupir bicos de bomba finos. Use somente em mangueiras mais largas ou na bomba de nutrientes com filtro.',
  },
  {
    id: 'folhosas',
    nome: 'Hoagland Simplificada — Folhosas',
    emoji: '🥬',
    dificuldade: 'medium',
    difLabel: 'Médio',
    paraQuem: 'Alface, couve, espinafre, rúcula, salsinha',
    badge: 'Clássica da Hidroponia',
    descricao: 'Versão simplificada da fórmula Hoagland, referência mundial em nutrição hidropônica. Rica em nitrogênio para estimular o crescimento foliar. Requer sais separados disponíveis em agropecuárias.',
    ingredientes: [
      { qtd: '0.6 g/L',  item: 'Ureia (N — crescimento foliar)' },
      { qtd: '0.3 g/L',  item: 'MAP — Fosfato monoamônico (P — raízes)' },
      { qtd: '0.8 g/L',  item: 'Nitrato de potássio (K — resistência)' },
      { qtd: '0.5 g/L',  item: 'Sulfato de cálcio ou nitrato de cálcio (Ca)' },
      { qtd: '0.1 g/L',  item: 'Sulfato de magnésio (Mg — fotossíntese)' },
      { qtd: '1 litro',  item: 'Água filtrada' },
    ],
    preparo: [
      'Dissolva cada sal separadamente em um pouco de água antes de misturar.',
      'Adicione ao reservatório principal na ordem: Ca → K → Mg → P → N.',
      'Meça o pH (ideal 5.8–6.2 para folhosas). Ajuste conforme necessário.',
      'Verifique a CE (ideal 1.5–2.0 mS/cm para folhosas).',
      'Troque completamente a cada 10–14 dias.',
    ],
    dica: 'Dissolva o cálcio e o fosfato SEPARADAMENTE antes de juntar — eles precipitam juntos se misturados em concentrado.',
    aviso: null,
  },
  {
    id: 'frutas-legumes',
    nome: 'Solução Rica — Frutas e Legumes',
    emoji: '🍅',
    dificuldade: 'hard',
    difLabel: 'Avançado',
    paraQuem: 'Tomate, pimentão, pepino, morango, berinjela',
    badge: 'Alta produtividade',
    descricao: 'Fórmula com mais fósforo e potássio para suportar floração e frutificação. Plantas que produzem frutos exigem mais energia e cálcio para evitar podridão apical. CE mais alta que folhosas.',
    ingredientes: [
      { qtd: '0.5 g/L',  item: 'Ureia (N)' },
      { qtd: '0.5 g/L',  item: 'MAP — Fosfato monoamônico (P — flores e frutos)' },
      { qtd: '1.2 g/L',  item: 'Nitrato de potássio (K — qualidade dos frutos)' },
      { qtd: '0.8 g/L',  item: 'Nitrato de cálcio (Ca — evita podridão apical)' },
      { qtd: '0.2 g/L',  item: 'Sulfato de magnésio (Mg)' },
      { qtd: '0.1 g/L',  item: 'Micronutrientes quelatos (Fe, Zn, Mn, B)' },
    ],
    preparo: [
      'Dissolva cada componente separadamente antes de misturar no reservatório.',
      'pH ideal: 6.0–6.5 (um pouco mais alto que folhosas).',
      'CE ideal: 2.0–3.5 mS/cm (mais concentrada que folhosas).',
      'Durante floração, aumente K para 1.5 g/L e reduza N para 0.3 g/L.',
      'Troque a cada 7–10 dias.',
    ],
    dica: 'Em plantas de fruto, o cálcio é crítico. Falta de Ca causa podridão no fundo do tomate e do pimentão. Nunca corte o cálcio para economizar.',
    aviso: '⚠️ CE acima de 4.0 mS/cm causa estresse osmótico. Monitore sempre.',
  },
  {
    id: 'raizes',
    nome: 'Solução para Raízes e Tubérculos',
    emoji: '🥕',
    dificuldade: 'hard',
    difLabel: 'Avançado',
    paraQuem: 'Cenoura, beterraba, batata, cebola, alho',
    badge: 'Especializada',
    descricao: 'Raízes e tubérculos precisam de mais fósforo para o desenvolvimento subterrâneo e menos nitrogênio que folhosas — excesso de N faz crescer muito folha e pouca raiz. pH levemente mais ácido favorece absorção de P.',
    ingredientes: [
      { qtd: '0.3 g/L',  item: 'Ureia (N reduzido — menos folha, mais raiz)' },
      { qtd: '0.8 g/L',  item: 'MAP — Fosfato monoamônico (P alto — desenvolvimento de raiz)' },
      { qtd: '0.9 g/L',  item: 'Nitrato de potássio (K)' },
      { qtd: '0.6 g/L',  item: 'Nitrato de cálcio (Ca)' },
      { qtd: '0.15 g/L', item: 'Sulfato de magnésio (Mg)' },
    ],
    preparo: [
      'Dissolva cada sal separadamente antes de misturar.',
      'pH ideal: 5.5–6.0 (mais ácido para favorecer absorção de fósforo).',
      'CE ideal: 1.8–2.5 mS/cm.',
      'Troque a cada 10 dias.',
      'Mantenha o substrato bem aerado — raízes apodrecem em anaerobiose.',
    ],
    dica: 'Para cenoura e beterraba, o fósforo é o nutriente mais importante. Se as raízes saírem finas e ramificadas, é falta de P ou excesso de N.',
    aviso: null,
  },
  {
    id: 'ervas',
    nome: 'Solução Leve — Ervas Aromáticas',
    emoji: '🌿',
    dificuldade: 'easy',
    difLabel: 'Fácil',
    paraQuem: 'Manjericão, salsinha, coentro, hortelã',
    badge: 'Ciclo rápido',
    descricao: 'Ervas aromáticas crescem rápido e não precisam de solução tão concentrada. Excesso de nutrientes pode diluir os óleos essenciais que dão o aroma. CE baixa é a regra aqui.',
    ingredientes: [
      { qtd: '3–5 ml/L',  item: 'Fertilizante NPK hidropônico (metade da dose normal)' },
      { qtd: '1 litro',   item: 'Água filtrada' },
    ],
    preparo: [
      'Prepare como o NPK Comercial mas com metade da concentração.',
      'pH ideal: 5.8–6.5.',
      'CE ideal: 0.8–1.5 mS/cm — bem mais baixo que outras culturas.',
      'Troque a cada 14 dias.',
    ],
    dica: 'Ervas aromáticas produzem mais óleo essencial (mais cheiro e sabor) quando submetidas a leve estresse hídrico. Não mantenha o solo saturado.',
    aviso: null,
  },
];

function renderNutricao() {
  const grid = document.getElementById('solucao-grid');
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = '1';

  SOLUCOES.forEach(sol => {
    const card = document.createElement('div');
    card.className = 'solucao-card';

    const ingredientesHTML = sol.ingredientes.map(i =>
      `<li><span class="ing-qtd">${i.qtd}</span>${i.item}</li>`
    ).join('');

    const passoHTML = sol.preparo.map((p, idx) =>
      `<div class="passo"><span class="passo-num">${idx + 1}</span><span>${p}</span></div>`
    ).join('');

    card.innerHTML = `
      <div class="solucao-header">
        <div class="sol-icon-wrap">${sol.emoji}</div>
        <div class="sol-info">
          <div class="sol-title-row">
            <h3 class="sol-nome">${sol.nome}</h3>
            <span class="diff-badge ${sol.dificuldade}">${sol.difLabel}</span>
          </div>
          <span class="sol-para">${sol.paraQuem}</span>
          ${sol.badge ? `<span class="sol-badge">${sol.badge}</span>` : ''}
        </div>
      </div>

      <p class="sol-descricao">${sol.descricao}</p>

      <div class="sol-section">
        <h4 class="sol-section-title">🧂 Ingredientes</h4>
        <ul class="sol-ingredientes">${ingredientesHTML}</ul>
      </div>

      <div class="sol-section">
        <h4 class="sol-section-title">📋 Preparo passo a passo</h4>
        <div class="sol-passos">${passoHTML}</div>
      </div>

      ${sol.dica ? `<div class="sol-dica">💡 <strong>Dica:</strong> ${sol.dica}</div>` : ''}
      ${sol.aviso ? `<div class="sol-aviso">${sol.aviso}</div>` : ''}
    `;

    grid.appendChild(card);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INICIALIZAÇÃO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {

  aplicarTema(getTema());
  criarGraficoMain();
  criarGraficoHistorico();

  // Navegação
  document.querySelectorAll('.nav-item').forEach(item =>
    item.addEventListener('click', (e) => { e.preventDefault(); navegarPara(item.dataset.page); })
  );

  // Filtro histórico
  document.querySelectorAll('.period-btn').forEach(btn =>
    btn.addEventListener('click', () => filtrarHistorico(btn.dataset.period, btn))
  );

  // Exportar CSV
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportarCSV);

  // Tema
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTema);

  // Modo manual
  const toggleBtn = document.getElementById('mode-toggle');
  if (toggleBtn) toggleBtn.addEventListener('click', (e) => { e.preventDefault(); toggleModo(); });

  // Toggles do gráfico principal (mostrar/ocultar datasets)
  document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.dataset);
      const meta = mainChart.getDatasetMeta(idx);
      meta.hidden = !meta.hidden;
      btn.classList.toggle('inactive');
      mainChart.update();
    });
  });

  // Restaura página anterior
  const paginaSalva = localStorage.getItem('paginaAtual') || 'home';
  navegarPara(paginaSalva);

  carregarRegrasIniciais();

  loop();
  setInterval(loop, CONFIG.UPDATE_INTERVAL);
  setInterval(verificarAtraso, 1000);
});