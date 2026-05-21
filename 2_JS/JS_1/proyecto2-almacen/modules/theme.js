/**
 * ARCHIVO: theme.js
 * PROPÓSITO: Modo claro/oscuro con persistencia en localStorage
 */

export function aplicarTema(modo) {
  if (modo === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    localStorage.setItem('tema', 'dark');
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    localStorage.setItem('tema', 'light');
  }
  actualizarTextoBoton(modo);
}

function actualizarTextoBoton(modo) {
  const boton = document.getElementById('themeToggle');
  if (!boton) return;
  if (modo === 'dark') {
    boton.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  } else {
    boton.innerHTML = '<i class="fas fa-moon"></i> Modo Oscuro';
  }
}

export function initTheme() {
  const temaGuardado = localStorage.getItem('tema');
  if (temaGuardado === 'dark') {
    aplicarTema('dark');
  } else {
    aplicarTema('light');
  }

  const boton = document.getElementById('themeToggle');
  if (boton) {
    // Eliminar eventos duplicados
    const nuevoBoton = boton.cloneNode(true);
    boton.parentNode.replaceChild(nuevoBoton, boton);
    nuevoBoton.addEventListener('click', () => {
      const esDark = document.body.classList.contains('dark-mode');
      aplicarTema(esDark ? 'light' : 'dark');
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
  });
}