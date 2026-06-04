import { checkAndSaveScore, updateSprayUI } from './main.js';

let canvas, ctx;
const W = 600, H = 500, CELL = 20;
let loop = null;
let p1;
let food;
let spray1;
let started = false;
let p1Name = '';
let leaderboardMode = '';

let invincibleTimer = 0;
let invincibleFrames = 0;

let audioWave = null, audioWin = null;

function initSounds() {
  try {
    audioWin = new Audio('/styles/audio_1.mp3');
    audioWin.volume = 0.7;
    audioWave = new Audio('/styles/audio_2.mp3');
    audioWave.volume = 0.5;
  } catch(e) { console.log('Error cargando audios:', e); }
}
function playWinSound() { audioWin?.play().catch(e=>console.log('Error:',e)); }
function playWaveSound() { audioWave?.play().catch(e=>console.log('Error:',e)); }

const images = {
  mallaRoja: new Image(),
  ola: new Image()
};
images.mallaRoja.src = '/styles/malla_roja.png';
images.ola.src = '/styles/ola.png';

let waveOffset = 0, foodAnimation = 0;

class SpraySystem {
  constructor() {
    this.sprays = [];
    this.count = 0;
    this.image = images.ola;
  }
  add(x,y) {
    if (this.sprays.length >= 3) this.sprays.shift();
    this.sprays.push({ x, y, time: Date.now() });
    this.count++;
    return this.sprays.length;
  }
  draw(ctx) {
    this.sprays.forEach(s => {
      const alpha = Math.max(0, 1 - (Date.now()-s.time)/800);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.image, s.x-15, s.y-15, 30, 30);
      ctx.restore();
    });
  }
  reset() { this.sprays = []; this.count = 0; }
}

// Verifica colisión con bordes (con invulnerabilidad)
function checkBorderCollision(snake) {
  if (!snake?.alive) return false;
  const head = snake.body[0];
  const cols = W / CELL, rows = H / CELL;
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    // Si es invulnerable, no muere
    if (invincibleTimer > 0) return false;
    snake.alive = false;
    return true;
  }
  return false;
}

function spawnFood() {
  const cols = W/CELL, rows = H/CELL;
  let pos, attempts=0;
  do {
    pos = { x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows) };
    attempts++;
    if (attempts>200) break;
  } while (p1?.body?.some(s => s.x===pos.x && s.y===pos.y));
  return pos;
}

function moveSnake(snake) {
  if (!snake?.alive) return;
  snake.dir = { ...snake.nextDir };
  const head = { x: snake.body[0].x + snake.dir.x, y: snake.body[0].y + snake.dir.y };
  
  // Verificar bordes (con invulnerabilidad)
  if (checkBorderCollision(snake)) return;
  
  snake.body.unshift(head);
  
  const ateFood = (head.x === food.x && head.y === food.y);
  if (ateFood) {
    snake.score += 10;
    food = spawnFood();
    document.getElementById('p1-score').textContent = snake.score;
    playWaveSound();
  } else {
    snake.body.pop();
  }
}

function checkCollisions() {
  if (!p1?.alive) return;
  const head = p1.body[0];
  for (let i=1; i<p1.body.length; i++) {
    if (p1.body[i].x === head.x && p1.body[i].y === head.y) {
      // Si es invulnerable, ignorar auto‑colisión
      if (invincibleTimer > 0) continue;
      p1.alive = false;
      break;
    }
  }
}

function gameOver(msg) {
  if (loop) clearInterval(loop);
  loop = null;
  if (p1 && p1.score > 0) {
    checkAndSaveScore(leaderboardMode, p1.score, p1Name);
  }
  const ov = document.getElementById('game-overlay');
  document.getElementById('overlay-title').textContent = msg;
  document.getElementById('overlay-sub').textContent = 'PRESIONÁ UNA FLECHA PARA REINICIAR';
  ov.style.display = 'flex';
  spray1?.reset();
  updateSprayUI(1,0);
  started = false;
  invincibleTimer = 0;
  
  const restartHandler = (e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      document.removeEventListener('keydown', restartHandler);
      resetGame();
    }
  };
  document.addEventListener('keydown', restartHandler);
}

function resetGame() {
  if (loop) clearInterval(loop);
  p1 = {
    body: [{x:10,y:12},{x:9,y:12},{x:8,y:12}],
    dir: {x:1,y:0}, nextDir: {x:1,y:0},
    score: 0, alive: true,
    image: images.mallaRoja
  };
  food = spawnFood();
  started = false;
  invincibleTimer = 25; // 3 segundos de invulnerabilidad (25 * 120ms = 3s)
  spray1?.reset();
  updateSprayUI(1,0);
  document.getElementById('p1-score').textContent = 0;
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('overlay-title').textContent = '🏄‍♂️ SURF SNAKE 🏄‍♀️';
  document.getElementById('overlay-sub').textContent = 'PRESIONÁ UNA FLECHA PARA COMENZAR (3 SEGUNDOS INVULNERABLE)';
  render();
}

function tick() {
  if (invincibleTimer > 0) {
    invincibleTimer--;
    invincibleFrames = (invincibleFrames + 1) % 6;
  }
  
  if (p1) moveSnake(p1);
  checkCollisions();
  
  // Si la serpiente murió (por borde o auto‑colisión) terminar el juego
  if (p1 && !p1.alive) {
    gameOver('GAME OVER');
    return;
  }
  
  waveOffset = (waveOffset + 0.05) % (Math.PI * 2);
  foodAnimation = (foodAnimation + 0.03) % (Math.PI * 2);
  render();
}

function drawWaveBackground(ctx) {
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#0a2a5a'); grad.addColorStop(0.5,'#0a3a7a'); grad.addColorStop(1,'#0a2a5a');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
  for(let i=0;i<5;i++) {
    const waveY = 50 + i*100 + Math.sin(waveOffset*2 + i)*15;
    ctx.beginPath(); ctx.moveTo(0,waveY);
    for(let x=0;x<=W;x+=20) {
      const y = waveY + Math.sin(x*0.03 + waveOffset*3)*8;
      ctx.lineTo(x,y);
    }
    ctx.strokeStyle = `rgba(100,200,255,${0.08 - i*0.01})`;
    ctx.lineWidth=2; ctx.stroke();
  }
}

function render() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  drawWaveBackground(ctx);
  ctx.fillStyle = '#c2a15b';
  ctx.fillRect(0,0,W,8); ctx.fillRect(0,H-8,W,8); ctx.fillRect(0,0,8,H); ctx.fillRect(W-8,0,8,H);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth=0.5;
  for(let x=0;x<=W;x+=CELL){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let y=0;y<=H;y+=CELL){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  spray1?.draw(ctx);
  if(food) {
    const fx = food.x*CELL+CELL/2, fy = food.y*CELL+CELL/2, scale = 0.8+Math.sin(foodAnimation*4)*0.1;
    ctx.save(); ctx.translate(fx,fy); ctx.scale(scale,scale);
    ctx.shadowBlur=15; ctx.shadowColor='#fff';
    ctx.drawImage(images.ola,-15,-15,30,30);
    ctx.restore();
  }
  if(p1 && p1.body) {
    p1.body.forEach((seg,i) => {
      const x=seg.x*CELL, y=seg.y*CELL;
      let inv = (invincibleTimer>0), draw = true;
      if(inv && Math.floor(invincibleFrames/2)%2===0 && i===0) draw=false;
      if(!draw && i===0) return;
      if(i===0) {
        ctx.save();
        ctx.shadowBlur=8; ctx.shadowColor='#ff4444';
        if(inv) { ctx.globalAlpha=0.7; ctx.shadowColor='#ffff00'; }
        ctx.drawImage(images.mallaRoja, x+2, y+2, CELL-4, CELL-4);
        ctx.restore();
      } else {
        const ws = 0.9+Math.sin(waveOffset*3+i)*0.05;
        ctx.save(); ctx.translate(x+CELL/2, y+CELL/2); ctx.scale(ws,ws);
        ctx.globalAlpha = Math.max(0.4, 1-i*0.03);
        if(inv) ctx.globalAlpha=0.5;
        ctx.drawImage(images.ola,-12,-12,24,24);
        ctx.restore();
      }
    });
  }
  for(let i=0;i<5;i++) {
    const fx = (Date.now()/50 + i*100)%W, fy = H-15+Math.sin(Date.now()/200+i)*3;
    ctx.fillStyle = `rgba(255,255,255,${0.3+Math.sin(Date.now()/300+i)*0.1})`;
    ctx.beginPath(); ctx.arc(fx,fy,3,0,Math.PI*2); ctx.fill();
  }
  if(invincibleTimer>0) {
    ctx.font = '0.35em "Press Start 2P"';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('✨ INVULNERABLE ✨', W/2-70, 25);
  }
}

function keyHandler(e) {
  const prevent = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Space'];
  if(prevent.includes(e.key) || e.code==='Space') e.preventDefault();
  const dirMap = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0} };
  if(dirMap[e.key] && p1?.alive) {
    const nd = dirMap[e.key];
    if(!(nd.x === -p1.dir.x && nd.y === -p1.dir.y)) p1.nextDir = nd;
  }
  if(e.code === 'Space' && p1?.alive && spray1) {
    const head = p1.body[0];
    const cnt = spray1.add(head.x*CELL+CELL/2, head.y*CELL+CELL/2);
    updateSprayUI(1,cnt);
  }
  if(!started && p1?.alive && dirMap[e.key]) {
    started = true;
    const ov = document.getElementById('game-overlay');
    if(ov) ov.style.display = 'none';
    if(loop) clearInterval(loop);
    loop = setInterval(tick, 120);
  }
}

export function initSnake(mode, name1, lbMode) {
  p1Name = name1 || 'MALLA ROJA';
  leaderboardMode = lbMode;
  initSounds();
  canvas = document.getElementById('game-canvas');
  if(!canvas) return;
  ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  spray1 = new SpraySystem();
  resetGame();
  document.addEventListener('keydown', keyHandler);
  document.getElementById('p1-tag').textContent = p1Name;
}

export function cleanSnake() {
  if(loop) clearInterval(loop);
  document.removeEventListener('keydown', keyHandler);
}