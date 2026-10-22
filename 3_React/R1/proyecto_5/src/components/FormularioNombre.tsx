// FormularioNombre: captura el nombre de un usuario y muestra un mensaje de bienvenida.
// Dependencias: react (hook useState), react-hook-form (useForm), ../styles/FormularioNombre.css
// Conceptos clave:
//  1) useForm: maneja el input de forma declarativa (register + handleSubmit).
//     Evita tener un useState por campo y no re-renderiza en cada tecla.
//  2) validación con "required" y mensaje de error vía formState.errors (sin alert()).
//  3) handleSubmit: evita la recarga de la página al enviar.
import { useState } from "react";
import { useForm } from "react-hook-form";
import "./../styles/FormularioNombre.css";

// Tipo que describe los campos del formulario.
interface DatosFormulario {
    nombre: string;
}

function FormularioNombre() {
    // useForm devuelve:
    //  - register: vincula cada input al formulario.
    //  - handleSubmit: envuelve la función que se ejecuta al enviar.
    //  - formState: contiene los errores de validación.
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<DatosFormulario>();

    // Estado "enviado": controla si ya se envió el formulario.
    // (Se mantiene con useState porque no es un campo del formulario,
    //  es un estado de la interfaz.)
    const [enviado, setEnviado] = useState(false);

    // Estado que guarda el nombre ingresado para mostrarlo en la bienvenida.
    const [nombre, setNombre] = useState("");

    // Se ejecuta al enviar el formulario (solo si pasa la validación).
    const manejarEnvio = (datos: DatosFormulario) => {
        // Quita espacios del nombre y lo guarda.
        setNombre(datos.nombre.trim());
        setEnviado(true);
    };

    // Vuelve al formulario para escribir otro nombre.
    const volverAEditar = () => {
        setEnviado(false);
        setNombre("");
    };

    return (
        <section className="formulario">
            {/* Si ya se envió, muestra la bienvenida; si no, muestra el formulario. */}
            {enviado ? (
                <div className="formulario__bienvenida">
                    <h1 className="formulario__mensaje">
                        Bienvenido/a, {nombre}
                    </h1>
                    <button
                        className="formulario__boton formulario__boton--secundario"
                        onClick={volverAEditar}
                    >
                        Ingresar otro nombre
                    </button>
                </div>
            ) : (
                <form
                    className="formulario__form"
                    onSubmit={handleSubmit(manejarEnvio)}
                >
                    <h1 className="formulario__titulo">Ingresá tu nombre</h1>

                    {/* register vincula el input y define su validación. */}
                    <input
                        className="formulario__entrada"
                        type="text"
                        placeholder="Tu nombre"
                        {...register("nombre", {
                            required: "Escribí tu nombre antes de enviar.",
                        })}
                    />

                    {/* Mensaje de error visible en pantalla (sin alert()). */}
                    {errors.nombre && (
                        <p className="formulario__error">
                            {errors.nombre.message}
                        </p>
                    )}

                    <button className="formulario__boton" type="submit">
                        Enviar
                    </button>
                </form>
            )}
        </section>
    );
}

export default FormularioNombre;
