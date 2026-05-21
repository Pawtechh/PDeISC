/**
 * ARCHIVO: alertas.js
 * PROPÓSITO: Mostrar mensajes en el contenedor de alertas del DOM.
 */

let alertContainer = null;

export function initAlertContainer() {
    alertContainer = document.getElementById('alertContainer');
}

export function mostrarAlerta(mensaje, tipo = 'info') {
    if (!alertContainer) {
        console.warn('Contenedor de alertas no encontrado');
        return;
    }
    
    const iconos = {
        success: 'bi-check-circle-fill',
        danger: 'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill'
    };
    const icono = iconos[tipo] || 'bi-info-circle-fill';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show mb-2`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <i class="bi ${icono} me-2"></i> ${mensaje}
        <button type="button" class="btn-close" aria-label="Cerrar"></button>
    `;
    
    const closeBtn = alertDiv.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        alertDiv.classList.remove('show');
        alertDiv.classList.add('fade');
        setTimeout(() => alertDiv.remove(), 300);
    });
    
    alertContainer.insertAdjacentElement('beforeend', alertDiv);
    
    // Auto-cierre después de 5 segundos
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.classList.remove('show');
            alertDiv.classList.add('fade');
            setTimeout(() => {
                if (alertDiv && alertDiv.parentNode) alertDiv.remove();
            }, 300);
        }
    }, 5000);
}