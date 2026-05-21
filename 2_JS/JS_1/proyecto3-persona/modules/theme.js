/**
 * ARCHIVO: theme.js
 * PROPÓSITO: Gestionar modo claro/oscuro con persistencia (localStorage)
 *            y actualización visual completa.
 * REQUISITO 12: Botón + persistencia + cambio global.
 */

// Aplica el tema visual a todo el body y guarda preferencia
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

// Cambia el texto e ícono del botón según el modo activo
function actualizarTextoBoton(modo) {
  const boton = document.getElementById('themeToggle');
  if (!boton) return;
  if (modo === 'dark') {
    boton.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
  } else {
    boton.innerHTML = '<i class="fas fa-moon"></i> Modo Oscuro';
  }
}

// Inicializa el tema al cargar la página (desde localStorage o por defecto claro)
export function initTheme() {
  const temaGuardado = localStorage.getItem('tema');
  // Si no hay tema guardado, se aplica "light" por defecto
  if (temaGuardado === 'dark') {
    aplicarTema('dark');
  } else {
    aplicarTema('light');
  }

  const boton = document.getElementById('themeToggle');
  if (boton) {
    // Eliminar event listeners duplicados si existieran
    const nuevoBoton = boton.cloneNode(true);
    boton.parentNode.replaceChild(nuevoBoton, boton);
    nuevoBoton.addEventListener('click', () => {
      const esDark = document.body.classList.contains('dark-mode');
      if (esDark) {
        aplicarTema('light');
      } else {
        aplicarTema('dark');
      }
    });
  }
}

// Auto-inicialización cuando el DOM esté listo
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
  });
}