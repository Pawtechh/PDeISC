// Inicio: página principal con la lista de tareas dividida en dos columnas.
// Propósito: mostrar "Pendientes" (izquierda) y "Completadas" (derecha).
// En desktop las dos columnas van lado a lado; en móvil se apilan verticalmente.
// Dependencias: TarjetaTarea, tipo Tarea.
import TarjetaTarea from "../components/TarjetaTarea";
import type { Tarea } from "../modules/datosTareas";

// Datos que recibe la página por props: la lista y la función de cambiar estado.
interface PropsInicio {
    tareas: Tarea[];
    alternarTarea: (id: number) => void;
}

function Inicio({ tareas, alternarTarea }: PropsInicio) {
    // Se separan las tareas en dos grupos (inmutabilidad: .filter() no modifica).
    const pendientes = tareas.filter((tarea) => !tarea.completada);
    const completadas = tareas.filter((tarea) => tarea.completada);

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
            {/* Dos contenedores horizontales (verticales en móvil). */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Columna izquierda: pendientes. */}
                <section className="flex flex-col">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Pendientes ({pendientes.length})
                    </h2>
                    {pendientes.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                            No hay tareas pendientes.
                        </p>
                    ) : (
                        // La lista tiene scroll interno para no estirar la página.
                        <ul className="lista-con-scroll flex flex-col gap-3 overflow-y-auto pr-2">
                            {pendientes.map((tarea) => (
                                <TarjetaTarea
                                    key={tarea.id}
                                    tarea={tarea}
                                    alternarTarea={alternarTarea}
                                />
                            ))}
                        </ul>
                    )}
                </section>

                {/* Columna derecha: completadas. */}
                <section className="flex flex-col">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Completadas ({completadas.length})
                    </h2>
                    {completadas.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                            No hay tareas completadas.
                        </p>
                    ) : (
                        // La lista tiene scroll interno para no estirar la página.
                        <ul className="lista-con-scroll flex flex-col gap-3 overflow-y-auto pr-2">
                            {completadas.map((tarea) => (
                                <TarjetaTarea
                                    key={tarea.id}
                                    tarea={tarea}
                                    alternarTarea={alternarTarea}
                                />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Inicio;
