import { Platform } from 'react-native';

/**
 * Abre el selector nativo de archivos / galería / cámara del dispositivo (PC o celular)
 * y devuelve las imágenes seleccionadas optimizadas en formato Data URI (JPEG base64).
 */
export const pickImagesFromDevice = (options?: {
  multiple?: boolean;
  maxDimension?: number;
  quality?: number;
}): Promise<string[]> => {
  const { multiple = true, maxDimension = 1000, quality = 0.82 } = options || {};

  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      resolve([]);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/*';
    input.multiple = multiple;
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : [];
      cleanup();
      if (files.length === 0) {
        resolve([]);
        return;
      }

      const results: string[] = [];
      for (const file of files) {
        try {
          const dataUrl = await compressImageFile(file, maxDimension, quality);
          if (dataUrl) {
            results.push(dataUrl);
          }
        } catch {
          // Ignorar archivo corrupto
        }
      }
      resolve(results);
    };

    input.oncancel = () => {
      cleanup();
      resolve([]);
    };

    input.click();
  });
};

const compressImageFile = (
  file: File,
  maxDimension: number,
  quality: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      if (typeof Image === 'undefined' || typeof document === 'undefined') {
        resolve(rawDataUrl);
        return;
      }

      const img = new window.Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
};
