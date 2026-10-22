---
name: surf-design-system
description: Genera componentes y pantallas consistentes con el design system de Surf Rental MDP. Se activa al crear/modificar cualquier UI.
---

# Skill: Surf Design System

## Cuándo usarme
- Crear cualquier pantalla nueva
- Crear/modificar componentes visuales
- Ajustar estilos existentes
- Revisar consistencia visual

## Reglas duras
1. NUNCA hardcodear colores. Usar tokens de `theme/colors.ts`.
2. NUNCA hardcodear spacing. Usar `theme/spacing.ts`.
3. NUNCA hardcodear tipografía. Usar componente `<Text variant="...">`.
4. Todo componente va en `src/components/{categoría}/`.
5. Cada componente exporta: componente + tipos + variantes documentadas.
6. Cada componente tiene story de ejemplo en `src/components/__stories__/`.

## Flujo obligatorio
1. Leer `design-system.md` completo.
2. Verificar si existe componente similar (buscar en `src/components/`).
3. Si existe, extender con prop `variant`. Si no, crear nuevo.
4. Usar primitives existentes (Screen, Card, Text, Button).
5. Generar código.
6. Pedir screenshot (Browser Agent).
7. Auto-criticar contra referencias (Airbnb, Strava, AllTrails).
8. Iterar hasta que quede profesional.

## Checklist antes de aprobar UI
- [ ] Sin colores hardcodeados
- [ ] Sin spacing hardcodeado
- [ ] Funciona en dark mode
- [ ] Empty state definido
- [ ] Loading state con skeleton
- [ ] Error state con acción
- [ ] Tap targets ≥ 44x44
- [ ] Contraste AA
- [ ] Animaciones con Moti/Reanimated
- [ ] Screenshot se ve profesional

## Componentes de referencia (a construir primero)
1. Text (variants: display, h1, h2, h3, body-lg, body, caption, button)
2. Button (variants: primary, secondary, ghost, danger | sizes: sm, md, lg)
3. Input (label + error + helper + icon left/right)
4. Card (surface + shadow + border)
5. Screen (SafeArea + bg + padding)
6. Stack, Row, Spacer
7. Badge, Avatar, Divider
8. EmptyState, LoadingSkeleton

## Ejemplo de uso correcto
```tsx
import { Screen, Stack, Text, Button, Card } from '@/components'

export function BoardDetailScreen({ board }) {
  return (
    <Screen>
      <Stack spacing="lg">
        <Text variant="h1">{board.titulo}</Text>
        <Card>
          <Text variant="body">Precio: ${board.precioHora}/h</Text>
        </Card>
        <Button variant="primary" size="lg">Reservar</Button>
      </Stack>
    </Screen>
  )
}
```

## Ejemplo incorrecto (NUNCA hacer)
```tsx
<View style={{ backgroundColor: '#1E85F5', padding: 16 }}>
  <Text style={{ fontSize: 28, fontWeight: '700' }}>Título</Text>
</View>
```
