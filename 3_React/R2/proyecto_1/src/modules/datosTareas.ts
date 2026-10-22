// datosTareas: archivo de datos con las tareas iniciales de la aplicación.
// Propósito: separar los datos de la lógica de presentación (separación de capas).
// Dependencias: ninguna (solo tipos y datos).
//
// Este archivo exporta:
//  - El tipo Tarea (la "forma" de cada tarea).
//  - El arreglo tareasIniciales (datos de ejemplo con los que arranca la app).

// Tipo que describe los campos de una tarea.
export interface Tarea {
    id: number;          // identificador único (se usa en la URL /tarea/:id)
    titulo: string;      // título de la tarea
    descripcion: string; // descripción completa
    fecha: string;       // fecha de creación (formato legible)
    completada: boolean; // estado: true = completa, false = incompleta
}

// Arreglo inicial de tareas (datos de ejemplo).
// El estado de React en App.tsx arranca desde este arreglo.
export const tareasIniciales: Tarea[] = [
    {
        id: 1,
        titulo: "Estudiar React Router",
        descripcion:
            "Leer la documentación y practicar rutas, parámetros dinámicos y navegación con React Router.",
        fecha: "2026-09-01",
        completada: false,
    },
    {
        id: 2,
        titulo: "Configurar Tailwind CSS",
        descripcion:
            "Instalar y configurar Tailwind para maquetar las páginas de forma rápida y responsive.",
        fecha: "2026-09-03",
        completada: true,
    },
    {
        id: 3,
        titulo: "Entregar el trabajo práctico",
        descripcion:
            "Revisar que las tres páginas funcionen, validar el build y entregar la actividad.",
        fecha: "2026-09-10",
        completada: false,
    },
];
