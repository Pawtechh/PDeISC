// Componente raíz: arma la pantalla usando el componente Saludo y el botón de tema.
// Dependencias: ./components/Saludo, ./scripts/useTema, ./App.css
import Saludo from "./components/Saludo";
import { useTema } from "./scripts/useTema";
import "./App.css";

function App() {
    // Hook del tema: devuelve el tema actual y la función para alternarlo.
    const { tema, alternarTema } = useTema();

    return (
        <>
            {/* Botón flotante para alternar claro/oscuro (icono sol/luna). */}
            <button
                className="boton-tema"
                onClick={alternarTema}
                aria-label="Cambiar tema"
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
                        style={{ width: 20, height: 20 }}
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
                        style={{ width: 20, height: 20 }}
                    >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                )}
            </button>

            <main>
                <Saludo />
            </main>
        </>
    );
}

export default App;