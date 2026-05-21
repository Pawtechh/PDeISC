/**
 * ARCHIVO: theme.js
 * PROPÓSITO: Gestionar el tema claro/oscuro con persistencia en localStorage.
 */

let themeButton = null;

function aplicarTema() {
    const modoGuardado = localStorage.getItem('theme');
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (modoGuardado === 'dark' || (!modoGuardado && prefiereOscuro)) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
}

function toggleTheme() {
    const esOscuro = document.body.classList.contains('dark-mode');
    if (esOscuro) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        actualizarIconoBoton(false);
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        actualizarIconoBoton(true);
    }
}

function actualizarIconoBoton(esOscuro) {
    if (!themeButton) return;
    if (esOscuro) {
        themeButton.innerHTML = '<i class="bi bi-sun-fill"></i> Modo Claro';
    } else {
        themeButton.innerHTML = '<i class="bi bi-moon-fill"></i> Modo Oscuro';
    }
}

export function initTheme() {
    aplicarTema();
    themeButton = document.getElementById('themeToggle');
    if (themeButton) {
        const esOscuro = document.body.classList.contains('dark-mode');
        actualizarIconoBoton(esOscuro);
        themeButton.addEventListener('click', toggleTheme);
    }
}