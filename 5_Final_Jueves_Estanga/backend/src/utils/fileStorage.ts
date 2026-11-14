import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

const SUBFOLDER_BY_PREFIX: Record<string, string> = {
  avatar: 'avatars',
  board: 'boards',
  boards: 'boards',
  agency: 'agencies',
  agencies: 'agencies',
};

function resolveSubfolder(prefix: string): string {
  return SUBFOLDER_BY_PREFIX[prefix] || 'dni';
}

function getS3Config() {
  const endpoint = process.env.S3_ENDPOINT?.trim().replace(/\/+$/, '');
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const region = process.env.S3_REGION?.trim() || 'auto';
  const publicUrl = process.env.S3_PUBLIC_URL?.trim().replace(/\/+$/, '');

  const configured = Boolean(
    endpoint &&
      bucket &&
      accessKeyId &&
      secretAccessKey &&
      !endpoint.includes('example.com') &&
      !accessKeyId.startsWith('your-')
  );

  return { configured, endpoint, bucket, accessKeyId, secretAccessKey, region, publicUrl };
}

function isCloudinaryConfigured(): boolean {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  return Boolean(
    cloud &&
      key &&
      secret &&
      !cloud.startsWith('your-') &&
      !key.startsWith('your-') &&
      !secret.startsWith('your-')
  );
}

let cloudinaryConfigured = false;
function ensureCloudinaryInit() {
  if (!cloudinaryConfigured && isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
  }
}

export function getActiveStorageProvider(): 'r2_s3' | 'cloudinary' | 'local' {
  if (getS3Config().configured) return 'r2_s3';
  if (isCloudinaryConfigured()) return 'cloudinary';
  return 'local';
}

interface ParsedImagePayload {
  ext: string;
  contentType: string;
  buffer: Buffer;
}

function parseImageDataUri(trimmed: string): ParsedImagePayload | null {
  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  let ext = 'jpg';
  let contentType = 'image/jpeg';
  let base64Data = trimmed;

  if (match && match[1] && match[2]) {
    const rawExt = match[1].toLowerCase();
    if (rawExt === 'png') {
      ext = 'png';
      contentType = 'image/png';
    } else if (rawExt === 'webp') {
      ext = 'webp';
      contentType = 'image/webp';
    } else {
      ext = 'jpg';
      contentType = 'image/jpeg';
    }
    base64Data = match[2];
  } else if (trimmed.startsWith('data:')) {
    return null;
  }

  return {
    ext,
    contentType,
    buffer: Buffer.from(base64Data, 'base64'),
  };
}

function hmacSha256(key: crypto.BinaryLike, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function uploadToS3R2(
  objectKey: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const cfg = getS3Config();
  if (!cfg.configured || !cfg.endpoint || !cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey) {
    throw new Error('S3/R2 no configurado');
  }

  const targetUrl = new URL(`${cfg.endpoint}/${cfg.bucket}/${objectKey}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(buffer);

  const canonicalHeaders =
    `host:${targetUrl.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    targetUrl.pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSha256(`AWS4${cfg.secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, cfg.region);
  const kService = hmacSha256(kRegion, 's3');
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(targetUrl.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authHeader,
    },
    body: buffer,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`S3/R2 PUT ${response.status}: ${errText.slice(0, 160)}`);
  }

  return cfg.publicUrl ? `${cfg.publicUrl}/${objectKey}` : targetUrl.toString();
}

/**
 * Persiste imágenes en Cloudflare R2 / S3 cuando está configurado en entorno,
 * luego Cloudinary como segunda opción cloud (ideal para hosting stateless económico),
 * o en almacenamiento local `/uploads/...` como fallback automático en desarrollo.
 */
export async function saveImageAsset(
  dataUriOrUrl: string | undefined | null,
  prefix = 'dni',
  identifier = 'user'
): Promise<string | undefined> {
  if (!dataUriOrUrl || typeof dataUriOrUrl !== 'string') {
    return undefined;
  }
  const trimmed = dataUriOrUrl.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/images/')
  ) {
    return trimmed;
  }

  const subfolder = resolveSubfolder(prefix);
  const cleanId = String(identifier).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);

  if (getS3Config().configured) {
    const parsed = parseImageDataUri(trimmed);
    if (parsed) {
      try {
        const objectKey = `surf-rental/${subfolder}/${prefix}-${cleanId}-${Date.now()}.${parsed.ext}`;
        return await uploadToS3R2(objectKey, parsed.buffer, parsed.contentType);
      } catch (err) {
        console.warn('[fileStorage] R2/S3 upload falló, intentando fallback:', err);
      }
    }
  }

  if (isCloudinaryConfigured()) {
    try {
      ensureCloudinaryInit();
      const uploadPayload = trimmed.startsWith('data:')
        ? trimmed
        : `data:image/jpeg;base64,${trimmed}`;
      const res = await cloudinary.uploader.upload(uploadPayload, {
        folder: `surf-rental/${subfolder}`,
        public_id: `${prefix}-${cleanId}-${Date.now()}`,
        resource_type: 'image',
      });
      if (res?.secure_url) {
        return res.secure_url;
      }
    } catch (err) {
      console.warn('[fileStorage] Cloudinary upload falló, usando fallback local:', err);
    }
  }

  return saveBase64Image(trimmed, prefix, identifier);
}

/**
 * Guarda una imagen en formato Base64 (Data URI o raw) en el directorio public/uploads/
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

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/images/')
  ) {
    return trimmed;
  }

  const parsed = parseImageDataUri(trimmed);
  if (!parsed) {
    return trimmed;
  }

  try {
    const subfolder = resolveSubfolder(prefix);
    const uploadDir = path.resolve(__dirname, `../../public/uploads/${subfolder}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanId = String(identifier).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    const fileName = `${prefix}-${cleanId}-${Date.now()}.${parsed.ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, parsed.buffer);

    return `/uploads/${subfolder}/${fileName}`;
  } catch (error) {
    console.error('[fileStorage] Error al guardar imagen base64:', error);
    return trimmed;
  }
}
