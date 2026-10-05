/* ============================================================
   TURBINA IoT EM REALIDADE AUMENTADA - MÚLTIPLOS CENÁRIOS
   ============================================================ */

const mv = document.getElementById('turbina');
const climaBadge = document.getElementById('climaBadge');
const statusBanner = document.getElementById('statusBanner');
const statusTitulo = document.getElementById('statusTitulo');
const statusDesc = document.getElementById('statusDesc');
const statusIcone = document.getElementById('statusIcone');
const pulsoGlobal = document.getElementById('pulsoGlobal');
const botoesCenarios = document.querySelectorAll('.btn-cenario');

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
    clima: 'CLIMA: ESTÁVEL',
    titulo: 'OPERAÇÃO NORMAL // EFICIÊNCIA MÁXIMA',
    desc: 'Brisa moderada contínua. Sistema IoT operando com parâmetros ótimos.',
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
    clima: 'CLIMA: TEMPESTADE',
    titulo: 'VENTO SEVERO // ALTA ROTAÇÃO',
    desc: 'Anemômetro acusa rajadas fortes de vento e chuva. Sistema ajusta ângulo de pitch das pás.',
    corHex: '#ffe81f',
    corGL: [1.0, 0.9, 0.15],
    speed: 1.85,
    vento: [78, 92],
    temp: [79, 86],
    rpm: [2150, 2350],
    vib: [0.85, 1.30],
    energia: [3.10, 3.45],
    chuva: true,
    vibrar: [120]
  },
  superaquecimento: {
    clima: 'CLIMA: CRÍTICO',
    titulo: 'ALERTA TÉRMICO // SUPERAQUECIMENTO NO EIXO',
    desc: 'Sensores IoT acusam temperatura e vibração anormais. Risco iminente de dano mecânico.',
    corHex: '#ff3344',
    corGL: [1.0, 0.15, 0.22],
    speed: 2.9,
    vento: [40, 48],
    temp: [116, 128],
    rpm: [2750, 2980],
    vib: [2.30, 3.10],
    energia: [0.45, 0.80],
    chuva: false,
    vibrar: [200, 100, 200]
  },
  calmaria: {
    clima: 'CLIMA: SEM VENTO',
    titulo: 'STANDBY // BAIXA VELOCIDADE DO VENTO',
    desc: 'Velocidade do ar abaixo do corte inicial. Rotor desacelerado em estado de espera.',
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
    clima: 'CLIMA: BLOQUEIO',
    titulo: 'PROTEÇÃO IoT // FREIO HIDRÁULICO ATIVADO',
    desc: 'Vento extremo detectado. IoT travou o rotor imediatamente para evitar quebra da estrutura.',
    corHex: '#c084fc',
    corGL: [0.85, 0.45, 1.0],
    speed: 0.0,
    vento: [98, 116],
    temp: [60, 66],
    rpm: [0, 0],
    vib: [0.02, 0.04],
    energia: [0.00, 0.00],
    chuva: false,
    vibrar: [300]
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
    campos.rpm.textContent = '0 RPM [TRAVADO]';
    campos.energia.textContent = '0.00 MW [DESCONECTADO]';
  } else {
    campos.rpm.textContent = `${Math.round(aleatorio(c.rpm)).toLocaleString('pt-BR')} RPM`;
    campos.energia.textContent = `${aleatorio(c.energia).toFixed(2)} MW`;
  }

  campos.vento.textContent = `${Math.round(aleatorio(c.vento))} km/h`;
  campos.temp.textContent = `${aleatorio(c.temp).toFixed(1)} °C`;
  campos.vib.textContent = `${aleatorio(c.vib).toFixed(2)} mm/s`;
}

setInterval(atualizarSensores, 850);
atualizarSensores();

// ------------------------------------------------------------
// Ajuste das Luzes e Rotação do Modelo 3D
// ------------------------------------------------------------
function pintarModelo(cor) {
  if (!mv.model) return;
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

  // Atualiza textos
  climaBadge.textContent = c.clima;
  statusTitulo.textContent = c.titulo;
  statusDesc.textContent = c.desc;

  // Atualiza botões
  botoesCenarios.forEach(btn => {
    btn.classList.toggle('ativo', btn.getAttribute('data-cenario') === chave);
  });

  // Atualiza modelo 3D
  pintarModelo(c.corGL);
  mv.timeScale = c.speed;

  // Atualiza chuva
  alternarChuva(c.chuva);

  // Vibração no celular
  if (c.vibrar && navigator.vibrate) {
    navigator.vibrate(c.vibrar);
  }

  atualizarSensores();
}

// Ouvintes dos botões de cenários
botoesCenarios.forEach(btn => {
  btn.addEventListener('click', () => {
    const chave = btn.getAttribute('data-cenario');
    aplicarCenario(chave);
  });
});

// ------------------------------------------------------------
// Sistema de Chuva Dinâmica em Canvas (Leve e Eficiente)
// ------------------------------------------------------------
const rainCanvas = document.getElementById('rainCanvas');
const rCtx = rainCanvas.getContext('2d');
let gotas = [];
let chuvaAtiva = false;
let animacaoId = null;

function redimensionarCanvasChuva() {
  const retangulo = rainCanvas.parentElement.getBoundingClientRect();
  rainCanvas.width = retangulo.width;
  rainCanvas.height = retangulo.height;
  criarGotas();
}

function criarGotas() {
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
  if (!chuvaAtiva) return;
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
    rCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  }
}

window.addEventListener('resize', redimensionarCanvasChuva);
setTimeout(redimensionarCanvasChuva, 300);

// ------------------------------------------------------------
// Eventos do Model Viewer
// ------------------------------------------------------------
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
  // Reduz chuva dentro da câmera para priorizar visão do mundo real
  if (e.detail.status === 'session-started') {
    rainCanvas.style.display = 'none';
  } else {
    rainCanvas.style.display = 'block';
  }
});
