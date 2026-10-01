/**
 * Modulo: moduloInterfaz.js
 * Proposito: Gestionar la actualizacion del Document Object Model (DOM), el renderizado visual
 *            del catalogo y del carrito de compras, la administracion del tema claro/oscuro
 *            y la emision de notificaciones flotantes sin recurrir a la funcion alert().
 * Modulos usados: Ninguno directo (interactua con los elementos del DOM).
 * Funciones principales:
 *   - formatearMoneda: Convierte valores numericos a formato estandar de moneda.
 *   - formatearFecha: Formatea cadenas de tiempo a texto legible.
 *   - mostrarNotificacion: Despliega mensajes visuales con transicion en el DOM sin alert().
 *   - alternarTemaColor: Gestiona el cambio entre modo claro (por defecto) y modo oscuro.
 *   - inicializarTema: Aplica la preferencia guardada en localStorage o el valor predeterminado claro.
 *   - renderizarCatalogo: Construye las tarjetas de productos en el contenedor principal.
 *   - renderizarResumenCarrito: Construye el listado de elementos del carrito y los totales.
 *   - renderizarTicketCompra: Construye el comprobante formal de la orden emitida.
 */

/**
 * Formatea un numero a notacion de moneda estandar.
 * @param {number} valor Monto numerico a formatear.
 * @returns {string} Cadena con simbolo de divisa y dos decimales.
 */
export function formatearMoneda(valor) {
    const cantidad = Number(valor) || 0;
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(cantidad);
}

/**
 * Formatea una fecha en formato ISO a una representacion cronologica comprensible.
 * @param {string} marcaTiempo Cadena de fecha ISO.
 * @returns {string}
 */
export function formatearFecha(marcaTiempo) {
    if (!marcaTiempo) return '';
    const fecha = new Date(marcaTiempo);
    return fecha.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Muestra una notificacion temporal en la pantalla integrada en el DOM.
 * Satisface la regla estricta de prohibicion de la funcion alert().
 * @param {string} mensaje Texto a comunicar al usuario.
 * @param {'exito'|'error'|'advertencia'|'informacion'} variante Estilo visual del aviso.
 * @param {number} duracionMilisegundos Tiempo en pantalla antes de removerse.
 */
export function mostrarNotificacion(mensaje, variante = 'informacion', duracionMilisegundos = 3500) {
    let contenedor = document.getElementById('contenedor-notificaciones');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'contenedor-notificaciones';
        contenedor.className = 'contenedor-avisos-fijo';
        document.body.appendChild(contenedor);
    }

    const elementoAviso = document.createElement('div');
    elementoAviso.className = `tarjeta-aviso aviso-${variante}`;

    const iconoTexto = {
        exito: '[OK]',
        error: '[ERROR]',
        advertencia: '[AVISO]',
        informacion: '[INFO]'
    }[variante] || '[INFO]';

    elementoAviso.innerHTML = `
        <span class="aviso-prefijo">${iconoTexto}</span>
        <span class="aviso-cuerpo">${mensaje}</span>
        <button type="button" class="boton-cerrar-aviso" aria-label="Cerrar notificacion">&times;</button>
    `;

    const botonCerrar = elementoAviso.querySelector('.boton-cerrar-aviso');
    botonCerrar.addEventListener('click', () => {
        removerAviso(elementoAviso);
    });

    contenedor.appendChild(elementoAviso);

    setTimeout(() => {
        removerAviso(elementoAviso);
    }, duracionMilisegundos);
}

function removerAviso(elemento) {
    if (!elemento) return;
    elemento.classList.add('aviso-salida');
    setTimeout(() => {
        if (elemento.parentElement) {
            elemento.parentElement.removeChild(elemento);
        }
    }, 250);
}

/**
 * Control del Modo Claro y Oscuro (Claro por defecto obligatorio).
 */
const CLAVE_TEMA = 'preferencia_tema_tienda';

export function inicializarTema() {
    const temaGuardado = localStorage.getItem(CLAVE_TEMA) || 'claro';
    aplicarTema(temaGuardado);
}

export function alternarTemaColor() {
    const temaActual = document.documentElement.getAttribute('data-tema') || 'claro';
    const nuevoTema = temaActual === 'claro' ? 'oscuro' : 'claro';
    aplicarTema(nuevoTema);
    localStorage.setItem(CLAVE_TEMA, nuevoTema);
    mostrarNotificacion(`Modo ${nuevoTema} activado.`, 'informacion', 2000);
}

function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    const botonTema = document.getElementById('boton-cambiar-tema');
    if (botonTema) {
        botonTema.setAttribute('aria-pressed', tema === 'oscuro');
        const etiquetaTexto = botonTema.querySelector('.texto-boton-tema');
        if (etiquetaTexto) {
            etiquetaTexto.textContent = tema === 'claro' ? 'Modo Oscuro' : 'Modo Claro';
        }
    }
}

/**
 * Renderiza los productos en el contenedor del catalogo.
 * Utiliza Array.prototype.map().
 * @param {Array} productos Vector de productos en formato plano.
 * @param {HTMLElement} contenedor Elemento receptor del DOM.
 */
export function renderizarCatalogo(productos, contenedor) {
    if (!contenedor) return;

    if (!productos || productos.length === 0) {
        contenedor.innerHTML = `
            <div class="mensaje-vacio-catalogo">
                <p class="titulo-vacio">No se hallaron productos coincidentes.</p>
                <p class="detalle-vacio">Verifique los filtros ingresados o restablezca los criterios de busqueda.</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = productos.map(producto => {
        const tieneRebaja = producto.porcentajeDescuento > 0;
        const sinExistencias = producto.existencias <= 0;
        const existenciasBajas = producto.existencias > 0 && producto.existencias <= 3;

        let distintivoInventario = '';
        if (sinExistencias) {
            distintivoInventario = '<span class="distintivo distintivo-agotado">Agotado</span>';
        } else if (existenciasBajas) {
            distintivoInventario = `<span class="distintivo distintivo-alerta">Ultimas ${producto.existencias} un.</span>`;
        } else {
            distintivoInventario = `<span class="distintivo distintivo-disponible">${producto.existencias} disponibles</span>`;
        }

        return `
            <article class="tarjeta-articulo" data-id="${producto.identificador}">
                <div class="contenedor-imagen-articulo">
                    <img 
                        src="${producto.enlaceImagen}" 
                        alt="${producto.nombre}"
                        loading="lazy"
                        class="imagen-articulo"
                    />
                    <div class="etiquetas-superpuestas">
                        <span class="distintivo distintivo-categoria">${producto.categoria}</span>
                        ${tieneRebaja ? `<span class="distintivo distintivo-descuento">-${producto.porcentajeDescuento}%</span>` : ''}
                    </div>
                    <div class="etiqueta-inventario">
                        ${distintivoInventario}
                    </div>
                </div>

                <div class="cuerpo-tarjeta-articulo">
                    <h3 class="nombre-articulo" title="${producto.nombre}">${producto.nombre}</h3>
                    <p class="descripcion-articulo">${producto.descripcion}</p>

                    <div class="seccion-precios">
                        <span class="precio-actual">${formatearMoneda(producto.precioFinal)}</span>
                        ${tieneRebaja ? `<span class="precio-original">${formatearMoneda(producto.precio)}</span>` : ''}
                    </div>

                    <div class="acciones-articulo">
                        <div class="control-cantidad-articulo">
                            <button 
                                type="button" 
                                class="boton-decrementar-catalogo" 
                                data-id="${producto.identificador}"
                                aria-label="Restar una unidad">-</button>
                            <span class="contador-catalogo" id="contador-cat-${producto.identificador}">1</span>
                            <button 
                                type="button" 
                                class="boton-incrementar-catalogo" 
                                data-id="${producto.identificador}"
                                data-max="${producto.existencias}"
                                aria-label="Sumar una unidad">+</button>
                        </div>

                        <button 
                            type="button" 
                            class="boton-agregar-carrito" 
                            data-id="${producto.identificador}"
                            ${sinExistencias ? 'disabled' : ''}>
                            ${sinExistencias ? 'Sin Stock' : 'Agregar'}
                        </button>
                    </div>

                    <!-- Botones de Edicion y Eliminacion para ABM -->
                    <div class="acciones-abm-articulo">
                        <button 
                            type="button" 
                            class="boton-editar-producto" 
                            data-id="${producto.identificador}">
                            Modificar
                        </button>
                        <button 
                            type="button" 
                            class="boton-eliminar-producto" 
                            data-id="${producto.identificador}">
                            Eliminar
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

/**
 * Renderiza la seccion del carrito de compras.
 * Utiliza Array.prototype.map().
 * @param {Object} estadoCarrito Datos planos del carrito devueltos por el servidor.
 * @param {HTMLElement} contenedorLista Elemento contenedor de elementos.
 * @param {Object} elementosResumen Referencias a campos de subtotales y totales.
 */
export function renderizarResumenCarrito(estadoCarrito, contenedorLista, elementosResumen) {
    if (!contenedorLista) return;

    if (!estadoCarrito || estadoCarrito.elementos.length === 0) {
        contenedorLista.innerHTML = `
            <div class="mensaje-carrito-vacio">
                <p class="titulo-carrito-vacio">El carrito se encuentra vacio.</p>
                <p class="subtitulo-carrito-vacio">Seleccione articulos del catalogo para agregarlos a su pedido.</p>
            </div>
        `;
        if (elementosResumen.botonVaciar) elementosResumen.botonVaciar.disabled = true;
        if (elementosResumen.botonComprar) elementosResumen.botonComprar.disabled = true;
    } else {
        if (elementosResumen.botonVaciar) elementosResumen.botonVaciar.disabled = false;
        if (elementosResumen.botonComprar) elementosResumen.botonComprar.disabled = false;

        contenedorLista.innerHTML = estadoCarrito.elementos.map(item => {
            return `
                <div class="renglon-carrito" data-id="${item.identificadorProducto}">
                    <img src="${item.enlaceImagen}" alt="${item.nombre}" class="miniatura-carrito" />
                    <div class="detalles-renglon-carrito">
                        <h4 class="nombre-renglon-carrito">${item.nombre}</h4>
                        <div class="precio-renglon-carrito">
                            <span>${formatearMoneda(item.precioFinal)} c/u</span>
                            ${item.porcentajeDescuento > 0 ? `<span class="etiqueta-descuento-item">(-${item.porcentajeDescuento}%)</span>` : ''}
                        </div>
                        <div class="barra-controles-renglon">
                            <div class="control-cantidad-pequeno">
                                <button 
                                    type="button" 
                                    class="btn-cant-carrito" 
                                    data-accion="decrementar"
                                    data-id="${item.identificadorProducto}"
                                    data-cantidad="${item.cantidad}">-</button>
                                <span class="cantidad-actual-renglon">${item.cantidad}</span>
                                <button 
                                    type="button" 
                                    class="btn-cant-carrito" 
                                    data-accion="incrementar"
                                    data-id="${item.identificadorProducto}"
                                    data-cantidad="${item.cantidad}"
                                    data-max="${item.existenciasDisponibles}">+</button>
                            </div>
                            <span class="subtotal-renglon">${formatearMoneda(item.subtotal)}</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        class="boton-remover-renglon" 
                        data-id="${item.identificadorProducto}"
                        title="Quitar este articulo">&times;</button>
                </div>
            `;
        }).join('');
    }

    // Actualizacion de totales
    if (elementosResumen.subtotal) {
        elementosResumen.subtotal.textContent = formatearMoneda(estadoCarrito?.subtotal || 0);
    }
    if (elementosResumen.iva) {
        elementosResumen.iva.textContent = formatearMoneda(estadoCarrito?.iva || 0);
    }
    if (elementosResumen.total) {
        elementosResumen.total.textContent = formatearMoneda(estadoCarrito?.total || 0);
    }
    if (elementosResumen.contadorEncabezado) {
        elementosResumen.contadorEncabezado.textContent = estadoCarrito?.totalUnidades || 0;
    }

    // Cupon de descuento
    if (elementosResumen.filaCupon && elementosResumen.descuentoCupon) {
        if (estadoCarrito?.codigoCupon && estadoCarrito.montoDescuentoCupon > 0) {
            elementosResumen.filaCupon.classList.remove('oculto');
            elementosResumen.descuentoCupon.textContent = `-${formatearMoneda(estadoCarrito.montoDescuentoCupon)} (${estadoCarrito.porcentajeCupon}%)`;
        } else {
            elementosResumen.filaCupon.classList.add('oculto');
        }
    }
}

/**
 * Renderiza el ticket formal de compra.
 * Utiliza Array.prototype.map().
 * @param {Object} orden Objeto plano de la orden completada.
 * @param {HTMLElement} contenedor Elemento donde se dibuja el comprobante.
 */
export function renderizarTicketCompra(orden, contenedor) {
    if (!contenedor || !orden) return;

    contenedor.innerHTML = `
        <div class="comprobante-fiscal">
            <header class="encabezado-fiscal">
                <div>
                    <h2 class="razon-social">TechStore Pro S.A.</h2>
                    <p class="datos-fiscales">CUIT: 30-71982345-4 | IVA Responsable Inscripto</p>
                    <p class="datos-fiscales">Direccion: Av. Corrientes 1234, CABA</p>
                </div>
                <div class="bloque-orden-fiscal">
                    <span class="estado-orden">${orden.estado}</span>
                    <h3 class="tipo-comprobante">FACTURA B</h3>
                    <p class="numero-factura">Comprobante Nro: ${orden.numeroOrden}</p>
                    <p class="numero-factura">Codigo Seguimiento: ${orden.codigoSeguimiento}</p>
                    <p class="fecha-factura">Fecha: ${formatearFecha(orden.fechaRegistro)}</p>
                </div>
            </header>

            <section class="datos-comprador-fiscal">
                <h4 class="subtitulo-seccion-fiscal">Datos del Cliente Receptor</h4>
                <div class="grilla-datos-cliente">
                    <div><strong>Nombre:</strong> ${orden.comprador.nombre}</div>
                    <div><strong>Apellido:</strong> ${orden.comprador.apellido || ''}</div>
                    <div><strong>Correo Electronico:</strong> ${orden.comprador.correoElectronico}</div>
                    <div><strong>Telefono de Contacto:</strong> ${orden.comprador.telefono}</div>
                    <div><strong>Domicilio de Entrega:</strong> ${orden.comprador.direccionEntrega}, ${orden.comprador.ciudad}</div>
                    <div><strong>Forma de Pago Utilizada:</strong> ${orden.metodoPago}</div>
                </div>
            </section>

            <section class="tabla-articulos-fiscal">
                <table class="tabla-comprobante">
                    <thead>
                        <tr>
                            <th class="texto-izquierda">Articulo</th>
                            <th class="texto-centro">Cantidad</th>
                            <th class="texto-derecha">Precio Unitario</th>
                            <th class="texto-derecha">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orden.elementos.map(item => `
                            <tr>
                                <td class="texto-izquierda">${item.nombre}</td>
                                <td class="texto-centro">${item.cantidad}</td>
                                <td class="texto-derecha">${formatearMoneda(item.precioFinal)}</td>
                                <td class="texto-derecha negrita">${formatearMoneda(item.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>

            <footer class="pie-totales-fiscal">
                <div class="desglose-totales">
                    <div class="linea-total">
                        <span>Subtotal de mercaderia:</span>
                        <span>${formatearMoneda(orden.totales.subtotal)}</span>
                    </div>
                    ${orden.totales.codigoCupon ? `
                        <div class="linea-total descuento">
                            <span>Descuento de cupon (${orden.totales.codigoCupon}):</span>
                            <span>-${formatearMoneda(orden.totales.montoDescuentoCupon)}</span>
                        </div>
                    ` : ''}
                    <div class="linea-total">
                        <span>Impuesto al Valor Agregado (IVA 21%):</span>
                        <span>${formatearMoneda(orden.totales.iva)}</span>
                    </div>
                    <div class="linea-total total-destacado">
                        <span>Total Pagado:</span>
                        <span>${formatearMoneda(orden.totales.total)}</span>
                    </div>
                </div>
                <div class="nota-cierre-fiscal">
                    <p>Operacion procesada con exito en el servidor Node.js.</p>
                </div>
            </footer>
        </div>
    `;
}
