/**
 * Archivo: server.js
 * Proposito: Servidor backend en Node.js utilizando el framework Express.
 *            Cumple con los siguientes requerimientos obligatorios:
 *            1. Despacha la interfaz grafica (HTML semantico, CSS moderno y JS modular).
 *            2. Genera contrasenias seguras del lado del servidor respondiendo a peticiones de Axios.
 *            3. Administra la base de datos en archivo local JSON ('database/contrasenas.json') en localhost.
 *            4. Aplica el patron Vector de Clases (GestorContrasenas) y modelos con GET y SET.
 *            5. Emite eventos propios del servidor utilizando la clase nativa EventEmitter.
 * Modulos usados:
 *   - express, cors, morgan (dependencias de produccion)
 *   - node:events (EventEmitter), node:path, node:url (modulos estandar de Node.js)
 *   - ./modules/moduloClases.js, ./modules/moduloGeneradorServidor.js, ./modules/moduloPersistencia.js
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';

import {
    CATEGORIAS_VALIDAS,
    ConfiguracionGenerador,
    RegistroContrasena
} from './modules/moduloClases.js';
import {
    evaluarSeguridad,
    generarContrasenasServidor
} from './modules/moduloGeneradorServidor.js';
import {
    RUTA_BASE_DATOS,
    cargarGestorContrasenas,
    guardarGestorContrasenas
} from './modules/moduloPersistencia.js';

// Obtenemos de forma multiplataforma la ruta absoluta del directorio raiz del proyecto
const __nombreArchivo = fileURLToPath(import.meta.url);
const __directorioRaiz = path.dirname(__nombreArchivo);

/**
 * Clase que hereda de EventEmitter para emitir y escuchar eventos internos en el servidor.
 * 
 * En criollo formal: Cumple con el tema de "Eventos" del lado del servidor.
 * Cuando alguien genera una clave o guarda una credencial, el servidor dispara un evento
 * que puede registrar logs, auditorias o notificar a otros servicios desacoplados.
 */
class EmisorEventosServidor extends EventEmitter {}

/**
 * Fabrica asincrona para construir, configurar y retornar la aplicacion de Express.
 * 
 * En criollo formal: Centraliza toda la configuracion del servidor (middlewares, rutas estaticas,
 * endpoints de la API y eventos) permitiendo tanto encender el servidor en produccion
 * como correr pruebas unitarias aisladas sin levantar puertos fijos.
 * 
 * @param {Object} opciones Opciones de configuracion (rutaBaseDatos, silenciarLogs).
 * @returns {Promise<{ aplicacion: express.Application, emisorEventos: EmisorEventosServidor }>}
 */
export async function crearAplicacion(opciones = {}) {
    const rutaBaseDatos = opciones.rutaBaseDatos || RUTA_BASE_DATOS;
    const silenciarLogs = Boolean(opciones.silenciarLogs);

    const aplicacion = express();
    const emisorEventos = new EmisorEventosServidor();

    // Registramos los escuchadores de eventos del servidor
    if (!silenciarLogs) {
        emisorEventos.on('contrasena:generada', (info) => {
            console.log(`[EVENTO SERVIDOR] Generada(s) ${info.cantidad} clave(s) de ${info.longitud} caracteres (${info.nivelSeguridad})`);
        });
        emisorEventos.on('registro:guardado', (info) => {
            console.log(`[EVENTO SERVIDOR] Guardada credencial para "${info.servicio}" [${info.categoria}]`);
        });
        emisorEventos.on('registro:actualizado', (info) => {
            console.log(`[EVENTO SERVIDOR] Actualizada credencial "${info.servicio}" (ID: ${info.id})`);
        });
        emisorEventos.on('registro:eliminado', (info) => {
            console.log(`[EVENTO SERVIDOR] Eliminada credencial "${info.servicio}" (ID: ${info.id})`);
        });
        emisorEventos.on('historial:vaciado', (info) => {
            console.log(`[EVENTO SERVIDOR] Historial JSON vaciado (${info.eliminados} eliminados)`);
        });
    }

    // Inicializamos la base de datos JSON en disco
    await cargarGestorContrasenas(rutaBaseDatos);

    // Middlewares esenciales
    aplicacion.use(cors());
    aplicacion.use(express.json({ limit: '1mb' }));
    aplicacion.use(express.urlencoded({ extended: true }));
    if (!silenciarLogs) {
        aplicacion.use(morgan('dev'));
    }

    // Despacho de carpetas estaticas segun la arquitectura requerida
    aplicacion.use('/styles', express.static(path.join(__directorioRaiz, 'styles')));
    aplicacion.use('/scripts', express.static(path.join(__directorioRaiz, 'scripts')));
    aplicacion.use('/modules', express.static(path.join(__directorioRaiz, 'modules')));
    aplicacion.use('/vendor/axios', express.static(path.join(__directorioRaiz, 'node_modules/axios/dist')));

    aplicacion.get('/favicon.ico', (_req, res) => res.status(204).end());

    // Ruta raiz: entrega la pagina HTML semantica
    aplicacion.get(['/', '/index.html'], (_req, res) => {
        res.sendFile('index.html', { root: path.join(__directorioRaiz, 'pages') });
    });

    // =========================================================================
    // ENDPOINTS DE LA API (RESPUESTAS DEL LADO DEL SERVIDOR OBLIGATORIAS)
    // =========================================================================

    /**
     * GET /api/salud
     * En criollo: Chequeo de estado. Responde si Node.js esta vivo y cuantas claves hay guardadas.
     * Consumido desde el cliente mediante Axios.
     */
    aplicacion.get('/api/salud', async (_req, res) => {
        try {
            const gestor = await cargarGestorContrasenas(rutaBaseDatos);
            res.json({
                exito: true,
                mensaje: 'Servidor Node.js operativo.',
                datos: {
                    motor: `Node.js ${process.version}`,
                    archivoBaseDatos: path.basename(rutaBaseDatos),
                    totalGuardadas: gestor.total,
                    categorias: CATEGORIAS_VALIDAS
                }
            });
        } catch (error) {
            res.status(500).json({
                exito: false,
                mensaje: `Error al consultar estado: ${error.message}`
            });
        }
    });

    /**
     * POST /api/generar
     * En criollo: Genera de 1 a 5 contrasenias seguras con node:crypto y calcula su fuerza.
     * Consumido desde el cliente mediante Axios.
     */
    aplicacion.post('/api/generar', (req, res) => {
        try {
            // Validamos los parametros con la clase ConfiguracionGenerador
            const configuracion = new ConfiguracionGenerador(req.body || {});
            const resultado = generarContrasenasServidor(configuracion);

            // Disparamos el evento de servidor
            emisorEventos.emit('contrasena:generada', {
                cantidad: resultado.lista.length,
                longitud: resultado.principal.longitud,
                nivelSeguridad: resultado.principal.nivelSeguridad
            });

            res.json({
                exito: true,
                mensaje: resultado.lista.length > 1
                    ? `Se generaron ${resultado.lista.length} contrasenias en el servidor.`
                    : 'Contrasenia generada con exito en el servidor.',
                datos: resultado
            });
        } catch (error) {
            res.status(400).json({
                exito: false,
                mensaje: error.message || 'Parametros invalidos para la generacion.'
            });
        }
    });

    /**
     * GET /api/contrasenas
     * En criollo: Lee el archivo database/contrasenas.json y devuelve las claves filtradas.
     * Consumido desde el cliente mediante Fetch API.
     */
    aplicacion.get('/api/contrasenas', async (req, res) => {
        try {
            const gestor = await cargarGestorContrasenas(rutaBaseDatos);
            const filtradas = gestor.filtrar({
                busqueda: req.query.busqueda || '',
                categoria: req.query.categoria || 'Todas'
            });

            res.json({
                exito: true,
                mensaje: 'Contrasenias cargadas desde database/contrasenas.json.',
                datos: {
                    registros: filtradas.map((reg) => reg.aObjetoJSON()),
                    total: gestor.total
                }
            });
        } catch (error) {
            res.status(500).json({
                exito: false,
                mensaje: `Error al leer la base de datos JSON: ${error.message}`
            });
        }
    });

    /**
     * POST /api/contrasenas
     * En criollo: Guarda una nueva clave en el archivo database/contrasenas.json.
     * Consumido desde el cliente mediante Fetch API.
     */
    aplicacion.post('/api/contrasenas', async (req, res) => {
        try {
            const gestor = await cargarGestorContrasenas(rutaBaseDatos);
            const cuerpo = req.body || {};
            const seguridad = evaluarSeguridad(cuerpo.contrasena || '');

            // Creamos la instancia validada mediante sus setters de clase
            const nuevo = new RegistroContrasena({
                servicio: cuerpo.servicio,
                usuario: cuerpo.usuario || '',
                categoria: cuerpo.categoria || 'Personal',
                contrasena: cuerpo.contrasena,
                ...seguridad
            });

            gestor.agregar(nuevo);
            await guardarGestorContrasenas(gestor, rutaBaseDatos);

            emisorEventos.emit('registro:guardado', {
                id: nuevo.id,
                servicio: nuevo.servicio,
                categoria: nuevo.categoria
            });

            res.status(201).json({
                exito: true,
                mensaje: `Contrasenia de "${nuevo.servicio}" guardada correctamente en localhost.`,
                datos: {
                    registro: nuevo.aObjetoJSON(),
                    total: gestor.total
                }
            });
        } catch (error) {
            res.status(400).json({
                exito: false,
                mensaje: error.message || 'No se pudo guardar la contrasenia en el archivo JSON.'
            });
        }
    });

    /**
     * PUT /api/contrasenas/:id
     * En criollo: Modifica una contrasenia existente segun su ID.
     * Consumido desde el cliente mediante Fetch API.
     */
    aplicacion.put('/api/contrasenas/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const gestor = await cargarGestorContrasenas(rutaBaseDatos);
            const existente = gestor.buscarPorId(id);

            if (!existente) {
                return res.status(404).json({
                    exito: false,
                    mensaje: `No existe ningun registro con el ID "${id}".`
                });
            }

            const cambios = { ...(req.body || {}) };
            if (cambios.contrasena !== undefined) {
                Object.assign(cambios, evaluarSeguridad(cambios.contrasena));
            }

            const actualizado = gestor.actualizar(id, cambios);
            await guardarGestorContrasenas(gestor, rutaBaseDatos);

            emisorEventos.emit('registro:actualizado', {
                id: actualizado.id,
                servicio: actualizado.servicio
            });

            return res.json({
                exito: true,
                mensaje: `Registro "${actualizado.servicio}" actualizado con exito.`,
                datos: {
                    registro: actualizado.aObjetoJSON(),
                    total: gestor.total
                }
            });
        } catch (error) {
            return res.status(400).json({
                exito: false,
                mensaje: error.message || 'No se pudo actualizar el registro.'
            });
        }
    });

    /**
     * DELETE /api/contrasenas/:id
     * En criollo: Borra una contrasenia especifica de database/contrasenas.json.
     * Consumido desde el cliente mediante Fetch API.
     */
    aplicacion.delete('/api/contrasenas/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const gestor = await cargarGestorContrasenas(rutaBaseDatos);
            const eliminado = gestor.eliminar(id);

            if (!eliminado) {
                return res.status(404).json({
                    exito: false,
                    mensaje: `Registro con ID "${id}" no encontrado en el archivo JSON.`
                });
            }

            await guardarGestorContrasenas(gestor, rutaBaseDatos);

            emisorEventos.emit('registro:eliminado', {
                id: eliminado.id,
                servicio: eliminado.servicio
            });

            return res.json({
                exito: true,
                mensaje: `Registro "${eliminado.servicio}" eliminado de database/contrasenas.json.`,
                datos: {
                    eliminado: eliminado.aObjetoJSON(),
                    total: gestor.total
                }
            });
        } catch (error) {
            return res.status(500).json({
                exito: false,
                mensaje: `Error al eliminar el registro: ${error.message}`
            });
        }
    });

    /**
     * DELETE /api/contrasenas
     * En criollo: Vacia todas las contrasenias del archivo JSON.
     * Consumido desde el cliente mediante Fetch API.
     */
    aplicacion.delete('/api/contrasenas', async (_req, res) => {
        try {
            const gestor = await cargarGestorContrasenas(rutaBaseDatos);
            const eliminados = gestor.vaciar();
            await guardarGestorContrasenas(gestor, rutaBaseDatos);

            emisorEventos.emit('historial:vaciado', { eliminados });

            res.json({
                exito: true,
                mensaje: `Historial vaciado (${eliminados} registro(s) eliminados del archivo JSON).`,
                datos: { total: 0 }
            });
        } catch (error) {
            res.status(500).json({
                exito: false,
                mensaje: `Error al vaciar el historial: ${error.message}`
            });
        }
    });

    // Manejador 404 para rutas de API no definidas
    aplicacion.use('/api', (_req, res) => {
        res.status(404).json({
            exito: false,
            mensaje: 'Ruta de API inexistente en el servidor.'
        });
    });

    return { aplicacion, emisorEventos };
}

// Punto de entrada si el archivo se ejecuta directamente con 'node server.js'
const esEjecucionDirecta = process.argv[1]
    && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (esEjecucionDirecta) {
    const PUERTO = Number(process.env.PORT) || 3000;
    const { aplicacion } = await crearAplicacion();

    aplicacion.listen(PUERTO, () => {
        console.log('==============================================================');
        console.log(` Generador de Contrasenias activo en http://localhost:${PUERTO}`);
        console.log(` Base de datos JSON en: ${RUTA_BASE_DATOS}`);
        console.log('==============================================================');
    });
}
