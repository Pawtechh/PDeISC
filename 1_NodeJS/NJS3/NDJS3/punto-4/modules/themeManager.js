/**
 * Archivo: themeManager.js
 * Propósito: Gestión de tema claro/oscuro
 */

const THEME_KEY = 'proyecto4-theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

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