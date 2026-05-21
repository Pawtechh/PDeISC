/**
 * ARCHIVO: personasManager.js
 * PROPÓSITO: Gestión de personas en LocalStorage con validaciones robustas
 * EXPORTA: cargarPersonas, guardarPersona, eliminarPersona, validarPersona, obtenerNombresCompletos
 */

const STORAGE_KEY = 'personas_db';

export function cargarPersonas() {
  const datos = localStorage.getItem(STORAGE_KEY);
  if (!datos) return [];
  try {
    return JSON.parse(datos);
  } catch (e) {
    console.error('Error al cargar personas:', e);
    return [];
  }
}

export function guardarPersona(persona) {
  const personas = cargarPersonas();
  const nuevaPersona = { ...persona, id: Date.now() };
  personas.push(nuevaPersona);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
  return personas;
}

export function eliminarPersona(id) {
  let personas = cargarPersonas();
  personas = personas.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
  return personas;
}

/**
 * Validación completa de todos los campos
 * @returns {Object} { valido: boolean, errores: string[] }
 */
export function validarPersona(data) {
  const errores = [];

  // 1. Nombre y apellido: solo letras y espacios, mínimo 2 caracteres
  const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}$/;
  if (!data.nombre?.trim()) errores.push('El nombre es obligatorio');
  else if (!nombreRegex.test(data.nombre.trim())) errores.push('El nombre solo debe contener letras y espacios (mínimo 2 caracteres)');

  if (!data.apellido?.trim()) errores.push('El apellido es obligatorio');
  else if (!nombreRegex.test(data.apellido.trim())) errores.push('El apellido solo debe contener letras y espacios (mínimo 2 caracteres)');

  // 2. Edad: entero entre 0 y 120
  const edad = parseInt(data.edad);
  if (isNaN(edad)) errores.push('La edad debe ser un número');
  else if (edad < 0 || edad > 120) errores.push('La edad debe estar entre 0 y 120 años');

  // 3. Fecha de nacimiento: debe ser fecha real y no mayor a hoy
  if (!data.fechaNac) errores.push('La fecha de nacimiento es obligatoria');
  else {
    const fecha = new Date(data.fechaNac);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (isNaN(fecha.getTime())) errores.push('Fecha de nacimiento inválida');
    else if (fecha > hoy) errores.push('La fecha de nacimiento no puede ser futura');
  }

  // 4. Sexo: valores predefinidos
  const sexosValidos = ['Masculino', 'Femenino'];
  if (!data.sexo || !sexosValidos.includes(data.sexo)) errores.push('Debe seleccionar un sexo válido');

  // 5. Documento: alfanumérico, sin espacios, entre 5 y 15 caracteres
  const docRegex = /^[A-Za-z0-9]{5,15}$/;
  if (!data.documento?.trim()) errores.push('El documento es obligatorio');
  else if (!docRegex.test(data.documento.trim())) errores.push('El documento debe tener entre 5 y 15 caracteres alfanuméricos (sin espacios)');

  // 6. Estado civil: valores predefinidos
  const estadosCiviles = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a'];
  if (!data.estadoCivil || !estadosCiviles.includes(data.estadoCivil)) errores.push('Debe seleccionar un estado civil válido');

  // 7. Nacionalidad: solo letras y espacios, mínimo 2 caracteres
  const nacionalidadRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,}$/;
  if (!data.nacionalidad?.trim()) errores.push('La nacionalidad es obligatoria');
  else if (!nacionalidadRegex.test(data.nacionalidad.trim())) errores.push('La nacionalidad solo debe contener letras y espacios');

  // 8. Teléfono: solo dígitos, entre 7 y 15 caracteres (puede incluir + al inicio opcional)
  const telefonoRegex = /^\+?[0-9]{7,15}$/;
  if (!data.telefono?.trim()) errores.push('El teléfono es obligatorio');
  else if (!telefonoRegex.test(data.telefono.trim())) errores.push('El teléfono debe contener solo números (opcional + al inicio) y tener entre 7 y 15 dígitos');

  // 9. Email: formato estándar
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email?.trim()) errores.push('El email es obligatorio');
  else if (!emailRegex.test(data.email.trim())) errores.push('Ingrese un email válido (ej: nombre@dominio.com)');

  // 10. Hijos: si tiene hijos, cantidad debe ser número entero >= 0
  if (data.tieneHijos === '1') {
    const cantidad = parseInt(data.cantidadHijos);
    if (isNaN(cantidad) || cantidad < 0) errores.push('Si tiene hijos, la cantidad debe ser un número válido (0 o más)');
  }

  return { valido: errores.length === 0, errores };
}

/**
 * Obtiene lista de nombres completos para listado rápido
 */
export function obtenerNombresCompletos() {
  const personas = cargarPersonas();
  return personas.map(p => ({
    id: p.id,
    nombreCompleto: `${p.nombre} ${p.apellido}`
  }));
}