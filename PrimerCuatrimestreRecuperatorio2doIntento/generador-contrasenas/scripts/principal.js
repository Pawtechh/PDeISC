/**
 * Modulo: scripts/principal.js
 * Proposito: Punto de entrada principal de la aplicacion en el navegador (cargado desde pages/index.html).
 *            Orquesta la inicializacion del sistema:
 *            1. Captura de elementos del DOM.
 *            2. Configuracion del modo claro/oscuro y del boton para subir hacia arriba al toque.
 *            3. Comprobacion de salud del servidor y generacion de contrasenias seguras con Axios.
 *            4. Coordinacion con el moduloHistorial para el guardado en la base de datos JSON con Fetch.
 * Modulos usados:
 *   - ../modules/moduloClases.js (CATEGORIAS_VALIDAS, ConfiguracionGenerador)
 *   - ../modules/moduloPeticiones.js (servicioAxios)
 *   - ../modules/moduloInterfaz.js (tema, scroll-top, visor, barra seguridad, variantes, toasts)
 *   - ../modules/moduloHistorial.js (inicializarHistorial, cargarClaveEnFormulario, sincronizarCampoClaveSiAlta)
 */

import { CATEGORIAS_VALIDAS, ConfiguracionGenerador } from '../modules/moduloClases.js';
import { servicioAxios } from '../modules/moduloPeticiones.js';
import {
    alternarTemaColor,
    copiarAlPortapapeles,
    inicializarBotonSubirArriba,
    inicializarTema,
    mostrarNotificacion,
    renderizarBarraSeguridad,
    renderizarVariantesGeneradas,
    renderizarVisorContrasena
} from '../modules/moduloInterfaz.js';
import {
    cargarClaveEnFormulario,
    inicializarHistorial,
    sincronizarCampoClaveSiAlta
} from '../modules/moduloHistorial.js';

// Instancia reactiva que contiene las opciones del generador seleccionadas en la pantalla
const configActual = new ConfiguracionGenerador();

// Variables de estado del cliente
let clavePrincipalActual = '';
let listaVariantesActual = [];
let visorOculto = false;
let temporizadorSlider = null;

// Objeto para almacenar las referencias a los elementos del DOM capturados
const dom = {};

/**
 * Busca y guarda en el objeto 'dom' todos los elementos HTML necesarios.
 * Captura por ID todas las referencias del DOM necesarias para controlar la interfaz.
 */
function capturarDOM() {
    dom.btnAlternarTema = document.getElementById('btnAlternarTema');
    dom.btnSubirArriba = document.getElementById('btnSubirArriba');
    dom.estadoServidorBadge = document.getElementById('estadoServidorBadge');

    dom.visorContrasena = document.getElementById('visorContrasena');
    dom.barraSeguridadRelleno = document.getElementById('barraSeguridadRelleno');
    dom.etiquetaNivelSeguridad = document.getElementById('etiquetaNivelSeguridad');
    dom.btnGenerar = document.getElementById('btnGenerar');
    dom.btnCopiar = document.getElementById('btnCopiar');
    dom.btnOcultar = document.getElementById('btnOcultar');

    dom.rangoLongitud = document.getElementById('rangoLongitud');
    dom.numeroLongitud = document.getElementById('numeroLongitud');
    dom.checkMayusculas = document.getElementById('checkMayusculas');
    dom.checkMinusculas = document.getElementById('checkMinusculas');
    dom.checkNumeros = document.getElementById('checkNumeros');
    dom.checkSimbolos = document.getElementById('checkSimbolos');
    dom.checkEvitarAmbiguos = document.getElementById('checkEvitarAmbiguos');
    dom.selectCantidad = document.getElementById('selectCantidad');
    dom.contenedorVariantes = document.getElementById('contenedorVariantes');
}

/**
 * Pide al servidor Node.js que genere contrasenias usando Axios (POST /api/generar).
 * Valida la configuracion actual, solicita claves al servidor via Axios y actualiza
 * visor, barra de seguridad, lista de variantes y campo del formulario de guardado.
 * 
 * @param {boolean} mostrarAviso Si es true, muestra un toast de confirmacion en pantalla.
 */
async function solicitarGeneracion(mostrarAviso = false) {
    try {
        configActual.validar();
        const respuesta = await servicioAxios.generarContrasenas(configActual.aObjetoPlano());
        const datos = respuesta.datos;

        clavePrincipalActual = datos.principal.contrasena;
        listaVariantesActual = Array.isArray(datos.lista) ? datos.lista : [];
        renderizarVisorContrasena(dom.visorContrasena, clavePrincipalActual, visorOculto);
        renderizarBarraSeguridad(dom.barraSeguridadRelleno, dom.etiquetaNivelSeguridad, datos.principal);
        renderizarVariantesGeneradas(dom.contenedorVariantes, datos.lista);
        sincronizarCampoClaveSiAlta(clavePrincipalActual);

        if (mostrarAviso) {
            mostrarNotificacion(respuesta.mensaje, 'exito', 2200);
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'No se pudo generar la contrasenia en el servidor.', 'error');
    }
}

/**
 * Registra todos los escuchadores de eventos para los controles del generador.
 * Vincula los eventos de interfaz (click, input, change) con el generador, portapapeles y variantes.
 * Demuestra eventos de DOM como 'click', 'input', 'change' y debounce de slider.
 */
function registrarEventosGenerador() {
    // Evento para alternar entre tema claro y tema oscuro
    dom.btnAlternarTema?.addEventListener('click', () => alternarTemaColor(dom.btnAlternarTema));

    // Evento 'input' en el slider de longitud con debounce (espera 110ms antes de llamar al servidor)
    dom.rangoLongitud?.addEventListener('input', (e) => {
        try {
            configActual.longitud = e.target.value;
            dom.numeroLongitud.value = String(configActual.longitud);
            clearTimeout(temporizadorSlider);
            temporizadorSlider = setTimeout(() => solicitarGeneracion(false), 110);
        } catch (error) {
            mostrarNotificacion(error.message, 'error');
        }
    });

    // Evento 'change' en el campo numerico de longitud para sincronizarlo con el slider
    dom.numeroLongitud?.addEventListener('change', (e) => {
        try {
            configActual.longitud = e.target.value;
            dom.rangoLongitud.value = String(configActual.longitud);
            solicitarGeneracion(false);
        } catch (error) {
            mostrarNotificacion(error.message, 'error');
            dom.numeroLongitud.value = String(configActual.longitud);
        }
    });

    // Helper atomico para vincular cada checkbox booleano con su setter correspondiente
    const vincularCheck = (propiedad, elemento) => {
        elemento?.addEventListener('change', (e) => {
            const previo = configActual[propiedad];
            configActual[propiedad] = e.target.checked;
            try {
                // Si el usuario intento destildar todos los tipos, salta la validacion
                configActual.validar();
                solicitarGeneracion(false);
            } catch (error) {
                // Revertimos la eleccion si dejo todo vacio
                configActual[propiedad] = previo;
                e.target.checked = previo;
                mostrarNotificacion(error.message, 'advertencia');
            }
        });
    };

    vincularCheck('incluirMayusculas', dom.checkMayusculas);
    vincularCheck('incluirMinusculas', dom.checkMinusculas);
    vincularCheck('incluirNumeros', dom.checkNumeros);
    vincularCheck('incluirSimbolos', dom.checkSimbolos);

    dom.checkEvitarAmbiguos?.addEventListener('change', (e) => {
        configActual.evitarAmbiguos = e.target.checked;
        solicitarGeneracion(false);
    });

    dom.selectCantidad?.addEventListener('change', (e) => {
        configActual.cantidad = e.target.value;
        solicitarGeneracion(false);
    });

    // Boton Generar (manual con toast de confirmacion)
    dom.btnGenerar?.addEventListener('click', () => solicitarGeneracion(true));

    // Boton Copiar al portapapeles
    dom.btnCopiar?.addEventListener('click', async () => {
        const ok = await copiarAlPortapapeles(clavePrincipalActual);
        mostrarNotificacion(ok ? 'Contrasenia copiada al portapapeles.' : 'Error al copiar.', ok ? 'exito' : 'error');
    });

    // Boton Ocultar / Mostrar clave en el visor
    dom.btnOcultar?.addEventListener('click', () => {
        visorOculto = !visorOculto;
        dom.btnOcultar.textContent = visorOculto ? 'Mostrar' : 'Ocultar';
        renderizarVisorContrasena(dom.visorContrasena, clavePrincipalActual, visorOculto);
    });

    // Delegacion de eventos para las variantes de lote (Copiar o Usar)
    dom.contenedorVariantes?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-accion-lote]');
        if (!btn) return;
        const clave = btn.dataset.clave || '';
        if (btn.dataset.accionLote === 'copiar') {
            const ok = await copiarAlPortapapeles(clave);
            mostrarNotificacion(ok ? 'Variante copiada al portapapeles.' : 'Error al copiar.', ok ? 'exito' : 'error');
        } else if (btn.dataset.accionLote === 'usar') {
            // Actualizamos tambien el visor principal de arriba y su barra de seguridad
            clavePrincipalActual = clave;
            renderizarVisorContrasena(dom.visorContrasena, clavePrincipalActual, visorOculto);
            const variante = listaVariantesActual.find((item) => item.contrasena === clave);
            if (variante) {
                renderizarBarraSeguridad(dom.barraSeguridadRelleno, dom.etiquetaNivelSeguridad, variante);
            }
            cargarClaveEnFormulario(clave);
        }
    });
}

/**
 * Funcion de arranque general ejecutada cuando el DOM esta completamente cargado.
 * Orquesta el arranque completo: tema, scroll-top, eventos, estado del servidor e historial.
 */
async function iniciarAplicacion() {
    capturarDOM();
    inicializarTema(dom.btnAlternarTema);
    inicializarBotonSubirArriba(dom.btnSubirArriba);
    registrarEventosGenerador();

    let categorias = CATEGORIAS_VALIDAS;
    try {
        // Consultamos la salud del servidor mediante Axios
        const salud = await servicioAxios.obtenerSalud();
        categorias = salud.categorias || CATEGORIAS_VALIDAS;
        if (dom.estadoServidorBadge) {
            dom.estadoServidorBadge.textContent = `${salud.motor} | ${salud.archivoBaseDatos}`;
            dom.estadoServidorBadge.classList.add('conectado');
        }
    } catch {
        if (dom.estadoServidorBadge) {
            dom.estadoServidorBadge.textContent = 'Servidor desconectado';
            dom.estadoServidorBadge.classList.add('desconectado');
        }
    }

    // Ejecutamos en paralelo la primera generacion de clave y la carga del historial
    await Promise.all([
        solicitarGeneracion(false),
        inicializarHistorial(categorias, () => clavePrincipalActual)
    ]);
}

// Escuchamos el evento estandar DOMContentLoaded para asegurar que todo el HTML este listo
document.addEventListener('DOMContentLoaded', iniciarAplicacion);
