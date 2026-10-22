/**
 * ARCHIVO: theme.js
 * PROPÓSITO: Gestionar el tema claro/oscuro con persistencia en localStorage.
 * MÓDULOS: ninguno.
 */

// Función para aplicar el tema según el modo guardado o preferencia del sistema
function aplicarTema() {
    const modoGuardado = localStorage.getItem('theme');
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (modoGuardado === 'dark' || (!modoGuardado && prefiereOscuro)) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        // Actualizar texto del botón (se hará al inicializar el botón)
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
}

// Cambiar tema y guardar preferencia
function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
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

// Actualizar icono y texto del botón (se llama desde main.js después de crear el botón)
let themeButton = null;
function actualizarIconoBoton(esOscuro) {
    if (!themeButton) return;
    if (esOscuro) {
        themeButton.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
    } else {
        themeButton.innerHTML = '<i class="fas fa-moon"></i> Modo Oscuro';
    }
}

// Inicializar el control del tema (llamado desde main.js)
export function initTheme() {
    aplicarTema();
    themeButton = document.getElementById('themeToggle');
    if (themeButton) {
        const esOscuro = document.body.classList.contains('dark-mode');
        actualizarIconoBoton(esOscuro);
        themeButton.addEventListener('click', toggleTheme);
    }
}

// También exportar el estado inicial si se necesita
export function isDarkMode() {
    return document.body.classList.contains('dark-mode');
}