/**
 * Modulo: principal.js
 * Proposito: Punto de entrada del cliente web en el navegador. Orquesta la inicializacion de la aplicacion,
 *            la captura de eventos de la interfaz de usuario, la sincronizacion con la API del servidor Express
 *            mediante Fetch y Axios, y la manipulacion reactiva de los elementos del DOM.
 * Modulos usados:
 *   - moduloPeticiones.js (servicioAxios, servicioFetch)
 *   - moduloInterfaz.js (mostrarNotificacion, alternarTemaColor, inicializarTema, renderizarCatalogo, renderizarResumenCarrito, renderizarTicketCompra)
 *   - moduloGestionABM.js (inicializarGestionABM, abrirFormularioModificacion, ejecutarBajaProducto)
 * Funciones principales:
 *   - iniciarAplicacion: Carga catalogo, categorias, cupones y estado inicial del carrito.
 *   - refrescarCatalogo: Consulta el backend mediante Axios y actualiza las tarjetas de articulos.
 *   - refrescarCarrito: Consulta el backend mediante Fetch y actualiza la lista y totales.
 *   - registrarEscuchasEventos: Asocia todos los listeners a controles de filtrado, busqueda, modales y checkout.
 */

import { servicioAxios, servicioFetch } from '../modules/moduloPeticiones.js';
import {
    mostrarNotificacion,
    alternarTemaColor,
    inicializarTema,
    renderizarCatalogo,
    renderizarResumenCarrito,
    renderizarTicketCompra
} from '../modules/moduloInterfaz.js';
import {
    inicializarGestionABM,
    abrirFormularioModificacion,
    ejecutarBajaProducto
} from '../modules/moduloGestionABM.js';

// Estado reactivo en cliente para los criterios de filtrado del catalogo
const filtrosCatalogo = {
    categoria: 'todas',
    busqueda: '',
    orden: 'precio-asc',
    precioMinimo: undefined,
    precioMaximo: undefined
};

// Referencias a elementos del DOM
let elementoGridCatalogo = null;
let elementoListaCarrito = null;
let referenciasTotales = {};

/**
 * Funcion de arranque principal ejecutada al cargar el DOM.
 */
async function iniciarAplicacion() {
    // 1. Inicializar tema claro / oscuro (claro por defecto obligatorio)
    inicializarTema();

    // 2. Obtener referencias principales del DOM
    elementoGridCatalogo = document.getElementById('grilla-catalogo-productos');
    elementoListaCarrito = document.getElementById('lista-elementos-carrito');

    referenciasTotales = {
        subtotal: document.getElementById('resumen-subtotal-valor'),
        iva: document.getElementById('resumen-iva-valor'),
        total: document.getElementById('resumen-total-valor'),
        contadorEncabezado: document.getElementById('contador-carrito-total'),
        filaCupon: document.getElementById('fila-descuento-cupon'),
        descuentoCupon: document.getElementById('resumen-descuento-cupon-valor'),
        botonVaciar: document.getElementById('boton-vaciar-carrito'),
        botonComprar: document.getElementById('boton-iniciar-checkout')
    };

    // 3. Vincular los eventos de interaccion
    registrarEscuchasEventos();

    // 4. Inicializar modulo ABM de productos
    const formularioABM = document.getElementById('formulario-abm');
    inicializarGestionABM(formularioABM, async () => {
        await cargarCategorias();
        await refrescarCatalogo();
    });

    // 5. Cargar datos iniciales del backend (Categorias, Cupones, Catalogo y Carrito)
    try {
        await cargarCategorias();
        await cargarCuponesDisponibles();
        await refrescarCatalogo();
        await refrescarCarrito();
    } catch (error) {
        mostrarNotificacion(`No se pudo conectar con el servidor: ${error.message}`, 'error');
    }
}

/**
 * Consulta el listado de categorias via Axios y crea los botones de filtrado.
 */
async function cargarCategorias() {
    const contenedor = document.getElementById('contenedor-chips-categorias');
    if (!contenedor) return;

    try {
        const categorias = await servicioAxios.obtenerCategorias();
        contenedor.innerHTML = categorias.map(cat => {
            const estaActiva = cat.toLowerCase() === filtrosCatalogo.categoria.toLowerCase();
            const claseActiva = estaActiva ? 'chip-categoria-activo' : '';
            const etiqueta = cat === 'todas' ? 'Todos los Articulos' : cat;

            return `
                <button 
                    type="button" 
                    class="chip-categoria ${claseActiva}" 
                    data-categoria="${cat}">
                    ${etiqueta}
                </button>
            `;
        }).join('');

        // Evento click en cada chip de categoria
        contenedor.querySelectorAll('.chip-categoria').forEach(boton => {
            boton.addEventListener('click', () => {
                filtrosCatalogo.categoria = boton.getAttribute('data-categoria');
                cargarCategorias();
                refrescarCatalogo();
            });
        });
    } catch (error) {
        console.error('Error al cargar categorias:', error);
    }
}

/**
 * Carga los cupones desde el servidor para presentarlos al usuario.
 */
async function cargarCuponesDisponibles() {
    const contenedor = document.getElementById('cupones-disponibles-lista');
    if (!contenedor) return;

    try {
        const cupones = await servicioAxios.obtenerCupones();
        contenedor.innerHTML = cupones.map(cupon => `
            <button 
                type="button" 
                class="boton-cupon-sugerido" 
                data-codigo="${cupon.codigo}"
                title="${cupon.descripcion}">
                <strong>${cupon.codigo}</strong> (-${cupon.porcentaje}%)
            </button>
        `).join('');

        contenedor.querySelectorAll('.boton-cupon-sugerido').forEach(btn => {
            btn.addEventListener('click', () => {
                const codigo = btn.getAttribute('data-codigo');
                const campoCupon = document.getElementById('campo-codigo-cupon');
                if (campoCupon) {
                    campoCupon.value = codigo;
                    mostrarNotificacion(`Codigo ${codigo} copiado al campo de cupon. Presione Aplicar.`, 'informacion');
                }
            });
        });
    } catch (error) {
        console.error('Error al consultar cupones:', error);
    }
}

/**
 * Consulta el inventario al servidor mediante AXIOS y renderiza el catalogo.
 */
async function refrescarCatalogo() {
    try {
        const datos = await servicioAxios.obtenerCatalogo(filtrosCatalogo);
        renderizarCatalogo(datos.productos, elementoGridCatalogo);

        const badgeTotal = document.getElementById('indicador-total-articulos');
        if (badgeTotal) {
            badgeTotal.textContent = `${datos.total} articulos`;
        }

        vincularEventosArticulos(datos.productos);
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}

/**
 * Asocia eventos de incremento/decremento, agregado al carrito y botones ABM de cada tarjeta.
 */
function vincularEventosArticulos(vectorProductos) {
    if (!elementoGridCatalogo) return;

    // Incrementar cantidad en tarjeta
    elementoGridCatalogo.querySelectorAll('.boton-incrementar-catalogo').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const max = parseInt(btn.getAttribute('data-max'), 10);
            const span = document.getElementById(`contador-cat-${id}`);
            let actual = parseInt(span.textContent, 10);
            if (actual < max) {
                span.textContent = actual + 1;
            } else {
                mostrarNotificacion(`Inventario maximo alcanzado (${max} unidades).`, 'advertencia');
            }
        });
    });

    // Decrementar cantidad en tarjeta
    elementoGridCatalogo.querySelectorAll('.boton-decrementar-catalogo').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const span = document.getElementById(`contador-cat-${id}`);
            let actual = parseInt(span.textContent, 10);
            if (actual > 1) {
                span.textContent = actual - 1;
            }
        });
    });

    // Agregar al carrito usando FETCH
    elementoGridCatalogo.querySelectorAll('.boton-agregar-carrito').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const span = document.getElementById(`contador-cat-${id}`);
            const cantidad = span ? parseInt(span.textContent, 10) : 1;

            try {
                btn.disabled = true;
                const respuesta = await servicioFetch.agregarElemento(id, cantidad);
                mostrarNotificacion(`"${respuesta.elemento.nombre}" fue incorporado al carrito.`, 'exito');
                if (span) span.textContent = '1';
                await refrescarCarrito();
            } catch (error) {
                mostrarNotificacion(error.message, 'error');
            } finally {
                btn.disabled = false;
            }
        });
    });

    // Boton Modificar (ABM)
    elementoGridCatalogo.querySelectorAll('.boton-editar-producto').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.getAttribute('data-id'));
            const producto = vectorProductos.find(p => p.identificador === id);
            if (producto) {
                abrirFormularioModificacion(producto);
            }
        });
    });

    // Boton Eliminar (ABM)
    elementoGridCatalogo.querySelectorAll('.boton-eliminar-producto').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.getAttribute('data-id'));
            const producto = vectorProductos.find(p => p.identificador === id);
            if (producto) {
                ejecutarBajaProducto(producto.identificador, producto.nombre, async () => {
                    await refrescarCatalogo();
                    await refrescarCarrito();
                });
            }
        });
    });
}

/**
 * Consulta el estado actual del carrito al servidor mediante FETCH y renderiza su contenido.
 */
async function refrescarCarrito() {
    try {
        const estadoCarrito = await servicioFetch.obtenerEstadoCarrito();
        renderizarResumenCarrito(estadoCarrito, elementoListaCarrito, referenciasTotales);
        vincularEventosCarrito();
    } catch (error) {
        console.error('Error al sincronizar carrito:', error);
    }
}

/**
 * Asocia eventos dentro del panel del carrito (modificar cantidades y eliminar elementos).
 */
function vincularEventosCarrito() {
    if (!elementoListaCarrito) return;

    // Modificar cantidad (+ / -) con Fetch
    elementoListaCarrito.querySelectorAll('.btn-cant-carrito').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const accion = btn.getAttribute('data-accion');
            const cantidadActual = parseInt(btn.getAttribute('data-cantidad'), 10);
            let nuevaCantidad = accion === 'incrementar' ? cantidadActual + 1 : cantidadActual - 1;

            if (accion === 'incrementar') {
                const max = parseInt(btn.getAttribute('data-max'), 10);
                if (nuevaCantidad > max) {
                    mostrarNotificacion(`No hay mas existencias disponibles (${max} unidades).`, 'advertencia');
                    return;
                }
            }

            try {
                await servicioFetch.actualizarCantidadElemento(id, nuevaCantidad);
                await refrescarCarrito();
            } catch (error) {
                mostrarNotificacion(error.message, 'error');
            }
        });
    });

    // Remover elemento con Fetch
    elementoListaCarrito.querySelectorAll('.boton-remover-renglon').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            try {
                await servicioFetch.eliminarElemento(id);
                mostrarNotificacion('Articulo retirado del pedido.', 'informacion');
                await refrescarCarrito();
            } catch (error) {
                mostrarNotificacion(error.message, 'error');
            }
        });
    });
}

/**
 * Registra los escuchas de eventos estaticos de la interfaz (Filtros, Busqueda, Modales, Cupones).
 */
function registrarEscuchasEventos() {
    // 1. Cambio de Tema Claro / Oscuro
    const botonTema = document.getElementById('boton-cambiar-tema');
    if (botonTema) {
        botonTema.addEventListener('click', alternarTemaColor);
    }

    // 2. Busqueda en tiempo real (evento input)
    const campoBusqueda = document.getElementById('campo-busqueda-texto');
    if (campoBusqueda) {
        campoBusqueda.addEventListener('input', (evento) => {
            filtrosCatalogo.busqueda = evento.target.value.trim();
            refrescarCatalogo();
        });
    }

    // 3. Ordenamiento (evento change)
    const selectorOrden = document.getElementById('selector-criterio-orden');
    if (selectorOrden) {
        selectorOrden.addEventListener('change', (evento) => {
            filtrosCatalogo.orden = evento.target.value;
            refrescarCatalogo();
        });
    }

    // 4. Rango de Precios
    const campoPrecioMin = document.getElementById('campo-precio-min');
    const campoPrecioMax = document.getElementById('campo-precio-max');
    const botonFiltrarPrecio = document.getElementById('boton-filtrar-precios');
    const botonRestablecer = document.getElementById('boton-restablecer-filtros');

    if (botonFiltrarPrecio) {
        botonFiltrarPrecio.addEventListener('click', () => {
            filtrosCatalogo.precioMinimo = campoPrecioMin.value ? Number(campoPrecioMin.value) : undefined;
            filtrosCatalogo.precioMaximo = campoPrecioMax.value ? Number(campoPrecioMax.value) : undefined;
            refrescarCatalogo();
        });
    }

    if (botonRestablecer) {
        botonRestablecer.addEventListener('click', () => {
            if (campoBusqueda) campoBusqueda.value = '';
            if (campoPrecioMin) campoPrecioMin.value = '';
            if (campoPrecioMax) campoPrecioMax.value = '';
            if (selectorOrden) selectorOrden.value = 'precio-asc';

            filtrosCatalogo.categoria = 'todas';
            filtrosCatalogo.busqueda = '';
            filtrosCatalogo.orden = 'precio-asc';
            filtrosCatalogo.precioMinimo = undefined;
            filtrosCatalogo.precioMaximo = undefined;

            cargarCategorias();
            refrescarCatalogo();
            mostrarNotificacion('Filtros restablecidos.', 'informacion');
        });
    }

    // 5. Aplicar y Remover Cupon (con Fetch)
    const botonAplicarCupon = document.getElementById('boton-aplicar-cupon');
    const campoCodigoCupon = document.getElementById('campo-codigo-cupon');
    const botonQuitarCupon = document.getElementById('boton-quitar-cupon');

    if (botonAplicarCupon && campoCodigoCupon) {
        botonAplicarCupon.addEventListener('click', async () => {
            const codigo = campoCodigoCupon.value.trim();
            if (!codigo) {
                mostrarNotificacion('Ingrese un codigo de cupon para aplicar.', 'advertencia');
                return;
            }

            try {
                const res = await servicioFetch.aplicarCupon(codigo);
                mostrarNotificacion(`Cupon ${res.resultado.codigo} aplicado con exito (-${res.resultado.porcentaje}%).`, 'exito');
                campoCodigoCupon.value = '';
                await refrescarCarrito();
            } catch (error) {
                mostrarNotificacion(error.message, 'error');
            }
        });
    }

    if (botonQuitarCupon) {
        botonQuitarCupon.addEventListener('click', async () => {
            try {
                await servicioFetch.removerCupon();
                mostrarNotificacion('Cupon removido.', 'informacion');
                await refrescarCarrito();
            } catch (error) {
                mostrarNotificacion(error.message, 'error');
            }
        });
    }

    // 6. Vaciar Carrito (con Fetch y confirmacion DOM sin alert)
    const botonVaciar = document.getElementById('boton-vaciar-carrito');
    if (botonVaciar) {
        botonVaciar.addEventListener('click', async () => {
            const modalConfirmacion = document.getElementById('modal-confirmacion-baja');
            const textoMensaje = document.getElementById('texto-confirmacion-baja');
            const botonAceptar = document.getElementById('boton-confirmar-baja');
            const botonCancelar = document.getElementById('boton-cancelar-baja');

            if (!modalConfirmacion) return;

            textoMensaje.textContent = '¿Confirma que desea vaciar todos los articulos del carrito de compras?';
            modalConfirmacion.classList.remove('oculto');

            const nuevoAceptar = botonAceptar.cloneNode(true);
            botonAceptar.parentNode.replaceChild(nuevoAceptar, botonAceptar);

            const nuevoCancelar = botonCancelar.cloneNode(true);
            botonCancelar.parentNode.replaceChild(nuevoCancelar, botonCancelar);

            nuevoCancelar.addEventListener('click', () => {
                modalConfirmacion.classList.add('oculto');
            });

            nuevoAceptar.addEventListener('click', async () => {
                modalConfirmacion.classList.add('oculto');
                try {
                    await servicioFetch.vaciarCarrito();
                    mostrarNotificacion('El carrito ha sido vaciado.', 'informacion');
                    await refrescarCarrito();
                } catch (error) {
                    mostrarNotificacion(error.message, 'error');
                }
            });
        });
    }

    // 7. Modal de Checkout y Envio de Orden (Evento submit sin alert)
    const botonAbrirCheckout = document.getElementById('boton-iniciar-checkout');
    const modalCheckout = document.getElementById('modal-formulario-checkout');
    const botonCerrarCheckout = document.getElementById('boton-cerrar-checkout');
    const botonCancelarCheckout = document.getElementById('boton-cancelar-checkout');
    const formularioCheckout = document.getElementById('formulario-finalizar-compra');

    if (botonAbrirCheckout && modalCheckout) {
        botonAbrirCheckout.addEventListener('click', () => {
            modalCheckout.classList.remove('oculto');
            document.body.classList.add('bloqueo-desplazamiento');
        });
    }

    const cerrarCheckout = () => {
        if (modalCheckout) {
            modalCheckout.classList.add('oculto');
            document.body.classList.remove('bloqueo-desplazamiento');
        }
    };

    if (botonCerrarCheckout) botonCerrarCheckout.addEventListener('click', cerrarCheckout);
    if (botonCancelarCheckout) botonCancelarCheckout.addEventListener('click', cerrarCheckout);

    if (formularioCheckout) {
        formularioCheckout.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const nombre = document.getElementById('checkout-nombre').value.trim();
            const apellido = document.getElementById('checkout-apellido').value.trim();
            const email = document.getElementById('checkout-email').value.trim();
            const telefono = document.getElementById('checkout-telefono').value.trim();
            const direccion = document.getElementById('checkout-direccion').value.trim();
            const ciudad = document.getElementById('checkout-ciudad').value.trim();
            const metodoPago = document.getElementById('checkout-metodo-pago').value;

            // Validacion estricta: todos los campos son obligatorios
            if (!nombre || !apellido || !email || !telefono || !direccion || !ciudad) {
                mostrarNotificacion('Todos los campos son obligatorios. Por favor completelos todos.', 'advertencia');
                return;
            }

            // Validacion especifica de solo letras en Nombre
            const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
            if (!regexSoloLetras.test(nombre)) {
                mostrarNotificacion('El campo Nombre no puede contener numeros ni caracteres especiales.', 'advertencia');
                return;
            }

            if (nombre.length < 3) {
                mostrarNotificacion('El campo Nombre debe contener como minimo 3 letras.', 'advertencia');
                return;
            }

            // Validacion especifica de solo letras en Apellido
            if (!regexSoloLetras.test(apellido)) {
                mostrarNotificacion('El campo Apellido no puede contener numeros ni caracteres especiales.', 'advertencia');
                return;
            }

            if (apellido.length < 2) {
                mostrarNotificacion('El campo Apellido debe contener como minimo 2 letras.', 'advertencia');
                return;
            }

            // Validacion estricta de Email
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexEmail.test(email)) {
                mostrarNotificacion('Ingrese un correo electronico con formato valido (ejemplo@dominio.com).', 'advertencia');
                return;
            }

            // Validacion estricta de Telefono (solo numeros, min. 8 digitos)
            const regexSoloNumeros = /^[0-9]+$/;
            if (!regexSoloNumeros.test(telefono)) {
                mostrarNotificacion('El telefono debe contener exclusivamente numeros, sin letras ni simbolos.', 'advertencia');
                return;
            }

            if (telefono.length < 8) {
                mostrarNotificacion('El numero de telefono debe tener al menos 8 digitos.', 'advertencia');
                return;
            }

            // Validacion estricta de Domicilio: debe contener Calle y Altura numerica
            // Ejemplo: "San Martin 500", "Av. Corrientes 1234", "Rivadavia 45"
            const regexCalleAltura = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\.\s]+\s+[0-9]+[a-zA-Z0-9\s]*$/;
            const tieneNumero = /\d+/.test(direccion);
            const tieneTexto = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{2,}/.test(direccion);
            if (!tieneNumero || !tieneTexto || !regexCalleAltura.test(direccion)) {
                mostrarNotificacion('El domicilio debe incluir obligatoriamente el nombre de la calle y la altura numerica (Ej: San Martin 500).', 'advertencia');
                return;
            }

            // Validacion estricta de Ciudad (solo letras y espacios, min. 3 caracteres)
            if (!regexSoloLetras.test(ciudad) || ciudad.length < 3) {
                mostrarNotificacion('La ciudad debe contener solo letras (sin numeros) y al menos 3 caracteres (Ej: Buenos Aires, Rosario, Cordoba).', 'advertencia');
                return;
            }

            const botonConfirmar = formularioCheckout.querySelector('button[type="submit"]');
            try {
                botonConfirmar.disabled = true;
                botonConfirmar.textContent = 'Procesando transaccion...';

                const datosComprador = {
                    nombre,
                    apellido,
                    nombreCompleto: `${nombre} ${apellido}`,
                    correoElectronico: email,
                    telefono,
                    direccionEntrega: direccion,
                    ciudad
                };

                const ordenGenerada = await servicioFetch.procesarCompra(datosComprador, metodoPago);
                mostrarNotificacion('¡Compra confirmada y procesada exitosamente en el servidor!', 'exito');

                cerrarCheckout();
                formularioCheckout.reset();

                // Mostrar modal de ticket
                const modalFactura = document.getElementById('modal-ticket-factura');
                const contenedorTicket = document.getElementById('cuerpo-ticket-imprimible');
                renderizarTicketCompra(ordenGenerada, contenedorTicket);
                if (modalFactura) {
                    modalFactura.classList.remove('oculto');
                    document.body.classList.add('bloqueo-desplazamiento');
                }

                await refrescarCarrito();
                await refrescarCatalogo();
            } catch (error) {
                mostrarNotificacion(`No se pudo completar la orden: ${error.message}`, 'error');
            } finally {
                botonConfirmar.disabled = false;
                botonConfirmar.textContent = 'Confirmar y Pagar';
            }
        });
    }

    // 8. Cierre e Impresion del Ticket Fiscal
    const modalFactura = document.getElementById('modal-ticket-factura');
    const botonCerrarTicket = document.getElementById('boton-cerrar-ticket');
    const botonContinuarComprando = document.getElementById('boton-continuar-comprando');
    const botonImprimirTicket = document.getElementById('boton-imprimir-ticket');

    const cerrarFactura = () => {
        if (modalFactura) {
            modalFactura.classList.add('oculto');
            document.body.classList.remove('bloqueo-desplazamiento');
        }
    };

    if (botonCerrarTicket) botonCerrarTicket.addEventListener('click', cerrarFactura);
    if (botonContinuarComprando) botonContinuarComprando.addEventListener('click', cerrarFactura);
    if (botonImprimirTicket) {
        botonImprimirTicket.addEventListener('click', () => {
            window.print();
        });
    }

    // 9. Restricciones en tiempo real en los campos del formulario (impedir letras en numeros y numeros en texto)
    vincularRestriccionesEntradaCampos();

    // 10. Boton Flotante para Volver a la Parte Superior (Scroll to Top)
    vincularBotonVolverArriba();
}

/**
 * Restringe en tiempo real el tipeo de caracteres invalidos en cada casilla.
 */
function vincularRestriccionesEntradaCampos() {
    // Solo letras en Nombre, Apellido y Ciudad
    const camposSoloTexto = [
        document.getElementById('checkout-nombre'),
        document.getElementById('checkout-apellido'),
        document.getElementById('checkout-ciudad'),
        document.getElementById('abm-categoria')
    ];

    camposSoloTexto.forEach(campo => {
        if (campo) {
            campo.addEventListener('input', (e) => {
                // Elimina numeros y caracteres no alfabeticos
                const valorFiltrado = e.target.value.replace(/[0-9]/g, '');
                if (e.target.value !== valorFiltrado) {
                    e.target.value = valorFiltrado;
                    mostrarNotificacion('Este campo solo admite letras. No se permiten numeros.', 'advertencia', 1800);
                }
            });
        }
    });

    // Solo numeros en Telefono
    const campoTelefono = document.getElementById('checkout-telefono');
    if (campoTelefono) {
        campoTelefono.addEventListener('input', (e) => {
            // Elimina letras y simbolos excepto digitos
            const valorFiltrado = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value !== valorFiltrado) {
                e.target.value = valorFiltrado;
                mostrarNotificacion('El telefono solo permite numeros. No se admiten letras ni simbolos.', 'advertencia', 1800);
            }
        });
    }

    // Solo numeros en campos numericos de inventario
    const camposNumericos = [
        document.getElementById('campo-precio-min'),
        document.getElementById('campo-precio-max'),
        document.getElementById('abm-existencias'),
        document.getElementById('abm-descuento')
    ];

    camposNumericos.forEach(campo => {
        if (campo) {
            campo.addEventListener('input', (e) => {
                const valorFiltrado = e.target.value.replace(/[^0-9]/g, '');
                if (e.target.value !== valorFiltrado) {
                    e.target.value = valorFiltrado;
                }
            });
        }
    });
}

/**
 * Controla la visibilidad y el desplazamiento suave del boton de volver arriba.
 */
function vincularBotonVolverArriba() {
    const botonArriba = document.getElementById('boton-volver-arriba');
    if (!botonArriba) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 220) {
            botonArriba.classList.remove('oculto');
        } else {
            botonArriba.classList.add('oculto');
        }
    });

    botonArriba.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Inicializar la aplicacion cuando el documento HTML este listo
document.addEventListener('DOMContentLoaded', iniciarAplicacion);
