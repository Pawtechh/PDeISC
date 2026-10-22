// useTema: hook personalizado para manejar el modo claro/oscuro.
// Propósito: leer el tema guardado en localStorage, aplicar la clase "dark"
// al elemento <html> y permitir alternar entre claro y oscuro.
// Dependencias: react (useState, useEffect).

import { useEffect, useState } from "react";

// Clave con la que se guarda el tema en localStorage.
const CLAVE_TEMA = "tema";

// Tipo del tema: solo puede ser "claro" u "oscuro".
type Tema = "claro" | "oscuro";

// Lee el tema guardado al iniciar. Si no hay nada, devuelve "claro" (por defecto).
function leerTemaGuardado(): Tema {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return guardado === "oscuro" ? "oscuro" : "claro";
}

export function useTema() {
    // Estado del tema, inicializado con lo guardado en localStorage.
    const [tema, setTema] = useState<Tema>(leerTemaGuardado);

    // useEffect: cada vez que cambia el tema, aplica/quito la clase "dark"
    // en <html> y guarda la preferencia en localStorage.
    useEffect(() => {
        const raiz = document.documentElement;
        if (tema === "oscuro") {
            raiz.classList.add("dark");
        } else {
            raiz.classList.remove("dark");
        }
        localStorage.setItem(CLAVE_TEMA, tema);
    }, [tema]);

    // Alterna entre claro y oscuro.
    const alternarTema = () => {
        setTema((anterior) => (anterior === "claro" ? "oscuro" : "claro"));
    };

    return { tema, alternarTema };
}
