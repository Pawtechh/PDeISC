/**
 * Modulo: moduloClases.js
 * Proposito: Definir las clases del modelo de dominio para el simulador de carrito de compras,
 *            aplicando encapsulamiento estricto mediante atributos privados, metodos getters,
 *            setters con validaciones y gestion de un vector de clases para los elementos del carrito.
 * Modulos usados: Ninguno (Modulo base de dominio exportable para entorno servidor y cliente).
 * Clases principales:
 *   - Producto: Modela un articulo del catalogo con validaciones de precio y existencias.
 *   - ElementoCarrito: Modela una linea de pedido compuesta por una instancia de Producto y su cantidad.
 *   - CarritoCompras: Gestiona el vector de clases de elementos, calculos de subtotales, IVA y cupones.
 *   - OrdenCompra: Modela el comprobante formal de una transaccion completada.
 */

/**
 * Clase que representa un producto individual del inventario.
 */
export class Producto {
    #identificador;
    #nombre;
    #precio;
    #categoria;
    #existencias;
    #enlaceImagen;
    #descripcion;
    #porcentajeDescuento;

    /**
     * Constructor de la clase Producto.
     * Que hace: Asigna y valida los atributos iniciales del producto.
     * Por que: Garantiza que ninguna instancia posea valores indefinidos o inconsistentes.
     * @param {Object} parametros Datos de construccion del producto.
     */
    constructor({
        identificador,
        nombre,
        precio,
        categoria,
        existencias,
        enlaceImagen,
        descripcion,
        porcentajeDescuento = 0
    }) {
        if (!identificador) {
            throw new Error('El identificador del producto es un campo requerido.');
        }
        this.#identificador = Number(identificador);
        this.nombre = nombre;
        this.precio = precio;
        this.categoria = categoria;
        this.existencias = existencias;
        this.#enlaceImagen = enlaceImagen || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
        this.descripcion = descripcion;
        this.porcentajeDescuento = porcentajeDescuento;
    }

    // --- METODOS GETTERS ---

    get identificador() {
        return this.#identificador;
    }

    get nombre() {
        return this.#nombre;
    }

    get precio() {
        return this.#precio;
    }

    get categoria() {
        return this.#categoria;
    }

    get existencias() {
        return this.#existencias;
    }

    get enlaceImagen() {
        return this.#enlaceImagen;
    }

    get descripcion() {
        return this.#descripcion;
    }

    get porcentajeDescuento() {
        return this.#porcentajeDescuento;
    }

    /**
     * Getter para obtener el precio final aplicando el descuento vigente si existiera.
     * Por que: Centraliza la logica comercial para que la interfaz y el servidor consuman el mismo calculo.
     */
    get precioFinal() {
        if (this.#porcentajeDescuento > 0) {
            const rebaja = (this.#precio * this.#porcentajeDescuento) / 100;
            return Number((this.#precio - rebaja).toFixed(2));
        }
        return this.#precio;
    }

    // --- METODOS SETTERS CON VALIDACION ---

    set nombre(nuevoNombre) {
        if (!nuevoNombre || typeof nuevoNombre !== 'string' || nuevoNombre.trim().length === 0) {
            throw new Error('El nombre del producto debe ser una cadena de texto no vacia.');
        }
        this.#nombre = nuevoNombre.trim();
    }

    set precio(nuevoPrecio) {
        const valorNumerico = Number(nuevoPrecio);
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            throw new Error('El precio debe ser un numero positivo mayor a cero.');
        }
        this.#precio = Number(valorNumerico.toFixed(2));
    }

    set categoria(nuevaCategoria) {
        if (!nuevaCategoria || typeof nuevaCategoria !== 'string' || nuevaCategoria.trim().length === 0) {
            throw new Error('La categoria no puede estar vacia.');
        }
        this.#categoria = nuevaCategoria.trim();
    }

    set existencias(nuevasExistencias) {
        const entero = parseInt(nuevasExistencias, 10);
        if (isNaN(entero) || entero < 0) {
            throw new Error('Las existencias en inventario deben ser un numero entero mayor o igual a cero.');
        }
        this.#existencias = entero;
    }

    set descripcion(nuevaDescripcion) {
        this.#descripcion = String(nuevaDescripcion || 'Sin descripcion detallada.').trim();
    }

    set porcentajeDescuento(nuevoPorcentaje) {
        const porcentaje = Number(nuevoPorcentaje);
        if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 90) {
            throw new Error('El porcentaje de descuento debe situarse en el rango de 0 a 90.');
        }
        this.#porcentajeDescuento = porcentaje;
    }

    // --- METODOS DE COMPORTAMIENTO ---

    /**
     * Verifica si se cuenta con existencias suficientes.
     * @param {number} cantidadRequerida Cantidad solicitada.
     * @returns {boolean}
     */
    tieneExistencias(cantidadRequerida = 1) {
        return this.#existencias >= cantidadRequerida;
    }

    /**
     * Descuenta del stock la cantidad vendida.
     * @param {number} cantidad Unidades a descontar.
     */
    descontarExistencias(cantidad = 1) {
        if (!this.tieneExistencias(cantidad)) {
            throw new Error(`Inventario insuficiente para "${this.#nombre}". Disponibles: ${this.#existencias}`);
        }
        this.#existencias -= cantidad;
        return this.#existencias;
    }

    /**
     * Incrementa existencias (por cancelacion o reabastecimiento).
     * @param {number} cantidad Unidades a ingresar.
     */
    incrementarExistencias(cantidad = 1) {
        if (cantidad <= 0) {
            throw new Error('La cantidad a restituir debe ser un entero positivo.');
        }
        this.#existencias += cantidad;
        return this.#existencias;
    }

    /**
     * Transforma la instancia en un objeto plano serializable.
     * @returns {Object}
     */
    aObjetoPlano() {
        return {
            identificador: this.identificador,
            nombre: this.nombre,
            precio: this.precio,
            precioFinal: this.precioFinal,
            categoria: this.categoria,
            existencias: this.existencias,
            enlaceImagen: this.enlaceImagen,
            descripcion: this.descripcion,
            porcentajeDescuento: this.porcentajeDescuento,
            disponible: this.existencias > 0
        };
    }
}

/**
 * Clase que representa un renglon del carrito de compras.
 * Asocia una instancia de Producto con una cantidad de unidades.
 */
export class ElementoCarrito {
    #producto;
    #cantidad;

    /**
     * Constructor de ElementoCarrito.
     * @param {Producto} producto Instancia de la clase Producto.
     * @param {number} cantidad Cantidad inicial de compra.
     */
    constructor(producto, cantidad = 1) {
        if (!producto || !(producto instanceof Producto)) {
            throw new Error('ElementoCarrito requiere obligatoriamente una instancia valida de Producto.');
        }
        this.#producto = producto;
        this.cantidad = cantidad;
    }

    // --- GETTERS ---

    get producto() {
        return this.#producto;
    }

    get cantidad() {
        return this.#cantidad;
    }

    get subtotal() {
        return Number((this.#producto.precioFinal * this.#cantidad).toFixed(2));
    }

    // --- SETTER ---

    set cantidad(nuevaCantidad) {
        const entero = parseInt(nuevaCantidad, 10);
        if (isNaN(entero) || entero <= 0) {
            throw new Error('La cantidad de un elemento debe ser como minimo 1 unidad.');
        }
        if (!this.#producto.tieneExistencias(entero)) {
            throw new Error(`Inventario insuficiente. Solo quedan ${this.#producto.existencias} unidades de "${this.#producto.nombre}".`);
        }
        this.#cantidad = entero;
    }

    aObjetoPlano() {
        return {
            identificadorProducto: this.#producto.identificador,
            nombre: this.#producto.nombre,
            precioUnitario: this.#producto.precio,
            precioFinal: this.#producto.precioFinal,
            porcentajeDescuento: this.#producto.porcentajeDescuento,
            categoria: this.#producto.categoria,
            enlaceImagen: this.#producto.enlaceImagen,
            existenciasDisponibles: this.#producto.existencias,
            cantidad: this.cantidad,
            subtotal: this.subtotal
        };
    }
}

/**
 * Clase CarritoCompras
 * Administra un VECTOR DE CLASES (Array de instancias de ElementoCarrito).
 * Aplica operaciones de vectores: find, findIndex, filter, map, reduce, splice.
 */
export class CarritoCompras {
    // Vector de Clases ElementoCarrito[]
    #elementos;
    #codigoCupon;
    #porcentajeCupon;
    static IVA_TASA = 0.21; // Tasa del 21%

    constructor() {
        this.#elementos = [];
        this.#codigoCupon = null;
        this.#porcentajeCupon = 0;
    }

    // --- GETTERS ---

    /**
     * Retorna una copia superficial del vector de clases para resguardar la inmutabilidad directa.
     */
    get elementos() {
        return [...this.#elementos];
    }

    /**
     * Calcula el total de unidades utilizando Array.prototype.reduce().
     */
    get totalUnidades() {
        return this.#elementos.reduce((acumulador, item) => acumulador + item.cantidad, 0);
    }

    /**
     * Calcula la suma de subtotales mediante Array.prototype.reduce().
     */
    get subtotal() {
        const acumulado = this.#elementos.reduce((acumulador, item) => acumulador + item.subtotal, 0);
        return Number(acumulado.toFixed(2));
    }

    get codigoCupon() {
        return this.#codigoCupon;
    }

    get porcentajeCupon() {
        return this.#porcentajeCupon;
    }

    /**
     * Monto monetario del descuento por cupon.
     */
    get montoDescuentoCupon() {
        if (this.#porcentajeCupon <= 0) return 0;
        const rebaja = (this.subtotal * this.#porcentajeCupon) / 100;
        return Number(rebaja.toFixed(2));
    }

    /**
     * Base gravable neta despues de aplicar el cupon.
     */
    get baseImponible() {
        const resultado = this.subtotal - this.montoDescuentoCupon;
        return Number(Math.max(0, resultado).toFixed(2));
    }

    /**
     * Monto del impuesto al valor agregado (IVA 21%).
     */
    get iva() {
        const calculado = this.baseImponible * CarritoCompras.IVA_TASA;
        return Number(calculado.toFixed(2));
    }

    /**
     * Monto final a cancelar (Base imponible mas IVA).
     */
    get total() {
        const suma = this.baseImponible + this.iva;
        return Number(suma.toFixed(2));
    }

    get estaVacio() {
        return this.#elementos.length === 0;
    }

    // --- METODOS SOBRE EL VECTOR DE CLASES ---

    /**
     * Agrega un producto al vector de clases o incrementa unidades si ya existe.
     * Utiliza Array.prototype.find()
     * @param {Producto} producto Instancia del producto.
     * @param {number} cantidad Cantidad requerida.
     */
    agregarProducto(producto, cantidad = 1) {
        if (!producto || !(producto instanceof Producto)) {
            throw new Error('Se requiere una instancia valida de Producto.');
        }

        const elementoExistente = this.#elementos.find(
            item => item.producto.identificador === producto.identificador
        );

        if (elementoExistente) {
            const nuevaCantidad = elementoExistente.cantidad + cantidad;
            elementoExistente.cantidad = nuevaCantidad;
            return { elemento: elementoExistente, operacion: 'actualizado' };
        } else {
            const nuevoElemento = new ElementoCarrito(producto, cantidad);
            this.#elementos.push(nuevoElemento);
            return { elemento: nuevoElemento, operacion: 'agregado' };
        }
    }

    /**
     * Modifica la cantidad de un elemento del vector de clases.
     */
    actualizarCantidad(identificadorProducto, nuevaCantidad) {
        const idNumerico = Number(identificadorProducto);
        const elemento = this.#elementos.find(
            item => item.producto.identificador === idNumerico
        );

        if (!elemento) {
            throw new Error(`No existe el producto con identificador ${identificadorProducto} en el carrito.`);
        }

        if (nuevaCantidad <= 0) {
            return this.eliminarProducto(idNumerico);
        }

        elemento.cantidad = nuevaCantidad;
        return elemento;
    }

    /**
     * Elimina un elemento del vector de clases usando findIndex() y splice().
     */
    eliminarProducto(identificadorProducto) {
        const idNumerico = Number(identificadorProducto);
        const indice = this.#elementos.findIndex(
            item => item.producto.identificador === idNumerico
        );

        if (indice === -1) {
            throw new Error(`El producto con identificador ${identificadorProducto} no se encuentra en el carrito.`);
        }

        const [elementoRemovido] = this.#elementos.splice(indice, 1);
        return elementoRemovido;
    }

    /**
     * Vacia el vector de elementos.
     */
    vaciar() {
        this.#elementos = [];
        this.#codigoCupon = null;
        this.#porcentajeCupon = 0;
        return true;
    }

    /**
     * Asocia un cupon comercial valido al carrito.
     */
    aplicarCupon(codigo, porcentaje) {
        if (this.estaVacio) {
            throw new Error('No es posible aplicar un cupon a un carrito sin productos.');
        }
        const pct = Number(porcentaje);
        if (isNaN(pct) || pct <= 0 || pct > 70) {
            throw new Error('El porcentaje del cupon debe ser mayor a cero y no exceder el 70%.');
        }
        this.#codigoCupon = String(codigo).toUpperCase().trim();
        this.#porcentajeCupon = pct;
        return {
            codigo: this.#codigoCupon,
            porcentaje: this.#porcentajeCupon,
            montoDescuento: this.montoDescuentoCupon
        };
    }

    /**
     * Desvincula el cupon activo.
     */
    removerCupon() {
        const codigoPrevio = this.#codigoCupon;
        this.#codigoCupon = null;
        this.#porcentajeCupon = 0;
        return codigoPrevio;
    }

    /**
     * Convierte el carrito a una estructura serializable JSON.
     * Utiliza Array.prototype.map() sobre el vector de clases.
     */
    aObjetoPlano() {
        return {
            elementos: this.#elementos.map(item => item.aObjetoPlano()),
            totalUnidades: this.totalUnidades,
            subtotal: this.subtotal,
            codigoCupon: this.#codigoCupon,
            porcentajeCupon: this.#porcentajeCupon,
            montoDescuentoCupon: this.montoDescuentoCupon,
            baseImponible: this.baseImponible,
            ivaTasa: CarritoCompras.IVA_TASA * 100,
            iva: this.iva,
            total: this.total,
            estaVacio: this.estaVacio
        };
    }
}

/**
 * Clase que representa una orden de compra concretada.
 */
export class OrdenCompra {
    #numeroOrden;
    #codigoSeguimiento;
    #fechaRegistro;
    #comprador;
    #elementos;
    #totales;
    #metodoPago;
    #estado;

    constructor({ comprador, elementos, totales, metodoPago }) {
        if (!comprador || !comprador.nombre || !comprador.correoElectronico) {
            throw new Error('Los datos del comprador estan incompletos para generar la orden.');
        }
        if (!elementos || elementos.length === 0) {
            throw new Error('No es posible emitir una orden de compra sin elementos asociados.');
        }

        this.#numeroOrden = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.#codigoSeguimiento = `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        this.#fechaRegistro = new Date().toISOString();
        this.#comprador = { ...comprador };
        this.#elementos = [...elementos];
        this.#totales = { ...totales };
        this.#metodoPago = metodoPago || 'Tarjeta de Credito';
        this.#estado = 'APROBADA Y REGISTRADA';
    }

    get numeroOrden() { return this.#numeroOrden; }
    get codigoSeguimiento() { return this.#codigoSeguimiento; }
    get fechaRegistro() { return this.#fechaRegistro; }
    get comprador() { return { ...this.#comprador }; }
    get elementos() { return [...this.#elementos]; }
    get totales() { return { ...this.#totales }; }
    get metodoPago() { return this.#metodoPago; }
    get estado() { return this.#estado; }

    aObjetoPlano() {
        return {
            numeroOrden: this.numeroOrden,
            codigoSeguimiento: this.codigoSeguimiento,
            fechaRegistro: this.fechaRegistro,
            comprador: this.comprador,
            elementos: this.elementos,
            totales: this.totales,
            metodoPago: this.metodoPago,
            estado: this.estado
        };
    }
}
