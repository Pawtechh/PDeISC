import { initSnake as initSnake1, cleanSnake as cleanSnake1 } from './snake1jugador.js';
import { initSnake as initSnake2, cleanSnake as cleanSnake2 } from './snake2jugador.js';
import { initPacman as initPacman1, cleanPacman as cleanPacman1 } from './pacman1jugador.js';
import { initPacman as initPacman2, cleanPacman as cleanPacman2 } from './pacman2jugador.js';
import { applyDeviceClass, detectDevice, resolveDeviceConfig, saveDeviceConfig, syncViewportSize } from './deviceControl.js';
import { bindTouchControls, setTouchControlsVisible } from './touchInterface.js';

const STATE = {
  game: null,
  mode: null,
  p1Name: 'PLAYER1',
  p2Name: 'PLAYER2',
  device: null
};

const LB_KEYS = {
  snake_solo: 'lb_snake_solo',
  snake_vs: 'lb_snake_vs',
  pacman_solo: 'lb_pacman_solo',
  pacman_coop: 'lb_pacman_coop'
};

let currentGameMode = null;
let currentCleanup = null;

const GAME_MODES = {
  snake: ['snake_solo', 'snake_vs'],
  pacman: ['pacman_solo', 'pacman_coop']
};

/**
 * Lee un ranking desde localStorage.
 * @param {string} key Clave persistida del modo.
 * @returns {Array<{name:string,score:number,mode:string,timestamp:number}>} Entradas guardadas.
 */
function getLeaderboard(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Ordena y guarda el top 10 de un ranking.
 * @param {string} key Clave persistida del modo.
 * @param {Array<{name:string,score:number,mode:string,timestamp:number}>} entries Entradas candidatas.
 * @returns {Array<{name:string,score:number,mode:string,timestamp:number}>} Top 10 guardado.
 */
function saveLeaderboard(key, entries) {
  entries.sort((a, b) => b.score - a.score);
  const top10 = entries.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(top10));
  return top10;
}

/**
 * Determina si un puntaje entra en el top 10 del modo.
 * @param {string} key Clave persistida del modo.
 * @param {number} score Puntaje obtenido.
 * @returns {boolean} True cuando el puntaje califica.
 */
function isTopScore(key, score) {
  const lb = getLeaderboard(key);
  return lb.length < 10 || score > lb[lb.length - 1].score;
}

/**
 * Guarda un puntaje y refresca los paneles visibles.
 * @param {string} mode Identificador interno del modo.
 * @param {string} name Nombre del jugador.
 * @param {number} score Puntaje obtenido.
 * @returns {boolean} True si el modo existe.
 */
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

/**
 * Valida si un puntaje entra al top y lo guarda con nombre seguro.
 * @param {string} mode Identificador interno del modo.
 * @param {number} score Puntaje obtenido.
 * @param {string|null} defaultName Nombre ya cargado por el jugador.
 * @returns {boolean} True si el puntaje fue guardado.
 */
export function checkAndSaveScore(mode, score, defaultName = null) {
  const key = LB_KEYS[mode];
  if (!key || !isTopScore(key, score)) return false;

  let playerName = defaultName;
  if (!playerName) {
    playerName = prompt(`TOP 10\nTu puntaje: ${score}\nIngresa tu nombre (max 12 caracteres):`, 'PLAYER');
    if (!playerName) playerName = 'ANONIMO';
    playerName = playerName.trim().toUpperCase().slice(0, 12);
  }

  saveScore(mode, playerName, score);
  showNewHighScoreMessage(score, playerName);
  return true;
}

/**
 * Refresca el ranking global en todas las pantallas de menú.
 * @returns {void}
 */
function updateGlobalLeaderboard() {
  const allEntries = Object.entries(LB_KEYS).flatMap(([mode, key]) => {
    return getLeaderboard(key).map((entry) => ({ ...entry, mode: entry.mode || mode }));
  });
  allEntries.sort((a, b) => b.score - a.score);
  const topGlobal = allEntries.slice(0, 10);

  ['global-leaderboard-list', 'global-leaderboard-list-mode', 'global-leaderboard-list-names'].forEach((id) => {
    const container = document.getElementById(id);
    if (container) renderLeaderboard(container, topGlobal);
  });
}

/**
 * Refresca el ranking específico del minijuego actual.
 * @param {string} mode Identificador interno del modo.
 * @returns {void}
 */
function updateGameLeaderboard(mode) {
  const key = LB_KEYS[mode];
  const container = document.getElementById('game-leaderboard-list');
  if (key && container) renderLeaderboard(container, getLeaderboard(key), mode);
}

/**
 * Dibuja una lista de ranking en un contenedor.
 * @param {HTMLElement} container Contenedor destino.
 * @param {Array<{name:string,score:number,mode:string}>} entries Entradas a renderizar.
 * @returns {void}
 */
function renderLeaderboard(container, entries) {
  if (!entries.length) {
    container.innerHTML = '<div class="leaderboard-empty">Aún no hay scores...</div>';
    return;
  }

  container.innerHTML = entries.map((entry, idx) => {
    const modeTag = getModeTag(entry.mode);
    return `
      <div class="leaderboard-entry">
        <span class="rank">${idx + 1}</span>
        <span class="name">${entry.name.substring(0, 12)}</span>
        <span class="score">${entry.score}</span>
        <span class="game-tag">${modeTag}</span>
      </div>
    `;
  }).join('');
}

/**
 * Devuelve una etiqueta corta para un modo de ranking.
 * @param {string} mode Identificador interno del modo.
 * @returns {string} Etiqueta legible.
 */
function getModeTag(mode) {
  const tags = {
    snake_solo: '#snake1J',
    snake_vs: '#snakeVS',
    pacman_solo: '#pacman1J',
    pacman_coop: '#pacman2J'
  };
  return tags[mode] || '';
}

/**
 * Muestra una notificación temporal cuando hay nuevo high score.
 * @param {number} score Puntaje obtenido.
 * @param {string} name Nombre del jugador.
 * @returns {void}
 */
function showNewHighScoreMessage(score, name) {
  const message = document.createElement('div');
  message.className = 'new-highscore-message';
  message.innerHTML = `<div class="new-highscore-content">NUEVO HIGH SCORE<br>${name} - ${score}<br>Entraste al Top 10</div>`;
  document.body.appendChild(message);
  setTimeout(() => {
    message.classList.add('fade-out');
    setTimeout(() => message.remove(), 1000);
  }, 3000);
}

/**
 * Activa una pantalla y desactiva el resto.
 * @param {'device'|'menu'|'mode'|'names'|'game'} id Identificador de pantalla.
 * @returns {void}
 */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
  document.getElementById(`screen-${id}`)?.classList.add('active');
  setTouchControlsVisible(id === 'game' && isMobileDevice());
  updateGlobalLeaderboard();
  if (id === 'game' && currentGameMode) updateGameLeaderboard(currentGameMode);
}

/**
 * Indica si la configuración efectiva debe comportarse como móvil.
 * @returns {boolean} True cuando el modo táctil está activo.
 */
function isMobileDevice() {
  return STATE.device?.effective === 'mobile';
}

/**
 * Procesa la elección inicial y cruza preferencia contra detección real.
 * @param {'pc'|'mobile'} choice Preferencia seleccionada por el usuario.
 * @returns {void}
 */
function chooseDevice(choice) {
  const detected = detectDevice();
  STATE.device = resolveDeviceConfig(choice, detected);
  saveDeviceConfig(STATE.device);
  applyDeviceClass(STATE.device);
  document.getElementById('device-detection-summary').textContent = STATE.device.summary;
  showScreen('menu');
}

/**
 * Crea las tarjetas de modo de acuerdo al juego y al dispositivo efectivo.
 * @param {'snake'|'pacman'} game Juego seleccionado.
 * @returns {void}
 */
function goMode(game) {
  STATE.game = game;
  const modeCards = document.getElementById('mode-cards');
  const modeTitle = document.getElementById('mode-title');
  modeTitle.textContent = `${game.toUpperCase()} - MODO`;

  const secondMode = game === 'snake'
    ? { mode: 'vs', title: '2 JUGADORES (VS)', icon: 'VS' }
    : { mode: 'coop', title: 'COOPERATIVO', icon: '2J' };

  modeCards.innerHTML = `
    <button class="mode-card" data-mode="solo">
      <span class="mode-card-icon">1J</span>
      <div class="mode-card-title">1 JUGADOR</div>
    </button>
    <button class="mode-card ${isMobileDevice() ? 'is-disabled' : ''}" data-mode="${secondMode.mode}" ${isMobileDevice() ? 'disabled' : ''}>
      <span class="mode-card-icon">${secondMode.icon}</span>
      <div class="mode-card-title">${isMobileDevice() ? 'en un futuro servidor para el 11/6/26' : secondMode.title}</div>
    </button>
  `;
  showScreen('mode');
}

/**
 * Renderiza los inputs de nombres según modo elegido.
 * @param {'solo'|'vs'|'coop'} mode Modo elegido.
 * @returns {void}
 */
function goNames(mode) {
  STATE.mode = isMobileDevice() ? 'solo' : mode;
  const inputs = document.getElementById('name-inputs');
  const mobileHint = isMobileDevice() ? 'Joystick táctil + Acción' : 'Flechas + Space para spray';

  if (!isMobileDevice() && (STATE.mode === 'vs' || STATE.mode === 'coop')) {
    inputs.innerHTML = `
      <div class="name-field"><label>JUGADOR 1 (Flechas + Space)</label><input id="inp-p1" type="text" maxlength="12" placeholder="PLAYER 1" value="${STATE.p1Name}"></div>
      <div class="name-field"><label>JUGADOR 2 (WASD + Shift)</label><input id="inp-p2" type="text" maxlength="12" placeholder="PLAYER 2" value="${STATE.p2Name}"></div>
    `;
  } else {
    inputs.innerHTML = `<div class="name-field"><label>TU NOMBRE (${mobileHint})</label><input id="inp-p1" type="text" maxlength="12" placeholder="PLAYER 1" value="${STATE.p1Name}"></div>`;
  }

  showScreen('names');
}

/**
 * Copia nombres desde el formulario al estado global.
 * @returns {void}
 */
function capturePlayerNames() {
  const p1 = document.getElementById('inp-p1');
  if (p1) STATE.p1Name = p1.value.trim().toUpperCase() || 'PLAYER1';
  const p2 = document.getElementById('inp-p2');
  if (p2) STATE.p2Name = p2.value.trim().toUpperCase() || 'PLAYER2';
}

/**
 * Calcula el identificador de ranking para el juego y modo activos.
 * @returns {string} Identificador de ranking.
 */
function getCurrentLeaderboardMode() {
  if (STATE.game === 'snake') return STATE.mode === 'solo' ? 'snake_solo' : 'snake_vs';
  return STATE.mode === 'solo' ? 'pacman_solo' : 'pacman_coop';
}

/**
 * Inicializa el minijuego elegido y deja su función de limpieza preparada.
 * @returns {void}
 */
function startGame() {
  capturePlayerNames();
  STATE.mode = isMobileDevice() ? 'solo' : STATE.mode;
  currentGameMode = getCurrentLeaderboardMode();

  document.getElementById('p1-tag').textContent = STATE.p1Name;
  document.getElementById('p2-tag').textContent = STATE.p2Name;
  document.getElementById('p1-score').textContent = '0';
  document.getElementById('p2-score').textContent = '0';
  document.getElementById('p2-hud').style.display = (STATE.mode === 'vs' || STATE.mode === 'coop') ? 'flex' : 'none';

  showScreen('game');
  updateGameLeaderboard(currentGameMode);
  if (currentCleanup) currentCleanup();

  if (STATE.game === 'snake') {
    if (STATE.mode === 'solo') initSnake1(STATE.mode, STATE.p1Name, currentGameMode);
    else initSnake2(STATE.mode, STATE.p1Name, STATE.p2Name, currentGameMode);
    currentCleanup = STATE.mode === 'solo' ? cleanSnake1 : cleanSnake2;
    return;
  }

  if (STATE.mode === 'solo') initPacman1(STATE.p1Name, false, '', currentGameMode);
  else initPacman2(STATE.p1Name, true, STATE.p2Name, currentGameMode);
  currentCleanup = STATE.mode === 'solo' ? cleanPacman1 : cleanPacman2;
}

/**
 * Cierra el minijuego y vuelve al selector de modos sin reiniciar dispositivo.
 * @returns {void}
 */
function exitGame() {
  if (currentCleanup) currentCleanup();
  currentCleanup = null;
  currentGameMode = null;
  goMode(STATE.game);
}

/**
 * Vincula todos los eventos de UI que controlan navegación y selección.
 * @returns {void}
 */
function bindMenuEvents() {
  document.querySelectorAll('[data-device-choice]').forEach((button) => {
    button.addEventListener('click', () => chooseDevice(button.dataset.deviceChoice));
  });

  document.querySelectorAll('.game-card').forEach((card) => {
    card.addEventListener('click', () => goMode(card.dataset.game));
  });

  document.querySelectorAll('.back-btn[data-back]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.back));
  });

  document.getElementById('start-game-btn').addEventListener('click', startGame);
  document.getElementById('exit-game-btn').addEventListener('click', exitGame);
  document.getElementById('mode-cards').addEventListener('click', (event) => {
    const card = event.target.closest('.mode-card');
    if (card && card.dataset.mode && !card.disabled) goNames(card.dataset.mode);
  });
}

/**
 * Refresca la detección ante cambios de tamaño sin volver al selector inicial.
 * @returns {void}
 */
function bindResponsiveDeviceRefresh() {
  window.addEventListener('resize', () => {
    syncViewportSize();
    if (!STATE.device) return;
    const nextDevice = resolveDeviceConfig(STATE.device.choice, detectDevice());
    STATE.device = nextDevice;
    saveDeviceConfig(nextDevice);
    applyDeviceClass(nextDevice);
    setTouchControlsVisible(document.getElementById('screen-game').classList.contains('active') && isMobileDevice());
    if (document.getElementById('screen-mode').classList.contains('active') && STATE.game) {
      goMode(STATE.game);
    }
  });
}

/**
 * Inicializa la aplicación una vez cargado el DOM.
 * @returns {void}
 */
function initApp() {
  syncViewportSize();
  bindTouchControls();
  bindMenuEvents();
  bindResponsiveDeviceRefresh();
  updateGlobalLeaderboard();
}

/**
 * Actualiza los indicadores visuales de sprays restantes/usados por jugador.
 * @param {1|2} playerIdx Jugador a actualizar.
 * @param {number} count Cantidad de sprays activos.
 * @returns {void}
 */
export function updateSprayUI(playerIdx, count) {
  const id = playerIdx === 1 ? 'p1-sprays' : 'p2-sprays';
  const dots = document.querySelectorAll(`#${id} .spray-dot`);
  dots.forEach((dot, index) => dot.classList.toggle('active', index < count));
}

document.addEventListener('DOMContentLoaded', initApp);
