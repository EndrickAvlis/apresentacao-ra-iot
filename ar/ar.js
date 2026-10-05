/* ============================================================
   TURBINA IoT EM RA - sensores simulados em tempo real
   ============================================================ */

const mv = document.getElementById('turbina');
const btnFalha = document.getElementById('btnFalha');
const statusTexto = document.getElementById('statusTexto');

const campos = {
  temp: document.getElementById('vTemp'),
  rpm: document.getElementById('vRpm'),
  vib: document.getElementById('vVib'),
  energia: document.getElementById('vEnergia')
};

let emFalha = false;

// Faixas de valores dos "sensores"
const NORMAL = { temp: [68, 76], rpm: [1480, 1560], vib: [0.05, 0.12], energia: [2.3, 2.6] };
const FALHA  = { temp: [112, 124], rpm: [2650, 2900], vib: [2.1, 2.9], energia: [0.4, 0.9] };

function aleatorio([min, max]) {
  return min + Math.random() * (max - min);
}

function atualizarSensores() {
  const f = emFalha ? FALHA : NORMAL;
  campos.temp.textContent = `${aleatorio(f.temp).toFixed(1)} °C`;
  campos.rpm.textContent = `${Math.round(aleatorio(f.rpm)).toLocaleString('pt-BR')} RPM`;
  campos.vib.textContent = `${aleatorio(f.vib).toFixed(2)} mm/s`;
  campos.energia.textContent = `${aleatorio(f.energia).toFixed(2)} MW`;
}

setInterval(atualizarSensores, 900);
atualizarSensores();

// Cor das luzes de status no próprio modelo 3D
function pintarModelo(cor) {
  if (!mv.model) return;
  const mat = mv.model.materials.find(m => m.name === 'Status');
  if (!mat) return;
  mat.pbrMetallicRoughness.setBaseColorFactor([...cor, 1]);
  mat.setEmissiveFactor(cor);
}

function alternarFalha() {
  emFalha = !emFalha;
  document.body.classList.toggle('falha', emFalha);

  statusTexto.textContent = emFalha ? 'ALERTA: SUPERAQUECIMENTO' : 'OPERAÇÃO NORMAL';
  btnFalha.textContent = emFalha ? 'NORMALIZAR' : 'SIMULAR FALHA';

  pintarModelo(emFalha ? [1, 0.2, 0.27] : [0, 0.94, 1]);
  mv.timeScale = emFalha ? 3 : 1;

  if (emFalha && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  atualizarSensores();
}

btnFalha.addEventListener('click', alternarFalha);

// Barra de carregamento
mv.addEventListener('progress', (e) => {
  const p = e.detail.totalProgress;
  document.getElementById('carregandoBarra').style.width = `${p * 100}%`;
  if (p >= 1) document.getElementById('carregando').classList.add('oculto');
});

mv.addEventListener('load', () => {
  pintarModelo(emFalha ? [1, 0.2, 0.27] : [0, 0.94, 1]);
  // Mostra a dica certa conforme o suporte a RA do aparelho
  setTimeout(() => {
    if (!mv.canActivateAR) document.body.classList.add('sem-ra');
  }, 600);
});

// Ao entrar na RA, para de girar sozinho para facilitar o posicionamento
mv.addEventListener('ar-status', (e) => {
  mv.autoRotate = e.detail.status !== 'session-started';
});
