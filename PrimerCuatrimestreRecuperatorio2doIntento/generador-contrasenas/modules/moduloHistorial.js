/**
 * Modulo: modules/moduloHistorial.js
 * Proposito: Administra el historial de contrasenias guardadas en 'database/contrasenas.json'
 *            utilizando en el navegador el Vector de Clases GestorContrasenas e instancias
 *            RegistroContrasena. Realiza todas las operaciones ABM exclusivamente mediante
 *            la Fetch API nativa y muestra validaciones inline en el DOM sin alert().
 * Modulos usados:
 *   - ./moduloClases.js (CATEGORIAS_VALIDAS, GestorContrasenas, RegistroContrasena)
 *   - ./moduloPeticiones.js (servicioFetch)
 *   - ./moduloInterfaz.js (renderizado, portapapeles, validacion inline y modal propio)
 */

import {
    CATEGORIAS_VALIDAS,
    GestorContrasenas,
    RegistroContrasena
} from './moduloClases.js';
import { servicioFetch } from './moduloPeticiones.js';
import {
    copiarAlPortapapeles,
    escaparHTML,
    limpiarMensajeInlineDOM,
    mostrarMensajeInlineDOM,
    mostrarNotificacion,
    renderizarListaGuardadas,
    solicitarConfirmacionDOM
} from './moduloInterfaz.js';

// Instancia cliente del Vector de Clases: mantiene en la memoria del navegador
// todas las contrasenias sincronizadas con el archivo database/contrasenas.json del servidor
const gestorCliente = new GestorContrasenas();

// Set con los IDs de las contrasenias que el usuario decidio "desenmascarar" con el boton Ver
const idsVisibles = new Set();

// Criterios activos de filtrado en tiempo real
const filtros = { busqueda: '', categoria: 'Todas' };

let dom = {};
let obtenerClaveActual = () => '';

/**
 * Aplica los filtros activos sobre el Vector de Clases y redibuja la lista en el DOM.
 * En criollo: Toma las contrasenias del gestor, las pasa por el colador de busqueda y categoria,
 * y manda a pintar en pantalla unicamente las que coincidan.
 */
function refrescarListado() {
    const filtradas = gestorCliente.filtrar(filtros);
    if (dom.resumenGuardadas) {
        dom.resumenGuardadas.textContent = `${gestorCliente.total} registro(s) guardado(s) en database/contrasenas.json`;
    }
    renderizarListaGuardadas(dom.listaGuardadas, filtradas, idsVisibles, gestorCliente.total);
}

/**
 * Consulta las contrasenias guardadas al servidor Node.js usando Fetch (GET /api/contrasenas).
 * En criollo: Trae el archivo JSON del servidor y rellena el Vector de Clases cliente.
 */
export async function cargarHistorialServidor() {
    try {
        const datos = await servicioFetch.listarGuardadas();
        gestorCliente.cargarDesdeJSON(datos.registros || []);
        refrescarListado();
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al cargar el historial desde el servidor.', 'error');
    }
}

/**
 * Si el usuario esta dando de alta una contrasenia nueva, actualiza el input con la clave recien generada.
 */
export function sincronizarCampoClaveSiAlta(nuevaClave) {
    if (dom.inputClaveGuardar && !dom.inputIdEdicion?.value.trim()) {
        dom.inputClaveGuardar.value = nuevaClave;
    }
}

/**
 * Copia una contrasenia de las variantes alternativas al formulario de guardado.
 */
export function cargarClaveEnFormulario(clave) {
    if (!dom.inputClaveGuardar) return;
    dom.inputClaveGuardar.value = clave;
    dom.inputServicio?.focus();
    mostrarNotificacion('Variante cargada en el formulario de guardado.', 'info', 2000);
}

/**
 * Limpia el formulario y lo devuelve al modo inicial "Guardar en Base de Datos (.json)".
 * En criollo: Cancela cualquier edicion pendiente y deja las cajas listas para una nueva clave.
 */
function reiniciarFormulario() {
    if (!dom.formGuardar) return;
    dom.formGuardar.reset();
    dom.inputIdEdicion.value = '';
    dom.inputClaveGuardar.value = obtenerClaveActual();
    dom.tituloFormGuardar.textContent = 'Guardar en Base de Datos (.json)';
    dom.btnGuardar.textContent = 'Guardar en Servidor';
    dom.btnCancelarEdicion.hidden = true;
    limpiarMensajeInlineDOM(dom.mensajeValidacionForm);
}

/**
 * Pasa los datos de una contrasenia guardada al formulario para editarla mediante un PUT.
 * @param {string} id Identificador del registro a editar.
 */
function abrirEdicion(id) {
    const registro = gestorCliente.buscarPorId(id);
    if (!registro) return;

    dom.inputIdEdicion.value = registro.id;
    dom.inputServicio.value = registro.servicio;
    dom.inputUsuario.value = registro.usuario;
    dom.selectCategoria.value = registro.categoria;
    dom.inputClaveGuardar.value = registro.contrasena;

    dom.tituloFormGuardar.textContent = `Editando: ${registro.servicio}`;
    dom.btnGuardar.textContent = 'Actualizar Registro';
    dom.btnCancelarEdicion.hidden = false;
    limpiarMensajeInlineDOM(dom.mensajeValidacionForm);
    dom.inputServicio.focus();
}

/**
 * Maneja el evento submit del formulario para dar de alta (POST) o editar (PUT) con Fetch.
 * 
 * En criollo formal: Antes de mandar nada al servidor, instanciamos un 'new RegistroContrasena'
 * en el navegador. Si el usuario puso un nombre de 1 letra o una categoria rara, los setters
 * de la clase tiran una excepcion inmediatamente. La capturamos en el 'catch' y mostramos
 * el mensaje de error en una cajita roja dentro del DOM, sin usar jamas la funcion alert().
 * Si pasa la validacion, se envia via Fetch al servidor y se persiste en database/contrasenas.json.
 */
async function manejarEnvioGuardar(evento) {
    evento.preventDefault();
    limpiarMensajeInlineDOM(dom.mensajeValidacionForm);

    const idEdicion = dom.inputIdEdicion.value.trim();
    const carga = {
        servicio: dom.inputServicio.value,
        usuario: dom.inputUsuario.value,
        categoria: dom.selectCategoria.value,
        contrasena: dom.inputClaveGuardar.value
    };

    try {
        // Validacion previa en cliente mediante los setters de la clase RegistroContrasena
        const validado = new RegistroContrasena({ id: idEdicion || 'temp', ...carga });
        const payload = {
            servicio: validado.servicio,
            usuario: validado.usuario,
            categoria: validado.categoria,
            contrasena: validado.contrasena
        };

        dom.btnGuardar.disabled = true;

        if (idEdicion) {
            // Edicion mediante metodo PUT con Fetch
            const resp = await servicioFetch.actualizarRegistro(idEdicion, payload);
            mostrarNotificacion(resp.mensaje, 'exito');
        } else {
            // Alta mediante metodo POST con Fetch
            const resp = await servicioFetch.guardarRegistro(payload);
            mostrarNotificacion(resp.mensaje, 'exito');
        }

        reiniciarFormulario();
        await cargarHistorialServidor();
    } catch (error) {
        // Mostramos el mensaje en un elemento del DOM (prohibido usar alert)
        mostrarMensajeInlineDOM(dom.mensajeValidacionForm, error.message || 'Revisa los datos ingresados.', 'error');
    } finally {
        dom.btnGuardar.disabled = false;
    }
}

/**
 * Manejador centralizado (delegacion de eventos) para los botones de cada tarjeta de contrasenia.
 * 
 * En criollo formal: En vez de pegarle 4 escuchadores de eventos a cada tarjeta individual,
 * le ponemos un solo listener al contenedor padre 'listaGuardadas'. Cuando el usuario hace click,
 * detectamos a que boton le dio (ver, copiar, editar o eliminar) usando closest('button[data-accion]').
 */
async function manejarClickTarjeta(evento) {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    const accion = boton.dataset.accion;
    const id = boton.dataset.id;
    const reg = gestorCliente.buscarPorId(id);
    if (!reg) return;

    // Accion 1: Alternar entre contrasenia visible y asteriscos
    if (accion === 'ver') {
        if (idsVisibles.has(id)) idsVisibles.delete(id);
        else idsVisibles.add(id);
        refrescarListado();
        return;
    }

    // Accion 2: Copiar clave al portapapeles
    if (accion === 'copiar') {
        const ok = await copiarAlPortapapeles(reg.contrasena);
        mostrarNotificacion(ok ? `Contrasenia de "${reg.servicio}" copiada.` : 'Error al copiar.', ok ? 'exito' : 'error');
        return;
    }

    // Accion 3: Cargar en el formulario para editar
    if (accion === 'editar') {
        abrirEdicion(id);
        return;
    }

    // Accion 4: Eliminar registro con confirmacion en modal propio (sin confirm())
    if (accion === 'eliminar') {
        const confirmado = await solicitarConfirmacionDOM({
            titulo: 'Eliminar contrasenia',
            mensaje: `Se eliminara "${reg.servicio}" de database/contrasenas.json.`,
            textoConfirmar: 'Eliminar'
        });
        if (!confirmado) return;

        try {
            const resp = await servicioFetch.eliminarRegistro(id);
            idsVisibles.delete(id);
            if (dom.inputIdEdicion.value === id) reiniciarFormulario();
            mostrarNotificacion(resp.mensaje, 'exito');
            await cargarHistorialServidor();
        } catch (error) {
            mostrarNotificacion(error.message, 'error');
        }
    }
}

/**
 * Inicializa los elementos DOM, los eventos de escucha y la carga inicial del historial.
 * 
 * @param {string[]} categorias Vector de categorias oficiales recibidas del servidor.
 * @param {Function} callbackClaveActual Funcion para obtener la contrasenia activa del visor.
 */
export async function inicializarHistorial(categorias = CATEGORIAS_VALIDAS, callbackClaveActual) {
    obtenerClaveActual = callbackClaveActual;

    dom = {
        tituloFormGuardar: document.getElementById('tituloFormGuardar'),
        formGuardar: document.getElementById('formGuardar'),
        mensajeValidacionForm: document.getElementById('mensajeValidacionForm'),
        inputIdEdicion: document.getElementById('inputIdEdicion'),
        inputServicio: document.getElementById('inputServicio'),
        inputUsuario: document.getElementById('inputUsuario'),
        selectCategoria: document.getElementById('selectCategoria'),
        inputClaveGuardar: document.getElementById('inputClaveGuardar'),
        btnUsarGenerada: document.getElementById('btnUsarGenerada'),
        btnGuardar: document.getElementById('btnGuardar'),
        btnCancelarEdicion: document.getElementById('btnCancelarEdicion'),
        resumenGuardadas: document.getElementById('resumenGuardadas'),
        inputBuscar: document.getElementById('inputBuscar'),
        filtroCategoria: document.getElementById('filtroCategoria'),
        btnVaciarHistorial: document.getElementById('btnVaciarHistorial'),
        listaGuardadas: document.getElementById('listaGuardadas')
    };

    // Poblamos los selectores de categoria usando .map()
    if (dom.selectCategoria) {
        dom.selectCategoria.innerHTML = categorias.map(
            (cat) => `<option value="${escaparHTML(cat)}">${escaparHTML(cat)}</option>`
        ).join('');
    }
    if (dom.filtroCategoria) {
        dom.filtroCategoria.innerHTML = [
            '<option value="Todas">Todas las categorias</option>',
            ...categorias.map((cat) => `<option value="${escaparHTML(cat)}">${escaparHTML(cat)}</option>`)
        ].join('');
    }

    // Eventos del formulario
    dom.btnUsarGenerada?.addEventListener('click', () => {
        const clave = obtenerClaveActual();
        if (clave) {
            dom.inputClaveGuardar.value = clave;
            limpiarMensajeInlineDOM(dom.mensajeValidacionForm);
        }
    });

    dom.inputServicio?.addEventListener('input', () => limpiarMensajeInlineDOM(dom.mensajeValidacionForm));
    dom.inputUsuario?.addEventListener('input', () => limpiarMensajeInlineDOM(dom.mensajeValidacionForm));
    dom.inputClaveGuardar?.addEventListener('input', () => limpiarMensajeInlineDOM(dom.mensajeValidacionForm));
    dom.btnCancelarEdicion?.addEventListener('click', reiniciarFormulario);
    dom.formGuardar?.addEventListener('submit', manejarEnvioGuardar);

    // Eventos de busqueda y filtrado en tiempo real
    dom.inputBuscar?.addEventListener('input', (e) => {
        filtros.busqueda = e.target.value;
        refrescarListado();
    });

    dom.filtroCategoria?.addEventListener('change', (e) => {
        filtros.categoria = e.target.value;
        refrescarListado();
    });

    // Delegacion de eventos sobre la lista
    dom.listaGuardadas?.addEventListener('click', manejarClickTarjeta);

    // Evento para vaciar el historial completo
    dom.btnVaciarHistorial?.addEventListener('click', async () => {
        if (gestorCliente.total === 0) {
            mostrarNotificacion('El historial ya esta vacio.', 'info');
            return;
        }
        const ok = await solicitarConfirmacionDOM({
            titulo: 'Vaciar historial',
            mensaje: `Se eliminaran los ${gestorCliente.total} registros de database/contrasenas.json.`,
            textoConfirmar: 'Vaciar'
        });
        if (!ok) return;

        try {
            const resp = await servicioFetch.vaciarHistorial();
            idsVisibles.clear();
            mostrarNotificacion(resp.mensaje, 'exito');
            await cargarHistorialServidor();
        } catch (error) {
            mostrarNotificacion(error.message, 'error');
        }
    });

    // Carga inicial del historial desde database/contrasenas.json
    await cargarHistorialServidor();
}
