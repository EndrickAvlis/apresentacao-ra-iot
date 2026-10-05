/* ============================================================
   APRESENTAÇÃO REAL DE SLIDES - CONTROLE & EFEITOS
   Tema: Realidade Aumentada com IoT (Star Wars Edition)
   ============================================================ */

// ============================================================
// LINK DA TURBINA EM RA (QR CODE DO SLIDE "HORA DA PRÁTICA")
// Depois de publicar no GitHub Pages, cole o link aqui. Exemplo:
// const LINK_RA = 'https://SEU-USUARIO.github.io/apresentacao-ra-iot/ar/';
// Se a apresentação for aberta pelo próprio GitHub Pages, o link é detectado sozinho.
// ============================================================
const LINK_RA = 'https://endrickavlis.github.io/apresentacao-ra-iot/ar/';

function obterLinkRA() {
  if (LINK_RA) return LINK_RA;
  if (location.protocol === 'https:') {
    return location.origin + location.pathname.replace(/[^/]*$/, '') + 'ar/';
  }
  return '';
}

function montarQrCode() {
  const caixa = document.getElementById('qrCode');
  const texto = document.getElementById('qrLink');
  if (!caixa) return;

  const link = obterLinkRA();
  if (!link || typeof qrcode === 'undefined') {
    caixa.innerHTML = '<p class="qr-aviso">Configure o LINK_RA no arquivo script.js</p>';
    return;
  }

  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();
  caixa.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  texto.textContent = link.replace(/^https?:\/\//, '');
}

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlidesCount = slides.length;
let audioEnabled = true;

// ============================================================
// SISTEMA DE ÁUDIO NATIVO (WEB AUDIO API - ZERO ARQUIVOS EXTERNOS)
// ============================================================
class GalacticSoundEngine {
  constructor() {
    this.ctx = null;
    this.initContext();
  }

  initContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    } catch (e) {
      console.warn("AudioContext não suportado.");
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSaberSwipe() {
    if (!audioEnabled || !this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.28);

    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playCommlinkBeep() {
    if (!audioEnabled || !this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1760, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playAlarmWarning() {
    if (!audioEnabled || !this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550, this.ctx.currentTime);
    osc.frequency.setValueAtTime(440, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }

  playHyperspace() {
    if (!audioEnabled || !this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.46);
  }
}

const sounds = new GalacticSoundEngine();

// ============================================================
// CANVAS DE ESTRELAS COM EFEITO DE HIPERESPAÇO
// ============================================================
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let stars = [];
const numStars = 220;
let warpSpeed = 1;
let isHyperspace = false;

function initStarfield() {
  resizeCanvas();
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: (Math.random() - 0.5) * canvas.width * 2,
      y: (Math.random() - 0.5) * canvas.height * 2,
      z: Math.random() * canvas.width,
      size: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.8 ? '#00f0ff' : '#ffffff'
    });
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

function triggerWarpEffect() {
  warpSpeed = 13;
  isHyperspace = true;
  sounds.playHyperspace();

  setTimeout(() => {
    warpSpeed = 1;
    isHyperspace = false;
  }, 400);
}

function renderStarfield() {
  ctx.fillStyle = isHyperspace ? 'rgba(3, 7, 18, 0.4)' : 'rgba(3, 7, 18, 0.88)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];

    star.z -= warpSpeed * 1.5;

    if (star.z <= 0) {
      star.z = canvas.width;
      star.x = (Math.random() - 0.5) * canvas.width * 2;
      star.y = (Math.random() - 0.5) * canvas.height * 2;
    }

    const k = 280 / star.z;
    const px = star.x * k + cx;
    const py = star.y * k + cy;

    if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
      const size = (1 - star.z / canvas.width) * (isHyperspace ? 3.5 : 1.8);
      ctx.beginPath();
      ctx.fillStyle = star.color;

      if (isHyperspace) {
        const tailX = star.x * (280 / (star.z + warpSpeed * 8)) + cx;
        const tailY = star.y * (280 / (star.z + warpSpeed * 8)) + cy;
        ctx.strokeStyle = star.color;
        ctx.lineWidth = size * 0.8;
        ctx.moveTo(px, py);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      } else {
        ctx.arc(px, py, Math.max(0.6, size), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  requestAnimationFrame(renderStarfield);
}

// ============================================================
// NAVEGAÇÃO DOS SLIDES
// ============================================================
function updateSlideView(index, playEffects = true) {
  if (index < 0) index = 0;
  if (index >= totalSlidesCount) index = totalSlidesCount - 1;

  currentSlide = index;

  // Atualizar classes ativas dos slides
  slides.forEach((s, idx) => {
    if (idx === currentSlide) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  // Atualizar contador discreto (ex: 1 / 10)
  document.getElementById('currentSlideNum').textContent = currentSlide + 1;
  document.getElementById('totalSlidesNum').textContent = totalSlidesCount;

  // Atualizar barra de progresso
  const progressPercent = ((currentSlide + 1) / totalSlidesCount) * 100;
  document.getElementById('progressBar').style.width = `${progressPercent}%`;

  // Efeitos visuais e sonoros de transição
  if (playEffects) {
    sounds.playSaberSwipe();
    triggerWarpEffect();
  }
}

function nextSlide() {
  if (currentSlide < totalSlidesCount - 1) {
    updateSlideView(currentSlide + 1);
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    updateSlideView(currentSlide - 1);
  }
}

function goToSlide(index) {
  updateSlideView(index);
}

// Botões Flutuantes Próximo e Anterior
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');

if (btnPrev) btnPrev.addEventListener('click', prevSlide);
if (btnNext) btnNext.addEventListener('click', nextSlide);

// ============================================================
// SIMULADOR INTERATIVO DA TURBINA NO SLIDE 3
// ============================================================
function setSlideScenario(cenario) {
  const panel = document.querySelector('.interactive-demo-panel');
  if (!panel) return;

  const vTemp = document.getElementById('valTemp');
  const vRpm = document.getElementById('valRpm');
  const vVib = document.getElementById('valVib');
  const vVento = document.getElementById('valVento');

  panel.classList.remove('has-anomaly', 'has-wind');

  if (cenario === 'vento') {
    panel.classList.add('has-wind');
    if (vTemp) vTemp.textContent = '82°C [ALTO]';
    if (vRpm) vRpm.textContent = '4.250 RPM [VENTO FORTE]';
    if (vVib) vVib.textContent = '1.10 mm/s [MODERADA]';
    if (vVento) vVento.textContent = '85 km/h [TEMPESTADE]';
    sounds.playCommlinkBeep();
  } else if (cenario === 'falha') {
    panel.classList.add('has-anomaly');
    if (vTemp) vTemp.textContent = '118°C [ALERTA CRÍTICO]';
    if (vRpm) vRpm.textContent = '5.180 RPM [SOBRECARGA]';
    if (vVib) vVib.textContent = '2.45 mm/s [ANORMAL]';
    if (vVento) vVento.textContent = '44 km/h [MODERADO]';
    sounds.playAlarmWarning();
  } else {
    // Normal / Padrão
    if (vTemp) vTemp.textContent = '74°C [NORMAL]';
    if (vRpm) vRpm.textContent = '3.420 RPM';
    if (vVib) vVib.textContent = '0.08 mm/s [OK]';
    if (vVento) vVento.textContent = '35 km/h [ESTÁVEL]';
    sounds.playCommlinkBeep();
  }
}

function simulateAnomaly() { setSlideScenario('falha'); }
function resetAnomaly() { setSlideScenario('normal'); }

// ============================================================
// ATALHOS DE TECLADO (APRESENTAÇÃO)
// ============================================================
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.code) {
    case 'ArrowRight':
    case 'Space':
    case 'PageDown':
    case 'Enter':
      e.preventDefault();
      nextSlide();
      break;

    case 'ArrowLeft':
    case 'Backspace':
    case 'PageUp':
      e.preventDefault();
      prevSlide();
      break;

    case 'KeyF':
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Erro ao entrar em tela cheia: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
      break;

    case 'KeyM':
      e.preventDefault();
      audioEnabled = !audioEnabled;
      sounds.playCommlinkBeep();
      break;

    case 'KeyH':
      e.preventDefault();
      triggerWarpEffect();
      break;

    case 'Digit0': goToSlide(0); break;
    case 'Digit1': goToSlide(1); break;
    case 'Digit2': goToSlide(2); break;
    case 'Digit3': goToSlide(3); break;
    case 'Digit4': goToSlide(4); break;
    case 'Digit5': goToSlide(5); break;
    case 'Digit6': goToSlide(6); break;
    case 'Digit7': goToSlide(7); break;
    case 'Digit8': goToSlide(8); break;
    case 'Digit9': goToSlide(9); break;
  }
});

// Suporte para Touch / Swipe em Celulares & Tablets
let touchStartX = 0;
let touchEndX = 0;

window.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  const swipeDiff = touchEndX - touchStartX;
  if (Math.abs(swipeDiff) > 60) {
    if (swipeDiff < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }
}, { passive: true });

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  renderStarfield();
  montarQrCode();
  const slideInicial = parseInt(location.hash.replace('#', ''), 10);
  updateSlideView(isNaN(slideInicial) ? 0 : slideInicial, false);
});
