// Contador: componente que muestra un número y permite incrementarlo o decrementarlo.
// Dependencias: react (hook useState), ../styles/Contador.css
// Concepto clave: usa "estado" (useState) para recordar el valor actual del contador.
import { useState } from "react";
import "./../styles/Contador.css";

function Contador() {
    // useState devuelve dos cosas:
    //  1) "valor"     -> el número actual del contador (empieza en 0).
    //  2) "setValor"  -> la función que actualiza ese número.
    // Al llamar a setValor, React vuelve a dibujar (renderizar) el componente con el nuevo valor.
    const [valor, setValor] = useState(0);

    // Incrementar: suma 1 al valor actual.
    const incrementar = () => {
        setValor(valor + 1);
    };

    // Decrementar: resta 1 al valor actual.
    const decrementar = () => {
        setValor(valor - 1);
    };

    return (
        <section className="contador">
            <h2 className="contador__titulo">Contador</h2>

            {/* El valor se muestra entre llaves {} porque es una variable de JS dentro de JSX. */}
            <p className="contador__valor">{valor}</p>

            <div className="contador__acciones">
                <button
                    className="contador__boton contador__boton--restar"
                    onClick={decrementar}
                >
                    Decrementar
                </button>

                <button
                    className="contador__boton contador__boton--sumar"
                    onClick={incrementar}
                >
                    Incrementar
                </button>
            </div>
        </section>
    );
}

export default Contador;
