/**
 * ARCHIVO: backToTop.js
 * PROPÓSITO: Botón flotante "Volver arriba" que aparece al scrollear
 * MÓDULOS: Ninguno (independiente)
 */

export function initBackToTop() {
    const boton = document.getElementById('backToTop');
    if (!boton) return;

    // Mostrar/ocultar el botón según el scroll
    const alScrollear = () => {
        if (window.scrollY > 300) {
            boton.classList.add('visible');
        } else {
            boton.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', alScrollear, { passive: true });
    alScrollear();

    // Volver arriba con scroll suave
    boton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initBackToTop();
    });
}
