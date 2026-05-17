/* ═══════════════════════════════════════════════════
   SmartGreen Dashboard — script.js v3.0
   ═══════════════════════════════════════════════════ */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ CONFIGURAÇÃO GLOBAL
// Tudo que pode precisar de ajuste fica aqui em cima.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CONFIG = {
  // IP da API — o usuário pode trocar via localStorage (veja initConfig)
  API_BASE: localStorage.getItem('api_base') || 'http://192.168.0.124:8000',

  // Intervalo de atualização automática em milissegundos (5 segundos)
  UPDATE_INTERVAL: 5000,

  // Quantos pontos o gráfico de tempo real guarda antes de descartar os mais antigos
  MAX_CHART_POINTS: 20,

  // Se passar mais que X ms sem receber dado novo, o badge "Atualizado" fica vermelho
  STALE_THRESHOLD_MS: 15000, // 15 segundos
};

// Endpoints montados automaticamente a partir do API_BASE
// Se mudar o IP, só muda no CONFIG acima — todos os endpoints se atualizam
const ENDPOINTS = {
  dados:    `${CONFIG.API_BASE}/dados`,
  status:   `${CONFIG.API_BASE}/status`,
  historico:`${CONFIG.API_BASE}/historico`,
  controle: `${CONFIG.API_BASE}/controle`,
  plantas:  `${CONFIG.API_BASE}/plantas`,
  regras:   `${CONFIG.API_BASE}/config/regras`,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌡️ FAIXAS IDEAIS DOS SENSORES
// Define o que é bom, atenção e crítico.
// Esses valores são os limites do SmartGreen.
// No futuro isso pode vir do backend (perfis de plantas).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let SENSOR_RANGES = {
  temperatura: {
    min: 0, max: 50,          // limites para a barra de progresso
    good:     [18, 30],       // faixa ideal: 18–30°C
    warning:  [10, 35],       // atenção: fora do ideal mas ainda ok
    // fora do warning = crítico
  },
  umidade_ar: {
    min: 0, max: 100,
    good:    [50, 80],        // ideal: 50–80%
    warning: [30, 90],
  },
  luminosidade: {
    min: 0, max: 100,
    good:    [20, 90],        // qualquer coisa com luz é ok
    warning: [5, 95],
  },
  umidade_solo_1: {
    min: 0, max: 100,
    good:    [35, 70],        // mesmo limiar do backend (SOLO_MIN=30, folga acima)
    warning: [20, 80],
  },
  umidade_solo_2: {
    min: 0, max: 100,
    good:    [35, 70],
    warning: [20, 80],
  },
};

// Textos do badge de estado
const STATUS_LABELS = {
  good:     'Ideal',
  warning:  'Atenção',
  critical: 'Crítico',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗂️ ESTADO DA APLICAÇÃO
// Variáveis que controlam o que está acontecendo agora.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const state = {
  paginaAtual:    'home',
  historicoAtivo: 'dia',
  ultimaLeitura:  null,       // timestamp da última resposta bem-sucedida da API
  controle: {
    modo_manual: false,
    cooler:      false,
    water_pump:  false,
    nutr_pump:   false,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 DADOS DO GRÁFICO DE TEMPO REAL
// Arrays que alimentam o Chart.js da Home.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const realtimeData = {
  labels:      [],
  temperatura: [],
  umidade_ar:  [],
};

let mainChart;
let historicoChart;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌗 TEMA CLARO / ESCURO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Retorna o tema atual ('dark' ou 'light').
 * Padrão: escuro.
 */
function getTema() {
  return localStorage.getItem('tema') || 'dark';
}

/**
 * Aplica o tema no HTML e atualiza o ícone do botão.
 * 
 * Como funciona: adicionamos data-theme="light" no <html>.
 * O CSS tem [data-theme="light"] { --bg-base: ...; } que
 * sobrescreve as variáveis do :root — todo o visual muda
 * automaticamente sem tocar em mais nenhum elemento.
 */
function aplicarTema(tema) {
  // Define o atributo no elemento raiz do HTML
  document.documentElement.setAttribute('data-theme', tema);

  // Atualiza o ícone do botão (☀️ para claro, 🌙 para escuro)
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = tema === 'light' ? '🌙' : '☀️';

  // Salva a preferência para a próxima vez que abrir
  localStorage.setItem('tema', tema);

  // Reconfigura as cores dos gráficos (Chart.js não usa CSS vars automaticamente)
  atualizarCoresGraficos();
}

/**
 * Alterna entre claro e escuro.
 * Chamado pelo clique no botão de tema.
 */
function toggleTema() {
  const temaAtual = getTema();
  aplicarTema(temaAtual === 'dark' ? 'light' : 'dark');
}

/**
 * Retorna as cores corretas para os gráficos
 * baseado no tema atual. Chart.js precisa receber
 * as cores como string — não lê variáveis CSS.
 */
function getCoresGrafico() {
  const claro = getTema() === 'light';
  return {
    grid:  claro ? 'rgba(0,0,0,0.06)'   : 'rgba(255,255,255,0.06)',
    texto: claro ? '#7a95ab'             : '#4d6278',
    tick:  claro ? '#3d5166'             : '#8ca0bb',
  };
}

/**
 * Atualiza as configurações visuais dos gráficos
 * quando o tema muda. Precisa chamar .update() depois.
 */
function atualizarCoresGraficos() {
  const cores = getCoresGrafico();

  // Função auxiliar que aplica nas escalas de um chart
  const aplicar = (chart) => {
    if (!chart) return;

    // Escala X (linha do tempo / timestamps)
    chart.options.scales.x.grid.color  = cores.grid;
    chart.options.scales.x.ticks.color = cores.texto;

    // Escala Y (valores dos sensores)
    chart.options.scales.y.grid.color  = cores.grid;
    chart.options.scales.y.ticks.color = cores.texto;

    chart.update('none'); // 'none' = sem animação, só redesenha
  };

  aplicar(mainChart);
  aplicar(historicoChart);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍞 TOAST — notificações de canto de tela
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Mostra um toast no canto inferior direito da tela.
 * 
 * @param {string} mensagem - texto a exibir
 * @param {'error'|'warning'|'success'} tipo - controla a cor
 * @param {number} duracao - tempo em ms antes de sumir (padrão: 4s)
 */
function showToast(mensagem, tipo = 'error', duracao = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Cria o elemento do toast
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;

  // Ícone baseado no tipo
  const icones = { error: '⚠️', warning: '⚠️', success: '✅' };
  toast.innerHTML = `<span>${icones[tipo] || '⚠️'}</span><span>${mensagem}</span>`;

  container.appendChild(toast);

  // Após a duração, adiciona a classe .hide para animar a saída
  // e remove o elemento depois que a animação termina
  setTimeout(() => {
    toast.classList.add('hide');
    // 300ms é a duração da animação toast-out no CSS
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

// Controle para não mostrar o toast de "API offline" repetidamente
let toastApiOfflineMostrado = false;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 COMUNICAÇÃO COM A API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Faz uma requisição GET na API.
 * 
 * Em caso de erro, atualiza o indicador de status
 * e mostra um toast — mas só uma vez por sessão de
 * falha para não encher a tela.
 * 
 * @returns {Object|null} dados JSON ou null
 */
async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Deu certo: marca API como online e reseta o controle do toast
    atualizarStatusAPI(true);
    toastApiOfflineMostrado = false;

    return await res.json();
  } catch (err) {
    atualizarStatusAPI(false);

    // Mostra o toast só na primeira falha consecutiva
    if (!toastApiOfflineMostrado) {
      showToast('API offline — verifique a conexão', 'error');
      toastApiOfflineMostrado = true;
    }

    console.warn(`[SmartGreen] GET falhou — ${url} →`, err.message);
    return null;
  }
}

/**
 * Faz uma requisição POST na API com corpo JSON.
 * 
 * @returns {Object|null} resposta ou null
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
    showToast('Erro ao enviar comando', 'error', 3000);
    console.warn(`[SmartGreen] POST falhou — ${url} →`, err.message);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 INDICADOR DE STATUS DA API (topbar)
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
// 🕐 INDICADOR DE DADO ATRASADO
// Fica vermelho se passar STALE_THRESHOLD_MS sem atualizar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Atualiza o timestamp de "última leitura" e
 * marca como fresco (remove classe .stale).
 */
function marcarLeituraFresca() {
  state.ultimaLeitura = Date.now();
  const el = document.querySelector('.last-update');
  if (el) el.classList.remove('stale');
}

/**
 * Verifica periodicamente se o dado está atrasado.
 * Se passar o limite, o badge "Atualizado" fica vermelho.
 * Chamado a cada segundo via setInterval.
 */
function verificarAtraso() {
  if (!state.ultimaLeitura) return; // ainda não recebeu nenhum dado
  const atraso = Date.now() - state.ultimaLeitura;
  const el = document.querySelector('.last-update');
  if (el) el.classList.toggle('stale', atraso > CONFIG.STALE_THRESHOLD_MS);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧭 NAVEGAÇÃO ENTRE PÁGINAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function navegarPara(pagina) {
  // Esconde todas as páginas
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));

  // Mostra a página alvo
  const alvo = document.getElementById(`page-${pagina}`);
  if (alvo) alvo.classList.remove('hidden');

  // Atualiza os itens de nav (destaque no item ativo)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pagina);
  });

  // Atualiza o título da topbar
  const titulos = {
    home:     'Painel Principal',
    historico:'Histórico de Dados',
    controle: 'Painel de Controle',
  };
  const titulo = document.getElementById('page-title');
  if (titulo) titulo.textContent = titulos[pagina] || '';

  state.paginaAtual = pagina;
  localStorage.setItem('paginaAtual', pagina);

  // Carrega dados específicos da página
  if (pagina === 'historico') carregarHistorico(state.historicoAtivo);
  if (pagina === 'plantas')   carregarPlantas();
  if (pagina === 'controle')  carregarControle();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📟 SENSORES — Atualização dos cards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Determina o estado de um sensor com base nas faixas definidas em SENSOR_RANGES.
 * 
 * Exemplo para temperatura = 32:
 *   good    = [18, 30] → 32 não está dentro
 *   warning = [10, 35] → 32 está dentro → retorna 'warning'
 * 
 * @returns {'good'|'warning'|'critical'}
 */
function getEstadoSensor(sensor, valor) {
  const range = SENSOR_RANGES[sensor];
  if (!range) return 'good';

  const [goodMin, goodMax]       = range.good;
  const [warnMin, warnMax]       = range.warning;

  if (valor >= goodMin && valor <= goodMax)  return 'good';
  if (valor >= warnMin && valor <= warnMax)  return 'warning';
  return 'critical';
}

/**
 * Atualiza o valor exibido em um card de sensor.
 * toFixed(1) = mostra 1 casa decimal (ex: 25.3)
 */
function setValor(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = typeof valor === 'number' ? valor.toFixed(1) : '—';
}

/**
 * Atualiza a barra de progresso de um sensor.
 * A largura da barra é proporcional ao valor dentro do range min–max.
 */
function atualizarBarra(sensor, valor) {
  const bar = document.getElementById(`bar-${sensor}`);
  if (!bar) return;
  const { min, max } = SENSOR_RANGES[sensor] ?? { min: 0, max: 100 };
  // Math.min/max garante que fica entre 0 e 100%
  const pct = Math.min(100, Math.max(0, ((valor - min) / (max - min)) * 100));
  bar.style.width = `${pct.toFixed(1)}%`;
}

/**
 * Aplica a classe de estado (status-good, status-warning, status-critical)
 * no card do sensor e atualiza o texto do badge.
 */
function atualizarEstadoCard(sensor, valor) {
  const card  = document.getElementById(`card-${sensor}`);
  const badge = card ? card.querySelector('.card-status-badge') : null;
  if (!card) return;

  const estado = getEstadoSensor(sensor, valor);

  // Remove os estados anteriores antes de adicionar o novo
  card.classList.remove('status-good', 'status-warning', 'status-critical');
  card.classList.add(`status-${estado}`);

  if (badge) badge.textContent = STATUS_LABELS[estado] || '';
}

/**
 * Atualiza todos os cards de sensores com os dados recebidos da API.
 */
function atualizarSensores(d) {
  const sensores = ['temperatura', 'umidade_ar', 'luminosidade', 'umidade_solo_1', 'umidade_solo_2'];
  sensores.forEach(s => {
    setValor(`val-${s}`, d[s]);
    atualizarBarra(s, d[s]);
    atualizarEstadoCard(s, d[s]);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔵 ATUADORES — Home (somente leitura)
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
// 📈 GRÁFICO DE TEMPO REAL — Home
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Adiciona um ponto ao gráfico de tempo real.
 * Descarta pontos antigos quando ultrapassa MAX_CHART_POINTS.
 * Também controla o estado vazio (mensagem "aguardando dados").
 */
function atualizarGrafico(temp, umid) {
  // Formata a hora atual como HH:MM:SS
  const hora = new Date().toLocaleTimeString('pt-BR');

  realtimeData.labels.push(hora);
  realtimeData.temperatura.push(temp);
  realtimeData.umidade_ar.push(umid);

  // Remove pontos mais antigos se ultrapassar o limite
  if (realtimeData.labels.length > CONFIG.MAX_CHART_POINTS) {
    realtimeData.labels.shift();     // shift() remove o primeiro elemento do array
    realtimeData.temperatura.shift();
    realtimeData.umidade_ar.shift();
  }

  mainChart.update();

  // Esconde o estado vazio quando há dados
  const emptyState = document.getElementById('chart-empty-main');
  if (emptyState) emptyState.classList.remove('visible');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️ ALERTAS — Home
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Verifica as leituras e mostra alertas na seção de alertas.
 * As regras espelham a lógica do backend (logic.py) para
 * dar feedback imediato ao operador.
 */
function verificarAlertas(d) {
  const area = document.getElementById('alerts-section');
  area.innerHTML = '';

  const alertas = [];

  if (d.temperatura > 30)    alertas.push({ tipo: 'danger',  icone: '🔥', texto: `Temperatura em ${d.temperatura.toFixed(1)}°C — cooler acionado` });
  if (d.temperatura < 10)    alertas.push({ tipo: 'danger',  icone: '🧊', texto: `Temperatura muito baixa: ${d.temperatura.toFixed(1)}°C` });
  if (d.umidade_ar < 40)     alertas.push({ tipo: 'warning', icone: '💧', texto: `Umidade do ar em ${d.umidade_ar.toFixed(1)}% — abaixo do ideal` });
  if (d.umidade_solo_1 < 30) alertas.push({ tipo: 'warning', icone: '🌱', texto: `Solo 1 seco (${d.umidade_solo_1}%) — bomba de água acionada` });
  if (d.umidade_solo_2 < 30) alertas.push({ tipo: 'warning', icone: '🌿', texto: `Solo 2 seco (${d.umidade_solo_2}%) — bomba de água acionada` });

  alertas.forEach(({ tipo, icone, texto }) => {
    const div = document.createElement('div');
    div.className = `alert-item ${tipo}`;
    div.innerHTML = `<span class="alert-icon">${icone}</span><span>${texto}</span>`;
    area.appendChild(div);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏰ HORÁRIO DE ATUALIZAÇÃO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function atualizarHorario() {
  const el = document.getElementById('last-update-time');
  if (el) el.textContent = new Date().toLocaleTimeString('pt-BR');
  marcarLeituraFresca();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📜 HISTÓRICO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function carregarHistorico(periodo) {
  const sub = document.getElementById('historico-sub');
  const emptyState = document.getElementById('chart-empty-historico');
  if (sub) sub.textContent = 'Carregando...';

  const resultado = await fetchAPI(`${ENDPOINTS.historico}?periodo=${periodo}`);

  if (!resultado || !resultado.dados || resultado.dados.length === 0) {
    if (sub) sub.textContent = 'Nenhum dado encontrado para este período.';

    // Limpa o gráfico e mostra o estado vazio
    historicoChart.data.labels = [];
    historicoChart.data.datasets.forEach(ds => ds.data = []);
    historicoChart.update();

    if (emptyState) emptyState.classList.add('visible');
    return;
  }

  const dados = resultado.dados;
  if (emptyState) emptyState.classList.remove('visible');

  // Formata o label do eixo X de acordo com o período
  const formatarLabel = (ts) => {
    const d = new Date(ts);
    if (periodo === 'dia') {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
           + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

function filtrarHistorico(periodo, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  carregarHistorico(periodo);
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

async function salvarControle() {
  const res = await postAPI(ENDPOINTS.controle, state.controle);
  if (res) state.controle = { ...res };
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
    showToast(
      novoModo ? 'Modo manual ativado' : 'Modo automático ativado',
      'success',
      3000
    );
  }
}

async function toggleAtuador(nome) {
  if (!state.controle.modo_manual) return;
  const novoEstado = { ...state.controle, [nome]: !state.controle[nome] };
  const res = await postAPI(ENDPOINTS.controle, novoEstado);
  if (res) {
    state.controle = res;
    renderControle();
  }
}

function renderControle() {
  const { modo_manual, cooler, water_pump, nutr_pump } = state.controle;
  const atuadores = { cooler, water_pump, nutr_pump };

  const modeCard    = document.querySelector('.mode-card');
  const toggle      = document.getElementById('mode-toggle');
  const modeTitle   = document.getElementById('mode-title');
  const modeDesc    = document.getElementById('mode-desc');
  const labelAuto   = document.getElementById('mode-label-auto');
  const labelManual = document.getElementById('mode-label-manual');

  if (toggle)   toggle.classList.toggle('manual', modo_manual);
  if (modeCard) modeCard.classList.toggle('manual-mode', modo_manual);

  if (modeTitle) modeTitle.textContent = modo_manual ? 'Modo Manual Ativo' : 'Modo Automático';
  if (modeDesc)  modeDesc.textContent  = modo_manual
    ? 'Você está no controle — ajuste os atuadores manualmente'
    : 'Atuadores controlados pelas regras automáticas da estufa';

  if (labelAuto)   labelAuto.style.color   = !modo_manual ? 'var(--green-500)' : 'var(--text-muted)';
  if (labelManual) labelManual.style.color  =  modo_manual ? 'var(--green-500)' : 'var(--text-muted)';

  Object.entries(atuadores).forEach(([nome, estado]) => {
    const card   = document.getElementById(`ctrl-${nome}`);
    const status = document.getElementById(`ctrl-status-${nome}`);
    const btn    = document.getElementById(`ctrl-btn-${nome}`);

    if (card)   card.classList.toggle('manual-active', modo_manual);
    if (status) {
      status.textContent = estado ? 'ON' : 'OFF';
      status.classList.toggle('on',  estado);
      status.classList.toggle('off', !estado);
    }
    if (btn) {
      btn.disabled    = !modo_manual;
      btn.textContent = estado ? 'Desligar' : 'Ligar';
      btn.classList.toggle('btn-on', estado);
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 LOOP PRINCIPAL — Home
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loop() {
  // Só atualiza a Home quando está nessa página
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

  if (atualizou) atualizarHorario();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏗️ CRIAÇÃO DOS GRÁFICOS
// Função separada para ficar mais organizado.
// As opções de escala (scales) são o que corrigem
// o visual bugado — sem elas o Chart.js usa cores
// padrão que somem no fundo escuro.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Retorna o objeto de opções padrão para os gráficos.
 * Ambos os gráficos compartilham essa base.
 */
function getChartOptions(mostrarLegenda = false) {
  const cores = getCoresGrafico();

  return {
    responsive: true,
    maintainAspectRatio: false,

    // spanGaps: quando há gaps (null/undefined) no array de dados,
    // o Chart.js conecta os pontos existentes em vez de quebrar a linha.
    // Resolve o visual estranho com poucos dados.
    spanGaps: true,

    animation: {
      duration: 400, // animação mais rápida = menos engasgo visual
    },

    plugins: {
      // Desativa a legenda embutida do Chart.js (usamos a nossa própria no HTML)
      legend: { display: mostrarLegenda },

      tooltip: {
        backgroundColor: 'rgba(13, 20, 30, 0.92)',
        titleColor: '#e8f0fe',
        bodyColor: '#8ca0bb',
        borderColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },

    scales: {
      x: {
        grid: {
          color: cores.grid,      // cor das linhas verticais da grade
          drawBorder: false,
        },
        ticks: {
          color: cores.texto,     // cor dos labels do eixo X
          maxTicksLimit: 6,       // no máximo 6 labels (evita sobreposição)
          maxRotation: 0,         // não rotaciona os labels
        },
      },
      y: {
        grid: {
          color: cores.grid,
          drawBorder: false,
        },
        ticks: {
          color: cores.texto,
          padding: 8,
        },
        // beginAtZero: false permite que o gráfico amplie a área de interesse
        // em vez de sempre começar do zero (fica muito mais legível)
        beginAtZero: false,
      },
    },
  };
}

function criarGraficoMain() {
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
          borderWidth: 2,
          tension: 0.4,       // suavização das curvas (0 = reto, 1 = muito curvo)
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
        },
        {
          label: 'Umidade (%)',
          data: realtimeData.umidade_ar,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
        },
      ],
    },
    options: getChartOptions(false),
  });
}

function criarGraficoHistorico() {
  historicoChart = new Chart(document.getElementById('historicoChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: [],
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.06)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
          fill: false,
        },
        {
          label: 'Umidade Ar (%)',
          data: [],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.06)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
          fill: false,
        },
        {
          label: 'Solo 1 (%)',
          data: [],
          borderColor: '#84cc16',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
          fill: false,
        },
        {
          label: 'Solo 2 (%)',
          data: [],
          borderColor: '#4ade80',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
          fill: false,
        },
      ],
    },
    options: getChartOptions(false),
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INICIALIZAÇÃO
// Tudo começa aqui quando o HTML termina de carregar.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {

  // 1. Aplica o tema salvo (ou escuro por padrão)
  aplicarTema(getTema());

  // 2. Cria os dois gráficos
  criarGraficoMain();
  criarGraficoHistorico();

  // 3. Navegação entre páginas
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navegarPara(item.dataset.page);
    });
  });

  // 4. Botões de filtro de período do histórico
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => filtrarHistorico(btn.dataset.period, btn));
  });

  // 5. Botão de tema
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTema);

  // 6. Botão de modo manual
  const toggleBtn = document.getElementById('mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleModo();
    });
  }

  // 7. Restaura a página que estava aberta antes de fechar o browser
  const paginaSalva = localStorage.getItem('paginaAtual') || 'home';
  navegarPara(paginaSalva);

  // 8. Carrega perfil de planta ativo (atualiza faixas dos cards)
  carregarRegrasIniciais();

  // 9. Inicia o loop de atualização automática
  loop();
  setInterval(loop, CONFIG.UPDATE_INTERVAL);

  // 10. Verifica atraso de dado a cada 1 segundo
  setInterval(verificarAtraso, 1000);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌱 PLANTAS — lógica completa da página
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Categorias únicas extraídas da lista de plantas
// (preenchidas depois do primeiro fetch)
let categoriasDisponiveis = [];

// ID da planta atualmente ativa (vem do backend)
let plantaAtiva = null;

/**
 * Calcula a posição e largura da barra de zona ideal,
 * expressas em % dentro do intervalo min–max da planta.
 *
 * Exemplo: temp min=18, ideal=[22,28], max=32
 *   totalRange = 32 - 18 = 14
 *   left  = (22 - 18) / 14 * 100 = 28.6%
 *   width = (28 - 22) / 14 * 100 = 42.9%
 */
function calcBarIdeal(min, idealMin, idealMax, max) {
  const total = max - min;
  if (total <= 0) return { left: 0, width: 100 };
  const left  = ((idealMin - min) / total) * 100;
  const width = ((idealMax - idealMin) / total) * 100;
  return { left: Math.max(0, left), width: Math.min(100 - left, width) };
}

/**
 * Renderiza um único card de planta no grid.
 * Recebe o objeto da planta (vindo da API) e retorna
 * o elemento DOM pronto para inserir na página.
 */
function criarCardPlanta(planta) {
  const ativo = planta.id === plantaAtiva;

  // Calcula as barras de parâmetro
  const barTemp = calcBarIdeal(planta.temp.min, planta.temp.ideal[0], planta.temp.ideal[1], planta.temp.max);
  const barAr   = calcBarIdeal(planta.umidade_ar.min, planta.umidade_ar.ideal[0], planta.umidade_ar.ideal[1], planta.umidade_ar.max);
  const barSolo = calcBarIdeal(planta.solo.min, planta.solo.ideal[0], planta.solo.ideal[1], planta.solo.max);

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
        <div class="param-header">
          <span class="param-label">🌡 Temperatura</span>
          <span class="param-valor">${planta.temp.ideal[0]}–${planta.temp.ideal[1]}°C</span>
        </div>
        <div class="param-bar-wrap">
          <div class="param-bar-ideal param-bar-temp"
               style="left:${barTemp.left.toFixed(1)}%; width:${barTemp.width.toFixed(1)}%;"></div>
        </div>
      </div>

      <div class="param-row">
        <div class="param-header">
          <span class="param-label">💧 Umidade Ar</span>
          <span class="param-valor">${planta.umidade_ar.ideal[0]}–${planta.umidade_ar.ideal[1]}%</span>
        </div>
        <div class="param-bar-wrap">
          <div class="param-bar-ideal param-bar-ar"
               style="left:${barAr.left.toFixed(1)}%; width:${barAr.width.toFixed(1)}%;"></div>
        </div>
      </div>

      <div class="param-row">
        <div class="param-header">
          <span class="param-label">🌱 Solo</span>
          <span class="param-valor">${planta.solo.ideal[0]}–${planta.solo.ideal[1]}%</span>
        </div>
        <div class="param-bar-wrap">
          <div class="param-bar-ideal param-bar-solo"
               style="left:${barSolo.left.toFixed(1)}%; width:${barSolo.width.toFixed(1)}%;"></div>
        </div>
      </div>

    </div>

    <button class="planta-btn" data-id="${planta.id}">
      ${ativo ? '✅ Perfil ativo' : 'Aplicar perfil'}
    </button>
  `;

  // Evento no botão de aplicar (ignora se já está ativo)
  const btn = card.querySelector('.planta-btn');
  btn.addEventListener('click', () => {
    if (planta.id !== plantaAtiva) aplicarPerfilPlanta(planta);
  });

  return card;
}

/**
 * Filtra os cards visíveis por categoria.
 * Em vez de re-renderizar tudo, mostra/oculta com CSS.
 */
function filtrarCategorias(cat) {
  document.querySelectorAll('.categoria-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === cat)
  );

  document.querySelectorAll('.planta-card').forEach(card => {
    const pertence = cat === 'Todos' || card.dataset.categoria === cat;
    card.style.display = pertence ? '' : 'none';
  });
}

/**
 * Busca as plantas na API e renderiza o grid e os filtros de categoria.
 * Chamado toda vez que o usuário navega para a página Plantas.
 */
async function carregarPlantas() {
  const grid = document.getElementById('plantas-grid');
  if (!grid) return;

  grid.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Carregando plantas...</p>';

  const resultado = await fetchAPI(ENDPOINTS.plantas);
  if (!resultado) {
    grid.innerHTML = '<p style="color:var(--text-muted);">Erro ao carregar plantas. Verifique a API.</p>';
    return;
  }

  const plantas = resultado.plantas || [];
  plantaAtiva   = resultado.planta_ativa || null;

  // Atualiza o banner de planta ativa
  atualizarBannerAtiva(plantaAtiva, plantas);

  // Monta os botões de categoria dinamicamente
  const filterEl = document.getElementById('categoria-filter');
  if (filterEl) {
    const cats = ['Todos', ...new Set(plantas.map(p => p.categoria))];
    filterEl.innerHTML = cats
      .map(c => `<button class="categoria-btn${c === 'Todos' ? ' active' : ''}" data-cat="${c}">${c}</button>`)
      .join('');

    filterEl.querySelectorAll('.categoria-btn').forEach(btn => {
      btn.addEventListener('click', () => filtrarCategorias(btn.dataset.cat));
    });
  }

  // Renderiza os cards
  grid.innerHTML = '';
  plantas.forEach(p => grid.appendChild(criarCardPlanta(p)));
}

/**
 * Atualiza o banner que mostra qual planta está ativa no topo da página.
 */
function atualizarBannerAtiva(id, plantas) {
  const banner = document.getElementById('planta-ativa-banner');
  const nomeEl = document.getElementById('planta-ativa-nome');
  const emojiEl = document.getElementById('planta-ativa-emoji');
  if (!banner) return;

  if (!id) {
    banner.classList.add('oculto');
    return;
  }

  const planta = plantas.find(p => p.id === id);
  if (planta) {
    banner.classList.remove('oculto');
    if (nomeEl)  nomeEl.textContent  = planta.nome;
    if (emojiEl) emojiEl.textContent = planta.emoji;
  }
}

/**
 * Envia o perfil selecionado para o backend via POST /config/regras.
 * Atualiza também o SENSOR_RANGES local para que os cards da Home
 * passem a usar a faixa ideal da planta escolhida.
 */
async function aplicarPerfilPlanta(planta) {
  const payload = {
    temp_max:  planta.temp_max,
    solo_min:  planta.solo_min,
    planta_id: planta.id,
  };

  const res = await postAPI(ENDPOINTS.regras, payload);
  if (!res) return; // postAPI já mostra o toast de erro

  // Atualiza estado local
  plantaAtiva = planta.id;

  // Atualiza as faixas de cores dos cards de sensor na Home
  // para refletir os parâmetros ideais da planta escolhida
  SENSOR_RANGES.temperatura.good    = [planta.temp.ideal[0],       planta.temp.ideal[1]];
  SENSOR_RANGES.temperatura.warning = [planta.temp.min,            planta.temp.max];
  SENSOR_RANGES.umidade_ar.good     = [planta.umidade_ar.ideal[0], planta.umidade_ar.ideal[1]];
  SENSOR_RANGES.umidade_ar.warning  = [planta.umidade_ar.min,      planta.umidade_ar.max];
  SENSOR_RANGES.umidade_solo_1.good    = [planta.solo.ideal[0], planta.solo.ideal[1]];
  SENSOR_RANGES.umidade_solo_1.warning = [planta.solo.min,      planta.solo.max];
  SENSOR_RANGES.umidade_solo_2.good    = [planta.solo.ideal[0], planta.solo.ideal[1]];
  SENSOR_RANGES.umidade_solo_2.warning = [planta.solo.min,      planta.solo.max];

  // Re-renderiza o grid com o novo card ativo destacado
  const grid = document.getElementById('plantas-grid');
  if (grid) {
    const res2 = await fetchAPI(ENDPOINTS.plantas);
    if (res2) {
      grid.innerHTML = '';
      (res2.plantas || []).forEach(p => grid.appendChild(criarCardPlanta(p)));
      atualizarBannerAtiva(planta.id, res2.plantas || []);
    }
  }

  showToast(`Perfil "${planta.nome}" aplicado com sucesso`, 'success', 4000);
}

// Carrega o perfil ativo ao iniciar para já ter as faixas certas nos cards da Home
async function carregarRegrasIniciais() {
  const regras = await fetchAPI(ENDPOINTS.regras);
  if (!regras || !regras.planta_id) return;

  // Busca os dados completos da planta para atualizar os ranges locais
  const resultado = await fetchAPI(ENDPOINTS.plantas);
  if (!resultado) return;

  const planta = (resultado.plantas || []).find(p => p.id === regras.planta_id);
  if (!planta) return;

  plantaAtiva = planta.id;

  SENSOR_RANGES.temperatura.good    = [planta.temp.ideal[0],       planta.temp.ideal[1]];
  SENSOR_RANGES.temperatura.warning = [planta.temp.min,            planta.temp.max];
  SENSOR_RANGES.umidade_ar.good     = [planta.umidade_ar.ideal[0], planta.umidade_ar.ideal[1]];
  SENSOR_RANGES.umidade_ar.warning  = [planta.umidade_ar.min,      planta.umidade_ar.max];
  SENSOR_RANGES.umidade_solo_1.good    = [planta.solo.ideal[0], planta.solo.ideal[1]];
  SENSOR_RANGES.umidade_solo_1.warning = [planta.solo.min,      planta.solo.max];
  SENSOR_RANGES.umidade_solo_2.good    = [planta.solo.ideal[0], planta.solo.ideal[1]];
  SENSOR_RANGES.umidade_solo_2.warning = [planta.solo.min,      planta.solo.max];
}