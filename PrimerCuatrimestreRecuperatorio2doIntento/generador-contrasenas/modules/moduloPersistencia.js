/**
 * Modulo: modules/moduloPersistencia.js
 * Proposito: Administra la lectura y escritura de la base de datos en archivo local JSON
 *            ('database/contrasenas.json') en localhost utilizando node:fs/promises.
 *            Demuestra el almacenamiento persistente sin motores SQL externos y la serializacion
 *            del Vector de Clases GestorContrasenas.
 * Modulos usados:
 *   - node:fs/promises: Operaciones asincronas de archivos con promesas y async/await.
 *   - node:path, node:url: Resolucion segura de rutas en disco.
 *   - ./moduloClases.js (GestorContrasenas, RegistroContrasena): Modelos de datos del sistema.
 *   - ./moduloGeneradorServidor.js (evaluarSeguridad): Para evaluar los registros iniciales de muestra.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GestorContrasenas, RegistroContrasena } from './moduloClases.js';
import { evaluarSeguridad } from './moduloGeneradorServidor.js';

// Resolvemos la ruta absoluta al archivo database/contrasenas.json de forma independiente del sistema operativo
const __archivoActual = fileURLToPath(import.meta.url);
const __directorioModulos = path.dirname(__archivoActual);
export const RUTA_BASE_DATOS = path.resolve(__directorioModulos, '..', 'database', 'contrasenas.json');

// Cola de promesas para escrituras en disco
// En criollo formal: Si dos usuarios o peticiones quieren guardar casi al mismo milisegundo,
// esta variable encadena las escrituras una detras de la otra para que nunca se pisen ni corrompan el archivo JSON.
let colaEscritura = Promise.resolve();

/**
 * Genera la estructura inicial con un par de registros de muestra si la base arranca vacia.
 * En criollo: Si el archivo JSON no existe o esta en blanco, crea un par de contrasenias demo
 * para que cuando abras la pagina por primera vez ya se vea el funcionamiento del historial.
 * 
 * @returns {{ ultimaActualizacion: string, registros: Array<Object> }}
 */
function crearDatosIniciales() {
    const ahora = new Date().toISOString();
    const muestras = [
        {
            id: 'reg_demo_1',
            servicio: 'Correo Personal',
            usuario: 'usuario@correo.local',
            categoria: 'Personal',
            contrasena: 'K8#mP4!vQ2@xL9$zR',
            fechaCreacion: ahora
        },
        {
            id: 'reg_demo_2',
            servicio: 'GitHub Estudio',
            usuario: 'estudiante@dev.local',
            categoria: 'Estudio',
            contrasena: 'N3!wT7@pB5#cF1$m',
            fechaCreacion: ahora
        }
    ];

    // Mapeamos los datos de muestra a objetos JSON evaluados con su nivel de seguridad real
    const registros = muestras.map((item) => {
        const seguridad = evaluarSeguridad(item.contrasena);
        return new RegistroContrasena({ ...item, ...seguridad }).aObjetoJSON();
    });

    return {
        ultimaActualizacion: ahora,
        registros
    };
}

/**
 * Garantiza que la carpeta 'database' y el archivo 'contrasenas.json' existan y sean validos.
 * En criollo: Si no existe la carpeta, la crea; si el archivo no esta, lo escribe con los datos demo.
 * 
 * @param {string} rutaArchivo Ruta absoluta al archivo JSON.
 */
export async function asegurarBaseDatosJSON(rutaArchivo = RUTA_BASE_DATOS) {
    // fs.mkdir con recursive: true crea la carpeta padre si aun no existe
    await fs.mkdir(path.dirname(rutaArchivo), { recursive: true });
    try {
        const contenido = await fs.readFile(rutaArchivo, 'utf-8');
        if (!contenido.trim()) throw new Error('El archivo JSON se encuentra vacio.');
        JSON.parse(contenido); // Comprobamos que sea sintacticamente correcto
    } catch {
        const inicial = crearDatosIniciales();
        await fs.writeFile(rutaArchivo, JSON.stringify(inicial, null, 4), 'utf-8');
    }
}

/**
 * Lee el archivo JSON desde el disco y retorna una instancia viva del Vector de Clases GestorContrasenas.
 * En criollo: Abre el archivo .json, lo lee, y carga cada registro adentro del Vector de Clases en memoria.
 * 
 * @param {string} rutaArchivo Ruta absoluta al archivo de base de datos.
 * @returns {Promise<GestorContrasenas>} Instancia del gestor cargada con los datos del disco.
 */
export async function cargarGestorContrasenas(rutaArchivo = RUTA_BASE_DATOS) {
    await asegurarBaseDatosJSON(rutaArchivo);
    const texto = await fs.readFile(rutaArchivo, 'utf-8');
    const datos = JSON.parse(texto);

    const gestor = new GestorContrasenas();
    gestor.cargarDesdeJSON(Array.isArray(datos.registros) ? datos.registros : []);
    return gestor;
}

/**
 * Guarda el estado actual del Vector de Clases en el archivo JSON del disco.
 * En criollo: Toma el Vector de Clases, lo pasa a texto con formato prolijo (4 espacios)
 * y lo guarda fisicamente en database/contrasenas.json usando la cola para evitar colisiones.
 * 
 * @param {GestorContrasenas} gestor Instancia del gestor que contiene las contrasenias.
 * @param {string} rutaArchivo Ruta absoluta al archivo de persistencia.
 * @returns {Promise<Object>} El documento plano guardado con su fecha de actualizacion.
 */
export function guardarGestorContrasenas(gestor, rutaArchivo = RUTA_BASE_DATOS) {
    const tarea = colaEscritura.then(async () => {
        await fs.mkdir(path.dirname(rutaArchivo), { recursive: true });
        const documento = {
            ultimaActualizacion: new Date().toISOString(),
            registros: gestor.exportarArregloPlano()
        };
        await fs.writeFile(rutaArchivo, JSON.stringify(documento, null, 4), 'utf-8');
        return documento;
    });

    // Encadenamos el catch para que un error eventual no congele las siguientes escrituras
    colaEscritura = tarea.catch(() => undefined);
    return tarea;
}
