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

    try {
      input.click();
    } catch {
      finish([]);
    }
  });
};

/**
 * Abre la cámara del dispositivo para tomar una foto en vivo.
 * - En Android APK / iOS: Lanza la cámara nativa del sistema mediante launchCameraAsync.
 * - En Web: Abre un visor de cámara en vivo (webcam) con botón de disparo o selector si no hay webcam.
 */
export const takePhotoWithCamera = async (options?: {
  quality?: number;
  allowsEditing?: boolean;
}): Promise<string | null> => {
  const { quality = 0.85, allowsEditing = false } = options || {};

  if (Platform.OS !== 'web') {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) {
        await ImagePicker.requestCameraPermissionsAsync();
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Desactivado para evitar cierres forzados por crop activity ausente en Android
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

  // Web: Abrir cámara web en vivo con visor y botón de captura
  return openWebCameraAsync(quality);
};

/**
 * Visor de cámara en vivo para navegadores Web (Webcam)
 */
function openWebCameraAsync(quality: number): Promise<string | null> {
  return new Promise((resolve) => {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      return fallbackWebFileInput(quality, resolve);
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      .then((stream) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(11, 15, 23, 0.94)';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';
        overlay.style.boxSizing = 'border-box';
        overlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';

        const card = document.createElement('div');
        card.style.backgroundColor = '#111827';
        card.style.borderRadius = '16px';
        card.style.border = '1px solid rgba(56, 189, 248, 0.35)';
        card.style.boxShadow = '0 25px 60px rgba(0,0,0,0.7)';
        card.style.maxWidth = '560px';
        card.style.width = '100%';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.padding = '20px';
        card.style.boxSizing = 'border-box';

        const header = document.createElement('div');
        header.style.width = '100%';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '14px';

        const title = document.createElement('div');
        title.innerText = '📸 Cámara en Vivo';
        title.style.color = '#F8FAFC';
        title.style.fontWeight = '700';
        title.style.fontSize = '17px';

        const closeBtn = document.createElement('button');
        closeBtn.innerText = '✕';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#94A3B8';
        closeBtn.style.fontSize = '22px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '4px 8px';

        header.appendChild(title);
        header.appendChild(closeBtn);
        card.appendChild(header);

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.maxHeight = '360px';
        video.style.borderRadius = '12px';
        video.style.backgroundColor = '#000';
        video.style.objectFit = 'cover';
        card.appendChild(video);

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '12px';
        controls.style.marginTop = '18px';

        const captureBtn = document.createElement('button');
        captureBtn.innerText = '🔘 Capturar Foto';
        captureBtn.style.backgroundColor = '#0284C7';
        captureBtn.style.color = '#FFFFFF';
        captureBtn.style.border = 'none';
        captureBtn.style.borderRadius = '8px';
        captureBtn.style.padding = '12px 28px';
        captureBtn.style.fontSize = '15px';
        captureBtn.style.fontWeight = '700';
        captureBtn.style.cursor = 'pointer';

        controls.appendChild(captureBtn);
        card.appendChild(controls);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const cleanup = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        };

        closeBtn.onclick = () => {
          cleanup();
          resolve(null);
        };

        captureBtn.onclick = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              cleanup();
              resolve(dataUrl);
              return;
            }
          } catch {
            // Fallback
          }
          cleanup();
          resolve(null);
        };
      })
      .catch(() => {
        fallbackWebFileInput(quality, resolve);
      });
  });
}

function fallbackWebFileInput(
  quality: number,
  resolve: (res: string | null) => void
) {
  if (typeof document === 'undefined') {
    resolve(null);
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
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
}

/**
 * Selecciona una sola imagen de la galería con recorte cuadrado para perfil o DNI
 */
export const pickSingleImage = async (options?: {
  quality?: number;
  allowsEditing?: boolean;
}): Promise<string | null> => {
  const { quality = 0.85, allowsEditing = false } = options || {};

  if (Platform.OS !== 'web') {
    try {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch {
        // Ignorar
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
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
