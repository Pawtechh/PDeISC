/**
 * ARCHIVO: validaciones.js
 * PROPÓSITO: Funciones para validar los campos del formulario y mostrar errores en el DOM.
 * MÓDULOS: ninguno.
 */

// Mostrar mensaje en el contenedor de mensajes del formulario
export function mostrarMensaje(contenedorId, mensaje, tipo = 'danger') {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    // Limpiar mensajes anteriores
    contenedor.innerHTML = '';
    contenedor.appendChild(alertDiv);
    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.remove();
    }, 4000);
}

// Validar email con regex simple
export function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar teléfono (solo números, mínimo 7 dígitos)
export function validarTelefono(telefono) {
    const soloNumeros = telefono.replace(/\D/g, '');
    return soloNumeros.length >= 7;
}

// Validar documento (solo números, entre 7 y 10 dígitos)
export function validarDocumento(doc) {
    const soloNumeros = doc.replace(/\D/g, '');
    return soloNumeros.length >= 7 && soloNumeros.length <= 10;
}

// Calcular edad a partir de fecha de nacimiento (formato YYYY-MM-DD)
export function calcularEdad(fechaNac) {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }
    return edad;
}

// Validar que la fecha no sea futura
export function validarFechaNacimiento(fechaNac) {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    return nac <= hoy;
}