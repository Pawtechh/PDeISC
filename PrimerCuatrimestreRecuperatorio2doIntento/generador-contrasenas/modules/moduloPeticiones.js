/**
 * Modulo: modules/moduloPeticiones.js
 * Proposito: Centraliza de manera atomizada y ordenada todas las peticiones HTTP entre el navegador
 *            y nuestro servidor Node.js en localhost.
 *            Aqui se demuestra el uso de ambas tecnologias vistas en el cuatrimestre:
 *            1. Axios: para comunicarse con el generador de claves y chequear la salud del servidor.
 *            2. Fetch: para las operaciones de ABM (Alta, Baja, Modificacion y Consulta) sobre
 *               nuestra base de datos local 'database/contrasenas.json'.
 * Modulos usados: Utiliza window.axios (cargado localmente desde /vendor/axios) y fetch (nativo del navegador).
 */

/**
 * Servicio HTTP basado en la libreria externa Axios.
 * Axios es una libreria HTTP basada en promesas que serializa JSON automaticamente y rechaza
 * la promesa ante codigos HTTP 4xx/5xx para capturar cualquier error del servidor en el catch.
 */
export const servicioAxios = {
    /**
     * Consulta el estado operativo del servidor y las categorias disponibles.
     * Verifica que el servidor Node.js este operativo y obtiene las categorias configuradas.
     * @returns {Promise<Object>} Promesa que resuelve con los datos del servidor (motor Node, base JSON, categorias).
     * @throws {Error} Si el servidor esta apagado o hubo un fallo de conexion.
     */
    async obtenerSalud() {
        try {
            // Hacemos una peticion GET al endpoint '/api/salud'.
            // Axios nos devuelve todo empaquetado en el objeto 'respuesta', y el cuerpo ya parseado esta en 'respuesta.data'.
            const respuesta = await window.axios.get('/api/salud');
            return respuesta.data.datos;
        } catch (error) {
            // Si el servidor respondio con un error HTTP (ej. 500), el mensaje viene en error.response.data.mensaje.
            // Si directamente se cayo la red, usamos error.message.
            const mensaje = error.response?.data?.mensaje || error.message;
            throw new Error(`Error Axios al verificar servidor: ${mensaje}`);
        }
    },

    /**
     * Envia la configuracion elegida en los controles al servidor para que este genere la clave.
     * Envia las opciones de configuracion via POST y recibe las contrasenias generadas.
     * @param {Object} configuracion Objeto plano con longitud, booleanos de caracteres y cantidad.
     * @returns {Promise<Object>} Promesa que resuelve con el JSON de respuesta ({ exito, mensaje, datos }).
     * @throws {Error} Si las opciones son invalidas segun las reglas del servidor.
     */
    async generarContrasenas(configuracion) {
        try {
            // Hacemos un POST con Axios. Axios toma el objeto 'configuracion' y lo convierte
            // a JSON automaticamente en el cuerpo (body) de la solicitud con el header correcto.
            const respuesta = await window.axios.post('/api/generar', configuracion);
            return respuesta.data;
        } catch (error) {
            const mensaje = error.response?.data?.mensaje || error.message;
            throw new Error(mensaje);
        }
    }
};

/**
 * Funcion auxiliar interna para procesar las respuestas de la Fetch API nativa.
 * A diferencia de Axios, fetch() nativo no lanza excepciones ante codigos HTTP 400 o 500.
 * Esta funcion auxiliar extrae el JSON con respuesta.json() y verifica respuesta.ok
 * para lanzar un Error con el mensaje exacto del servidor si la solicitud fallo.
 * @param {Response} respuesta Objeto de respuesta nativo devuelto por fetch().
 * @returns {Promise<Object>} Objeto JSON ya desempaquetado si todo salio bien.
 * @throws {Error} Si el servidor devolvio un estado no exitoso o el cuerpo no es valido.
 */
async function procesarRespuestaFetch(respuesta) {
    // Intentamos extraer el JSON; si por alguna razon el servidor mando texto plano, evitamos que rompa
    const cuerpo = await respuesta.json().catch(() => ({
        exito: false,
        mensaje: 'La respuesta devuelta por el servidor no tiene un formato JSON valido.'
    }));

    // Si el status HTTP no esta en el rango 200-299 o el servidor marco exito: false
    if (!respuesta.ok || !cuerpo.exito) {
        throw new Error(cuerpo.mensaje || `Error HTTP ${respuesta.status} en la peticion Fetch.`);
    }

    return cuerpo;
}

/**
 * Servicio HTTP basado en la Fetch API nativa del navegador.
 * La Fetch API viene integrada de forma nativa en los navegadores modernos sin dependencias.
 * Se utiliza aqui para todas las operaciones ABM sobre database/contrasenas.json.
 */
export const servicioFetch = {
    /**
     * Obtiene todas las contrasenias guardadas en el archivo JSON del servidor.
     * Consulta al backend mediante GET el listado completo de registros guardados en el JSON.
     * @returns {Promise<Array<Object>>} Vector con los registros guardados en la base de datos.
     */
    async listarGuardadas() {
        // Hacemos un GET mediante fetch; aclaramos que aceptamos JSON como respuesta
        const respuesta = await fetch('/api/contrasenas', {
            method: 'GET',
            headers: { Accept: 'application/json' }
        });
        const cuerpo = await procesarRespuestaFetch(respuesta);
        return cuerpo.datos;
    },

    /**
     * Guarda una nueva contrasenia con su servicio, usuario y categoria en el archivo JSON.
     * Envia una nueva credencial mediante POST serializando el cuerpo con JSON.stringify().
     * @param {Object} datos Objeto con servicio, usuario, categoria y contrasena.
     * @returns {Promise<Object>} Respuesta del servidor confirmando el guardado.
     */
    async guardarRegistro(datos) {
        // En fetch es OBLIGATORIO transformar el objeto a texto con JSON.stringify
        // y avisarle al servidor con el encabezado 'Content-Type': 'application/json'
        const respuesta = await fetch('/api/contrasenas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(datos)
        });
        return procesarRespuestaFetch(respuesta);
    },

    /**
     * Modifica los datos de una contrasenia ya existente segun su identificador unico.
     * Actualiza un registro existente en el servidor mediante PUT.
     * @param {string} id Identificador unico del registro (ej: 'reg_12345').
     * @param {Object} cambios Objeto con los nuevos valores a actualizar.
     * @returns {Promise<Object>} Respuesta del servidor confirmando la actualizacion.
     */
    async actualizarRegistro(id, cambios) {
        // Usamos encodeURIComponent en la URL para evitar que caracteres raros rompan la ruta
        const respuesta = await fetch(`/api/contrasenas/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(cambios)
        });
        return procesarRespuestaFetch(respuesta);
    },

    /**
     * Borra una contrasenia puntual de la base de datos JSON segun su ID.
     * Elimina una credencial puntual del archivo JSON mediante DELETE.
     * @param {string} id Identificador unico del registro a eliminar.
     * @returns {Promise<Object>} Confirmacion del servidor de que el registro fue borrado.
     */
    async eliminarRegistro(id) {
        const respuesta = await fetch(`/api/contrasenas/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' }
        });
        return procesarRespuestaFetch(respuesta);
    },

    /**
     * Borra absolutamente todas las contrasenias guardadas en el archivo JSON.
     * Vacia todos los registros de la base de datos JSON mediante DELETE.
     * @returns {Promise<Object>} Confirmacion del servidor indicando cuantos registros se eliminaron.
     */
    async vaciarHistorial() {
        const respuesta = await fetch('/api/contrasenas', {
            method: 'DELETE',
            headers: { Accept: 'application/json' }
        });
        return procesarRespuestaFetch(respuesta);
    }
};
