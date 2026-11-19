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
 * 
 * En criollo formal: Axios es una libreria que facilita las peticiones HTTP porque ya viene
 * con esteroides: transforma los datos a JSON automaticamente y cuando el servidor responde
 * con un codigo de error (como 400 o 500), salta directo al bloque catch sin que tengamos
 * que verificar a mano si la respuesta salio bien o mal.
 */
export const servicioAxios = {
    /**
     * Consulta el estado operativo del servidor y las categorias disponibles.
     * En criollo: Le pregunta al servidor "¿estas despierto y funcionando?".
     * 
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
     * En criollo: Le manda a Node.js las opciones (longitud, mayusculas, etc.) y recibe la contrasenia lista.
     * 
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
 * 
 * En criollo formal: A diferencia de Axios, la funcion nativa fetch() NO lanza un error
 * si el servidor contesta con un 400 (Bad Request) o 500 (Internal Error); para fetch eso
 * sigue siendo una respuesta valida. Por eso creamos esta funcion que hace dos cosas clave:
 * 1. Extrae el JSON manualmente con respuesta.json().
 * 2. Comprueba si 'respuesta.ok' es true (codigos 200-299); si no lo es, tira un throw Error
 *    con el mensaje exacto que mando el servidor, para que la app se entere del problema.
 * 
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
 * 
 * En criollo formal: Fetch viene incorporado de fábrica en JavaScript moderno sin instalar nada.
 * Aqui lo usamos para todas las operaciones de la base de datos local 'database/contrasenas.json':
 * leer la lista, crear un registro nuevo, modificarlo, eliminar uno solo o vaciar todos.
 */
export const servicioFetch = {
    /**
     * Obtiene todas las contrasenias guardadas en el archivo JSON del servidor.
     * En criollo: Trae del backend el listado completo para pintarlo en la pantalla.
     * 
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
     * En criollo: Da de alta una nueva credencial en la base de datos local.
     * 
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
     * En criollo: Actualiza un registro que ya teniamos guardado en el archivo JSON.
     * 
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
     * En criollo: Elimina del archivo del servidor la clave que el usuario selecciono.
     * 
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
     * En criollo: Limpia por completo la base de datos dejandola vacia.
     * 
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
