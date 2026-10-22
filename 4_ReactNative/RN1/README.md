# Trabajo Práctico N° 1 - React Native con Expo

**Ubicación:** `4_ReactNative/RN1`  
**Tecnologías:** React Native, Expo (SDK 58), TypeScript, Expo Router, Expo Go.

---

## 📁 Estructura del TP 1

```text
RN1/
├── ejercicio1/     # Punto 1: Hola Mundo limpio + Tab con diferentes estilos
└── ejercicio2/     # Punto 2: Catálogo interactivo de Componentes Nativos con TypeScript y formularios validados
```

---

## 🚀 Cómo ejecutar en Expo Go

### 1. Requisitos previos
1. Tener instalada la app **Expo Go** en tu celular Android o iOS (disponible en Google Play Store / App Store).
2. Asegurarte de que tu computadora y tu celular estén conectados a la **misma red Wi-Fi** (o usar modo tunnel con `npx expo start --tunnel`).

### 2. Ejecutar el Ejercicio 1
Abre una terminal en la carpeta del ejercicio 1:
```bash
cd 4_ReactNative/RN1/ejercicio1
npx expo start
```
* Escaneá el **código QR** que aparece en la terminal con la cámara de tu celular (iOS) o desde la app Expo Go (Android).
* Presioná `w` en la terminal si deseás previsualizarlo también en el navegador web.

### 3. Ejecutar el Ejercicio 2
Abre otra terminal o cambia de carpeta:
```bash
cd 4_ReactNative/RN1/ejercicio2
npx expo start
```
* Escaneá el **código QR** con Expo Go.

---

## 📌 Detalle de los Ejercicios

### Punto 1: `ejercicio1`
- **Tab 1 ("Hola Mundo"):** Pantalla limpia y minimalista, tarjeta de bienvenida, selector dinámico de idiomas (Español, Inglés, Francés, Italiano, Portugués, Alemán), contador reactivo de likes y acceso rápido al siguiente tab.
- **Tab 2 ("Estilos"):** Showcase pedagógico de `StyleSheet`:
  - **Selector dinámico de temas:** Paletas de colores en tiempo real (Océano, Esmeralda, Ámbar, Violeta, Grafito).
  - **Tipografía y Textos:** Tamaños, pesos, cursiva (`italic`), subrayado (`underline`), tachado (`line-through`), espaciado de letras (`letterSpacing`) y textos truncados.
  - **Cajas y Formas:** Bordes sólidos vs punteados (`dashed`/`dotted`), radios de borde (12px, píldoras de 30px, esquinas asimétricas, círculos).
  - **Sombras y Profundidad:** Comparativa visual entre Flat (sin sombra), Elevation 2 (sombra suave) y Elevation 8 (sombra profunda).
  - **Flexbox y Layout:** Chips de distribución con `flexWrap` y `space-between`.
  - **Botones con diferentes estilos:** Botón Primario (Filled), Secundario (Soft), Outline (Borde) y Deshabilitado (Disabled).

---

### Punto 2: `ejercicio2` (TypeScript)
- **Tab 1 ("Catálogo"):**
  - Buscador en tiempo real de componentes nativos.
  - Filtro por categorías: *Todos, Básicos, Entradas, Toques e Interacción, Listas, Feedback y Diálogos, Sistema*.
  - Ficha detallada por componente nativo (`View`, `Text`, `Image`, `ImageBackground`, `TextInput`, `Switch`, `Button`, `TouchableOpacity`, `TouchableHighlight`, `Pressable`, `ScrollView`, `FlatList`, `SectionList`, `ActivityIndicator`, `Modal`, `Alert`, `StatusBar`, `KeyboardAvoidingView`).
  - Cada ficha contiene:
    - **¿Para qué se usa?** (Explicación técnica y práctica).
    - **Casos de uso típicos** en apps de producción.
    - **Props principales** (nombre, tipo y descripción).
    - **Sintaxis de código de ejemplo** formateada.
    - **Tip didáctico clave**.
- **Tab 2 ("Laboratorio en Vivo"):**
  - **Formulario completamente validado (TextInput):**
    - Nombre obligatorio con mínimo 3 caracteres.
    - Correo electrónico validado con expresión regular estricta.
    - Contraseña obligatoria con mínimo 6 caracteres.
    - Retroalimentación visual inmediata (bordes rojos ante error, verdes ante éxito, íconos de check y mensajes descriptivos).
    - Botón de envío que solo procede si el formulario es 100% válido y dispara un diálogo nativo con `Alert.alert`.
  - **Switch nativo interactivo:** Toggle de notificaciones.
  - **Modal interactivo:** Capa emergente con animación, botón de cierre y backdrop.
  - **Alert nativo:** Cuadro de diálogo del sistema operativo con acciones Cancelar y Aceptar.
  - **ActivityIndicator:** Spinner de carga con simulación asíncrona de 2 segundos.
  - **Pressable vs TouchableOpacity:** Comparativa en vivo de respuesta táctil y contadores independientes.
  - **FlatList interactiva:** Lista virtualizada donde podés escribir una nueva tarea, agregarla a la lista y eliminarla.
  - **SectionList agrupada:** Listado dividido por secciones (Platos principales, Bebidas).
  - **StatusBar interactiva:** Alterna entre estilo claro y oscuro en tiempo real.
- **Tab 3 ("Guía & Tips"):**
  - Comparativa técnica exhaustiva: `ScrollView` vs `FlatList` (memoria, rendimiento, cuándo usar cada una).
  - Comparativa técnica: `TouchableOpacity` vs `Pressable` (por qué Pressable es el estándar moderno recomendado por Meta).
  - 5 Mandamientos y buenas prácticas de desarrollo en React Native.
