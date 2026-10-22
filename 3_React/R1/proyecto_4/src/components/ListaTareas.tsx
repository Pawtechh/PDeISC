// ListaTareas: lista de tareas con ABM completo (Alta, Baja, Modificación, Listado),
// separación en pendientes/completadas y persistencia en localStorage.
// Dependencias: react (hooks useState y useEffect), ../styles/ListaTareas.css
// Conceptos clave:
//  1) Estado con un ARREGLO de objetos (useState<Tarea[]>).
//  2) Inmutabilidad: nunca se muta el arreglo, se crea una copia nueva
//     (con spread [...], .map() o .filter()) para que React detecte el cambio.
//  3) useEffect: guarda las tareas en localStorage cada vez que cambian.
//  4) localStorage: memoria del navegador que persiste al recargar la página.
import { useEffect, useState } from "react";
import "./../styles/ListaTareas.css";

// Tipo que describe qué campos tiene una tarea.
interface Tarea {
    id: number;           // identificador único (sirve como "key" de la lista)
    titulo: string;       // texto principal de la tarea
    descripcion: string;  // descripción o subtarea (opcional)
    completada: boolean;  // true si ya está hecha
}

// Clave con la que se guardan las tareas en localStorage.
// Se usa una constante para evitar errores de tipeo al leer/escribir.
const CLAVE_ALMACENAMIENTO = "tareas_proyecto_4";

// Lee las tareas guardadas en localStorage al iniciar.
// Si no hay nada guardado (primera vez), devuelve un arreglo vacío [].
// Si hay datos corruptos, el try/catch evita que la app se rompa.
function leerTareasGuardadas(): Tarea[] {
    try {
        const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
        return guardado ? (JSON.parse(guardado) as Tarea[]) : [];
    } catch {
        return [];
    }
}

function ListaTareas() {
    // Estado principal: el arreglo de tareas.
    // Se inicializa LLAMANDO a leerTareasGuardadas(), que recupera lo guardado.
    // Al pasarle una función a useState, React la ejecuta una sola vez al montar.
    const [tareas, setTareas] = useState<Tarea[]>(leerTareasGuardadas);

    // Estado del formulario: título de la tarea.
    const [titulo, setTitulo] = useState("");

    // Estado del formulario: descripción/subtarea.
    const [descripcion, setDescripcion] = useState("");

    // Estado de edición: guarda la tarea que se está modificando (o null si no hay).
    // null significa "no estoy editando, estoy creando una nueva".
    const [tareaEnEdicion, setTareaEnEdicion] = useState<Tarea | null>(null);

    // Estado auxiliar: mensaje de error visible en pantalla (sin alert()).
    const [error, setError] = useState("");

    // Estado del modal de confirmación: guarda la tarea que se quiere eliminar.
    // Si es null, el modal está cerrado.
    const [tareaAEliminar, setTareaAEliminar] = useState<Tarea | null>(null);

    // useEffect se ejecuta DESPUÉS de cada renderizado en el que "tareas" cambió.
    // Aquí guarda las tareas en localStorage para que persistan al recargar.
    useEffect(() => {
        localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(tareas));
    }, [tareas]);

    // Crea una tarea nueva o actualiza una existente (según haya edición o no).
    const agregarOActualizar = () => {
        // Validación: el título no puede estar vacío (solo espacios).
        if (titulo.trim() === "") {
            setError("Escribí un título para la tarea.");
            return;
        }

        if (tareaEnEdicion) {
            // CASO EDICIÓN: se recorre con .map() y se reemplaza la tarea
            // cuyo id coincide, manteniendo su estado "completada" intacto.
            setTareas(
                tareas.map((tarea) =>
                    tarea.id === tareaEnEdicion.id
                        ? {
                              ...tarea,
                              titulo: titulo.trim(),
                              descripcion: descripcion.trim(),
                          }
                        : tarea
                )
            );
        } else {
            // CASO ALTA: se crea una tarea nueva con id único.
            // Date.now() devuelve los milisegundos actuales; sirve como id simple.
            const nuevaTarea: Tarea = {
                id: Date.now(),
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                completada: false,
            };

            // No se usa tareas.push(). Se crea un arreglo NUEVO con las viejas
            // + la nueva, para que React detecte el cambio y re-renderice.
            setTareas([...tareas, nuevaTarea]);
        }

        // Limpia el formulario y sale del modo edición.
        setTitulo("");
        setDescripcion("");
        setTareaEnEdicion(null);
        setError("");
    };

    // Carga una tarea en el formulario para modificarla.
    const iniciarEdicion = (tarea: Tarea) => {
        setTareaEnEdicion(tarea);
        setTitulo(tarea.titulo);
        setDescripcion(tarea.descripcion);
        setError("");
    };

    // Cancela la edición y vuelve al modo "agregar".
    const cancelarEdicion = () => {
        setTareaEnEdicion(null);
        setTitulo("");
        setDescripcion("");
        setError("");
    };

    // Elimina una tarea del arreglo.
    // .filter() devuelve un arreglo NUEVO con todos los elementos cuyo id
    // NO coincide con el que queremos borrar.
    const eliminarTarea = (id: number) => {
        setTareas(tareas.filter((tarea) => tarea.id !== id));
    };

    // Confirma la eliminación: borra la tarea del modal y cierra el modal.
    const confirmarEliminar = () => {
        if (tareaAEliminar) {
            eliminarTarea(tareaAEliminar.id);
        }
        setTareaAEliminar(null);
    };

    // Cambia una tarea de completada a pendiente (o viceversa).
    // .map() devuelve un arreglo nuevo; a la tarea coincidente le invierte
    // el valor de "completada" con el operador ! (negación).
    const alternarTarea = (id: number) => {
        setTareas(
            tareas.map((tarea) =>
                tarea.id === id
                    ? { ...tarea, completada: !tarea.completada }
                    : tarea
            )
        );
    };

    // Se separan las tareas en dos grupos para mostrarlas en sectores distintos.
    // .filter() crea sub-arreglos sin modificar el original.
    const tareasPendientes = tareas.filter((tarea) => !tarea.completada);
    const tareasCompletadas = tareas.filter((tarea) => tarea.completada);

    // Función que renderiza un <li> con los botones de acción de una tarea.
    // Se extrae para no repetir el mismo bloque en "pendientes" y "completadas".
    const renderizarTarea = (tarea: Tarea) => (
        <li
            key={tarea.id}
            className={
                tarea.completada
                    ? "lista__elemento lista__elemento--completada"
                    : "lista__elemento lista__elemento--pendiente"
            }
        >
            <div className="lista__info">
                <span
                    className={
                        tarea.completada
                            ? "lista__titulo-tarea lista__titulo-tarea--completada"
                            : "lista__titulo-tarea"
                    }
                >
                    {tarea.titulo}
                </span>
                {/* La descripción solo se muestra si no está vacía. */}
                {tarea.descripcion && (
                    <span className="lista__descripcion">
                        {tarea.descripcion}
                    </span>
                )}
            </div>

            <div className="lista__acciones">
                <button
                    className={
                        tarea.completada
                            ? "lista__boton-accion lista__boton-accion--reabrir"
                            : "lista__boton-accion lista__boton-accion--completar"
                    }
                    onClick={() => alternarTarea(tarea.id)}
                >
                    {tarea.completada ? "Marcar pendiente" : "Completar"}
                </button>
                <button
                    className="lista__boton-accion lista__boton-accion--editar"
                    onClick={() => iniciarEdicion(tarea)}
                >
                    Editar
                </button>
                <button
                    className="lista__boton-accion lista__boton-accion--eliminar"
                    onClick={() => setTareaAEliminar(tarea)}
                >
                    Eliminar
                </button>
            </div>
        </li>
    );

    return (
        <section className="lista">
            {/* Cabecera: título a la izquierda, resumen de conteos a la derecha. */}
            <header className="lista__cabecera">
                <h1 className="lista__titulo">Lista de tareas</h1>
                <div className="lista__resumen">
                    <span className="lista__resumen-item">
                        Total <strong>{tareas.length}</strong>
                    </span>
                    <span className="lista__resumen-item lista__resumen-item--pendientes">
                        Pendientes <strong>{tareasPendientes.length}</strong>
                    </span>
                    <span className="lista__resumen-item lista__resumen-item--completadas">
                        Completadas <strong>{tareasCompletadas.length}</strong>
                    </span>
                </div>
            </header>

            {/* Contenedor en dos columnas (fila en escritorio, columna en móvil). */}
            <div className="lista__columnas">
                {/* ===== COLUMNA IZQUIERDA: formulario ===== */}
                <aside className="lista__panel lista__panel--formulario">
                    <h2 className="lista__subtitulo">
                        {tareaEnEdicion ? "Editar tarea" : "Nueva tarea"}
                    </h2>

                    <form
                        className="lista__formulario"
                        onSubmit={(evento) => {
                            // Evita recargar la página al presionar Enter.
                            evento.preventDefault();
                            agregarOActualizar();
                        }}
                    >
                        <input
                            className="lista__entrada"
                            type="text"
                            placeholder="Título de la tarea"
                            value={titulo}
                            onChange={(evento) => setTitulo(evento.target.value)}
                        />
                        <textarea
                            className="lista__entrada lista__entrada--area"
                            placeholder="Descripción o subtarea (opcional)"
                            value={descripcion}
                            onChange={(evento) =>
                                setDescripcion(evento.target.value)
                            }
                        />
                        <button className="lista__boton" type="submit">
                            {tareaEnEdicion ? "Guardar cambios" : "Agregar"}
                        </button>
                        {/* El botón "Cancelar" solo aparece en modo edición. */}
                        {tareaEnEdicion && (
                            <button
                                className="lista__boton lista__boton--cancelar"
                                type="button"
                                onClick={cancelarEdicion}
                            >
                                Cancelar
                            </button>
                        )}
                    </form>

                    {/* Mensaje de error visible en pantalla (sin alert()). */}
                    {error && <p className="lista__error">{error}</p>}
                </aside>

                {/* ===== COLUMNA DERECHA: listados ===== */}
                <div className="lista__panel lista__panel--listados">
                    {/* Sector de pendientes. */}
                    <section className="lista__sector">
                        <h2 className="lista__subtitulo">
                            Pendientes ({tareasPendientes.length})
                        </h2>
                        {tareasPendientes.length === 0 ? (
                            <p className="lista__vacia">
                                No hay tareas pendientes.
                            </p>
                        ) : (
                            <ul className="lista__elementos">
                                {tareasPendientes.map(renderizarTarea)}
                            </ul>
                        )}
                    </section>

                    {/* Sector de completadas. */}
                    <section className="lista__sector">
                        <h2 className="lista__subtitulo">
                            Completadas ({tareasCompletadas.length})
                        </h2>
                        {tareasCompletadas.length === 0 ? (
                            <p className="lista__vacia">
                                No hay tareas completadas.
                            </p>
                        ) : (
                            <ul className="lista__elementos">
                                {tareasCompletadas.map(renderizarTarea)}
                            </ul>
                        )}
                    </section>
                </div>
            </div>

            {/* Modal de confirmación de eliminación (sin alert()). */}
            {tareaAEliminar && (
                <div className="lista__modal-fondo">
                    <div className="lista__modal">
                        <h2 className="lista__modal-titulo">
                            ¿Eliminar tarea?
                        </h2>
                        <p className="lista__modal-texto">
                            ¿Estás seguro de que querés eliminar la tarea{" "}
                            <strong>{tareaAEliminar.titulo}</strong>? Esta
                            acción no se puede deshacer.
                        </p>
                        <div className="lista__modal-acciones">
                            <button
                                className="lista__boton-accion"
                                onClick={() => setTareaAEliminar(null)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="lista__boton-accion lista__boton-accion--eliminar"
                                onClick={confirmarEliminar}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default ListaTareas;
