# DESIGN SYSTEM — Surf Rental MDP

## Concepto
App de alquiler de tablas en Mar del Plata. Vibe: **costero moderno**, no "playero kitsch".
Referencias: Airbnb (limpio), Strava (deporte), Patagonia (marca auténtica), AllTrails.

## Paleta de colores

### Primarios
- `ocean-50:  #EFF8FF`
- `ocean-100: #D1E9FF`
- `ocean-200: #B2DBFF`
- `ocean-300: #84C5FF`
- `ocean-400: #4DA5FF`
- `ocean-500: #1E85F5`  ← PRIMARY
- `ocean-600: #0A66D4`
- `ocean-700: #084FA8`
- `ocean-800: #063B7C`
- `ocean-900: #052A57`

### Acento (sunset — para CTA premium, puntos, highlights)
- `sunset-400: #FFB347`
- `sunset-500: #FF8C42`  ← ACCENT
- `sunset-600: #F26B1D`

### Neutrales
- `sand-50:  #FAFAF7`
- `sand-100: #F4F3EE`
- `sand-200: #E8E6DD`
- `sand-300: #D4D0C2`
- `sand-500: #8A8574`
- `sand-700: #4A473C`
- `sand-900: #1F1E19`

### Semánticos
- `success: #10B981`
- `warning: #F59E0B`
- `danger:  #EF4444`
- `info:    #3B82F6`

### Dark mode
- Background: `sand-900`
- Surface:    `#2A2925`
- Text:       `sand-100`
- Primary cambia a `ocean-400`

## Tipografía (Inter)
- `display:   32px / 40 / 700`  → Hero
- `h1:        28px / 36 / 700`
- `h2:        24px / 32 / 600`
- `h3:        20px / 28 / 600`
- `body-lg:   16px / 24 / 400`
- `body:      14px / 20 / 400`
- `caption:   12px / 16 / 500`
- `button:    15px / 20 / 600`

## Spacing (escala 4)
- `xs: 4`   `sm: 8`   `md: 12`   `lg: 16`   `xl: 24`   `2xl: 32`   `3xl: 48`   `4xl: 64`

## Radii
- `sm: 6`   `md: 10`   `lg: 16`   `xl: 24`   `full: 999`

## Sombras (React Native style)
- `sm: 0 1 2 rgba(0,0,0,0.05)`
- `md: 0 4 12 rgba(0,0,0,0.08)`
- `lg: 0 8 24 rgba(0,0,0,0.12)`

## Componentes base (a construir primero)

### Layout
- `Screen` (wrapper con SafeArea + bg)
- `Container` (max-width + padding horizontal)
- `Stack` (vertical spacing)
- `Row` (horizontal)

### Primitives
- `Button` (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
- `IconButton`
- `Input` (con label, error, helper)
- `Text` (con variants tipográficos)
- `Card` (surface + shadow)
- `Badge` (con estados: success, warning, danger, info)
- `Avatar` (con fallback de iniciales)
- `Divider`

### Compuestos
- `BoardCard` (para catálogo)
- `RentalCard` (para historial)
- `StatCard` (para dashboards)
- `PriceTag` (desglose)
- `RatingStars`
- `EmptyState` (ilustración + mensaje + acción)
- `LoadingSkeleton` (por tipo de contenido)
- `BottomSheet` (Gorhom wrapper)
- `Toast` (notificaciones in-app)

### Específicos de dominio
- `BoardPhotoGallery` (con swipe + indicadores)
- `PhotoComparator` (slider entrega vs devolución para owner)
- `SignatureCanvas` (firma digital)
- `CountdownTimer` (para plazos de disputa 24h)
- `MapZone` (zona permitida de uso)
- `QRRentalCard` (para retiro)

## Reglas de UI
1. Máximo 1 primary color por pantalla. Acento solo para destacar CTA premium.
2. Bordes: 1px `sand-200` en cards. Nada de bordes negros.
3. Sombras sutiles. Nunca shadow fuerte.
4. Espaciado entre secciones: `xl` mínimo.
5. Iconos: `lucide-react-native` (consistencia con el ecosistema web).
6. Empty states SIEMPRE con ilustración (Lottie) + mensaje + CTA.
7. Loading SIEMPRE con skeleton, nunca spinner solo.
8. Errores SIEMPRE con acción de recuperación.
9. Animaciones de entrada: fade + slide up (150-250ms).
10. Haptic feedback en acciones críticas (confirmar, pagar, firmar).

## Iconografía
- Librería: `lucide-react-native`
- Tamaños: 16, 20, 24, 32
- Stroke: 2 (default)

## Motion
- Duración: 150ms (micro), 250ms (media), 400ms (transición pantalla)
- Easing: `[0.25, 0.1, 0.25, 1]` (ease-in-out)
- Librería: `moti` (declarativo) + `reanimated` (complejas)

## Accesibilidad
- Contraste mínimo AA (4.5:1)
- Tap targets mínimo 44x44
- Labels en todos los inputs
- A11y en todos los botones
- Soporte de Dynamic Type (no escalar fuentes fijas)
