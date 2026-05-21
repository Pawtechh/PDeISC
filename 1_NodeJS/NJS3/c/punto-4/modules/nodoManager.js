/**
 * Archivo: nodoManager.js
 * Propósito: Gestión de nodos <a> (crear, modificar, resetear)
 * Exporta funciones para manipular los 5 nodos mínimos requeridos
 */

// Datos originales de los 5 nodos
const NODOS_ORIGINALES = [
  { href: 'https://www.google.com', texto: 'Google' },
  { href: 'https://www.youtube.com', texto: 'YouTube' },
  { href: 'https://github.com', texto: 'GitHub' },
  { href: 'https://twitter.com', texto: 'Twitter' },
  { href: 'https://wikipedia.org', texto: 'Wikipedia' }
];

// Estado actual de los nodos
let nodos = [];
let logs = [];

// URLs alternativas para modificaciones aleatorias
const URLs_ALTERNAS = [
  'https://www.amazon.com', 'https://www.netflix.com', 'https://www.spotify.com',
  'https://www.reddit.com', 'https://www.twitch.tv', 'https://www.discord.com',
  'https://stackoverflow.com', 'https://medium.com', 'https://dev.to'
];

const TEXTOS_ALTERNOS = [
  'Amazon', 'Netflix', 'Spotify', 'Reddit', 'Twitch', 'Discord', 
  'Stack Overflow', 'Medium', 'Dev.to'
];

function obtenerTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
}

export function agregarLog(accion, detalle) {
  logs.unshift({
    hora: obtenerTimestamp(),
    accion: accion,
    detalle: detalle
  });
  // Mantener solo últimos 50 logs
  if (logs.length > 50) logs.pop();
}

export function obtenerLogs() {
  return logs;
}

export function crearNodosPredeterminados() {
  // Copia profunda de los originales
  nodos = NODOS_ORIGINALES.map(n => ({ ...n }));
  agregarLog('CREACIÓN', `Se crearon ${nodos.length} nodos <a> (Google, YouTube, GitHub, Twitter, Wikipedia)`);
  return nodos;
}

export function obtenerNodos() {
  return [...nodos];
}

export function modificarNodoPorIndice(indice, nuevoHref, nuevoTexto) {
  if (indice < 0 || indice >= nodos.length) {
    agregarLog('ERROR', `Intento de modificar índice ${indice} pero no existe`);
    return false;
  }
  
  const viejo = { ...nodos[indice] };
  nodos[indice].href = nuevoHref;
  nodos[indice].texto = nuevoTexto;
  
  agregarLog(
    `MODIFICACIÓN (índice ${indice})`,
    `"${viejo.texto}" (${viejo.href}) → "${nuevoTexto}" (${nuevoHref})`
  );
  return true;
}

export function modificarTodosAleatorio() {
  if (nodos.length === 0) return 0;
  
  let modificados = 0;
  for (let i = 0; i < nodos.length; i++) {
    const urlRandom = URLs_ALTERNAS[Math.floor(Math.random() * URLs_ALTERNAS.length)];
    const textoRandom = TEXTOS_ALTERNOS[Math.floor(Math.random() * TEXTOS_ALTERNOS.length)];
    const viejo = { ...nodos[i] };
    nodos[i].href = urlRandom;
    nodos[i].texto = textoRandom;
    modificados++;
    agregarLog(
      `MODIFICACIÓN MASIVA (${i})`,
      `"${viejo.texto}" (${viejo.href}) → "${textoRandom}" (${urlRandom})`
    );
  }
  return modificados;
}

export function resetearNodos() {
  if (nodos.length === 0) {
    nodos = NODOS_ORIGINALES.map(n => ({ ...n }));
  } else {
    for (let i = 0; i < NODOS_ORIGINALES.length && i < nodos.length; i++) {
      const viejo = { ...nodos[i] };
      nodos[i] = { ...NODOS_ORIGINALES[i] };
      agregarLog(
        `RESET (índice ${i})`,
        `"${viejo.texto}" (${viejo.href}) → "${NODOS_ORIGINALES[i].texto}" (${NODOS_ORIGINALES[i].href})`
      );
    }
  }
  return nodos;
}