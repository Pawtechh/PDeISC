const MESSAGES = {
  access_denied: 'Cancelaste el inicio de sesión con el proveedor.',
  email_in_use: 'Ya existe una cuenta con ese email. Podés ingresar con tu email y contraseña abajo.',
  no_email: 'El proveedor no compartió tu email. Revisá los permisos e intentá de nuevo.',
  redirect_uri_mismatch: 'Error en Google/GitHub: el URI de callback no coincide con el registrado en su consola (debe ser http://localhost:4000/api/auth/<proveedor>/callback).',
  oauth_failed: 'No se pudo completar el inicio de sesión con el proveedor externo. Podés usar los botones de "Modo Demo / Pruebas" abajo o ingresar con email y contraseña.',
};

export const oauthErrorMessage = (code) => (code ? MESSAGES[code] || `${MESSAGES.oauth_failed} (Código: ${code})` : '');
