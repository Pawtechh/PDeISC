// Componente Saludo: muestra "Hola, mundo!" de forma minimalista.
// Dependencias: ../styles/Saludo.css
import "./../styles/Saludo.css";

function Saludo() {
    return (
        <section className="saludo">
            <h1 className="saludo__titulo">Hola, mundo!</h1>
        </section>
    );
}

export default Saludo;