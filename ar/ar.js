/* ============================================================
   TURBINA IoT EM REALIDADE AUMENTADA - CONTROLES INTEGRADOS AR
   ============================================================ */

const mv = document.getElementById('turbina');
const climaBadge = document.getElementById('climaBadge');
const statusTitulo = document.getElementById('statusTitulo');
const statusDesc = document.getElementById('statusDesc');
const statusIcone = document.getElementById('statusIcone');
const botoesCenarios = document.querySelectorAll('.btn-cenario');
const btnToggleHud = document.getElementById('btnToggleHud');
const txtToggleHud = document.getElementById('txtToggleHud');
const arControlesBar = document.getElementById('arControlesBar');

const campos = {
  vento: document.getElementById('vVento'),
  temp: document.getElementById('vTemp'),
  rpm: document.getElementById('vRpm'),
  vib: document.getElementById('vVib'),
  energia: document.getElementById('vEnergia')
};

// ------------------------------------------------------------
// Configuração dos Cenários Operacionais e Climáticos
// ------------------------------------------------------------
const CENARIOS = {
  padrao: {
    clima: 'ESTÁVEL',
    titulo: 'OPERAÇÃO NORMAL',
    desc: 'Brisa moderada contínua. Parâmetros dentro dos limites ideais.',
    corHex: '#00f0ff',
    corGL: [0.0, 0.94, 1.0],
    speed: 1.0,
    vento: [32, 38],
    temp: [68, 74],
    rpm: [1480, 1560],
    vib: [0.06, 0.12],
    energia: [2.35, 2.55],
    chuva: false,
    vibrar: false
  },
  tempestade: {
    clima: 'TEMPESTADE',
    titulo: 'VENTO SEVERO',
    desc: 'Rajadas fortes de vento e chuva detectadas. Rotação em regime alto.',
    corHex: '#ffe81f',
    corGL: [1.0, 0.9, 0.15],
    speed: 1.85,
    vento: [78, 92],
    temp: [79, 86],
    rpm: [2150, 2350],
    vib: [0.85, 1.30],
    energia: [3.10, 3.45],
    chuva: true,
    vibrar: [100]
  },
  superaquecimento: {
    clima: 'CRÍTICO',
    titulo: 'SUPERAQUECIMENTO',
    desc: 'Temperatura e vibração anormais no eixo. Risco de dano mecânico.',
    corHex: '#ff3344',
    corGL: [1.0, 0.15, 0.22],
    speed: 2.8,
    vento: [40, 48],
    temp: [116, 128],
    rpm: [2750, 2980],
    vib: [2.30, 3.10],
    energia: [0.45, 0.80],
    chuva: false,
    vibrar: [180, 80, 180]
  },
  calmaria: {
    clima: 'SEM VENTO',
    titulo: 'STANDBY',
    desc: 'Velocidade do ar abaixo do corte. Rotor em espera de vento.',
    corHex: '#38bdf8',
    corGL: [0.22, 0.70, 0.98],
    speed: 0.12,
    vento: [2, 6],
    temp: [35, 42],
    rpm: [75, 140],
    vib: [0.01, 0.03],
    energia: [0.02, 0.06],
    chuva: false,
    vibrar: false
  },
  freio: {
    clima: 'BLOQUEIO',
    titulo: 'FREIO ATIVADO',
    desc: 'Freio hidráulico acionado preventivamente pelo sistema IoT.',
    corHex: '#c084fc',
    corGL: [0.85, 0.45, 1.0],
    speed: 0.0,
    vento: [98, 116],
    temp: [60, 66],
    rpm: [0, 0],
    vib: [0.02, 0.04],
    energia: [0.00, 0.00],
    chuva: false,
    vibrar: [250]
  }
};

let cenarioAtualChave = 'padrao';

function aleatorio([min, max]) {
  return min + Math.random() * (max - min);
}

function atualizarSensores() {
  const c = CENARIOS[cenarioAtualChave];
  if (!c) return;

  if (c.rpm[0] === 0 && c.rpm[1] === 0) {
    if (campos.rpm) campos.rpm.textContent = '0 RPM [TRAVADO]';
    if (campos.energia) campos.energia.textContent = '0.00 MW';
  } else {
    if (campos.rpm) campos.rpm.textContent = `${Math.round(aleatorio(c.rpm)).toLocaleString('pt-BR')} RPM`;
    if (campos.energia) campos.energia.textContent = `${aleatorio(c.energia).toFixed(2)} MW`;
  }

  if (campos.vento) campos.vento.textContent = `${Math.round(aleatorio(c.vento))} km/h`;
  if (campos.temp) campos.temp.textContent = `${aleatorio(c.temp).toFixed(1)} °C`;
  if (campos.vib) campos.vib.textContent = `${aleatorio(c.vib).toFixed(2)} mm/s`;
}

setInterval(atualizarSensores, 850);
atualizarSensores();

// ------------------------------------------------------------
// Ajuste de Cor dos LEDs e Rotação do Modelo 3D
// ------------------------------------------------------------
function pintarModelo(cor) {
  if (!mv || !mv.model) return;
  const mat = mv.model.materials.find(m => m.name === 'Status');
  if (!mat) return;
  mat.pbrMetallicRoughness.setBaseColorFactor([...cor, 1]);
  mat.setEmissiveFactor(cor);
}

function aplicarCenario(chave) {
  const c = CENARIOS[chave];
  if (!c) return;

  cenarioAtualChave = chave;
  document.documentElement.style.setProperty('--cor-status', c.corHex);

  if (climaBadge) climaBadge.textContent = c.clima;
  if (statusTitulo) statusTitulo.textContent = c.titulo;
  if (statusDesc) statusDesc.textContent = c.desc;

  botoesCenarios.forEach(btn => {
    btn.classList.toggle('ativo', btn.getAttribute('data-cenario') === chave);
  });

  pintarModelo(c.corGL);
  if (mv) mv.timeScale = c.speed;

  alternarChuva(c.chuva);

  if (c.vibrar && navigator.vibrate) {
    navigator.vibrate(c.vibrar);
  }

  atualizarSensores();
}

// Ouvintes dos botões de cenários (funcionam na web e dentro da câmera em AR)
botoesCenarios.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const chave = btn.getAttribute('data-cenario');
    aplicarCenario(chave);
  });
});

// Evita que toques nos botões de controle afetem a ancoragem da turbina em WebXR AR
if (arControlesBar) {
  ['touchstart', 'touchend', 'click', 'pointerdown'].forEach(evt => {
    arControlesBar.addEventListener(evt, (e) => {
      e.stopPropagation();
    }, { passive: false });
  });
}

// ------------------------------------------------------------
// Controle do HUD (Ocultar / Exibir Sensores Flutuantes)
// ------------------------------------------------------------
let hudVisivel = true;
if (btnToggleHud) {
  btnToggleHud.addEventListener('click', (e) => {
    e.stopPropagation();
    hudVisivel = !hudVisivel;
    if (mv) mv.classList.toggle('hud-oculto', !hudVisivel);
    if (txtToggleHud) {
      txtToggleHud.textContent = hudVisivel ? 'LIGADO' : 'DESLIGADO';
    }
  });
}

// ------------------------------------------------------------
// Sistema de Chuva Dinâmica em Canvas
// ------------------------------------------------------------
const rainCanvas = document.getElementById('rainCanvas');
const rCtx = rainCanvas ? rainCanvas.getContext('2d') : null;
let gotas = [];
let chuvaAtiva = false;
let animacaoId = null;

function redimensionarCanvasChuva() {
  if (!rainCanvas || !rainCanvas.parentElement) return;
  const retangulo = rainCanvas.parentElement.getBoundingClientRect();
  rainCanvas.width = retangulo.width;
  rainCanvas.height = retangulo.height;
  criarGotas();
}

function criarGotas() {
  if (!rainCanvas) return;
  gotas = [];
  const qtd = Math.min(85, Math.floor(rainCanvas.width / 5));
  for (let i = 0; i < qtd; i++) {
    gotas.push({
      x: Math.random() * rainCanvas.width,
      y: Math.random() * rainCanvas.height,
      l: Math.random() * 18 + 10,
      v: Math.random() * 8 + 14,
      o: Math.random() * 0.4 + 0.2
    });
  }
}

function animarChuva() {
  if (!chuvaAtiva || !rCtx) return;
  rCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);

  rCtx.strokeStyle = 'rgba(180, 230, 255, 0.45)';
  rCtx.lineWidth = 1.3;
  rCtx.lineCap = 'round';

  const ventoInclinacao = 5;

  for (let i = 0; i < gotas.length; i++) {
    const g = gotas[i];
    rCtx.beginPath();
    rCtx.moveTo(g.x, g.y);
    rCtx.lineTo(g.x + ventoInclinacao, g.y + g.l);
    rCtx.stroke();

    g.y += g.v;
    g.x += ventoInclinacao;

    if (g.y > rainCanvas.height) {
      g.y = -20;
      g.x = Math.random() * (rainCanvas.width + 100) - 50;
    }
  }

  animacaoId = requestAnimationFrame(animarChuva);
}

function alternarChuva(ligar) {
  if (!rainCanvas) return;
  chuvaAtiva = ligar;
  rainCanvas.classList.toggle('ativo', ligar);

  if (ligar) {
    if (!animacaoId) {
      animarChuva();
    }
  } else {
    if (animacaoId) {
      cancelAnimationFrame(animacaoId);
      animacaoId = null;
    }
    if (rCtx) rCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  }
}

window.addEventListener('resize', redimensionarCanvasChuva);
setTimeout(redimensionarCanvasChuva, 300);

// ------------------------------------------------------------
// Eventos do Model Viewer
// ------------------------------------------------------------
if (mv) {
  mv.addEventListener('progress', (e) => {
    const p = e.detail.totalProgress;
    const barra = document.getElementById('carregandoBarra');
    if (barra) barra.style.width = `${p * 100}%`;
    if (p >= 1) {
      const c = document.getElementById('carregando');
      if (c) c.classList.add('oculto');
    }
  });

  mv.addEventListener('load', () => {
    aplicarCenario(cenarioAtualChave);
    setTimeout(() => {
      if (!mv.canActivateAR) {
        document.body.classList.add('sem-ra');
      }
    }, 600);
  });

  // Para de girar automaticamente ao entrar em sessão de RA
  mv.addEventListener('ar-status', (e) => {
    mv.autoRotate = e.detail.status !== 'session-started';
    if (rainCanvas) {
      if (e.detail.status === 'session-started') {
        rainCanvas.style.display = 'none';
      } else {
        rainCanvas.style.display = 'block';
      }
    }
  });
}
