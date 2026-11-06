import fs from 'fs';
import path from 'path';

/**
 * Guarda una imagen en formato Base64 (Data URI o raw) en el directorio public/uploads/dni/
 * y retorna la URL pública relativa (ej. /uploads/dni/dni-12345.jpg).
 * Si ya es una URL HTTP o relativa existente, la retorna tal cual.
 */
export function saveBase64Image(
  dataUriOrUrl: string | undefined | null,
  prefix = 'dni',
  identifier = 'user'
): string | undefined {
  if (!dataUriOrUrl || typeof dataUriOrUrl !== 'string') {
    return undefined;
  }

  const trimmed = dataUriOrUrl.trim();

  // Si ya es una URL HTTP o relativa ya guardada, devolver sin modificar
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/images/')
  ) {
    return trimmed;
  }

  // Detectar prefijo base64
  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  let ext = 'jpg';
  let base64Data = trimmed;

  if (match && match[1] && match[2]) {
    const rawExt = match[1].toLowerCase();
    ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'png' ? 'png' : rawExt === 'webp' ? 'webp' : 'jpg';
    base64Data = match[2];
  } else if (!trimmed.startsWith('data:')) {
    // Podría ser un string base64 directo
    base64Data = trimmed;
  } else {
    // Formato no reconocido, mantener original
    return trimmed;
  }

  try {
    const subfolder = prefix === 'avatar' ? 'avatars' : 'dni';
    const uploadDir = path.resolve(__dirname, `../../public/uploads/${subfolder}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanId = String(identifier).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const fileName = `${prefix}-${cleanId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${subfolder}/${fileName}`;
  } catch (error) {
    console.error('[fileStorage] Error al guardar imagen base64:', error);
    // Si falla la escritura en disco, retornar el string original como fallback seguro
    return trimmed;
  }
}
