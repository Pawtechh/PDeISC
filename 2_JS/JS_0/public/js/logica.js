// --- BASE DE DATOS DE VALIDACIÓN (CRITERIO GOOGLE) ---
const DB = {
    animales: ["perro", "gato", "loro", "caballo", "vaca", "leon", "tigre", "elefante", "mono", "jirafa", "cebra", "pato"],
    frutas: ["manzana", "banana", "pera", "uva", "naranja", "frutilla", "kiwi", "melon", "sandia", "piña", "mango"],
    colores: ["rojo", "azul", "verde", "amarillo", "negro", "blanco", "rosa", "naranja", "violeta", "gris", "marron"],
    ciudades: ["madrid", "buenos aires", "mar del plata", "paris", "londres", "roma", "berlin", "tokio", "nueva york"],
    nombres: ["hernan", "juan", "maria", "pedro", "lucas", "santiago", "florencia", "agustina", "belen", "marcos"]
};

export const ejecutar = (punto, menu, array, valor, valorExtra = null) => {
    const v = valor.toLowerCase().trim();

    switch (punto) {
        case 1: // PUSH
            if (menu === 1) {
                if (array.length >= 3) return { err: "Límite de 3 frutas alcanzado." };
                if (!DB.frutas.includes(v)) return { err: "Esa fruta no es válida." };
                array.push(valor); return { msg: `Fruta ${array.length}/3 agregada.` };
            }
            if (menu === 2) {
                if (array.length >= 3) return { err: "Ya tenés 3 amigos." };
                array.push(valor); return { msg: `Amigo ${array.length}/3 guardado.` };
            }
            if (menu === 3) {
                let n = Number(valor);
                if (isNaN(n)) return { err: "Debe ser un número." };
                if (array.length > 0 && n <= array[array.length - 1]) return { err: `Debe ser mayor a ${array[array.length - 1]}.` };
                array.push(n); return { msg: "Número mayor agregado." };
            }
            break;

        case 2: // POP
            if (menu === 1) {
                if (array.length === 0) {
                    let items = valor.split(",").map(i => i.trim().toLowerCase());
                    if (!items.every(i => DB.animales.includes(i))) return { err: "Hay algo que no es un animal." };
                    array.push(...items); return { msg: "Array creado. Dale de nuevo para borrar el último." };
                }
                return { msg: "Chau al animal: " + array.pop() };
            }
            if (menu === 2) {
                if (array.length === 0 && valor !== "") { array.push(...valor.split(",")); return { msg: "Lista de compras creada." }; }
                return { msg: "Producto quitado: " + array.pop() };
            }
            if (menu === 3) {
                if (array.length === 0) { array.push(1, 2, 3, 4, 5); return { msg: "Array con 5 items. Dale para vaciar." }; }
                while(array.length > 0) array.pop();
                return { msg: "Vaciado total con While." };
            }
            break;

        case 3: // UNSHIFT
            if (menu === 1) {
                if (array.length >= 3) return { err: "Solo 3 colores." };
                if (!DB.colores.includes(v)) return { err: "Color no válido." };
                array.unshift(valor); return { msg: "Color al principio." };
            }
            if (menu === 2) {
                if (valorExtra === 'urgente') { array.unshift(valor); return { msg: "Tarea URGENTE priorizada." }; }
                array.push(valor); return { msg: "Tarea normal añadida." };
            }
            if (menu === 3) {
                array.unshift(valor); return { msg: `${valor} se conectó primero.` };
            }
            break;

        case 5: // SPLICE
            if (menu === 1) {
                if (valor.length !== 1 || !/[a-zA-Z]/.test(valor)) return { err: "Solo una letra." };
                array.push(valor);
                if (array.length >= 4) { array.splice(1, 2); return { msg: "Borrados 2 desde pos 1." }; }
                return { msg: "Faltan letras." };
            }
            if (menu === 2) {
                if (!DB.nombres.includes(v)) return { err: "Nombre no validado." };
                if (array.length < 3) { array.push(valor); return { msg: `Cargando (${array.length}/3)...` }; }
                array.splice(1, 0, valor); return { msg: "Insertado en segunda posición." };
            }
            if (menu === 3) {
                if (array.length < 4) { array.push(valor); return { msg: "Cargando 4 elementos..." }; }
                array.splice(1, 2, "REEMPLAZO_1", "REEMPLAZO_2"); return { msg: "Elementos reemplazados." };
            }
            break;

        case 6: // SLICE
            if (menu === 1) {
                array.push(Number(valor));
                if (array.length === 10) return { msg: "Copia de los 3 primeros: " + JSON.stringify(array.slice(0, 3)) };
                return { msg: `Llevás ${array.length}/10.` };
            }
            if (menu === 2) {
                array.push(valor);
                if (array.length === 6) return { msg: "Copia parcial (pos 2 a 4): " + JSON.stringify(array.slice(2, 5)) };
                return { msg: `Llevás ${array.length}/6.` };
            }
            if (menu === 3) {
                array.push(valor);
                if (array.length === 8) return { msg: "Últimos 3: " + JSON.stringify(array.slice(-3)) };
                return { msg: `Llevás ${array.length}/8.` };
            }
            break;

        case 14: // REVERSE
            if (menu === 1) {
                if (valor.length > 25) return { err: "Máximo 25 caracteres." };
                return { msg: "Invertido: " + valor.split("").reverse().join("") };
            }
            if (menu === 2) {
                if (array.length < 10) { array.push(Number(valor)); return { msg: `Agregado. Inverso: ${JSON.stringify([...array].reverse())}` }; }
                return { err: "Máximo 10." };
            }
            if (menu === 3) {
                let frase = valor.split(" ").reverse().join(" ");
                return { msg: `Frase invertida: ${frase}` };
            }
            break;

        default:
            // Lógica genérica para los puntos intermedios (7 al 13)
            array.push(valor);
            return { msg: "Procesado correctamente." };
    }
};