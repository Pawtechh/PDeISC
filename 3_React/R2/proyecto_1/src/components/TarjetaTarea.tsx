// TarjetaTarea: componente que muestra una tarea en forma de tarjeta clickeable.
// Propósito: toda la tarjeta navega al detalle; incluye un círculo seleccionable
// para marcar/desmarcar la tarea como completada (sin navegar, gracias a stopPropagation).
// Dependencias: react-router-dom (useNavigate), ../modules/datosTareas (tipo Tarea).
import { useNavigate } from "react-router-dom";
import type { Tarea } from "../modules/datosTareas";

// Datos que recibe el componente por props.
interface PropsTarjeta {
    tarea: Tarea;
    alternarTarea: (id: number) => void;
}

function TarjetaTarea({ tarea, alternarTarea }: PropsTarjeta) {
    // Hook para navegar programáticamente al detalle.
    const navigate = useNavigate();

    // Navega a la página de detalle de esta tarea.
    const irAlDetalle = () => {
        navigate(`/tarea/${tarea.id}`);
    };

    return (
        <li>
            {/* Toda la tarjeta es clickeable: onClick navega; role="button" y
                tabIndex + onKeyDown permiten navegar con teclado (accesibilidad). */}
            <article
                onClick={irAlDetalle}
                onKeyDown={(evento) => {
                    if (evento.key === "Enter" || evento.key === " ") {
                        evento.preventDefault();
                        irAlDetalle();
                    }
                }}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
                {/* Círculo seleccionable para completar/descompletar.
                    stopPropagation evita que el clic dispare la navegación. */}
                <button
                    onClick={(evento) => {
                        evento.stopPropagation();
                        alternarTarea(tarea.id);
                    }}
                    aria-label={
                        tarea.completada
                            ? "Marcar como pendiente"
                            : "Marcar como completada"
                    }
                    className={
                        tarea.completada
                            ? "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-teal-600 bg-teal-600 text-xs font-bold text-white transition dark:border-teal-500 dark:bg-teal-500"
                            : "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-gray-300 text-transparent transition hover:border-teal-500 dark:border-gray-600 dark:hover:border-teal-400"
                    }
                >
                    {/* Check (símbolo, no emoji). */}
                    {tarea.completada ? "✓" : ""}
                </button>

                {/* Texto de la tarea. */}
                <div className="min-w-0">
                    <h3
                        className={
                            tarea.completada
                                ? "mb-1 text-base font-semibold text-gray-500 line-through dark:text-gray-400"
                                : "mb-1 text-base font-semibold text-gray-900 dark:text-white"
                        }
                    >
                        {tarea.titulo}
                    </h3>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {tarea.descripcion}
                    </p>
                </div>
            </article>
        </li>
    );
}

export default TarjetaTarea;
