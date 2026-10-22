// TarjetaPresentacion: credencial de identificación con nombre, apellido, profesión e imagen.
// Dependencias: ../styles/TarjetaPresentacion.css
import "./../styles/TarjetaPresentacion.css";

// Datos que recibe el componente por props.
interface PropsTarjeta {
    nombre: string;
    apellido: string;
    profesion: string;
    imagen: string;
}

function TarjetaPresentacion({ nombre, apellido, profesion, imagen }: PropsTarjeta) {
    return (
        <article className="credencial">
            {/* Banda superior con el título. */}
            <header className="credencial__cabecera">
                <span className="credencial__titulo">Tarjeta de Presentación</span>
            </header>

            {/* Cuerpo: foto a la izquierda, datos a la derecha. */}
            <div className="credencial__cuerpo">
                <img
                    className="credencial__imagen"
                    src={imagen}
                    alt={`Foto de ${nombre} ${apellido}`}
                />
                <div className="credencial__datos">
                    <h2 className="credencial__nombre">{nombre} {apellido}</h2>
                    <p className="credencial__profesion">{profesion}</p>
                </div>
            </div>

            {/* Franja inferior, como las tarjetas de acceso. */}
            <footer className="credencial__franja" />
        </article>
    );
}

export default TarjetaPresentacion;