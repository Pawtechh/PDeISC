/**
 * Modulo: modules/moduloInterfaz.js
 * Proposito: Centraliza de forma atomizada y segura todas las operaciones sobre el DOM del navegador:
 *            - Modo claro/oscuro persistido en localStorage.
 *            - Boton para subir hacia arriba al toque con desplazamiento suave.
 *            - Notificaciones flotantes tipo Toast (reemplazo de alert()).
 *            - Validacion visual inline dentro del formulario (reemplazo de alert()).
 *            - Modal de confirmacion propio en el DOM (reemplazo de confirm()).
 *            - Renderizado visual del visor de contrasenia, barra de fuerza y lista del historial.
 * Modulos usados: Ninguno directo (JavaScript estandar para navegadores).
 */

const CLAVE_TEMA_STORAGE = 'generador_claves_tema';

/**
 * Sanitiza cualquier texto antes de insertarlo en el HTML para evitar ataques XSS.
 * 
 * En criollo formal: Como las contrasenias generadas pueden tener simbolos raros
 * como '<', '>', '&' o comillas, si las metieramos directamente con innerHTML el navegador
 * podria confundirlas con etiquetas HTML. Esta funcion reemplaza esos caracteres especiales
 * por sus entidades HTML seguras (&lt;, &gt;, etc.) para que se vean intactas sin romper la pantalla.
 * 
 * @param {string} texto Cadena de caracteres a escapar.
 * @returns {string} Cadena sanitizada y segura para innerHTML.
 */
export function escaparHTML(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Copia un texto al portapapeles del sistema operativo de manera compatible.
 * 
 * En criollo formal: Intenta primero usar la API moderna navigator.clipboard. Si el navegador
 * esta en un entorno restringido o no lo permite, usa un truco clasico con un textarea temporal
 * invisible y document.execCommand('copy'), devolviendo true si pudo copiarlo o false si fallo.
 * 
 * @param {string} texto Texto a copiar (por ejemplo, la contrasenia).
 * @returns {Promise<boolean>} Resuelve true si se copio con exito.
 */
export async function copiarAlPortapapeles(texto) {
    if (!texto) return false;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            return true;
        }
        const area = document.createElement('textarea');
        area.value = texto;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(area);
        return ok;
    } catch {
        return false;
    }
}

/**
 * Ajusta visualmente el icono y el texto del boton de cambio de tema segun el modo activo.
 * @param {HTMLElement} botonTema Boton selector de tema en el encabezado.
 * @param {'claro'|'oscuro'} tema Modo actualmente configurado.
 */
function actualizarBotonTema(botonTema, tema) {
    if (!botonTema) return;
    const iconoSol = botonTema.querySelector('[data-icono="sol"]');
    const iconoLuna = botonTema.querySelector('[data-icono="luna"]');
    const etiqueta = botonTema.querySelector('[data-etiqueta-tema]');
    const esOscuro = tema === 'oscuro';

    if (iconoSol) iconoSol.hidden = !esOscuro;
    if (iconoLuna) iconoLuna.hidden = esOscuro;
    if (etiqueta) etiqueta.textContent = esOscuro ? 'Modo Claro' : 'Modo Oscuro';
    botonTema.setAttribute('aria-pressed', String(esOscuro));
}

/**
 * Inicializa el tema claro/oscuro al cargar la pagina leyendo el valor de localStorage.
 * En criollo: Se fija si el usuario ya habia elegido el modo oscuro antes para respetarselo.
 * 
 * @param {HTMLElement} botonTema Boton selector de tema.
 */
export function inicializarTema(botonTema) {
    const guardado = localStorage.getItem(CLAVE_TEMA_STORAGE) === 'oscuro' ? 'oscuro' : 'claro';
    if (guardado === 'oscuro') {
        document.documentElement.setAttribute('data-tema', 'oscuro');
    } else {
        document.documentElement.removeAttribute('data-tema');
    }
    actualizarBotonTema(botonTema, guardado);
}

/**
 * Alterna entre el tema claro y el tema oscuro y persiste la eleccion en localStorage.
 * En criollo: Hace el cambio de dia/noche al tocar el boton y lo guarda para no perderlo al refrescar.
 * 
 * @param {HTMLElement} botonTema Boton selector de tema.
 */
export function alternarTemaColor(botonTema) {
    const esOscuro = document.documentElement.getAttribute('data-tema') === 'oscuro';
    const nuevoTema = esOscuro ? 'claro' : 'oscuro';

    if (nuevoTema === 'oscuro') {
        document.documentElement.setAttribute('data-tema', 'oscuro');
    } else {
        document.documentElement.removeAttribute('data-tema');
    }

    localStorage.setItem(CLAVE_TEMA_STORAGE, nuevoTema);
    actualizarBotonTema(botonTema, nuevoTema);
}

/**
 * Configura el comportamiento del boton flotante para subir hacia arriba al toque.
 * 
 * En criollo formal: Escucha el scroll de la ventana; cuando el usuario bajo mas de 110 pixeles,
 * le agrega la clase '.visible' con transicion suave. Cuando el usuario hace click,
 * ejecuta scrollTo con animacion smooth hacia la posicion superior (top: 0).
 * 
 * @param {HTMLElement} botonFlotante Boton flotante en la esquina inferior.
 * @param {HTMLElement|null} botonFooter Boton o link secundario opcional.
 */
export function inicializarBotonSubirArriba(botonFlotante, botonFooter = null) {
    const actualizarVisibilidad = () => {
        if (!botonFlotante) return;
        botonFlotante.classList.toggle('visible', window.scrollY > 110);
    };

    const subirAlToque = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (botonFlotante) {
        window.addEventListener('scroll', actualizarVisibilidad, { passive: true });
        botonFlotante.addEventListener('click', subirAlToque);
        actualizarVisibilidad();
    }

    if (botonFooter) {
        botonFooter.addEventListener('click', subirAlToque);
    }
}

/**
 * Muestra una notificacion flotante tipo Toast en pantalla (prohibido usar alert()).
 * 
 * En criollo formal: En lugar de interrumpir al usuario con una molesta ventana alert(),
 * crea un elemento visual en la esquina superior con el mensaje (exito, error, info),
 * lo anima con CSS y lo hace desaparecer automaticamente tras unos segundos.
 * 
 * @param {string} mensaje Texto a comunicar al usuario.
 * @param {'info'|'exito'|'error'|'advertencia'} tipo Estilo visual del mensaje.
 * @param {number} duracionMs Milisegundos antes de cerrarse solo (por defecto 3000ms).
 */
export function mostrarNotificacion(mensaje, tipo = 'info', duracionMs = 3000) {
    const contenedor = document.getElementById('contenedorToasts');
    if (!contenedor) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.setAttribute('role', 'status');

    const texto = document.createElement('span');
    texto.textContent = mensaje;

    const cerrarBtn = document.createElement('button');
    cerrarBtn.type = 'button';
    cerrarBtn.className = 'toast-cerrar';
    cerrarBtn.textContent = 'x';

    const quitar = () => {
        toast.classList.add('saliendo');
        setTimeout(() => toast.remove(), 180);
    };

    cerrarBtn.addEventListener('click', quitar);
    toast.appendChild(texto);
    toast.appendChild(cerrarBtn);
    contenedor.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(quitar, duracionMs);
}

/**
 * Muestra un mensaje de validacion dentro del propio formulario (prohibido usar alert()).
 * En criollo: Muestra el error de validacion en una cajita roja debajo del formulario.
 */
export function mostrarMensajeInlineDOM(contenedor, mensaje, tipo = 'error') {
    if (!contenedor) return;
    contenedor.textContent = mensaje;
    contenedor.className = `mensaje-validacion-dom tipo-${tipo}`;
    contenedor.hidden = false;
}

/**
 * Limpia y oculta el mensaje de validacion del formulario.
 */
export function limpiarMensajeInlineDOM(contenedor) {
    if (!contenedor) return;
    contenedor.textContent = '';
    contenedor.hidden = true;
}

/**
 * Abre un modal de confirmacion propio en el DOM (prohibido usar confirm()).
 * 
 * En criollo formal: Reemplaza por completo la funcion nativa confirm(). Devuelve una Promesa
 * que se resuelve en 'true' si el usuario toco "Confirmar" o en 'false' si toco "Cancelar",
 * apreto la tecla Escape o hizo click fuera de la cajita.
 * 
 * @param {{ titulo?: string, mensaje?: string, textoConfirmar?: string }} opciones
 * @returns {Promise<boolean>} Resuelve true si el usuario acepto la operacion.
 */
export function solicitarConfirmacionDOM({
    titulo = 'Confirmar accion',
    mensaje = 'Deseas continuar?',
    textoConfirmar = 'Confirmar'
} = {}) {
    return new Promise((resolver) => {
        const modal = document.getElementById('modalConfirmacion');
        const elTitulo = document.getElementById('modalConfirmacionTitulo');
        const elMensaje = document.getElementById('modalConfirmacionMensaje');
        const btnAceptar = document.getElementById('btnModalAceptar');
        const btnCancelar = document.getElementById('btnModalCancelar');

        if (!modal || !elTitulo || !elMensaje || !btnAceptar || !btnCancelar) {
            resolver(false);
            return;
        }

        elTitulo.textContent = titulo;
        elMensaje.textContent = mensaje;
        btnAceptar.textContent = textoConfirmar;

        const cerrar = (ok) => {
            modal.hidden = true;
            btnAceptar.removeEventListener('click', onAceptar);
            btnCancelar.removeEventListener('click', onCancelar);
            modal.removeEventListener('click', onFondo);
            document.removeEventListener('keydown', onEscape);
            resolver(ok);
        };

        const onAceptar = () => cerrar(true);
        const onCancelar = () => cerrar(false);
        const onFondo = (e) => {
            if (e.target === modal) cerrar(false);
        };
        const onEscape = (e) => {
            if (e.key === 'Escape') cerrar(false);
        };

        btnAceptar.addEventListener('click', onAceptar);
        btnCancelar.addEventListener('click', onCancelar);
        modal.addEventListener('click', onFondo);
        document.addEventListener('keydown', onEscape);

        modal.hidden = false;
        btnCancelar.focus();
    });
}

/**
 * Renderiza la contrasenia en la caja principal del visor (en claro o enmascarada).
 */
export function renderizarVisorContrasena(contenedor, contrasena, oculta = false) {
    if (!contenedor) return;
    if (!contrasena) {
        contenedor.textContent = 'Generando...';
        return;
    }
    contenedor.textContent = oculta
        ? '*'.repeat(Math.min(Math.max(contrasena.length, 8), 24))
        : contrasena;
}

/**
 * Actualiza la barra grafica y el texto de nivel de seguridad (Debil, Media, Fuerte, Muy Fuerte).
 */
export function renderizarBarraSeguridad(barra, insignia, resultado) {
    if (!resultado) return;
    if (barra) {
        barra.style.width = `${resultado.puntuacion}%`;
        barra.className = `barra-seguridad-relleno nivel-${resultado.claseSeguridad}`;
    }
    if (insignia) {
        insignia.textContent = `${resultado.nivelSeguridad} (${resultado.puntuacion}/100)`;
        insignia.className = `insignia-nivel nivel-${resultado.claseSeguridad}`;
    }
}

/**
 * Renderiza el vector de variantes adicionales si el usuario pidio 3 o 5 claves.
 */
export function renderizarVariantesGeneradas(contenedor, lista) {
    if (!contenedor) return;
    if (!Array.isArray(lista) || lista.length <= 1) {
        contenedor.hidden = true;
        contenedor.innerHTML = '';
        return;
    }

    contenedor.hidden = false;
    contenedor.innerHTML = `
        <div class="lote-encabezado">Vector generado (${lista.length} variantes):</div>
        <div class="lote-lista">
            ${lista.map((item) => `
                <div class="lote-item">
                    <code class="lote-clave-texto">${escaparHTML(item.contrasena)}</code>
                    <div class="lote-acciones">
                        <span class="insignia-nivel mini nivel-${escaparHTML(item.claseSeguridad)}">${escaparHTML(item.nivelSeguridad)}</span>
                        <button type="button" class="btn btn-mini btn-secundario" data-accion-lote="copiar" data-clave="${escaparHTML(item.contrasena)}">
                            Copiar
                        </button>
                        <button type="button" class="btn btn-mini btn-primario" data-accion-lote="usar" data-clave="${escaparHTML(item.contrasena)}">
                            Usar
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Renderiza en el DOM la lista de contrasenias guardadas en database/contrasenas.json.
 * 
 * En criollo formal: Toma el vector filtrado de registros y dibuja una tarjeta por cada uno.
 * Si no hay ningun registro guardado en la base, muestra un cartel informativo vacio.
 * Cada tarjeta incluye botones atomicos para Ver/Ocultar, Copiar, Editar y Eliminar.
 */
export function renderizarListaGuardadas(contenedor, vectorRegistros, idsVisibles, totalGeneral) {
    if (!contenedor) return;

    if (totalGeneral === 0) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <p><strong>No hay contrasenias guardadas todavia.</strong></p>
                <p>Genera una clave y guardala usando el formulario de la izquierda para persistirla en database/contrasenas.json.</p>
            </div>
        `;
        return;
    }

    if (!Array.isArray(vectorRegistros) || vectorRegistros.length === 0) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <p><strong>Sin coincidencias para el filtro aplicado.</strong></p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = vectorRegistros.map((registro) => {
        const visible = idsVisibles.has(registro.id);
        const textoClave = visible ? registro.contrasena : registro.contrasenaEnmascarada;

        return `
            <article class="tarjeta-registro" data-id="${escaparHTML(registro.id)}">
                <div class="registro-info">
                    <div class="registro-linea-titulo">
                        <h3 class="registro-servicio">${escaparHTML(registro.servicio)}</h3>
                        <span class="badge-categoria">${escaparHTML(registro.categoria)}</span>
                        <span class="insignia-nivel mini nivel-${escaparHTML(registro.claseSeguridad)}">${escaparHTML(registro.nivelSeguridad)}</span>
                    </div>
                    <p class="registro-usuario">
                        ${registro.usuario ? escaparHTML(registro.usuario) : '<span class="texto-tenue">Sin usuario</span>'}
                    </p>
                </div>

                <div class="registro-controles">
                    <code class="registro-clave ${visible ? '' : 'oculta'}">${escaparHTML(textoClave)}</code>
                    <div class="registro-botones">
                        <button type="button" class="btn btn-mini btn-secundario" data-accion="ver" data-id="${escaparHTML(registro.id)}">
                            ${visible ? 'Ocultar' : 'Ver'}
                        </button>
                        <button type="button" class="btn btn-mini btn-primario" data-accion="copiar" data-id="${escaparHTML(registro.id)}">
                            Copiar
                        </button>
                        <button type="button" class="btn btn-mini btn-contorno" data-accion="editar" data-id="${escaparHTML(registro.id)}">
                            Editar
                        </button>
                        <button type="button" class="btn btn-mini btn-peligro-suave" data-accion="eliminar" data-id="${escaparHTML(registro.id)}">
                            Eliminar
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}
