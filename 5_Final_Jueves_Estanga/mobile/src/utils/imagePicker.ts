import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Abre el selector nativo de fotos / galería del dispositivo (Android, iOS o Web)
 * y devuelve las imágenes seleccionadas en formato Data URI (JPEG base64) o URL.
 */
export const pickImagesFromDevice = async (options?: {
  multiple?: boolean;
  maxDimension?: number;
  quality?: number;
}): Promise<string[]> => {
  const { multiple = true, maxDimension = 1000, quality = 0.82 } = options || {};

  if (Platform.OS !== 'web') {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: multiple,
        quality,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      return result.assets.map((asset) =>
        asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
      );
    } catch (error) {
      console.error('[imagePicker] Error en launchImageLibraryAsync:', error);
      return [];
    }
  }

  // Fallback para Web con elemento <input type="file"> y compresión Canvas
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
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

/**
 * Abre directamente la CÁMARA del dispositivo para tomarse una selfie o fotografía
 * (compatible con Android APK, iOS y Web)
 */
export const takePhotoWithCamera = async (options?: {
  quality?: number;
  allowsEditing?: boolean;
}): Promise<string | null> => {
  const { quality = 0.85, allowsEditing = true } = options || {};

  if (Platform.OS !== 'web') {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect: [1, 1],
        quality,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    } catch (error) {
      console.error('[imagePicker] Error en launchCameraAsync:', error);
      return null;
    }
  }

  // Web fallback con cámara frontal/trasera nativa del navegador
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'user');
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
        resolve(null);
        return;
      }

      try {
        const dataUrl = await compressImageFile(files[0], 800, quality);
        resolve(dataUrl);
      } catch {
        resolve(null);
      }
    };

    input.oncancel = () => {
      cleanup();
      resolve(null);
    };

    input.click();
  });
};

/**
 * Selecciona una sola imagen de la galería con recorte cuadrado para perfil o DNI
 */
export const pickSingleImage = async (options?: {
  quality?: number;
  allowsEditing?: boolean;
}): Promise<string | null> => {
  const { quality = 0.85, allowsEditing = true } = options || {};

  if (Platform.OS !== 'web') {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect: [1, 1],
        quality,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    } catch (error) {
      console.error('[imagePicker] Error en launchImageLibraryAsync:', error);
      return null;
    }
  }

  const results = await pickImagesFromDevice({ multiple: false, quality });
  return results.length > 0 ? results[0] : null;
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
