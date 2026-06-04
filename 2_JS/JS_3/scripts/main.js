import { initSnake as initSnake1, cleanSnake as cleanSnake1 } from './snake1jugador.js';
import { initSnake as initSnake2, cleanSnake as cleanSnake2 } from './snake2jugador.js';
import { initPacman as initPacman1, cleanPacman as cleanPacman1 } from './pacman1jugador.js';
import { initPacman as initPacman2, cleanPacman as cleanPacman2 } from './pacman2jugador.js';

const STATE = {
  game: null,
  mode: null,
  p1Name: 'PLAYER1',
  p2Name: 'PLAYER2',
};

const LB_KEYS = {
  snake_solo: 'lb_snake_solo',
  snake_vs: 'lb_snake_vs',
  pacman_solo: 'lb_pacman_solo',
  pacman_coop: 'lb_pacman_coop'
};

let currentGameMode = null;

function getLeaderboard(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLeaderboard(key, entries) {
  entries.sort((a,b) => b.score - a.score);
  const top10 = entries.slice(0,10);
  localStorage.setItem(key, JSON.stringify(top10));
  return top10;
}

function isTopScore(key, score) {
  const lb = getLeaderboard(key);
  if (lb.length < 10) return true;
  return score > lb[lb.length-1].score;
}

export function saveScore(mode, name, score) {
  const key = LB_KEYS[mode];
  if (!key) return false;
  const lb = getLeaderboard(key);
  lb.push({ name, score, mode, timestamp: Date.now() });
  saveLeaderboard(key, lb);
  updateGlobalLeaderboard();
  if (currentGameMode === mode) updateGameLeaderboard(mode);
  return true;
}

export function checkAndSaveScore(mode, score, defaultName = null) {
  const key = LB_KEYS[mode];
  if (!key) return false;
  if (isTopScore(key, score)) {
    let playerName = defaultName;
    if (!playerName) {
      playerName = prompt(`✨ ¡TOP 10! ✨\nTu puntaje: ${score}\nIngresa tu nombre (máx 12 caracteres):`, 'PLAYER');
      if (!playerName) playerName = 'ANÓNIMO';
      playerName = playerName.trim().toUpperCase().slice(0,12);
    }
    saveScore(mode, playerName, score);
    showNewHighScoreMessage(score, playerName);
    return true;
  }
  return false;
}

function updateGlobalLeaderboard() {
  const allEntries = [];
  for (const [mode, key] of Object.entries(LB_KEYS)) {
    const entries = getLeaderboard(key);
    allEntries.push(...entries);
  }
  allEntries.sort((a,b) => b.score - a.score);
  const topGlobal = allEntries.slice(0,10);
  ['global-leaderboard-list', 'global-leaderboard-list-mode', 'global-leaderboard-list-names'].forEach(id => {
    const container = document.getElementById(id);
    if (container) renderLeaderboard(container, topGlobal);
  });
}

function updateGameLeaderboard(mode) {
  const key = LB_KEYS[mode];
  if (!key) return;
  const entries = getLeaderboard(key);
  const container = document.getElementById('game-leaderboard-list');
  if (container) renderLeaderboard(container, entries, mode);
}

function renderLeaderboard(container, entries, currentMode = null) {
  if (!entries.length) {
    container.innerHTML = '<div class="leaderboard-empty">Aún no hay scores...</div>';
    return;
  }
  container.innerHTML = entries.map((entry, idx) => {
    let modeTag = '';
    switch (entry.mode) {
      case 'snake_solo': modeTag = '#snake1J'; break;
      case 'snake_vs': modeTag = '#snakeVS'; break;
      case 'pacman_solo': modeTag = '#pacman1J'; break;
      case 'pacman_coop': modeTag = '#pacman2J'; break;
      default: modeTag = '';
    }
    return `
      <div class="leaderboard-entry">
        <span class="rank">${idx+1}</span>
        <span class="name">${entry.name.substring(0,12)}</span>
        <span class="score">${entry.score}</span>
        <span class="game-tag">${modeTag}</span>
      </div>
    `;
  }).join('');
}

function showNewHighScoreMessage(score, name) {
  const message = document.createElement('div');
  message.className = 'new-highscore-message';
  message.innerHTML = `<div class="new-highscore-content">✨ NUEVO HIGH SCORE! ✨<br>${name} - ${score}<br>Entraste al Top 10</div>`;
  document.body.appendChild(message);
  setTimeout(() => { message.classList.add('fade-out'); setTimeout(() => message.remove(), 1000); }, 3000);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${id}`).classList.add('active');
  updateGlobalLeaderboard();
  if (id === 'game' && currentGameMode) updateGameLeaderboard(currentGameMode);
}

function goMode(game) {
  STATE.game = game;
  const modeCards = document.getElementById('mode-cards');
  const modeTitle = document.getElementById('mode-title');
  modeTitle.textContent = game.toUpperCase() + ' — MODO';
  if (game === 'snake') {
    modeCards.innerHTML = `<div class="mode-card" data-mode="solo"><span class="mode-card-icon">🎮</span><div class="mode-card-title">1 JUGADOR</div></div>
                           <div class="mode-card" data-mode="vs"><span class="mode-card-icon">⚔️</span><div class="mode-card-title">2 JUGADORES (VS)</div></div>`;
  } else {
    modeCards.innerHTML = `<div class="mode-card" data-mode="solo"><span class="mode-card-icon">🎮</span><div class="mode-card-title">1 JUGADOR</div></div>
                           <div class="mode-card" data-mode="coop"><span class="mode-card-icon">👥</span><div class="mode-card-title">COOPERATIVO</div></div>`;
  }
  showScreen('mode');
}

function goNames(mode) {
  STATE.mode = mode;
  const inputs = document.getElementById('name-inputs');
  if (mode === 'vs' || mode === 'coop') {
    inputs.innerHTML = `<div class="name-field"><label>► JUGADOR 1 (Flechas + Space)</label><input id="inp-p1" type="text" maxlength="12" placeholder="PLAYER 1" value="${STATE.p1Name}"></div>
                        <div class="name-field"><label>► JUGADOR 2 (WASD + Shift)</label><input id="inp-p2" type="text" maxlength="12" placeholder="PLAYER 2" value="${STATE.p2Name}"></div>`;
  } else {
    inputs.innerHTML = `<div class="name-field"><label>► TU NOMBRE (Flechas + Space para spray)</label><input id="inp-p1" type="text" maxlength="12" placeholder="PLAYER 1" value="${STATE.p1Name}"></div>`;
  }
  showScreen('names');
}

let currentCleanup = null;

function startGame() {
  const p1 = document.getElementById('inp-p1');
  if (p1) STATE.p1Name = p1.value.trim().toUpperCase() || 'PLAYER1';
  const p2 = document.getElementById('inp-p2');
  if (p2) STATE.p2Name = p2.value.trim().toUpperCase() || 'PLAYER2';
  document.getElementById('p1-tag').textContent = STATE.p1Name;
  document.getElementById('p2-tag').textContent = STATE.p2Name;
  document.getElementById('p2-hud').style.display = (STATE.mode === 'vs' || STATE.mode === 'coop') ? 'flex' : 'none';

  if (STATE.game === 'snake') currentGameMode = (STATE.mode === 'solo') ? 'snake_solo' : 'snake_vs';
  else currentGameMode = (STATE.mode === 'solo') ? 'pacman_solo' : 'pacman_coop';

  showScreen('game');
  updateGameLeaderboard(currentGameMode);
  if (currentCleanup) currentCleanup();

  if (STATE.game === 'snake') {
    if (STATE.mode === 'solo') initSnake1(STATE.mode, STATE.p1Name, currentGameMode);
    else initSnake2(STATE.mode, STATE.p1Name, STATE.p2Name, currentGameMode);
    currentCleanup = (STATE.mode === 'solo') ? cleanSnake1 : cleanSnake2;
  } else {
    if (STATE.mode === 'solo') initPacman1(STATE.p1Name, false, '', currentGameMode);
    else initPacman2(STATE.p1Name, true, STATE.p2Name, currentGameMode);
    currentCleanup = (STATE.mode === 'solo') ? cleanPacman1 : cleanPacman2;
  }
}

function exitGame() {
  if (currentCleanup) currentCleanup();
  currentCleanup = null;
  currentGameMode = null;
  showScreen('menu');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.game-card').forEach(card => card.addEventListener('click', () => goMode(card.dataset.game)));
  document.querySelectorAll('.back-btn[data-back]').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.back)));
  document.getElementById('start-game-btn').addEventListener('click', startGame);
  document.getElementById('exit-game-btn').addEventListener('click', exitGame);
  document.getElementById('mode-cards').addEventListener('click', (e) => {
    const card = e.target.closest('.mode-card');
    if (card && card.dataset.mode) goNames(card.dataset.mode);
  });
  updateGlobalLeaderboard();
});

export function updateSprayUI(playerIdx, count) {
  const id = playerIdx === 1 ? 'p1-sprays' : 'p2-sprays';
  const dots = document.querySelectorAll(`#${id} .spray-dot`);
  dots.forEach((d,i) => d.classList.toggle('active', i < count));
}