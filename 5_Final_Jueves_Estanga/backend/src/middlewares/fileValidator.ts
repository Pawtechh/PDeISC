import { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Valida que una URI de imagen en base64 o URL pertenezca a tipos de imagen autorizados y no exceda el tamaño máximo
 */
export function validateImagePayload(imageStr: string): { valid: boolean; error?: string } {
  if (!imageStr || typeof imageStr !== 'string') {
    return { valid: false, error: 'Formato de imagen inválido' };
  }

  // Si es un data URI en base64
  if (imageStr.startsWith('data:')) {
    const mimeMatch = imageStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (!mimeMatch || !mimeMatch[1]) {
      return { valid: false, error: 'Data URI malformada' };
    }
    const mimeType = mimeMatch[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido (${mimeType}). Solo se aceptan [${ALLOWED_MIME_TYPES.join(', ')}]`,
      };
    }

    const base64Data = imageStr.split(',')[1] || '';
    const approxBytes = Math.ceil((base64Data.length * 3) / 4);
    if (approxBytes > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `El archivo excede el tamaño máximo permitido de 10MB (actual: ${(approxBytes / (1024 * 1024)).toFixed(1)}MB)`,
      };
    }
  }

  return { valid: true };
}

export const validateUploadedFiles = (req: Request, res: Response, next: NextFunction): void => {
  const checkFields = ['foto', 'fotos', 'fotosRetiro', 'fotosDevolucion', 'fotosDano', 'fotoDanio', 'dniFotoUrl'];

  for (const field of checkFields) {
    const val = req.body?.[field];
    if (typeof val === 'string') {
      const check = validateImagePayload(val);
      if (!check.valid) {
        res.status(400).json({
          code: 'INVALID_FILE_TYPE_OR_SIZE',
          message: check.error,
          field,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string') {
          const check = validateImagePayload(item);
          if (!check.valid) {
            res.status(400).json({
              code: 'INVALID_FILE_TYPE_OR_SIZE',
              message: check.error,
              field,
              timestamp: new Date().toISOString(),
            });
            return;
          }
        }
      }
    }
  }

  next();
};
