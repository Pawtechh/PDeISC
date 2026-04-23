import { crearEnlace, modificarEnlace, logCambio } from './utilNodos.js';

const area = document.getElementById('area-nodos');
const log  = document.getElementById('log-cambios');

const NODOS_INICIALES = [
  { texto: 'Google',    href: 'https://google.com' },
  { texto: 'YouTube',   href: 'https://youtube.com' },
  { texto: 'Wikipedia', href: 'https://wikipedia.org' },
  { texto: 'GitHub',    href: 'https://github.com' },
  { texto: 'MDN',       href: 'https://developer.mozilla.org' },
];

const NODOS_MODIFICADOS = [
  { texto: 'DuckDuckGo', href: 'https://duckduckgo.com' },
  { texto: 'Vimeo',      href: 'https://vimeo.com' },
  { texto: 'OpenStreet', href: 'https://openstreetmap.org' },
  { texto: 'GitLab',     href: 'https://gitlab.com' },
  { texto: 'CanIUse',    href: 'https://caniuse.com' },
];

document.getElementById('btnCrear').addEventListener('click', () => {
  area.innerHTML = '';
  log.innerHTML  = '';
  NODOS_INICIALES.forEach(({ texto, href }) => {
    area.appendChild(crearEnlace(texto, href));
  });
  logCambio(log, 'Creados 5 nodos <a> con atributos href iniciales.');
});

document.getElementById('btnModificar').addEventListener('click', () => {
  const enlaces = area.querySelectorAll('a.nodo-a');
  if (!enlaces.length) return logCambio(log, '⚠️ Primero creá los nodos.');

  enlaces.forEach((a, i) => {
    const anterior = a.getAttribute('href');
    const { texto, href } = NODOS_MODIFICADOS[i];
    modificarEnlace(a, texto, href);
    logCambio(log, `[${i+1}] href: "${anterior}" → "${href}" | texto: "${NODOS_INICIALES[i].texto}" → "${texto}"`);
  });
});

document.getElementById('btnLimpiar').addEventListener('click', () => {
  area.innerHTML = '';
  log.innerHTML  = '';
});