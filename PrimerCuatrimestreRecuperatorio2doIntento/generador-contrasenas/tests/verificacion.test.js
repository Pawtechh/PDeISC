/**
 * Archivo: tests/verificacion.test.js
 * Proposito: Suite de pruebas automatizadas con el ejecutor nativo 'node:test'.
 *            Verifica de punta a punta que todos los temas del cuatrimestre funcionen sin errores:
 *            1. Clases con getters y setters (validaciones y restricciones de rango).
 *            2. Vector de Clases GestorContrasenas (filtrado, busqueda, mutacion y conteo).
 *            3. Generacion criptografica en el servidor (longitud, evitar ambiguos y evaluacion de fuerza).
 *            4. Integracion HTTP completa en localhost:
 *               - Despacho de HTML semantico y modulos estaticos.
 *               - Peticiones con Axios (salud y generacion).
 *               - Operaciones ABM con Fetch sobre el archivo JSON.
 *               - Emision y captura de eventos con EventEmitter.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import axios from 'axios';

import {
    ConfiguracionGenerador,
    RegistroContrasena,
    GestorContrasenas
} from '../modules/moduloClases.js';
import {
    evaluarSeguridad,
    generarContrasenasServidor
} from '../modules/moduloGeneradorServidor.js';
import { crearAplicacion } from '../server.js';

/**
 * Prueba 1: Verifica que las clases con getters y setters validen correctamente los datos.
 * En criollo: Comprueba que si alguien intenta poner una longitud invalida o una categoria trucha,
 * la clase salte con un error y no deje pasar datos corruptos.
 */
test('Clases ConfiguracionGenerador y RegistroContrasena validan con GET y SET', () => {
    const config = new ConfiguracionGenerador({
        longitud: 20,
        incluirMayusculas: true,
        incluirMinusculas: true,
        incluirNumeros: true,
        incluirSimbolos: false,
        cantidad: 3
    });

    assert.equal(config.longitud, 20);
    assert.deepEqual(config.tiposActivos, ['Mayusculas', 'Minusculas', 'Numeros']);
    
    // Debe lanzar RangeError si se pone una longitud menor a 6
    assert.throws(() => {
        config.longitud = 4;
    }, RangeError);

    // Debe lanzar RangeError si se pide generar mas de 5 claves
    assert.throws(() => {
        config.cantidad = 9;
    }, RangeError);

    const reg = new RegistroContrasena({
        servicio: 'Campus Virtual',
        usuario: 'alumno@uni.local',
        categoria: 'Estudio',
        contrasena: 'Ab3#xYz9!qLm'
    });

    // Comprueba el getter calculado de enmascaramiento con asteriscos
    assert.equal(reg.contrasenaEnmascarada.length, 12);

    // Debe fallar si el servicio tiene menos de 2 letras
    assert.throws(() => {
        reg.servicio = 'X';
    }, Error);

    // Debe fallar si la categoria no esta en el vector oficial
    assert.throws(() => {
        reg.categoria = 'CategoriaInvalida';
    }, Error);
});

/**
 * Prueba 2: Verifica el funcionamiento del Vector de Clases GestorContrasenas.
 * En criollo: Comprueba que el gestor guarde instancias reales de RegistroContrasena,
 * sepa buscar por ID, filtrar por categoria, actualizar y borrar con splice.
 */
test('Vector de Clases GestorContrasenas filtra, actualiza y elimina instancias', () => {
    const gestor = new GestorContrasenas([
        { id: 'r1', servicio: 'Banco Local', categoria: 'Finanzas', contrasena: 'Zp9#kL2$vR8!' },
        { id: 'r2', servicio: 'Red Social', categoria: 'Redes', contrasena: 'abcd1234' }
    ]);

    assert.equal(gestor.total, 2);
    // Cada elemento del vector DEBE ser una instancia de RegistroContrasena
    assert.ok(gestor.registros[0] instanceof RegistroContrasena);

    // Filtrado por categoria
    const soloFinanzas = gestor.filtrar({ categoria: 'Finanzas' });
    assert.equal(soloFinanzas.length, 1);
    assert.equal(soloFinanzas[0].servicio, 'Banco Local');

    // Actualizacion
    gestor.actualizar('r2', { servicio: 'Red Social Editada' });
    assert.equal(gestor.buscarPorId('r2').servicio, 'Red Social Editada');

    // Eliminacion
    const eliminado = gestor.eliminar('r1');
    assert.equal(eliminado.id, 'r1');
    assert.equal(gestor.total, 1);
});

/**
 * Prueba 3: Verifica la generacion segura de claves en el backend y evaluacion de fuerza.
 * En criollo: Comprueba que las claves tengan la longitud exacta, que no tengan caracteres
 * ambiguos si se pidio evitarlos y que el auditor de seguridad clasifique bien las contrasenias.
 */
test('Generador del servidor respeta longitud, evitar ambiguos y evaluacion', () => {
    const res = generarContrasenasServidor({
        longitud: 20,
        evitarAmbiguos: true,
        cantidad: 3
    });

    assert.equal(res.lista.length, 3);
    for (const item of res.lista) {
        assert.equal(item.contrasena.length, 20);
        // Ningun caracter ambiguo debe estar presente
        assert.equal(/[0Oo1Il]/.test(item.contrasena), false);
    }

    assert.equal(evaluarSeguridad('1234').nivelSeguridad, 'Debil');
    assert.equal(evaluarSeguridad('K9#mP4!vQ8@xL2$zR7').nivelSeguridad, 'Muy Fuerte');
});

/**
 * Prueba 4: Prueba de integracion completa con servidor Express levantado en puerto dinamico.
 * En criollo: Levanta un servidor de pruebas real, hace peticiones HTTP con Axios y con Fetch,
 * escribe en un archivo JSON temporal y captura los eventos de EventEmitter.
 */
test('Integracion HTTP en localhost con JSON, Axios, Fetch y EventEmitter', async (t) => {
    const dirTemporal = await fs.mkdtemp(path.join(os.tmpdir(), 'generador-test-'));
    const rutaJson = path.join(dirTemporal, 'contrasenas-test.json');

    const { aplicacion, emisorEventos } = await crearAplicacion({
        rutaBaseDatos: rutaJson,
        silenciarLogs: true
    });

    // Capturamos eventos del servidor emitidos con EventEmitter
    const eventosCapturados = [];
    emisorEventos.on('contrasena:generada', () => eventosCapturados.push('contrasena:generada'));
    emisorEventos.on('registro:guardado', () => eventosCapturados.push('registro:guardado'));
    emisorEventos.on('registro:actualizado', () => eventosCapturados.push('registro:actualizado'));
    emisorEventos.on('registro:eliminado', () => eventosCapturados.push('registro:eliminado'));

    // Escuchamos en un puerto dinamico asignado por el SO (puerto 0)
    const servidor = aplicacion.listen(0, '127.0.0.1');
    await new Promise((resolver) => servidor.once('listening', resolver));

    // Cleanup al finalizar la prueba
    t.after(async () => {
        await new Promise((resolver) => servidor.close(resolver));
        await fs.rm(dirTemporal, { recursive: true, force: true });
    });

    const { port } = servidor.address();
    const urlBase = `http://127.0.0.1:${port}`;

    // 1. Verificamos que entregue el index.html
    const resHtml = await fetch(`${urlBase}/`);
    assert.equal(resHtml.status, 200);
    const html = await resHtml.text();
    assert.match(html, /Generador de Contrasenias/);

    // 2. Probamos peticiones mediante Axios
    const resSalud = await axios.get(`${urlBase}/api/salud`);
    assert.equal(resSalud.data.exito, true);

    const resGenerar = await axios.post(`${urlBase}/api/generar`, {
        longitud: 16,
        cantidad: 3
    });
    assert.equal(resGenerar.status, 200);
    assert.equal(resGenerar.data.datos.lista.length, 3);

    // 3. Probamos operaciones ABM sobre el archivo .json mediante Fetch
    const resListar = await fetch(`${urlBase}/api/contrasenas`);
    const bodyListar = await resListar.json();
    assert.equal(bodyListar.datos.registros.length, 2);

    const resGuardar = await fetch(`${urlBase}/api/contrasenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            servicio: 'Cuenta Pruebas',
            usuario: 'tester@local',
            categoria: 'Trabajo',
            contrasena: resGenerar.data.datos.principal.contrasena
        })
    });
    assert.equal(resGuardar.status, 201);
    const bodyGuardar = await resGuardar.json();
    const idNuevo = bodyGuardar.datos.registro.id;

    // Comprobamos que el archivo JSON en disco realmente aumento a 3 registros
    const disco = JSON.parse(await fs.readFile(rutaJson, 'utf-8'));
    assert.equal(disco.registros.length, 3);

    // Modificamos con PUT
    const resEditar = await fetch(`${urlBase}/api/contrasenas/${idNuevo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicio: 'Cuenta Pruebas Editada' })
    });
    assert.equal(resEditar.status, 200);

    // Eliminamos con DELETE
    const resEliminar = await fetch(`${urlBase}/api/contrasenas/${idNuevo}`, {
        method: 'DELETE'
    });
    assert.equal(resEliminar.status, 200);

    // Verificamos que todos los eventos de EventEmitter se hayan disparado
    assert.deepEqual(eventosCapturados, [
        'contrasena:generada',
        'registro:guardado',
        'registro:actualizado',
        'registro:eliminado'
    ]);
});
