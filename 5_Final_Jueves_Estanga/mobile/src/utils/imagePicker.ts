import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Abre el selector nativo de fotos / galería del dispositivo (Android APK, iOS o Web)
 * y devuelve las imágenes seleccionadas en formato Data URI (JPEG base64) o URL.
 */
export const pickImagesFromDevice = async (options?: {
  multiple?: boolean;
  maxDimension?: number;
  quality?: number;
}): Promise<string[]> => {
  const { multiple = true, maxDimension = 1200, quality = 0.85 } = options || {};

  // Dispositivos móviles nativos (Android APK / iOS)
  if (Platform.OS !== 'web') {
    try {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch {
        // Ignorar si el sistema usa Photo Picker nativo sin permisos
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: multiple,
        quality,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      return result.assets
        .map((asset) => {
          if (asset.base64) {
            return `data:image/jpeg;base64,${asset.base64}`;
          }
          return asset.uri;
        })
        .filter((uri): uri is string => Boolean(uri));
    } catch (error) {
      console.warn('[imagePicker] Error en launchImageLibraryAsync nativo:', error);
      return [];
    }
  }

  // Plataforma Web: crear input file accesible y ejecutar click directo
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve([]);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/*';
    if (multiple) {
      input.multiple = true;
    }
    input.style.position = 'fixed';
    input.style.top = '-10000px';
    input.style.left = '-10000px';
    input.style.opacity = '0';
    document.body.appendChild(input);

    let finished = false;
    const finish = (results: string[]) => {
      if (!finished) {
        finished = true;
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
        resolve(results);
      }
    };

    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : [];
      if (files.length === 0) {
        finish([]);
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
      finish(results);
    };

    // Disparar click en el input inmediatamente
    try {
      input.click();
    } catch (e) {
      finish([]);
    }
  });
};

/**
 * Abre directamente la CÁMARA del dispositivo para tomar una fotografía
 * (compatible con Android APK, iOS y Web)
 */
export const takePhotoWithCamera = async (options?: {
  quality?: number;
  allowsEditing?: boolean;
}): Promise<string | null> => {
  const { quality = 0.85, allowsEditing = false } = options || {};

  if (Platform.OS !== 'web') {
    try {
      try {
        await ImagePicker.requestCameraPermissionsAsync();
      } catch {
        // Ignorar
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        quality,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    } catch (error) {
      console.warn('[imagePicker] Error en launchCameraAsync:', error);
      return null;
    }
  }

  // Web fallback con cámara nativa del navegador
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.style.position = 'fixed';
    input.style.top = '-10000px';
    input.style.left = '-10000px';
    input.style.opacity = '0';
    document.body.appendChild(input);

    let finished = false;
    const finish = (result: string | null) => {
      if (!finished) {
        finished = true;
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
        resolve(result);
      }
    };

    input.onchange = async () => {
      const files = input.files ? Array.from(input.files) : [];
      if (files.length === 0) {
        finish(null);
        return;
      }

      try {
        const dataUrl = await compressImageFile(files[0], 1200, quality);
        finish(dataUrl);
      } catch {
        finish(null);
      }
    };

    try {
      input.click();
    } catch {
      finish(null);
    }
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
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch {
        // Ignorar
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      console.warn('[imagePicker] Error en launchImageLibraryAsync:', error);
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
