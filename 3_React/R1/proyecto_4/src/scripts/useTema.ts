// useTema: hook personalizado para manejar el modo claro/oscuro.
import { useEffect, useState } from "react";

const CLAVE_TEMA = "tema";

type Tema = "claro" | "oscuro";

function leerTemaGuardado(): Tema {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return guardado === "oscuro" ? "oscuro" : "claro";
}

export function useTema() {
    const [tema, setTema] = useState<Tema>(leerTemaGuardado);

    useEffect(() => {
        document.documentElement.setAttribute("data-tema", tema);
        localStorage.setItem(CLAVE_TEMA, tema);
    }, [tema]);

    const alternarTema = () => {
        setTema((anterior) => (anterior === "claro" ? "oscuro" : "claro"));
    };

    return { tema, alternarTema };
}
