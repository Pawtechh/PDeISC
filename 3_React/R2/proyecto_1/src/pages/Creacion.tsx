// Creacion: página con un formulario para crear O editar una tarea.
// Propósito: capturar título y descripción. Si hay un id en la URL (modo edición),
// carga la tarea y la actualiza; si no, crea una tarea nueva.
// Dependencias: react-hook-form (useForm), react-router-dom (useNavigate, useParams),
//               tipo Tarea.
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import type { Tarea } from "../modules/datosTareas";

// Tipo que describe los campos del formulario.
interface DatosFormulario {
    titulo: string;
    descripcion: string;
}

// Datos que recibe la página por props: la lista y las funciones de alta/edición.
interface PropsCreacion {
    tareas: Tarea[];
    agregarTarea: (tarea: Tarea) => void;
    actualizarTarea: (tarea: Tarea) => void;
}

function Creacion({ tareas, agregarTarea, actualizarTarea }: PropsCreacion) {
    // Hook para navegar programáticamente después de guardar.
    const navigate = useNavigate();

    // useParams lee el "id" de la URL. En /crear no existe (undefined);
    // en /editar/:id trae el id de la tarea a editar.
    const { id } = useParams();

    // Busca la tarea a editar (solo en modo edición). Si no hay id, es undefined.
    const tareaEditar = id
        ? tareas.find((tarea) => tarea.id === Number(id))
        : undefined;

    // true si estamos editando una tarea existente.
    const esEdicion = Boolean(tareaEditar);

    // useForm maneja los campos de forma declarativa.
    // defaultValues precarga los valores si estamos editando una tarea.
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<DatosFormulario>({
        defaultValues: {
            titulo: tareaEditar?.titulo ?? "",
            descripcion: tareaEditar?.descripcion ?? "",
        },
    });

    // Se ejecuta al enviar el formulario (solo si pasa la validación).
    const manejarEnvio = (datos: DatosFormulario) => {
        if (esEdicion && tareaEditar) {
            // CASO EDICIÓN: se actualiza la tarea conservando id, fecha y estado.
            actualizarTarea({
                ...tareaEditar,
                titulo: datos.titulo.trim(),
                descripcion: datos.descripcion.trim(),
            });
        } else {
            // CASO ALTA: se crea una tarea nueva (siempre incompleta).
            const nuevaTarea: Tarea = {
                id: Date.now(),
                titulo: datos.titulo.trim(),
                descripcion: datos.descripcion.trim(),
                fecha: new Date().toISOString().slice(0, 10), // fecha actual (YYYY-MM-DD)
                completada: false,
            };
            agregarTarea(nuevaTarea);
        }

        // Navega a la página de inicio para ver el resultado.
        navigate("/");
    };

    return (
        // Contenedor centrado vertical y horizontalmente, restando la altura
        // del header sticky para que no genere scroll.
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                {/* Formulario dentro de una tarjeta con sombra. */}
                <form
                    onSubmit={handleSubmit(manejarEnvio)}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                    {/* Campo de título (validado como obligatorio). */}
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Título
                        <input
                            type="text"
                            placeholder="Título de la tarea"
                            {...register("titulo", {
                                required: "Escribí un título para la tarea.",
                            })}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </label>

                    {/* Campo de descripción: textarea grande para ver mucho texto sin scroll. */}
                    <label className="mb-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Descripción
                        <textarea
                            placeholder="Descripción de la tarea"
                            rows={8}
                            {...register("descripcion")}
                            className="mt-1 block w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-teal-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </label>

                    {/* Mensaje de error visible en pantalla (sin alert()). */}
                    {errors.titulo && (
                        <p className="mb-4 text-sm text-red-600">
                            {errors.titulo.message}
                        </p>
                    )}

                    {/* Botones. */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                        >
                            {esEdicion ? "Guardar cambios" : "Guardar"}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                // En edición vuelve al detalle; en creación, al inicio.
                                navigate(esEdicion ? `/tarea/${id}` : "/")
                            }
                            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Atrás
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Creacion;
