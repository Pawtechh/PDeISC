/**
 * Modulo: moduloPeticiones.js
 * Proposito: Centralizar la comunicacion HTTP con el servidor Node.js, integrando de forma
 *            diferenciada y armonica la libreria Axios y la API nativa Fetch.
 * Modulos usados: Ninguno directo (utiliza window.axios y la funcion global fetch del navegador).
 * Funciones principales:
 *   - servicioAxios.obtenerCatalogo: Recupera los productos desde el backend con parametros de consulta.
 *   - servicioAxios.obtenerCategorias: Obtiene las categorias unicas desde el servidor.
 *   - servicioAxios.obtenerCupones: Obtiene los cupones comerciales vigentes.
 *   - servicioAxios.guardarProducto: Realiza el Alta o Modificacion (ABM) de un producto via POST/PUT.
 *   - servicioAxios.eliminarProductoCatalogo: Realiza la Baja (ABM) de un producto via DELETE.
 *   - servicioFetch.obtenerEstadoCarrito: Consulta la composicion actual del carrito en el servidor.
 *   - servicioFetch.agregarElemento: Envia solicitud para agregar un producto al carrito.
 *   - servicioFetch.actualizarCantidadElemento: Modifica unidades de un elemento existente.
 *   - servicioFetch.eliminarElemento: Remueve un producto del carrito.
 *   - servicioFetch.vaciarCarrito: Elimina todos los elementos del carrito.
 *   - servicioFetch.aplicarCupon: Asocia un codigo de descuento en el servidor.
 *   - servicioFetch.removerCupon: Quita el cupon activo.
 *   - servicioFetch.procesarCompra: Ejecuta la confirmacion y checkout de la orden de compra.
 */

/**
 * Servicio encargado de las peticiones HTTP gestionadas a traves de Axios.
 * Se emplea para catalogo, metadatos y operaciones ABM de inventario.
 */
export const servicioAxios = {
    /**
     * Consulta el catalogo con filtros aplicados.
     * @param {Object} filtros Criterios de busqueda, orden y categoria.
     * @returns {Promise<Object>} Datos devueltos por el servidor.
     */
    async obtenerCatalogo(filtros = {}) {
        try {
            const respuesta = await window.axios.get('/api/productos', {
                params: filtros
            });
            if (!respuesta.data.exito) {
                throw new Error(respuesta.data.mensaje || 'Error al recuperar el catalogo.');
            }
            return respuesta.data.datos;
        } catch (error) {
            const mensajeError = error.response?.data?.mensaje || error.message;
            throw new Error(`Fallo en peticion Axios: ${mensajeError}`);
        }
    },

    /**
     * Recupera el listado de categorias registradas en el backend.
     */
    async obtenerCategorias() {
        try {
            const respuesta = await window.axios.get('/api/categorias');
            return respuesta.data.datos || ['todas'];
        } catch (error) {
            console.error('Error al recuperar categorias via Axios:', error);
            return ['todas'];
        }
    },

    /**
     * Recupera los cupones vigentes desde el backend.
     */
    async obtenerCupones() {
        try {
            const respuesta = await window.axios.get('/api/cupones');
            return respuesta.data.datos || [];
        } catch (error) {
            console.error('Error al recuperar cupones via Axios:', error);
            return [];
        }
    },

    /**
     * Registra un nuevo producto (Alta) o actualiza uno existente (Modificacion) en el backend.
     * @param {Object} datosProducto Informacion del formulario de producto.
     * @param {number|null} identificadorExistente Si existe, ejecuta PUT; de lo contrario, POST.
     */
    async guardarProducto(datosProducto, identificadorExistente = null) {
        try {
            let respuesta;
            if (identificadorExistente) {
                respuesta = await window.axios.put(`/api/productos/${identificadorExistente}`, datosProducto);
            } else {
                respuesta = await window.axios.post('/api/productos', datosProducto);
            }
            if (!respuesta.data.exito) {
                throw new Error(respuesta.data.mensaje);
            }
            return respuesta.data.datos;
        } catch (error) {
            const mensajeError = error.response?.data?.mensaje || error.message;
            throw new Error(mensajeError);
        }
    },

    /**
     * Da de baja un producto del catalogo en el backend (Baja del ABM).
     */
    async eliminarProductoCatalogo(identificador) {
        try {
            const respuesta = await window.axios.delete(`/api/productos/${identificador}`);
            if (!respuesta.data.exito) {
                throw new Error(respuesta.data.mensaje);
            }
            return respuesta.data.datos;
        } catch (error) {
            const mensajeError = error.response?.data?.mensaje || error.message;
            throw new Error(mensajeError);
        }
    }
};

/**
 * Servicio encargado de las peticiones HTTP gestionadas con la API nativa Fetch.
 * Se emplea para las transacciones del carrito y la concrecion de compras (Checkout).
 */
export const servicioFetch = {
    /**
     * Metodo privado auxiliar para estandarizar las peticiones Fetch.
     */
    async _ejecutarPeticion(url, configuracion = {}) {
        const encabezadosPredeterminados = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const opcionesFinales = {
            ...configuracion,
            headers: {
                ...encabezadosPredeterminados,
                ...configuracion.headers
            }
        };

        const respuesta = await fetch(url, opcionesFinales);
        const cuerpoJson = await respuesta.json();

        if (!respuesta.ok || !cuerpoJson.exito) {
            throw new Error(cuerpoJson.mensaje || `Fallo en el servidor con estado ${respuesta.status}`);
        }

        return cuerpoJson.datos;
    },

    async obtenerEstadoCarrito() {
        return this._ejecutarPeticion('/api/carrito');
    },

    async agregarElemento(identificadorProducto, cantidad = 1) {
        return this._ejecutarPeticion('/api/carrito/agregar', {
            method: 'POST',
            body: JSON.stringify({ identificadorProducto, cantidad })
        });
    },

    async actualizarCantidadElemento(identificadorProducto, cantidad) {
        return this._ejecutarPeticion('/api/carrito/actualizar', {
            method: 'PUT',
            body: JSON.stringify({ identificadorProducto, cantidad })
        });
    },

    async eliminarElemento(identificadorProducto) {
        return this._ejecutarPeticion(`/api/carrito/elemento/${identificadorProducto}`, {
            method: 'DELETE'
        });
    },

    async vaciarCarrito() {
        return this._ejecutarPeticion('/api/carrito/vaciar', {
            method: 'DELETE'
        });
    },

    async aplicarCupon(codigo) {
        return this._ejecutarPeticion('/api/carrito/cupon', {
            method: 'POST',
            body: JSON.stringify({ codigo })
        });
    },

    async removerCupon() {
        return this._ejecutarPeticion('/api/carrito/cupon', {
            method: 'DELETE'
        });
    },

    async procesarCompra(datosComprador, metodoPago) {
        return this._ejecutarPeticion('/api/ordenes/checkout', {
            method: 'POST',
            body: JSON.stringify({
                comprador: datosComprador,
                metodoPago
            })
        });
    }
};
