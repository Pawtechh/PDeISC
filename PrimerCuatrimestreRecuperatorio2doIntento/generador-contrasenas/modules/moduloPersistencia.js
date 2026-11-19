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
// Encadena las escrituras en orden secuencial para evitar condiciones de carrera
// o corrupcion del archivo JSON ante peticiones simultaneas.
let colaEscritura = Promise.resolve();

/**
 * Genera la estructura inicial con un par de registros de muestra si la base arranca vacia.
 * Inicializa el archivo JSON con registros de ejemplo cuando la base arranca vacia.
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
 * Crea el directorio database/ si falta y valida o genera el archivo contrasenas.json inicial.
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
 * Lee el archivo JSON del disco e instancia un Vector de Clases GestorContrasenas con los datos.
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
 * Serializa el Vector de Clases a JSON legible (4 espacios) y lo escribe en disco con la cola.
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
