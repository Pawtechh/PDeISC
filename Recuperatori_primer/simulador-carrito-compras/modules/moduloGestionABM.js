/**
 * Modulo: moduloGestionABM.js
 * Proposito: Implementar las operaciones de Alta, Baja, Modificacion (ABM) y Listado completo
 *            de productos, cumpliendo con el requisito obligatorio de gestion de formularios
 *            y persistencia en el backend sin recurrir a la funcion alert().
 * Modulos usados:
 *   - servicioAxios: Modulo para enviar peticiones POST, PUT y DELETE al servidor.
 *   - mostrarNotificacion: Modulo de notificaciones visuales en el DOM.
 * Funciones principales:
 *   - abrirFormularioAlta: Prepara el formulario limpio para crear un nuevo producto.
 *   - abrirFormularioModificacion: Carga los datos de un producto en el formulario para su edicion.
 *   - procesarEnvioFormulario: Valida los campos y persiste el alta o modificacion en el servidor.
 *   - ejecutarBajaProducto: Da de baja un producto con confirmacion visual en el DOM.
 *   - renderizarListadoGestion: Renderiza la tabla completa del inventario para su gestion administrativa.
 */

import { servicioAxios } from './moduloPeticiones.js';
import { mostrarNotificacion, formatearMoneda } from './moduloInterfaz.js';

let productoEnEdicionIdentificador = null;

/**
 * Inicializa y asocia los eventos del formulario ABM.
 * @param {HTMLFormElement} formulario Elemento form del DOM.
 * @param {Function} alFinalizarOperacion Callback para refrescar el catalogo tras cambios.
 */
export function inicializarGestionABM(formulario, alFinalizarOperacion) {
    if (!formulario) return;

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        await procesarEnvioFormulario(formulario, alFinalizarOperacion);
    });

    const botonCancelar = document.getElementById('boton-cancelar-abm');
    if (botonCancelar) {
        botonCancelar.addEventListener('click', () => {
            cerrarModalABM();
        });
    }

    const botonCerrar = document.getElementById('boton-cerrar-modal-abm');
    if (botonCerrar) {
        botonCerrar.addEventListener('click', () => {
            cerrarModalABM();
        });
    }

    const botonNuevoProducto = document.getElementById('boton-nuevo-producto');
    if (botonNuevoProducto) {
        botonNuevoProducto.addEventListener('click', () => {
            abrirFormularioAlta();
        });
    }
}

/**
 * Abre el formulario en modo Creacion (Alta).
 */
export function abrirFormularioAlta() {
    productoEnEdicionIdentificador = null;
    const modal = document.getElementById('modal-abm-producto');
    const titulo = document.getElementById('titulo-modal-abm');
    const formulario = document.getElementById('formulario-abm');

    if (titulo) titulo.textContent = 'Alta de Nuevo Producto';
    if (formulario) formulario.reset();

    const campoIdOculto = document.getElementById('abm-producto-id');
    if (campoIdOculto) campoIdOculto.value = '';

    if (modal) {
        modal.classList.remove('oculto');
        document.body.classList.add('bloqueo-desplazamiento');
    }
}

/**
 * Abre el formulario con los datos cargados para Edicion (Modificacion).
 * @param {Object} producto Datos del producto a editar.
 */
export function abrirFormularioModificacion(producto) {
    if (!producto) return;
    productoEnEdicionIdentificador = producto.identificador;

    const modal = document.getElementById('modal-abm-producto');
    const titulo = document.getElementById('titulo-modal-abm');

    if (titulo) titulo.textContent = `Modificar Producto: ${producto.nombre}`;

    // Carga de campos en el formulario
    document.getElementById('abm-producto-id').value = producto.identificador;
    document.getElementById('abm-nombre').value = producto.nombre;
    document.getElementById('abm-precio').value = producto.precio;
    document.getElementById('abm-categoria').value = producto.categoria;
    document.getElementById('abm-existencias').value = producto.existencias;
    document.getElementById('abm-descuento').value = producto.porcentajeDescuento;
    document.getElementById('abm-imagen').value = producto.enlaceImagen;
    document.getElementById('abm-descripcion').value = producto.descripcion;

    if (modal) {
        modal.classList.remove('oculto');
        document.body.classList.add('bloqueo-desplazamiento');
    }
}

export function cerrarModalABM() {
    const modal = document.getElementById('modal-abm-producto');
    if (modal) {
        modal.classList.add('oculto');
        document.body.classList.remove('bloqueo-desplazamiento');
    }
    productoEnEdicionIdentificador = null;
}

/**
 * Valida los datos del formulario y los persiste en el backend.
 */
async function procesarEnvioFormulario(formulario, alFinalizarOperacion) {
    const nombre = document.getElementById('abm-nombre').value.trim();
    const precio = Number(document.getElementById('abm-precio').value);
    const categoria = document.getElementById('abm-categoria').value.trim();
    const existencias = parseInt(document.getElementById('abm-existencias').value, 10);
    const descuento = Number(document.getElementById('abm-descuento').value || 0);
    const imagen = document.getElementById('abm-imagen').value.trim();
    const descripcion = document.getElementById('abm-descripcion').value.trim();

    // Validaciones en cliente
    if (!nombre) {
        mostrarNotificacion('El nombre del producto no puede estar vacio.', 'advertencia');
        return;
    }
    if (isNaN(precio) || precio <= 0) {
        mostrarNotificacion('El precio debe ser un numero mayor a 0.', 'advertencia');
        return;
    }
    if (isNaN(existencias) || existencias < 0) {
        mostrarNotificacion('Las existencias no pueden ser un valor negativo.', 'advertencia');
        return;
    }

    const payload = {
        nombre,
        precio,
        categoria,
        existencias,
        porcentajeDescuento: descuento,
        enlaceImagen: imagen,
        descripcion
    };

    try {
        await servicioAxios.guardarProducto(payload, productoEnEdicionIdentificador);
        const mensajeAccion = productoEnEdicionIdentificador ? 'Producto modificado exitosamente.' : 'Producto creado y agregado al catalogo.';
        mostrarNotificacion(mensajeAccion, 'exito');
        cerrarModalABM();
        if (typeof alFinalizarOperacion === 'function') {
            await alFinalizarOperacion();
        }
    } catch (error) {
        mostrarNotificacion(`Error al guardar: ${error.message}`, 'error');
    }
}

/**
 * Ejecuta la eliminacion (Baja) de un producto con confirmacion modal personalizada sin alert/confirm nativo.
 */
export function ejecutarBajaProducto(identificador, nombre, alFinalizarOperacion) {
    const modalConfirmacion = document.getElementById('modal-confirmacion-baja');
    const textoMensaje = document.getElementById('texto-confirmacion-baja');
    const botonAceptar = document.getElementById('boton-confirmar-baja');
    const botonCancelar = document.getElementById('boton-cancelar-baja');

    if (!modalConfirmacion) return;

    if (textoMensaje) {
        textoMensaje.textContent = `¿Confirma la eliminacion definitiva del articulo "${nombre}" (ID: ${identificador})? Esta accion no se puede deshacer.`;
    }

    modalConfirmacion.classList.remove('oculto');

    // Limpieza de eventos previos
    const nuevoBotonAceptar = botonAceptar.cloneNode(true);
    botonAceptar.parentNode.replaceChild(nuevoBotonAceptar, botonAceptar);

    const nuevoBotonCancelar = botonCancelar.cloneNode(true);
    botonCancelar.parentNode.replaceChild(nuevoBotonCancelar, botonCancelar);

    nuevoBotonCancelar.addEventListener('click', () => {
        modalConfirmacion.classList.add('oculto');
    });

    nuevoBotonAceptar.addEventListener('click', async () => {
        modalConfirmacion.classList.add('oculto');
        try {
            await servicioAxios.eliminarProductoCatalogo(identificador);
            mostrarNotificacion(`El articulo "${nombre}" ha sido dado de baja.`, 'informacion');
            if (typeof alFinalizarOperacion === 'function') {
                await alFinalizarOperacion();
            }
        } catch (error) {
            mostrarNotificacion(`Error al dar de baja: ${error.message}`, 'error');
        }
    });
}
