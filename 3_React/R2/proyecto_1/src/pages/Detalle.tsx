// Detalle: página que muestra la información completa de una tarea.
// Propósito: leer el id de la URL (useParams), buscar la tarea y mostrar
// título, descripción, fecha y estado, además de los botones Editar y Eliminar.
// Dependencias: react (useState), react-router-dom (useParams, useNavigate, Link), tipo Tarea.
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Tarea } from "../modules/datosTareas";

// Datos que recibe la página por props: la lista y la función de eliminar.
interface PropsDetalle {
    tareas: Tarea[];
    eliminarTarea: (id: number) => void;
}

function Detalle({ tareas, eliminarTarea }: PropsDetalle) {
    // useParams devuelve los parámetros de la URL (el "id").
    const { id } = useParams();

    // Hook para navegar después de eliminar.
    const navigate = useNavigate();

    // Estado que controla si el modal de confirmación está abierto.
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    // Busca la tarea cuyo id coincide con el de la URL.
    const tarea = tareas.find((t) => t.id === Number(id));

    // Si no se encuentra, muestra mensaje y un botón para volver.
    if (!tarea) {
        return (
            <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl text-center">
                    <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                        Tarea no encontrada
                    </h1>
                    <Link
                        to="/"
                        className="inline-block rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Volver
                    </Link>
                </div>
            </div>
        );
    }

    // Elimina la tarea y vuelve a la lista.
    const manejarEliminar = () => {
        eliminarTarea(tarea.id);
        navigate("/");
    };

    return (
        // Centrado vertical y horizontalmente, restando la altura del header sticky.
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
            {/* Información completa de la tarea. */}
            <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    {tarea.titulo}
                </h1>

                <p className="mb-4 text-gray-700 dark:text-gray-300">
                    {tarea.descripcion}
                </p>

                {/* Datos secundarios: fecha y estado. */}
                <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            Fecha de creación:
                        </span>{" "}
                        {tarea.fecha}
                    </p>
                    <span
                        className={
                            tarea.completada
                                ? "inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        }
                    >
                        {tarea.completada ? "Completa" : "Incompleta"}
                    </span>
                </div>

                {/* Botones de acción: atrás, editar y eliminar. */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate("/")}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Atrás
                    </button>
                    <Link
                        to={`/editar/${tarea.id}`}
                        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                    >
                        Editar
                    </Link>
                    <button
                        onClick={() => setMostrarConfirmacion(true)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Eliminar
                    </button>
                </div>
            </article>
            </div>

            {/* Modal de confirmación de eliminación (sin alert()). */}
            {mostrarConfirmacion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                            ¿Eliminar tarea?
                        </h2>
                        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
                            ¿Estás seguro de que querés eliminar la tarea{" "}
                            <span className="font-semibold">
                                {tarea.titulo}
                            </span>
                            ? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setMostrarConfirmacion(false)}
                                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={manejarEliminar}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Detalle;
