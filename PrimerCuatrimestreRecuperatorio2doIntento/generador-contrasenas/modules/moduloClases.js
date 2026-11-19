/**
 * Modulo: modules/moduloClases.js
 * Proposito: Define las clases de JavaScript ES6 compartidas tanto por el servidor Node.js
 *            como por el navegador web mediante import y export.
 *            Demuestra los conceptos del cuatrimestre:
 *            1. Clases con constructor y encapsulamiento.
 *            2. Metodos accesores GET (para leer) y SET (para validar datos antes de asignar).
 *            3. Vectores/Arrays para almacenar y transformar colecciones.
 *            4. Vector de Clases (GestorContrasenas), una clase administradora cuyo atributo
 *               principal es un arreglo donde cada elemento es una instancia de RegistroContrasena.
 * Modulos usados: Ninguno (codigo JavaScript estandar y puro).
 */

/**
 * Vector constante con las categorias validas permitidas en todo el sistema.
 * Lista oficial de categorias permitidas para clasificar las credenciales.
 */
export const CATEGORIAS_VALIDAS = [
    'Personal',
    'Trabajo',
    'Estudio',
    'Finanzas',
    'Redes'
];

/**
 * Comprueba si un texto cumple con el formato estandar de correo electronico (texto@dominio.ext).
 * Valida que, si el usuario escribio texto en el campo opcional, cumpla con el formato de email.
 * @param {string} valor Cadena a validar.
 * @returns {boolean} true si tiene formato valido de correo.
 */
export function esCorreoValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim());
}

/**
 * Clase que encapsula las opciones de configuracion del generador de contrasenias.
 * Modela las opciones elegidas por el usuario (longitud, conjuntos de caracteres y cantidad).
 * Sus metodos set validan los rangos permitidos para impedir configuraciones invalidas
 * (como longitudes fuera de 6-32 o cantidades fuera de 1-5).
 */
export class ConfiguracionGenerador {
    /**
     * Constructor: Inicializa las propiedades con valores por defecto seguros.
     * @param {Object} datos Opciones iniciales opcionales.
     */
    constructor(datos = {}) {
        // Usamos prefijo guion bajo (_propiedad) para indicar que son variables internas
        // a las cuales se debe acceder unicamente mediante sus getters y setters.
        this._longitud = 16;
        this._incluirMayusculas = true;
        this._incluirMinusculas = true;
        this._incluirNumeros = true;
        this._incluirSimbolos = true;
        this._evitarAmbiguos = false;
        this._cantidad = 1;

        // Si nos pasaron datos, los asignamos usando los setters para que se validen de entrada
        if (datos.longitud !== undefined) this.longitud = datos.longitud;
        if (datos.incluirMayusculas !== undefined) this.incluirMayusculas = datos.incluirMayusculas;
        if (datos.incluirMinusculas !== undefined) this.incluirMinusculas = datos.incluirMinusculas;
        if (datos.incluirNumeros !== undefined) this.incluirNumeros = datos.incluirNumeros;
        if (datos.incluirSimbolos !== undefined) this.incluirSimbolos = datos.incluirSimbolos;
        if (datos.evitarAmbiguos !== undefined) this.evitarAmbiguos = datos.evitarAmbiguos;
        if (datos.cantidad !== undefined) this.cantidad = datos.cantidad;
    }

    // Getter y Setter de longitud (valida entre 6 y 32 caracteres)
    get longitud() {
        return this._longitud;
    }

    set longitud(valor) {
        const numero = Number(valor);
        if (!Number.isInteger(numero) || numero < 6 || numero > 32) {
            throw new RangeError('La longitud debe ser un entero entre 6 y 32 caracteres.');
        }
        this._longitud = numero;
    }

    // Getters y Setters de booleanos para cada conjunto de caracteres
    get incluirMayusculas() {
        return this._incluirMayusculas;
    }

    set incluirMayusculas(valor) {
        this._incluirMayusculas = Boolean(valor);
    }

    get incluirMinusculas() {
        return this._incluirMinusculas;
    }

    set incluirMinusculas(valor) {
        this._incluirMinusculas = Boolean(valor);
    }

    get incluirNumeros() {
        return this._incluirNumeros;
    }

    set incluirNumeros(valor) {
        this._incluirNumeros = Boolean(valor);
    }

    get incluirSimbolos() {
        return this._incluirSimbolos;
    }

    set incluirSimbolos(valor) {
        this._incluirSimbolos = Boolean(valor);
    }

    get evitarAmbiguos() {
        return this._evitarAmbiguos;
    }

    set evitarAmbiguos(valor) {
        this._evitarAmbiguos = Boolean(valor);
    }

    // Getter y Setter de cantidad (valida entre 1 y 5 contrasenias por tirada)
    get cantidad() {
        return this._cantidad;
    }

    set cantidad(valor) {
        const numero = Number(valor);
        if (!Number.isInteger(numero) || numero < 1 || numero > 5) {
            throw new RangeError('La cantidad a generar debe ser entre 1 y 5.');
        }
        this._cantidad = numero;
    }

    /**
     * Getter calculado: Construye dinamicamente un vector con los nombres de los grupos activos.
     * Inspecciona las opciones habilitadas y retorna un vector con los nombres de los conjuntos activos.
     * @returns {string[]} Vector de textos con los conjuntos habilitados.
     */
    get tiposActivos() {
        const vector = [];
        if (this._incluirMayusculas) vector.push('Mayusculas');
        if (this._incluirMinusculas) vector.push('Minusculas');
        if (this._incluirNumeros) vector.push('Numeros');
        if (this._incluirSimbolos) vector.push('Simbolos');
        return vector;
    }

    /**
     * Comprueba que haya al menos un conjunto de caracteres seleccionado.
     * Evita que se desmarquen todos los tipos de caracteres al mismo tiempo.
     */
    validar() {
        if (this.tiposActivos.length === 0) {
            throw new Error('Debes seleccionar al menos un tipo de caracter (mayusculas, minusculas, etc.).');
        }
        return true;
    }

    /**
     * Convierte la instancia en un objeto JavaScript simple para enviarlo por red via JSON.
     */
    aObjetoPlano() {
        return {
            longitud: this._longitud,
            incluirMayusculas: this._incluirMayusculas,
            incluirMinusculas: this._incluirMinusculas,
            incluirNumeros: this._incluirNumeros,
            incluirSimbolos: this._incluirSimbolos,
            evitarAmbiguos: this._evitarAmbiguos,
            cantidad: this._cantidad
        };
    }
}

/**
 * Clase que representa una contrasenia guardada en la base de datos JSON local.
 * Modela cada credencial guardada en el archivo JSON (por ejemplo, una cuenta de Gmail o Banco).
 * Sus metodos set validan servicio, correo opcional, categoria y longitud de clave
 * antes de permitir cualquier escritura en disco.
 */
export class RegistroContrasena {
    constructor(datos = {}, opciones = {}) {
        // Generamos un ID por si viene vacio (usando timestamp para unicidad)
        this._id = String(datos.id || `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
        this._servicio = '';
        this._usuario = '';
        this._categoria = 'Personal';
        this._contrasena = '';
        this._puntuacion = Number(datos.puntuacion || 0);
        this._nivelSeguridad = String(datos.nivelSeguridad || 'Media');
        this._claseSeguridad = String(datos.claseSeguridad || 'media');
        this._fechaCreacion = datos.fechaCreacion || new Date().toISOString();

        if (datos.servicio !== undefined) this.servicio = datos.servicio;
        if (datos.usuario !== undefined) {
            if (opciones.permitirLegacy) {
                this._usuario = String(datos.usuario || '').trim().slice(0, 70);
            } else {
                this.usuario = datos.usuario;
            }
        }
        if (datos.categoria !== undefined) this.categoria = datos.categoria;
        if (datos.contrasena !== undefined) this.contrasena = datos.contrasena;
        if (datos.puntuacion !== undefined) this.puntuacion = datos.puntuacion;
        if (datos.nivelSeguridad !== undefined) this.nivelSeguridad = datos.nivelSeguridad;
        if (datos.claseSeguridad !== undefined) this.claseSeguridad = datos.claseSeguridad;
    }

    get id() { return this._id; }
    set id(valor) {
        const limpio = String(valor || '').trim();
        if (!limpio) throw new Error('El ID del registro es obligatorio.');
        this._id = limpio;
    }

    get servicio() { return this._servicio; }
    set servicio(valor) {
        const limpio = String(valor || '').trim();
        if (limpio.length < 2) throw new Error('El sitio o servicio debe tener al menos 2 caracteres.');
        if (limpio.length > 50) throw new Error('El nombre del servicio no puede superar los 50 caracteres.');
        this._servicio = limpio;
    }

    get usuario() { return this._usuario; }
    set usuario(valor) {
        const limpio = String(valor || '').trim().slice(0, 70);
        // Es opcional (si queda vacio pasa), pero si escribio aunque sea 1 caracter debe ser un correo valido
        if (limpio.length > 0 && !esCorreoValido(limpio)) {
            throw new Error('Si escribis un correo, debe tener formato valido (ej. usuario@correo.com) o quedar vacio.');
        }
        this._usuario = limpio;
    }

    get categoria() { return this._categoria; }
    set categoria(valor) {
        const texto = String(valor || 'Personal').trim();
        if (!CATEGORIAS_VALIDAS.includes(texto)) {
            throw new Error(`Categoria invalida: "${texto}". Debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}.`);
        }
        this._categoria = texto;
    }

    get contrasena() { return this._contrasena; }
    set contrasena(valor) {
        const texto = String(valor || '');
        if (texto.length < 4) throw new Error('La contrasenia debe tener como minimo 4 caracteres.');
        if (texto.length > 64) throw new Error('La contrasenia no puede superar los 64 caracteres.');
        this._contrasena = texto;
    }

    get puntuacion() { return this._puntuacion; }
    set puntuacion(valor) {
        const num = Number(valor);
        this._puntuacion = Number.isFinite(num) ? Math.max(0, Math.min(100, Math.round(num))) : 0;
    }

    get nivelSeguridad() { return this._nivelSeguridad; }
    set nivelSeguridad(valor) { this._nivelSeguridad = String(valor || 'Media').trim(); }

    get claseSeguridad() { return this._claseSeguridad; }
    set claseSeguridad(valor) { this._claseSeguridad = String(valor || 'media').trim(); }

    get fechaCreacion() { return this._fechaCreacion; }
    set fechaCreacion(valor) { this._fechaCreacion = String(valor || new Date().toISOString()); }

    /**
     * Getter calculado: Devuelve asteriscos para ocultar la contrasenia real en la pantalla.
     * Retorna una mascara de asteriscos para ocultar la clave real salvo que el usuario pulse Ver.
     */
    get contrasenaEnmascarada() {
        return '*'.repeat(Math.min(Math.max(this._contrasena.length, 8), 16));
    }

    /**
     * Convierte la instancia a un objeto plano listo para serializar a JSON en disco.
     */
    aObjetoJSON() {
        return {
            id: this._id,
            servicio: this._servicio,
            usuario: this._usuario,
            categoria: this._categoria,
            contrasena: this._contrasena,
            puntuacion: this._puntuacion,
            nivelSeguridad: this._nivelSeguridad,
            claseSeguridad: this._claseSeguridad,
            fechaCreacion: this._fechaCreacion
        };
    }
}

/**
 * Vector de Clases: Administra una coleccion interna de instancias RegistroContrasena.
 * Implementa el patron Vector de Clases: administra un arreglo interno (_vectorRegistros)
 * garantizando que cada elemento sea una instancia valida de RegistroContrasena
 * y proveyendo metodos centralizados para buscar, agregar, actualizar, eliminar y filtrar.
 */
export class GestorContrasenas {
    /**
     * Constructor del Vector de Clases.
     * @param {Array<Object|RegistroContrasena>} registrosIniciales Arreglo opcional para arrancar.
     */
    constructor(registrosIniciales = []) {
        this._vectorRegistros = [];
        this.registros = registrosIniciales;
    }

    /**
     * Getter: Devuelve una copia superficial del vector interno para preservar la inmutabilidad externa.
     */
    get registros() {
        return [...this._vectorRegistros];
    }

    /**
     * Setter: Recibe un array crudo y se asegura de convertir cada item a instancia RegistroContrasena.
     */
    set registros(nuevoVector) {
        if (!Array.isArray(nuevoVector)) {
            throw new TypeError('GestorContrasenas requiere un vector (Array) de registros.');
        }
        // Usamos .map() para instanciar cada elemento si todavia no era un objeto de la clase
        this._vectorRegistros = nuevoVector.map((item) => (
            item instanceof RegistroContrasena ? item : new RegistroContrasena(item)
        ));
    }

    /**
     * Getter: Retorna la cantidad total de contrasenias almacenadas en el vector.
     */
    get total() {
        return this._vectorRegistros.length;
    }

    /**
     * Llena el vector a partir de los datos leidos del archivo database/contrasenas.json.
     * Convierte los objetos leidos del disco en instancias de RegistroContrasena
     * sin rechazar registros viejos heredados de versiones previas.
     */
    cargarDesdeJSON(arregloCrudo = []) {
        const lista = Array.isArray(arregloCrudo) ? arregloCrudo : [];
        this._vectorRegistros = lista.map((item) => (
            item instanceof RegistroContrasena
                ? item
                : new RegistroContrasena(item, { permitirLegacy: true })
        ));
        return this;
    }

    /**
     * Busca una contrasenia en el vector por su identificador unico usando .find().
     * @param {string} id ID del registro a buscar.
     * @returns {RegistroContrasena|null} La instancia encontrada o null si no existe.
     */
    buscarPorId(id) {
        return this._vectorRegistros.find((reg) => reg.id === id) || null;
    }

    /**
     * Agrega una nueva credencial al principio del vector usando .unshift().
     * Inserta la nueva credencial al inicio del vector para mostrarla primero en el historial.
     * @param {Object|RegistroContrasena} datos Datos de la clave a agregar.
     * @returns {RegistroContrasena} La instancia que fue agregada al vector.
     */
    agregar(datos) {
        const instancia = datos instanceof RegistroContrasena ? datos : new RegistroContrasena(datos);
        this._vectorRegistros.unshift(instancia);
        return instancia;
    }

    /**
     * Modifica las propiedades de un registro existente aplicando sus setters correspondientes.
     * @param {string} id ID del registro a modificar.
     * @param {Object} cambios Nuevos datos a setear.
     * @returns {RegistroContrasena|null} La instancia modificada o null si no se encontro.
     */
    actualizar(id, cambios = {}) {
        const registro = this.buscarPorId(id);
        if (!registro) return null;

        if (cambios.servicio !== undefined) registro.servicio = cambios.servicio;
        if (cambios.usuario !== undefined) registro.usuario = cambios.usuario;
        if (cambios.categoria !== undefined) registro.categoria = cambios.categoria;
        if (cambios.contrasena !== undefined) registro.contrasena = cambios.contrasena;
        if (cambios.puntuacion !== undefined) registro.puntuacion = cambios.puntuacion;
        if (cambios.nivelSeguridad !== undefined) registro.nivelSeguridad = cambios.nivelSeguridad;
        if (cambios.claseSeguridad !== undefined) registro.claseSeguridad = cambios.claseSeguridad;
        return registro;
    }

    /**
     * Elimina un elemento del vector de clases segun su ID usando .splice().
     * Localiza la posicion exacta del registro en el vector y lo elimina mediante splice().
     * @param {string} id ID del registro a remover.
     * @returns {RegistroContrasena|null} El registro eliminado o null si no existia.
     */
    eliminar(id) {
        const indice = this._vectorRegistros.findIndex((reg) => reg.id === id);
        if (indice === -1) return null;
        const [eliminado] = this._vectorRegistros.splice(indice, 1);
        return eliminado;
    }

    /**
     * Vacia el vector completo dejando 0 registros.
     * @returns {number} Cantidad de registros que fueron eliminados.
     */
    vaciar() {
        const cantidadPrevia = this._vectorRegistros.length;
        this._vectorRegistros = [];
        return cantidadPrevia;
    }

    /**
     * Filtra el vector por texto de busqueda (servicio/usuario) y por categoria usando .filter().
     * Filtra el vector en tiempo real combinando el texto de busqueda y la categoria elegida.
     * @param {{ busqueda?: string, categoria?: string }} opciones Criterios de filtrado.
     * @returns {RegistroContrasena[]} Vector con las instancias que cumplen con el filtro.
     */
    filtrar({ busqueda = '', categoria = 'Todas' } = {}) {
        const termino = String(busqueda || '').trim().toLowerCase();
        return this._vectorRegistros.filter((reg) => {
            // Si eligio una categoria distinta a 'Todas' y no coincide, lo descarta
            if (categoria && categoria !== 'Todas' && reg.categoria !== categoria) {
                return false;
            }
            // Si escribio algo en el buscador, comprueba si coincide con servicio, usuario o categoria
            if (termino) {
                return (
                    reg.servicio.toLowerCase().includes(termino)
                    || reg.usuario.toLowerCase().includes(termino)
                    || reg.categoria.toLowerCase().includes(termino)
                );
            }
            return true;
        });
    }

    /**
     * Serializa todo el vector de clases a un arreglo plano de objetos para guardarlo en el archivo JSON.
     * @returns {Array<Object>} Arreglo plano exportable.
     */
    exportarArregloPlano() {
        return this._vectorRegistros.map((reg) => reg.aObjetoJSON());
    }
}
