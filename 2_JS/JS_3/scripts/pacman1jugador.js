import { checkAndSaveScore, updateSprayUI } from './main.js';
import { SpraySystem } from './spraySystem.js';

let canvas, ctx;
const W = 560, CELL = 20;
let loop = null;
let pac1;
let ghosts, walls, pellets;
let score, lives;
let started = false;
let spray1;
let player1Name = '';
let currentLevel = 1;
let leaderboardMode = '';

// Bandera para evitar múltiples muertes simultáneas
let isRespawning = false;

const MAP_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,3,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,3,1],
  [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,2,1,1,2,2,2,2,2,2,1,1,2,1,1,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,1,1,4,4,1,1,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,2,1,4,4,2,1,4,4,4,4,1,2,4,4,1,2,1,0,1,1,1,1],
  [2,2,2,2,0,2,2,1,4,4,2,1,4,4,4,4,1,2,4,4,1,2,2,0,2,2,2,2],
  [1,1,1,1,0,1,2,1,1,1,2,1,1,1,1,1,1,2,1,1,1,2,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,0,2,2,0,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,3,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,0,3,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const SPRAY_COLORS_P1 = ['#00ff41','#00f5ff','#ffee00'];

function buildLevel(resetScore = false) {
  walls = [];
  pellets = [];
  const rows = MAP_TEMPLATE.length;
  const cols = MAP_TEMPLATE[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = MAP_TEMPLATE[r][c];
      if (v === 1) walls.push({ x: c, y: r });
      if (v === 0) pellets.push({ x: c, y: r, power: false, alive: true });
      if (v === 3) pellets.push({ x: c, y: r, power: true, alive: true });
    }
  }
  pac1 = {
    x: 14, y: 16, dx: 0, dy: 0, nextDx: 0, nextDy: 0,
    mouthAngle: 0.2, mouthDir: 1,
    powered: false, powerTimer: 0,
    alive: true,
    color: '#ffee00'
  };
  ghosts = [
    { x: 13, y: 9, dx: 1, dy: 0, color: '#ff0000', scatter: { x: 26, y: 0 }, mode: 'scatter', timer: 0 },
    { x: 14, y: 9, dx: 0, dy: 1, color: '#ffb8ff', scatter: { x: 2, y: 0 }, mode: 'scatter', timer: 50 },
    { x: 13, y: 10, dx: -1, dy: 0, color: '#00ffff', scatter: { x: 26, y: 20 }, mode: 'scatter', timer: 100 },
    { x: 14, y: 10, dx: 0, dy: -1, color: '#ffb852', scatter: { x: 0, y: 20 }, mode: 'scatter', timer: 150 }
  ];
  if (resetScore) {
    score = 0;
    lives = 3;
    currentLevel = 1;
  }
}

function canMove(x, y) {
  const cols = MAP_TEMPLATE[0].length;
  if (x < 0 || x >= cols) return true;
  if (y < 0 || y >= MAP_TEMPLATE.length) return false;
  return MAP_TEMPLATE[Math.round(y)][Math.round(x)] !== 1;
}

function movePacman(pac) {
  if (!pac.alive) return;
  const nx = pac.x + pac.nextDx;
  const ny = pac.y + pac.nextDy;
  if (canMove(nx, ny)) {
    pac.dx = pac.nextDx;
    pac.dy = pac.nextDy;
  }
  const mx = pac.x + pac.dx;
  const my = pac.y + pac.dy;
  if (canMove(mx, my)) {
    pac.x = (mx + MAP_TEMPLATE[0].length) % MAP_TEMPLATE[0].length;
    pac.y = my;
  }
  pac.mouthAngle += 0.15 * pac.mouthDir;
  if (pac.mouthAngle > 0.35 || pac.mouthAngle < 0.02) pac.mouthDir *= -1;
}

function moveGhosts() {
  ghosts.forEach(g => {
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    const opp = { x: -g.dx, y: -g.dy };
    const valid = dirs.filter(d => !(d.x === opp.x && d.y === opp.y) && canMove(g.x + d.x, g.y + d.y));
    if (valid.length === 0) return;

    let target = pac1.alive ? pac1 : { x: 14, y: 16 };
    const finalTarget = pac1.powered ? g.scatter : target;
    valid.sort((a, b) => {
      const da = Math.hypot(g.x + a.x - finalTarget.x, g.y + a.y - finalTarget.y);
      const db = Math.hypot(g.x + b.x - finalTarget.x, g.y + b.y - finalTarget.y);
      return da - db;
    });
    const d = valid[0];
    g.dx = d.x;
    g.dy = d.y;
    g.x += g.dx;
    g.y += g.dy;
    g.x = (g.x + MAP_TEMPLATE[0].length) % MAP_TEMPLATE[0].length;
  });
}

function checkPellets() {
  if (!pac1.alive) return;
  for (let i = 0; i < pellets.length; i++) {
    const p = pellets[i];
    if (!p.alive) continue;
    if (Math.round(pac1.x) === p.x && Math.round(pac1.y) === p.y) {
      p.alive = false;
      if (p.power) {
        pac1.powered = true;
        pac1.powerTimer = 40;
        score += 50;
      } else {
        score += 10;
      }
      document.getElementById('p1-score').textContent = score;
    }
  }
  const remaining = pellets.filter(p => p.alive).length;
  if (remaining === 0) winGame();
}

function checkGhostCollision() {
  if (!pac1.alive || isRespawning) return;
  for (let i = 0; i < ghosts.length; i++) {
    const g = ghosts[i];
    if (Math.abs(g.x - pac1.x) < 1.2 && Math.abs(g.y - pac1.y) < 1.2) {
      if (pac1.powered) {
        // comer fantasma
        g.x = 13;
        g.y = 9;
        score += 200;
        document.getElementById('p1-score').textContent = score;
      } else {
        die();
        break;
      }
    }
  }
}

function die() {
  if (!pac1.alive || isRespawning) return;
  isRespawning = true;
  pac1.alive = false;
  lives--;

  if (lives <= 0) {
    if (loop) clearInterval(loop);
    loop = null;
    if (score > 0) checkAndSaveScore(leaderboardMode, score, player1Name);
    const ov = document.getElementById('game-overlay');
    document.getElementById('overlay-title').textContent = 'GAME OVER';
    document.getElementById('overlay-sub').textContent = `Nivel ${currentLevel} - Puntaje: ${score}`;
    ov.style.display = 'flex';
    spray1.reset();
    updateSprayUI(1, 0);
    started = false;
    isRespawning = false;
    const restartOnce = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        document.removeEventListener('keydown', restartOnce);
        resetGame();
      }
    };
    document.addEventListener('keydown', restartOnce);
    return;
  }

  // Respawn inmediato en el centro (sin invencibilidad)
  setTimeout(() => {
    // Reiniciar posición de Pac‑Man
    pac1.x = 14;
    pac1.y = 16;
    pac1.dx = 0;
    pac1.dy = 0;
    pac1.nextDx = 0;
    pac1.nextDy = 0;
    pac1.alive = true;
    pac1.powered = false;
    pac1.powerTimer = 0;

    // Reiniciar fantasmas a sus posiciones y direcciones originales
    ghosts.forEach(g => {
      if (g.color === '#ff0000') { g.x = 13; g.y = 9; g.dx = 1; g.dy = 0; }
      else if (g.color === '#ffb8ff') { g.x = 14; g.y = 9; g.dx = 0; g.dy = 1; }
      else if (g.color === '#00ffff') { g.x = 13; g.y = 10; g.dx = -1; g.dy = 0; }
      else if (g.color === '#ffb852') { g.x = 14; g.y = 10; g.dx = 0; g.dy = -1; }
      g.mode = 'scatter';
    });
    isRespawning = false;
  }, 100);
}

function winGame() {
  currentLevel++;
  const ov = document.getElementById('game-overlay');
  document.getElementById('overlay-title').textContent = `¡NIVEL ${currentLevel - 1} COMPLETADO!`;
  document.getElementById('overlay-sub').textContent = `Puntaje: ${score} | Vidas: ${lives} | Siguiente nivel...`;
  ov.style.display = 'flex';
  if (loop) clearInterval(loop);
  setTimeout(() => {
    const currentScore = score;
    const currentLives = lives;
    buildLevel(false);
    score = currentScore;
    lives = currentLives;
    document.getElementById('p1-score').textContent = score;
    spray1.reset();
    updateSprayUI(1, 0);
    ov.style.display = 'none';
    if (!started) started = true;
    if (loop) clearInterval(loop);
    loop = setInterval(tick, 150);
  }, 2000);
}

function resetGame() {
  buildLevel(true);
  started = false;
  currentLevel = 1;
  isRespawning = false;
  spray1.reset();
  updateSprayUI(1, 0);
  document.getElementById('p1-score').textContent = 0;
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('overlay-title').textContent = '¡LISTO!';
  document.getElementById('overlay-sub').textContent = 'PRESIONÁ UNA FLECHA PARA COMENZAR';
  render();
}

function tick() {
  movePacman(pac1);
  moveGhosts();
  checkPellets();
  checkGhostCollision();

  if (pac1.powered) {
    pac1.powerTimer--;
    if (pac1.powerTimer <= 0) {
      pac1.powered = false;
    }
  }
  render();
}

function render() {
  const ctx = canvas.getContext('2d');
  const H = MAP_TEMPLATE.length * CELL;
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, W, H);
  spray1.draw(ctx);

  // paredes
  walls.forEach(w => {
    ctx.fillStyle = '#00156a';
    ctx.fillRect(w.x * CELL, w.y * CELL, CELL, CELL);
    ctx.strokeStyle = 'rgba(0,100,255,0.6)';
    ctx.strokeRect(w.x * CELL + 0.5, w.y * CELL + 0.5, CELL - 1, CELL - 1);
  });

  // pellets
  pellets.forEach(p => {
    if (!p.alive) return;
    if (p.power) {
      ctx.fillStyle = '#ffee00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x * CELL + CELL / 2, p.y * CELL + CELL / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x * CELL + CELL / 2, p.y * CELL + CELL / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // fantasmas
  ghosts.forEach(g => {
    const gx = g.x * CELL + CELL / 2;
    const gy = g.y * CELL + CELL / 2;
    const gcol = pac1.powered ? '#3333ff' : g.color;
    ctx.fillStyle = gcol;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(gx, gy - 2, CELL / 2 - 2, Math.PI, 0);
    ctx.lineTo(gx + CELL / 2 - 2, gy + CELL / 2 - 2);
    for (let i = 3; i >= 0; i--) {
      const bx = gx - (CELL / 2 - 2) + (i * (CELL - 4) / 3);
      ctx.quadraticCurveTo(bx + (CELL - 4) / 6, gy + CELL / 2 - 6, bx, gy + CELL / 2 - 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(gx - 4, gy - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx + 4, gy - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(gx - 3, gy - 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(gx + 5, gy - 4, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Pac‑Man
  const drawPacman = (pac) => {
    if (!pac.alive) return;
    const px = pac.x * CELL + CELL / 2;
    const py = pac.y * CELL + CELL / 2;
    let startAngle = Math.PI * pac.mouthAngle;
    let endAngle = Math.PI * (2 - pac.mouthAngle);
    let rot = 0;
    if (pac.dx === -1) rot = Math.PI;
    else if (pac.dy === 1) rot = Math.PI / 2;
    else if (pac.dy === -1) rot = -Math.PI / 2;
    ctx.fillStyle = pac.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, CELL / 2 - 1, startAngle + rot, endAngle + rot);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  };
  drawPacman(pac1);

  // vidas
  ctx.fillStyle = '#ffee00';
  ctx.font = '0.7em "Press Start 2P"';
  for (let i = 0; i < lives; i++) {
    ctx.beginPath();
    ctx.arc(20 + i * 25, MAP_TEMPLATE.length * CELL - 12, 7, 0.3, Math.PI * 2 - 0.3);
    ctx.fill();
  }
  ctx.fillStyle = '#00f5ff';
  ctx.font = '0.4em "Press Start 2P"';
  ctx.fillText(`NIVEL ${currentLevel}`, W - 80, MAP_TEMPLATE.length * CELL - 8);
}

function keyHandler(e) {
  const dirs = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 }
  };
  if (dirs[e.key] && pac1.alive) {
    e.preventDefault();
    pac1.nextDx = dirs[e.key].dx;
    pac1.nextDy = dirs[e.key].dy;
    if (!started) {
      started = true;
      document.getElementById('game-overlay').style.display = 'none';
      if (loop) clearInterval(loop);
      loop = setInterval(tick, 150);
    }
  }
  if (e.code === 'Space' && pac1.alive) {
    e.preventDefault();
    const cnt = spray1.add(pac1.x * CELL + CELL / 2, pac1.y * CELL + CELL / 2);
    updateSprayUI(1, cnt);
  }
}

export function initPacman(name, cooperative, name2, lbMode) {
  player1Name = name || 'PLAYER1';
  leaderboardMode = lbMode;
  canvas = document.getElementById('game-canvas');
  canvas.width = W;
  canvas.height = MAP_TEMPLATE.length * CELL;
  spray1 = new SpraySystem(SPRAY_COLORS_P1, 0);
  resetGame();
  document.addEventListener('keydown', keyHandler);
  document.getElementById('p2-hud').style.display = 'none';
  const hint = document.getElementById('controls-hint');
  hint.innerHTML = '<span>▼▲◄► + SPACE (SPRAY)</span>';
}

export function cleanPacman() {
  if (loop) clearInterval(loop);
  document.removeEventListener('keydown', keyHandler);
}