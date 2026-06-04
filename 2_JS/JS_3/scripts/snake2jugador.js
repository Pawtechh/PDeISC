import { checkAndSaveScore, updateSprayUI } from './main.js';

let canvas, ctx;
const W = 600, H = 500, CELL = 20;
let loop = null;
let p1, p2;
let food;
let spray1, spray2;
let started = false;
let p1Name = '', p2Name = '';
let leaderboardMode = '';

const VS_OBSTACLES = [
  { x: 14, y: 12 }, { x: 15, y: 12 }, { x: 16, y: 12 },
  { x: 14, y: 13 }, { x: 15, y: 13 }, { x: 16, y: 13 },
  { x: 14, y: 11 }, { x: 15, y: 11 }, { x: 16, y: 11 },
  { x: 10, y: 8 }, { x: 20, y: 8 },
  { x: 10, y: 18 }, { x: 20, y: 18 },
  { x: 25, y: 15 }, { x: 5, y: 15 },
  { x: 28, y: 5 }, { x: 2, y: 5 },
  { x: 28, y: 22 }, { x: 2, y: 22 },
];

let audioWin = null, audioWave = null, audioBackground = null;
let backgroundMusicPlaying = false;

function initSounds() {
  try {
    audioWin = new Audio('/styles/audio_1.mp3'); audioWin.volume = 0.7;
    audioWave = new Audio('/styles/audio_2.mp3'); audioWave.volume = 0.5;
    audioBackground = new Audio('/styles/audio_3.mp3'); audioBackground.volume = 0.3; audioBackground.loop = true;
  } catch(e) { console.log('Error cargando audios:', e); }
}
function startBackgroundMusic() { if (audioBackground && !backgroundMusicPlaying) { audioBackground.play().catch(e=>console.log); backgroundMusicPlaying = true; } }
function stopBackgroundMusic() { if (audioBackground) { audioBackground.pause(); audioBackground.currentTime = 0; backgroundMusicPlaying = false; } }
function playWinSound() { audioWin?.play().catch(e=>console.log); }
function playWaveSound() { audioWave?.play().catch(e=>console.log); }

const images = {
  mallaRoja: new Image(), mallaAzul: new Image(), ola: new Image()
};
images.mallaRoja.src = '/styles/malla_roja.png';
images.mallaAzul.src = '/styles/malla_azul.png';
images.ola.src = '/styles/ola.png';

let waveOffset = 0, foodAnimation = 0;

class SpraySystem {
  constructor() {
    this.sprays = []; this.count = 0; this.image = images.ola;
  }
  add(x, y) {
    if (this.sprays.length >= 3) this.sprays.shift();
    this.sprays.push({ x, y, time: Date.now() });
    this.count++;
    return this.sprays.length;
  }
  draw(ctx) {
    this.sprays.forEach(s => {
      const alpha = Math.max(0, 1 - (Date.now() - s.time) / 800);
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.drawImage(this.image, s.x - 15, s.y - 15, 30, 30);
      ctx.restore();
    });
  }
  reset() { this.sprays = []; this.count = 0; }
}

function isObstacle(x, y) { return VS_OBSTACLES.some(o => o.x === x && o.y === y); }
function checkBorderCollision(snake) {
  if (!snake?.alive) return false;
  const head = snake.body[0];
  if (head.x < 0 || head.x >= W/CELL || head.y < 0 || head.y >= H/CELL) {
    snake.alive = false;
    return true;
  }
  return false;
}
function spawnFood() {
  const cols = W/CELL, rows = H/CELL;
  let pos, attempts = 0;
  do {
    pos = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    attempts++;
    if (attempts > 200) break;
  } while ((p1?.body?.some(s => s.x === pos.x && s.y === pos.y)) || (p2?.body?.some(s => s.x === pos.x && s.y === pos.y)) || isObstacle(pos.x, pos.y));
  return pos;
}

function moveSnake(snake) {
  if (!snake?.alive) return;
  snake.dir = { ...snake.nextDir };
  const head = { x: snake.body[0].x + snake.dir.x, y: snake.body[0].y + snake.dir.y };
  if (checkBorderCollision(snake)) return;
  if (isObstacle(head.x, head.y)) { snake.alive = false; return; }
  snake.body.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    snake.score += 10;
    food = spawnFood();
    if (snake === p1) document.getElementById('p1-score').textContent = snake.score;
    else if (snake === p2) document.getElementById('p2-score').textContent = snake.score;
    playWaveSound();
  } else {
    snake.body.pop();
  }
}

function checkCollisions() {
  if (p1?.alive) {
    const head = p1.body[0];
    for (let i = 1; i < p1.body.length; i++) if (p1.body[i].x === head.x && p1.body[i].y === head.y) p1.alive = false;
  }
  if (p2?.alive) {
    const head = p2.body[0];
    for (let i = 1; i < p2.body.length; i++) if (p2.body[i].x === head.x && p2.body[i].y === head.y) p2.alive = false;
  }
  if (p1?.alive && p2?.alive) {
    const h1 = p1.body[0], h2 = p2.body[0];
    if (p2.body.some(s => s.x === h1.x && s.y === h1.y)) p1.alive = false;
    if (p1.body.some(s => s.x === h2.x && s.y === h2.y)) p2.alive = false;
  }
  const p1Dead = !p1?.alive, p2Dead = p2 ? !p2.alive : true;
  if (p1Dead || p2Dead) {
    let msg = '', isVictory = false;
    if (p1Dead && p2Dead) msg = 'EMPATE';
    else if (p1Dead) { msg = `${p2Name} (MALLA AZUL) GANA!`; isVictory = true; }
    else if (p2Dead) { msg = `${p1Name} (MALLA ROJA) GANA!`; isVictory = true; }
    gameOver(msg, isVictory);
  }
}

function gameOver(msg, isVictory) {
  if (loop) clearInterval(loop); loop = null;
  stopBackgroundMusic();
  if (isVictory) playWinSound();
  if (p1 && p1.score > 0) checkAndSaveScore(leaderboardMode, p1.score, p1Name);
  if (p2 && p2.score > 0) checkAndSaveScore(leaderboardMode, p2.score, p2Name);
  const ov = document.getElementById('game-overlay');
  document.getElementById('overlay-title').textContent = msg;
  document.getElementById('overlay-sub').textContent = 'PRESIONÁ UNA FLECHA PARA REINICIAR';
  ov.style.display = 'flex';
  spray1?.reset(); spray2?.reset();
  updateSprayUI(1, 0); updateSprayUI(2, 0);
  started = false;
  const restartHandler = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      document.removeEventListener('keydown', restartHandler);
      resetGame();
    }
  };
  document.addEventListener('keydown', restartHandler);
}

function resetGame() {
  const cols = W / CELL;
  if (loop) clearInterval(loop);
  // P1 (rojo, flechas) ahora aparece a la derecha
  p1 = {
    body: [{ x: cols - 6, y: 10 }, { x: cols - 5, y: 10 }, { x: cols - 4, y: 10 }],
    dir: { x: -1, y: 0 }, nextDir: { x: -1, y: 0 },
    score: 0, alive: true,
    image: images.mallaRoja
  };
  // P2 (azul, WASD) ahora aparece a la izquierda
  p2 = {
    body: [{ x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }],
    dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    score: 0, alive: true,
    image: images.mallaAzul
  };
  food = spawnFood();
  started = false;
  spray1?.reset(); spray2?.reset();
  updateSprayUI(1, 0); updateSprayUI(2, 0);
  document.getElementById('p1-score').textContent = 0;
  document.getElementById('p2-score').textContent = 0;
  document.getElementById('p2-hud').style.display = 'flex';
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('overlay-title').textContent = '🏄‍♂️ ¡ATRAPA AL SNAKER! 🏄‍♀️';
  document.getElementById('overlay-sub').textContent = 'MALLA ROJA (▼▲◄►) VS MALLA AZUL (WASD)';
  render();
}

function tick() {
  if (p1) moveSnake(p1);
  if (p2) moveSnake(p2);
  checkCollisions();
  waveOffset = (waveOffset + 0.05) % (Math.PI * 2);
  foodAnimation = (foodAnimation + 0.03) % (Math.PI * 2);
  render();
}

function drawWaveBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a2a5a'); grad.addColorStop(0.5, '#0a3a7a'); grad.addColorStop(1, '#0a2a5a');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) {
    const waveY = 50 + i * 100 + Math.sin(waveOffset * 2 + i) * 15;
    ctx.beginPath(); ctx.moveTo(0, waveY);
    for (let x = 0; x <= W; x += 20) {
      const y = waveY + Math.sin(x * 0.03 + waveOffset * 3) * 8;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(100, 200, 255, ${0.08 - i * 0.01})`;
    ctx.lineWidth = 2; ctx.stroke();
  }
}

function render() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  drawWaveBackground(ctx);
  ctx.fillStyle = '#c2a15b';
  ctx.fillRect(0, 0, W, 8);
  ctx.fillRect(0, H - 8, W, 8);
  ctx.fillRect(0, 0, 8, H);
  ctx.fillRect(W - 8, 0, 8, H);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  VS_OBSTACLES.forEach(obs => {
    const x = obs.x * CELL, y = obs.y * CELL;
    ctx.fillStyle = '#8B7355'; ctx.shadowBlur = 5;
    ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.fillStyle = '#6B5335'; ctx.fillRect(x + 5, y + 5, CELL - 10, CELL - 8);
    ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(x + CELL / 2, y + CELL / 3, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });
  spray1?.draw(ctx);
  spray2?.draw(ctx);
  if (food) {
    const fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2, scale = 0.8 + Math.sin(foodAnimation * 4) * 0.1;
    ctx.save(); ctx.translate(fx, fy); ctx.scale(scale, scale);
    ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
    ctx.drawImage(images.ola, -15, -15, 30, 30);
    ctx.restore();
  }
  const drawSnake = (snake, image, isP1) => {
    if (!snake?.body) return;
    snake.body.forEach((seg, i) => {
      const x = seg.x * CELL, y = seg.y * CELL;
      if (i === 0) {
        ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = isP1 ? '#ff4444' : '#4444ff';
        ctx.drawImage(image, x + 2, y + 2, CELL - 4, CELL - 4);
        ctx.restore();
      } else {
        const ws = 0.9 + Math.sin(waveOffset * 3 + i) * 0.05;
        ctx.save(); ctx.translate(x + CELL / 2, y + CELL / 2); ctx.scale(ws, ws);
        ctx.globalAlpha = Math.max(0.4, 1 - i * 0.03);
        ctx.drawImage(images.ola, -12, -12, 24, 24);
        ctx.restore();
      }
    });
  };
  if (p1) drawSnake(p1, images.mallaRoja, true);
  if (p2) drawSnake(p2, images.mallaAzul, false);
  for (let i = 0; i < 5; i++) {
    const fx = (Date.now() / 50 + i * 100) % W;
    const fy = H - 15 + Math.sin(Date.now() / 200 + i) * 3;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() / 300 + i) * 0.1})`;
    ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function keyHandler(e) {
  const prevent = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Shift'];
  if (prevent.includes(e.key)) e.preventDefault();
  // Controles P1 (flechas) – ahora la serpiente roja está a la derecha
  const dirMapP1 = {
    ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }
  };
  if (dirMapP1[e.key] && p1?.alive) {
    const nd = dirMapP1[e.key];
    if (!(nd.x === -p1.dir.x && nd.y === -p1.dir.y)) p1.nextDir = nd;
  }
  // Controles P2 (WASD) – ahora la serpiente azul está a la izquierda
  const dirMapP2 = {
    w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
    a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
    W: { x: 0, y: -1 }, S: { x: 0, y: 1 },
    A: { x: -1, y: 0 }, D: { x: 1, y: 0 }
  };
  if (dirMapP2[e.key] && p2?.alive) {
    const nd = dirMapP2[e.key];
    if (!(nd.x === -p2.dir.x && nd.y === -p2.dir.y)) p2.nextDir = nd;
  }
  if (e.code === 'Space' && p1?.alive && spray1) {
    const head = p1.body[0];
    const cnt = spray1.add(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2);
    updateSprayUI(1, cnt);
  }
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && p2?.alive && spray2) {
    const head = p2.body[0];
    const cnt = spray2.add(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2);
    updateSprayUI(2, cnt);
  }
  if (!started && p1?.alive && (dirMapP1[e.key] || dirMapP2[e.key])) {
    started = true;
    const ov = document.getElementById('game-overlay');
    if (ov) ov.style.display = 'none';
    if (loop) clearInterval(loop);
    loop = setInterval(tick, 120);
    startBackgroundMusic();
  }
}

export function initSnake(mode, name1, name2, lbMode) {
  p1Name = name1 || 'MALLA ROJA';
  p2Name = name2 || 'MALLA AZUL';
  leaderboardMode = lbMode;
  initSounds();
  canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  spray1 = new SpraySystem();
  spray2 = new SpraySystem();
  resetGame();
  document.addEventListener('keydown', keyHandler);
  document.getElementById('p1-tag').textContent = p1Name;
  document.getElementById('p2-tag').textContent = p2Name;
}
export function cleanSnake() {
  if (loop) clearInterval(loop);
  document.removeEventListener('keydown', keyHandler);
  stopBackgroundMusic();
}