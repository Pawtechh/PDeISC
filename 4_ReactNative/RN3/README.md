# Trabajo Práctico N° 3 - Herramientas Nativas, Sensores y Generación de APK

**Ubicación:** `4_ReactNative/RN3`  
**Tecnologías:** React Native, Expo (SDK 58), TypeScript, Expo Router, EAS Build (APK Android).

---

## 📱 Herramientas y Módulos Nativos Implementados

| Módulo / Herramienta | Librería Expo | Funcionalidad Implementada |
| :--- | :--- | :--- |
| **📷 Cámara** | `expo-camera` | Captura de fotografías con flash (On/Off), cambio entre cámara trasera y frontal, y previsualización de miniatura en pantalla. |
| **🔍 Lector de Códigos** | `expo-camera` | Detección y lectura en vivo de códigos **QR**, **EAN-13**, **EAN-8**, **CODE-128**, **CODE-39**, con recuadro visual de enfoque y alerta con datos leídos. |
| **📍 Ubicación & GPS** | `expo-location` | Coordenadas en tiempo real (Latitud, Longitud con 6 decimales, Altitud, Precisión en metros, Velocidad en km/h, Rumbo). **Geocodificación Inversa:** Resuelve calle, altura, ciudad y país. Botón para abrir en Google Maps. |
| **🧭 Acelerómetro** | `expo-sensors` | Medición de fuerza G en los 3 ejes (X, Y, Z). Incluye un **Nivel de Burbuja Virtual interactivo** que responde físicamente a la inclinación del celular. |
| **🔄 Giroscopio** | `expo-sensors` | Velocidad angular de rotación en Radianes por segundo (rad/s) en X, Y, Z. Frecuencias de muestreo configurables (Rápido, Normal, Lento) y botón de pausa para ahorro de batería. |
| **🔐 Biometría** | `expo-local-authentication` | Diagnóstico de hardware biométrico disponible (Huella dactilar, FaceID, Iris). Disparador de autenticación biométrica nativa del sistema operativo. |
| **📋 Reporte de Campo (Validado)** | React Native + TypeScript | Formulario de auditoría en campo **completamente validado**: Operador (mín. 3 letras), Correo (regex), Descripción (mín. 10 letras), coordenadas GPS adjuntadas automáticamente, código de activo QR y **firma biométrica obligatoria** antes de confirmar el envío. |

---

## 🚀 Cómo probar en Expo Go

1. Abrí una terminal en la carpeta del proyecto:
   ```powershell
   cd C:\Users\G15\Documents\GitHub\PDeISC\4_ReactNative\RN3
   npx expo start
   ```
2. Escaneá el **código QR** desde la app **Expo Go** en tu celular.
3. Concedé los permisos solicitados de Cámara y Ubicación cuando el celular lo requiera.

---

## 📦 Cómo Generar el archivo .APK con Expo EAS

El proyecto ya tiene configurado:
- El paquete Android en `app.json`: `"package": "com.pdeisc.rn3herramientas"`
- Todos los permisos nativos requeridos en Android (`CAMERA`, `ACCESS_FINE_LOCATION`, `USE_BIOMETRIC`, etc.).
- El perfil de compilación directa en `eas.json`: `"buildType": "apk"`.

### Pasos para compilar el APK:

1. **Tener cuenta gratuita en Expo:**
   Si no tenés cuenta, registrate en [expo.dev/signup](https://expo.dev/signup).

2. **Iniciar sesión en EAS:**
   En tu terminal, dentro de `4_ReactNative/RN3`:
   ```powershell
   npx eas-cli login
   ```
   Ingresá tu usuario y contraseña de Expo.

3. **Vincular el proyecto a tu cuenta (solo la primera vez):**
   ```powershell
   npx eas-cli project:init
   ```
   (Presioná Enter para confirmar).

4. **Lanzar la compilación del APK:**
   ```powershell
   npx eas-cli build -p android --profile preview
   ```
   * Cuando te pregunte: *"Generate a new Android Keystore?"*, seleccioná **Yes** (EAS gestiona las llaves criptográficas de forma segura en la nube).
   * La compilación se ejecutará en los servidores de Expo (toma unos minutos).
   * Al finalizar, te devolverá un **enlace directo de descarga** y un **código QR** para descargar e instalar el archivo `.apk` directamente en tu teléfono Android.
