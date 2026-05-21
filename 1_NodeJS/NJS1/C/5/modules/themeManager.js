/**
 * Archivo: themeManager.js
 * Propósito: Gestionar el tema claro/oscuro y persistencia en localStorage
 * Exporta: initTheme, toggleTheme
 */

const THEME_KEY = 'app-theme';

/**
 * Inicializa el tema al cargar la pagina
 * Lee de localStorage y aplica la clase 'dark' si corresponde
 */
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

/**
 * Alterna entre tema claro y oscuro
 * Guarda la preferencia en localStorage
 */
export function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  if (isDark) {
    document.body.classList.remove('dark');
    localStorage.setItem(THEME_KEY, 'light');
  } else {
    document.body.classList.add('dark');
    localStorage.setItem(THEME_KEY, 'dark');
  }
}