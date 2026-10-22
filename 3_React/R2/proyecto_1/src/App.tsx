// App: componente raíz de la aplicación.
// Propósito: guardar el estado compartido (la lista de tareas), manejar el tema
// claro/oscuro y definir las rutas con un header fijo global.
// Dependencias: react (useState), react-router-dom (Routes, Route, Link),
//               useTema, las páginas y el archivo de datos inicial.
import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Detalle from "./pages/Detalle";
import Creacion from "./pages/Creacion";
import { tareasIniciales, type Tarea } from "./modules/datosTareas";
import { useTema } from "./scripts/useTema";

// Clave con la que se guardan las tareas en localStorage.
const CLAVE_TAREAS = "tareas_r2";

// Lee las tareas guardadas en localStorage al iniciar.
// Si no hay nada (primera vez), devuelve las tareas de ejemplo.
function leerTareasGuardadas(): Tarea[] {
    try {
        const guardado = localStorage.getItem(CLAVE_TAREAS);
        return guardado ? (JSON.parse(guardado) as Tarea[]) : tareasIniciales;
    } catch {
        return tareasIniciales;
    }
}

function App() {
    // Estado compartido: la lista de tareas.
    // Se inicializa desde localStorage (o tareasIniciales si no hay nada).
    const [tareas, setTareas] = useState<Tarea[]>(leerTareasGuardadas);

    // Hook del tema: devuelve el tema actual y la función para alternarlo.
    const { tema, alternarTema } = useTema();

    // useLocation devuelve la ruta actual, para adaptar el header a cada página.
    const { pathname } = useLocation();

    // Título del header según la ruta actual.
    const tituloHeader = pathname.startsWith("/crear")
        ? "Crear tarea"
        : pathname.startsWith("/editar")
          ? "Editar tarea"
          : pathname.startsWith("/tarea")
            ? "Detalle de tarea"
            : "Mis tareas";

    // El botón "Nueva tarea" solo se muestra en la página de inicio.
    const mostrarBotonNuevaTarea = pathname === "/";

    // ALTA: agrega una tarea nueva (inmutabilidad con spread).
    const agregarTarea = (nuevaTarea: Tarea) => {
        setTareas([...tareas, nuevaTarea]);
    };

    // MODIFICACIÓN: actualiza una tarea existente (.map()).
    const actualizarTarea = (tareaActualizada: Tarea) => {
        setTareas(
            tareas.map((tarea) =>
                tarea.id === tareaActualizada.id ? tareaActualizada : tarea
            )
        );
    };

    // BAJA: elimina una tarea por su id (.filter()).
    const eliminarTarea = (id: number) => {
        setTareas(tareas.filter((tarea) => tarea.id !== id));
    };

    // Cambia el estado de una tarea (completa <-> incompleta).
    const alternarTarea = (id: number) => {
        setTareas(
            tareas.map((tarea) =>
                tarea.id === id
                    ? { ...tarea, completada: !tarea.completada }
                    : tarea
            )
        );
    };

    // Persistencia: cada vez que cambia la lista, se guarda en localStorage.
    // Así las tareas no se pierden al recargar la página.
    useEffect(() => {
        localStorage.setItem(CLAVE_TAREAS, JSON.stringify(tareas));
    }, [tareas]);

    return (
        // Contenedor con fondo gradiente vertical y alto mínimo de pantalla.
        // Las clases dark:* cambian los colores en modo oscuro.
        <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* Header sticky: se queda arriba al hacer scroll, sin salir del flujo. */}
            <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3">
                    {/* Título dinámico (enlaza al inicio). */}
                    <Link
                        to="/"
                        className="text-xl font-bold text-gray-900 dark:text-white"
                    >
                        {tituloHeader}
                    </Link>

                    <div className="flex items-center gap-3">
                        {/* Botón "Nueva tarea": solo en la página de inicio. */}
                        {mostrarBotonNuevaTarea && (
                            <Link
                                to="/crear"
                                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                            >
                                Nueva tarea
                            </Link>
                        )}

                        {/* Botón para alternar tema (icono sol/luna, sin emojis). */}
                        <button
                            onClick={alternarTema}
                            aria-label={
                                tema === "claro"
                                    ? "Cambiar a modo oscuro"
                                    : "Cambiar a modo claro"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            {tema === "claro" ? (
                                // Icono de luna (indica "ir a oscuro").
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                >
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            ) : (
                                // Icono de sol (indica "ir a claro").
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                >
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido. */}
            <main>
            {/* Routes define qué componente se renderiza para cada ruta. */}
            <Routes>
                <Route
                    path="/"
                    element={
                        <Inicio
                            tareas={tareas}
                            alternarTarea={alternarTarea}
                        />
                    }
                />
                <Route
                    path="/tarea/:id"
                    element={
                        <Detalle
                            tareas={tareas}
                            eliminarTarea={eliminarTarea}
                        />
                    }
                />
                <Route
                    path="/crear"
                    element={
                        <Creacion
                            tareas={tareas}
                            agregarTarea={agregarTarea}
                            actualizarTarea={actualizarTarea}
                        />
                    }
                />
                <Route
                    path="/editar/:id"
                    element={
                        <Creacion
                            tareas={tareas}
                            agregarTarea={agregarTarea}
                            actualizarTarea={actualizarTarea}
                        />
                    }
                />
            </Routes>
            </main>
        </div>
    );
}

export default App;

