# SKILL: surf-apk-builder

## Propósito
Guía técnica y automatización para empaquetar, configurar y generar el archivo binario instalable (`.apk`) de Android para la evaluación final y defensa académica de Surf Rental MDP.

## Parámetros de Configuración Críticos
1. **Resolución de Host y Red Móvil**:
   - Para que el APK en un celular físico conecte con la base de datos MySQL en la PC, `EXPO_PUBLIC_API_URL` no debe ser `localhost` ni un dominio ficticio.
   - Debe usar la IP local de la computadora en la red Wi-Fi (ej. `http://192.168.1.X:3000/api`) o un túnel HTTPS (ej. Ngrok / Cloudflare Tunnel / LocalXpose).
2. **Perfiles EAS Build (`eas.json`)**:
   ```json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
3. **Comandos de Generación**:
   - Vía EAS Cloud: `eas build -p android --profile preview`
   - Vía Prebuild / Gradle local (si Android SDK está instalado): `npx expo run:android --variant release`
