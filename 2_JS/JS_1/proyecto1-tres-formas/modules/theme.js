/**
 * ARCHIVO: theme.js
 * PROPÓSITO: Gestionar el modo claro/oscuro con localStorage
 * MÓDULOS: Ninguno (independiente)
 * REQUISITO: Botón arriba derecha + persistencia
 */

// Función para aplicar el tema según el modo seleccionado
export function aplicarTema(modo) {
    if (modo === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        localStorage.setItem('tema', 'dark');
        actualizarTextoBoton('dark');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('tema', 'light');
        actualizarTextoBoton('light');
    }
}

// Actualizar el texto e icono del botón
function actualizarTextoBoton(modo) {
    const boton = document.getElementById('themeToggle');
    if (!boton) return;
    
    if (modo === 'dark') {
        boton.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
    } else {
        boton.innerHTML = '<i class="fas fa-moon"></i> Modo Oscuro';
    }
}

// Inicializar el tema al cargar la página
export function initTheme() {
    // Asegurar que el body tenga una clase base
    const temaGuardado = localStorage.getItem('tema');
    
    if (temaGuardado === 'dark') {
        aplicarTema('dark');
    } else {
        aplicarTema('light');
    }
    
    // Configurar el evento del botón
    const boton = document.getElementById('themeToggle');
    if (boton) {
        boton.addEventListener('click', () => {
            const esDark = document.body.classList.contains('dark-mode');
            if (esDark) {
                aplicarTema('light');
            } else {
                aplicarTema('dark');
            }
        });
    }
}

// Auto-ejecutar cuando se importa en página con DOM listo
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
    });
}