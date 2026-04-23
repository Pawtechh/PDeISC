export function crearEnlace(texto, href) {
  const a = document.createElement('a');
  a.className   = 'nodo-a';
  a.textContent = texto;
  a.setAttribute('href', href);
  a.setAttribute('target', '_blank');
  return a;
}

export function modificarEnlace(a, nuevoTexto, nuevoHref) {
  a.setAttribute('href', nuevoHref);
  a.textContent = nuevoTexto;
}

export function logCambio(contenedor, mensaje) {
  const div = document.createElement('div');
  div.className   = 'log-item';
  div.textContent = mensaje;
  contenedor.prepend(div);
}