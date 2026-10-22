// useTema: hook personalizado para manejar el modo claro/oscuro.
// Propósito: leer el tema guardado en localStorage, aplicar el atributo
// "data-tema" al <html> y permitir alternar entre claro y oscuro.
// Dependencias: react (useState, useEffect).
import { useEffect, useState } from "react";

// Clave con la que se guarda el tema en localStorage.
const CLAVE_TEMA = "tema";

// Tipo del tema: solo puede ser "claro" u "oscuro".
type Tema = "claro" | "oscuro";

// Lee el tema guardado al iniciar. Si no hay nada, devuelve "claro".
function leerTemaGuardado(): Tema {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return guardado === "oscuro" ? "oscuro" : "claro";
}

export function useTema() {
    // Estado del tema, inicializado con lo guardado.
    const [tema, setTema] = useState<Tema>(leerTemaGuardado);

    // Cada vez que cambia el tema, se aplica "data-tema" en <html> y se guarda.
    useEffect(() => {
        document.documentElement.setAttribute("data-tema", tema);
        localStorage.setItem(CLAVE_TEMA, tema);
    }, [tema]);

    // Alterna entre claro y oscuro.
    const alternarTema = () => {
        setTema((anterior) => (anterior === "claro" ? "oscuro" : "claro"));
    };

    return { tema, alternarTema };
}
