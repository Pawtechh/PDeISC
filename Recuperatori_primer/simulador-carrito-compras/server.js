/**
 * Archivo: server.js
 * Proposito: Servidor HTTP principal construido sobre Node.js y el framework Express.
 *            Centraliza el despacho de archivos estaticos requeridos por la arquitectura (/styles, /scripts, /modules, /pages),
 *            expone la API RESTful para el catalogo, el carrito y el proceso de checkout, e implementa
 *            la arquitectura de eventos con EventEmitter nativo y Programacion Orientada a Objetos.
 * Modulos usados:
 *   - express: Enrutamiento y despacho de peticiones HTTP.
 *   - node:path y node:url: Resolucion multiplataforma de rutas en el sistema de archivos (ES Modules).
 *   - node:events: Emisor de eventos del servidor para trazabilidad de compras e inventario.
 *   - ./modules/moduloClases.js: Clases del modelo de dominio (Producto, CarritoCompras, OrdenCompra).
 * Funciones y rutas principales:
 *   - GET /: Despacha la pagina principal pages/index.html.
 *   - GET /api/productos: Consulta filtrada del vector de productos.
 *   - POST /api/productos: Alta de un nuevo producto (ABM).
 *   - PUT /api/productos/:id: Modificacion de un producto existente (ABM).
 *   - DELETE /api/productos/:id: Baja definitiva de un producto (ABM).
 *   - GET /api/carrito: Consulta del estado del vector de clases del carrito.
 *   - POST /api/carrito/agregar: Agrega o incrementa un producto en el carrito.
 *   - PUT /api/carrito/actualizar: Modifica la cantidad de un elemento.
 *   - DELETE /api/carrito/elemento/:id: Remueve un elemento del carrito.
 *   - DELETE /api/carrito/vaciar: Limpia el vector del carrito.
 *   - POST /api/carrito/cupon: Aplica descuento comercial.
 *   - DELETE /api/carrito/cupon: Desvincula el cupon.
 *   - POST /api/ordenes/checkout: Valida stock, descuenta existencias y genera la orden de compra.
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventEmitter } from 'node:events';
import { Producto, CarritoCompras, OrdenCompra } from './modules/moduloClases.js';

// Configuracion de rutas absolutas para modulos ES6
const __nombreArchivo = fileURLToPath(import.meta.url);
const __directorioRaiz = path.dirname(__nombreArchivo);

const aplicacion = express();
const PUERTO = process.env.PORT || 3000;

// Emisor de eventos en Node.js
class EmisorTienda extends EventEmitter {}
const emisorTienda = new EmisorTienda();

// Escuchas de eventos del servidor
emisorTienda.on('producto:agregado', (detalle) => {
    console.log(`[EVENTO SERVIDOR - producto:agregado] Producto: ${detalle.nombre} | Cantidad: ${detalle.cantidad}`);
});

emisorTienda.on('orden:completada', (orden) => {
    console.log(`[EVENTO SERVIDOR - orden:completada] Nro Orden: ${orden.numeroOrden} | Total: $${orden.totales.total}`);
});

emisorTienda.on('inventario:critico', (detalle) => {
    console.warn(`[EVENTO SERVIDOR - inventario:critico] Alerta de existencias bajas para: ${detalle.nombre} (Disponibles: ${detalle.existencias})`);
});

// ================= MIDDLEWARES =================
aplicacion.use(express.json());
aplicacion.use(express.urlencoded({ extended: true }));

// Despacho estatico exclusivo segun la arquitectura requerida (/styles, /scripts, /modules)
aplicacion.use('/styles', express.static(path.join(__directorioRaiz, 'styles')));
aplicacion.use('/scripts', express.static(path.join(__directorioRaiz, 'scripts')));
aplicacion.use('/modules', express.static(path.join(__directorioRaiz, 'modules')));

// Manejador de favicon para responder 204 No Content y evitar errores 500
aplicacion.get('/favicon.ico', (peticion, respuesta) => {
    respuesta.status(204).end();
});

// ================= VECTOR DE CLASES EN MEMORIA (INVENTARIO) =================
const vectorInventario = [
    new Producto({
        identificador: 1,
        nombre: 'Laptop Portatil Profesional 15 Pulgadas',
        precio: 1250.00,
        categoria: 'Computacion',
        existencias: 8,
        enlaceImagen: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80',
        descripcion: 'Microprocesador de 8 nucleos, 16GB de memoria RAM DDR5 y unidad solida de 512GB NVMe.',
        porcentajeDescuento: 10
    }),
    new Producto({
        identificador: 2,
        nombre: 'Auriculares Inalambricos con Cancelacion de Ruido',
        precio: 210.00,
        categoria: 'Audio',
        existencias: 14,
        enlaceImagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        descripcion: 'Autonomia de bateria de 35 horas, microfono integrado y almohadillas viscoelasticas.',
        porcentajeDescuento: 15
    }),
    new Producto({
        identificador: 3,
        nombre: 'Teclado Mecanico Retroiluminado Switch Red',
        precio: 85.00,
        categoria: 'Perifericos',
        existencias: 20,
        enlaceImagen: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
        descripcion: 'Interruptores lineales de accionamiento rapido, estructura metalica y cable USB tipo C.',
        porcentajeDescuento: 0
    }),
    new Producto({
        identificador: 4,
        nombre: 'Raton Ergonomico Inalambrico de Precision',
        precio: 55.00,
        categoria: 'Perifericos',
        existencias: 16,
        enlaceImagen: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
        descripcion: 'Sensor optico graduable de hasta 4000 DPI con conexion Bluetooth y receptor USB.',
        porcentajeDescuento: 5
    }),
    new Producto({
        identificador: 5,
        nombre: 'Monitor Panoramico 27 Pulgadas QHD',
        precio: 320.00,
        categoria: 'Monitores',
        existencias: 6,
        enlaceImagen: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        descripcion: 'Panel IPS con resolucion 2560x1440, frecuencia de actualizacion de 144Hz y compatibilidad HDR.',
        porcentajeDescuento: 12
    }),
    new Producto({
        identificador: 6,
        nombre: 'Reloj Inteligente Deportivo con Pulsometro',
        precio: 160.00,
        categoria: 'Accesorios',
        existencias: 10,
        enlaceImagen: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        descripcion: 'Pantalla AMOLED a color, sumergible hasta 50 metros y monitorizacion de ritmo cardiaco.',
        porcentajeDescuento: 0
    })
];

// Vector de cupones comerciales validos
const vectorCuponesValidos = [
    { codigo: 'ESTUDIANTE10', porcentaje: 10, descripcion: 'Rebaja del 10% para compras del ambito academico' },
    { codigo: 'PROMO20', porcentaje: 20, descripcion: 'Descuento especial del 20%' },
    { codigo: 'BIENVENIDA15', porcentaje: 15, descripcion: 'Beneficio de bienvenida del 15%' }
];

// Instancia unica del Carrito de Compras en servidor
const carritoServidor = new CarritoCompras();

// Vector de ordenes completadas
const vectorOrdenesEmitidas = [];

// ================= RUTA PRINCIPAL (SIRVE PAGES/INDEX.HTML) =================
aplicacion.use('/pages', express.static(path.join(__directorioRaiz, 'pages')));

aplicacion.get('/', (peticion, respuesta) => {
    respuesta.sendFile('pages/index.html', { root: __directorioRaiz });
});

aplicacion.get('/pages/index.html', (peticion, respuesta) => {
    respuesta.sendFile('pages/index.html', { root: __directorioRaiz });
});

// ================= RUTAS DE LA API: CATALOGO Y ABM (PRODUCTOS) =================

/**
 * GET /api/productos: Consulta de catalogo con filtros de categoria, busqueda y orden.
 */
aplicacion.get('/api/productos', (peticion, respuesta) => {
    try {
        const { categoria, busqueda, orden, precioMinimo, precioMaximo } = peticion.query;
        let resultado = [...vectorInventario];

        // Filtrado por categoria (Array.prototype.filter)
        if (categoria && categoria !== 'todas') {
            resultado = resultado.filter(item => item.categoria.toLowerCase() === categoria.toLowerCase());
        }

        // Filtrado por termino textual
        if (busqueda && busqueda.trim().length > 0) {
            const termino = busqueda.trim().toLowerCase();
            resultado = resultado.filter(item =>
                item.nombre.toLowerCase().includes(termino) ||
                item.descripcion.toLowerCase().includes(termino)
            );
        }

        // Filtrado por rango de precios
        if (precioMinimo !== undefined && !isNaN(Number(precioMinimo))) {
            resultado = resultado.filter(item => item.precioFinal >= Number(precioMinimo));
        }
        if (precioMaximo !== undefined && !isNaN(Number(precioMaximo))) {
            resultado = resultado.filter(item => item.precioFinal <= Number(precioMaximo));
        }

        // Ordenamiento (Array.prototype.sort)
        if (orden === 'precio-asc') {
            resultado.sort((a, b) => a.precioFinal - b.precioFinal);
        } else if (orden === 'precio-desc') {
            resultado.sort((a, b) => b.precioFinal - a.precioFinal);
        } else if (orden === 'nombre-asc') {
            resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
        } else if (orden === 'nombre-desc') {
            resultado.sort((a, b) => b.nombre.localeCompare(a.nombre));
        }

        return respuesta.status(200).json({
            exito: true,
            mensaje: 'Inventario obtenido correctamente.',
            datos: {
                total: resultado.length,
                productos: resultado.map(p => p.aObjetoPlano())
            }
        });
    } catch (error) {
        return respuesta.status(500).json({
            exito: false,
            mensaje: `Fallo al recuperar inventario: ${error.message}`
        });
    }
});

/**
 * POST /api/productos: Alta de un nuevo producto (Requisito 15 ABM).
 */
aplicacion.post('/api/productos', (peticion, respuesta) => {
    try {
        const { nombre, precio, categoria, existencias, porcentajeDescuento, enlaceImagen, descripcion } = peticion.body;

        const nuevoId = vectorInventario.length > 0
            ? Math.max(...vectorInventario.map(p => p.identificador)) + 1
            : 1;

        const nuevoProducto = new Producto({
            identificador: nuevoId,
            nombre,
            precio,
            categoria,
            existencias,
            porcentajeDescuento,
            enlaceImagen,
            descripcion
        });

        vectorInventario.push(nuevoProducto);

        return respuesta.status(201).json({
            exito: true,
            mensaje: 'Producto incorporado con exito al inventario.',
            datos: nuevoProducto.aObjetoPlano()
        });
    } catch (error) {
        return respuesta.status(400).json({
            exito: false,
            mensaje: `Fallo al crear producto: ${error.message}`
        });
    }
});

/**
 * PUT /api/productos/:id: Modificacion de un producto existente (Requisito 15 ABM).
 */
aplicacion.put('/api/productos/:id', (peticion, respuesta) => {
    try {
        const idBuscado = Number(peticion.params.id);
        const productoEncontrado = vectorInventario.find(p => p.identificador === idBuscado);

        if (!productoEncontrado) {
            return respuesta.status(404).json({
                exito: false,
                mensaje: `No se hallo ningun producto con el identificador ${idBuscado}.`
            });
        }

        const { nombre, precio, categoria, existencias, porcentajeDescuento, enlaceImagen, descripcion } = peticion.body;

        if (nombre !== undefined) productoEncontrado.nombre = nombre;
        if (precio !== undefined) productoEncontrado.precio = precio;
        if (categoria !== undefined) productoEncontrado.categoria = categoria;
        if (existencias !== undefined) productoEncontrado.existencias = existencias;
        if (porcentajeDescuento !== undefined) productoEncontrado.porcentajeDescuento = porcentajeDescuento;
        if (descripcion !== undefined) productoEncontrado.descripcion = descripcion;

        return respuesta.status(200).json({
            exito: true,
            mensaje: 'Producto modificado exitosamente.',
            datos: productoEncontrado.aObjetoPlano()
        });
    } catch (error) {
        return respuesta.status(400).json({
            exito: false,
            mensaje: `Fallo al modificar el producto: ${error.message}`
        });
    }
});

/**
 * DELETE /api/productos/:id: Baja definitiva de un producto (Requisito 15 ABM).
 */
aplicacion.delete('/api/productos/:id', (peticion, respuesta) => {
    try {
        const idBuscado = Number(peticion.params.id);
        const indice = vectorInventario.findIndex(p => p.identificador === idBuscado);

        if (indice === -1) {
            return respuesta.status(404).json({
                exito: false,
                mensaje: `No existe el producto con identificador ${idBuscado}.`
            });
        }

        const [productoEliminado] = vectorInventario.splice(indice, 1);

        // Si estaba en el carrito, se remueve para evitar inconsistencias
        try {
            carritoServidor.eliminarProducto(idBuscado);
        } catch {
            // No estaba en el carrito, no se requiere accion
        }

        return respuesta.status(200).json({
            exito: true,
            mensaje: `Articulo "${productoEliminado.nombre}" dado de baja del inventario.`,
            datos: productoEliminado.aObjetoPlano()
        });
    } catch (error) {
        return respuesta.status(500).json({
            exito: false,
            mensaje: `Error al dar de baja el producto: ${error.message}`
        });
    }
});

/**
 * GET /api/categorias: Retorna categorias unicas.
 */
aplicacion.get('/api/categorias', (peticion, respuesta) => {
    const categorias = ['todas', ...new Set(vectorInventario.map(p => p.categoria))];
    return respuesta.status(200).json({
        exito: true,
        datos: categorias
    });
});

/**
 * GET /api/cupones: Retorna lista de cupones vigentes.
 */
aplicacion.get('/api/cupones', (peticion, respuesta) => {
    return respuesta.status(200).json({
        exito: true,
        datos: vectorCuponesValidos
    });
});

// ================= RUTAS DEL CARRITO DE COMPRAS (RESPUESTAS DEL SERVIDOR) =================

aplicacion.get('/api/carrito', (peticion, respuesta) => {
    return respuesta.status(200).json({
        exito: true,
        datos: carritoServidor.aObjetoPlano()
    });
});

aplicacion.post('/api/carrito/agregar', (peticion, respuesta) => {
    try {
        const { identificadorProducto, cantidad = 1 } = peticion.body;
        const id = Number(identificadorProducto);
        const producto = vectorInventario.find(p => p.identificador === id);

        if (!producto) {
            return respuesta.status(404).json({
                exito: false,
                mensaje: 'Articulo no localizado en el inventario.'
            });
        }

        const resultado = carritoServidor.agregarProducto(producto, Number(cantidad));

        emisorTienda.emit('producto:agregado', {
            nombre: producto.nombre,
            cantidad: Number(cantidad)
        });

        return respuesta.status(200).json({
            exito: true,
            mensaje: 'Articulo incorporado al carrito.',
            datos: {
                operacion: resultado.operacion,
                elemento: resultado.elemento.aObjetoPlano(),
                carrito: carritoServidor.aObjetoPlano()
            }
        });
    } catch (error) {
        return respuesta.status(400).json({
            exito: false,
            mensaje: error.message
        });
    }
});

aplicacion.put('/api/carrito/actualizar', (peticion, respuesta) => {
    try {
        const { identificadorProducto, cantidad } = peticion.body;
        carritoServidor.actualizarCantidad(identificadorProducto, cantidad);
        return respuesta.status(200).json({
            exito: true,
            mensaje: 'Cantidad actualizada correctamente.',
            datos: carritoServidor.aObjetoPlano()
        });
    } catch (error) {
        return respuesta.status(400).json({
            exito: false,
            mensaje: error.message
        });
    }
});

aplicacion.delete('/api/carrito/elemento/:id', (peticion, respuesta) => {
    try {
        carritoServidor.eliminarProducto(peticion.params.id);
        return respuesta.status(200).json({
            exito: true,
            mensaje: 'Articulo removido del carrito.',
            datos: carritoServidor.aObjetoPlano()
        });
    } catch (error) {
        return respuesta.status(404).json({
            exito: false,
            mensaje: error.message
        });
    }
});

aplicacion.delete('/api/carrito/vaciar', (peticion, respuesta) => {
    carritoServidor.vaciar();
    return respuesta.status(200).json({
        exito: true,
        mensaje: 'El carrito ha sido vaciado.',
        datos: carritoServidor.aObjetoPlano()
    });
});

aplicacion.post('/api/carrito/cupon', (peticion, respuesta) => {
    try {
        const { codigo } = peticion.body;
        const cuponEncontrado = vectorCuponesValidos.find(
            c => c.codigo.toUpperCase() === String(codigo || '').trim().toUpperCase()
        );

        if (!cuponEncontrado) {
            return respuesta.status(400).json({
                exito: false,
                mensaje: `El cupon '${codigo}' no existe o ha expirado.`
            });
        }

        const resultadoCupon = carritoServidor.aplicarCupon(cuponEncontrado.codigo, cuponEncontrado.porcentaje);

        return respuesta.status(200).json({
            exito: true,
            mensaje: `Cupon aplicado: -${resultadoCupon.porcentaje}%`,
            datos: {
                resultado: resultadoCupon,
                carrito: carritoServidor.aObjetoPlano()
            }
        });
    } catch (error) {
        return respuesta.status(400).json({
            exito: false,
            mensaje: error.message
        });
    }
});

aplicacion.delete('/api/carrito/cupon', (peticion, respuesta) => {
    carritoServidor.removerCupon();
    return respuesta.status(200).json({
        exito: true,
        mensaje: 'Cupon removido.',
        datos: carritoServidor.aObjetoPlano()
    });
});

// ================= RUTAS DE ORDENES Y CHECKOUT =================

aplicacion.post('/api/ordenes/checkout', (peticion, respuesta) => {
    try {
        const { comprador, metodoPago } = peticion.body;

        if (!comprador) {
            return respuesta.status(400).json({
                exito: false,
                mensaje: 'Se requieren los datos del comprador.'
            });
        }

        const { nombre, apellido, correoElectronico, telefono, direccionEntrega, ciudad } = comprador;

        // Validacion de campos obligatorios en el servidor
        if (!nombre || !apellido || !correoElectronico || !telefono || !direccionEntrega || !ciudad) {
            return respuesta.status(400).json({
                exito: false,
                mensaje: 'Todos los campos del comprador (Nombre, Apellido, Email, Telefono, Direccion y Ciudad) son obligatorios.'
            });
        }

        // Validacion de longitud minima en Nombre (min. 3) y Apellido (min. 2)
        if (String(nombre).trim().length < 3) {
            return respuesta.status(400).json({
                exito: false,
                mensaje: 'El nombre debe poseer como minimo 3 letras.'
            });
        }

        if (String(apellido).trim().length < 2) {
            return respuesta.status(400).json({
                exito: false,
                mensaje: 'El apellido debe poseer como minimo 2 letras.'
            });
        }

        if (carritoServidor.estaVacio) {
            return respuesta.status(400).json({
                exito: false,
                mensaje: 'El carrito esta vacio. No puede procesarse la orden.'
            });
        }

        const estadoCarrito = carritoServidor.aObjetoPlano();

        // Validar existencias de cada elemento
        for (const item of estadoCarrito.elementos) {
            const producto = vectorInventario.find(p => p.identificador === item.identificadorProducto);
            if (!producto || !producto.tieneExistencias(item.cantidad)) {
                return respuesta.status(409).json({
                    exito: false,
                    mensaje: `Inventario insuficiente para "${item.nombre}". Ajuste su carrito.`
                });
            }
        }

        // Descontar existencias del inventario
        estadoCarrito.elementos.forEach(item => {
            const producto = vectorInventario.find(p => p.identificador === item.identificadorProducto);
            if (producto) {
                producto.descontarExistencias(item.cantidad);
                if (producto.existencias <= 3) {
                    emisorTienda.emit('inventario:critico', {
                        nombre: producto.nombre,
                        existencias: producto.existencias
                    });
                }
            }
        });

        // Crear la instancia de la Orden de Compra
        const ordenEmitida = new OrdenCompra({
            comprador,
            elementos: estadoCarrito.elementos,
            totales: {
                totalUnidades: estadoCarrito.totalUnidades,
                subtotal: estadoCarrito.subtotal,
                codigoCupon: estadoCarrito.codigoCupon,
                montoDescuentoCupon: estadoCarrito.montoDescuentoCupon,
                iva: estadoCarrito.iva,
                total: estadoCarrito.total
            },
            metodoPago
        });

        vectorOrdenesEmitidas.push(ordenEmitida);
        carritoServidor.vaciar();

        emisorTienda.emit('orden:completada', ordenEmitida.aObjetoPlano());

        return respuesta.status(201).json({
            exito: true,
            mensaje: 'Transaccion aprobada y factura emitida con exito.',
            datos: ordenEmitida.aObjetoPlano()
        });
    } catch (error) {
        return respuesta.status(400).json({
            exito: false,
            mensaje: error.message
        });
    }
});

// Manejo de error 404 para endpoints API inexistentes
aplicacion.use('/api', (peticion, respuesta) => {
    return respuesta.status(404).json({
        exito: false,
        mensaje: `Ruta de API inexistente: ${peticion.method} ${peticion.originalUrl}`
    });
});

// Inicializacion del servidor Express
aplicacion.listen(PUERTO, () => {
    console.log('================================================================');
    console.log(`Servidor Express operativo en puerto: ${PUERTO}`);
    console.log(`URL local: http://localhost:${PUERTO}`);
    console.log(`Estructura: server.js en raiz, /pages, /styles, /scripts, /modules`);
    console.log('================================================================');
});
