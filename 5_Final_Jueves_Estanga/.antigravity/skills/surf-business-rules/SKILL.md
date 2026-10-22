---
name: surf-business-rules
description: Reglas de negocio del sistema Surf Rental MDP. Se activa al implementar cualquier lógica que involucre precios, multas, puntos, cancelaciones o comisiones.
---

# Skill: Reglas de Negocio

## Constantes (en `src/constants/business.ts`)
```ts
export const BUSINESS = {
  COMISION_AGENCIA: 0.05,
  GANANCIA_OWNER: 0.95,
  SUSCRIPCION_OWNER: 1000,     // ARS/mes
  MESES_GRATIS_OWNER: 3,
  MULTA_NO_LAVAR: 10000,
  MULTA_NO_PRESENTARSE_HORAS: 1,
  DESCUENTO_DIA_COMPLETO: 0.25,
  DESCUENTO_ANTICIPADO: 0.10,
  DIAS_ANTICIPADO: 7,
  EDAD_MINIMA: 18,
  HORA_INICIO: 6,
  HORA_FIN: 21,
  MANTENIMIENTO_DIAS: 45,
  PUNTOS_POR_HORA: 10,
  PLAZO_DISPUTA_HORAS: 24,
  VENCIMIENTO_PUNTOS_MESES: 12,
  RETENCION_DATOS_ANIOS: 5,
}
```

## Fórmulas

### Precio de alquiler
```text
precioBase = horas × precioHora
precioDia = precioHora × 24 × (1 - 0.25)  // si contrata día completo
descuentoAnticipado = precioBase × 0.10    // si reserva con +7 días
descuentoPuntos = según tabla
precioTotal = precioBase + precioSeguro - descuentos
```

### Puntos
```text
puntos = horas × 10
100pts → 5% off
250pts → 10% off
500pts → 15% off
Vencen a los 12 meses
Se pierden si hay daño no pagado
```

### Cancelación (Opción A)
```text
deltaHoras = fechaInicio - ahora
if deltaHoras >= 72 → reembolso 100%
if 24 <= deltaHoras < 72 → 70%
if 6 <= deltaHoras < 24 → 40%
if deltaHoras < 6 → 0%
no-show → multa 1h de alquiler
```

### Ganancias
```text
gananciaOwner = precioBase × 0.95
gananciaAgencia = precioBase × 0.05
```

## Multas escalonadas

| Falta | Multa | Puntos negativos |
| :--- | :--- | :--- |
| Devolver sucia | $10.000 | 1 |
| Devolver tarde <2h | 1h alquiler | 1 |
| Devolver tarde >2h | 2h + reclamo | 2 |
| No presentarse | 1h mínima | 2 |
| Daño menor no reportado | Costo + 20% | 3 |
| Uso fuera de zona | $30.000 + pierde cobertura | 3 |
| Daño mayor no reportado | Costo + 50% | 4 |
| Robo sin denuncia | Valor tabla completo | 5 |
| Reincidencia 3+ | Suspensión 30 días | 5 |
| Falsificación datos | Baja definitiva | 10 |

- 5 puntos negativos → suspensión temporal
- 10 puntos negativos → baja definitiva

## Estados

### Rental
`PENDIENTE` → `ACTIVA` → `EN_CURSO` → `PENDIENTE_REVISION` → `DEVUELTA` | `RECLAMO` | `CANCELADA`

### InsuranceClaim
`ABIERTO` → `NOTIFICADO` → (`ACEPTADO` | `DISPUTADO` | `SIN_RESPUESTA`)  
`DISPUTADO` → `EN_MEDIACION` → (`RESUELTO_OWNER` | `RESUELTO_CONSUMER`)  
`*` → `COBRADO` → `CERRADO`

### Board
`DISPONIBLE` | `ALQUILADA` | `MANTENIMIENTO` | `PRIVADA`

## Reglas críticas
- La agencia NUNCA se hace cargo de daños. Solo ejecuta cobro.
- El owner es responsable del seguro de su tabla.
- Silencio del consumer (24h) = aceptación de daño.
- Si owner no paga suscripción tras 3 meses → tablas PRIVADAS.
- Duplicar tabla = eliminar la segunda.
- Mantenimiento obligatorio cada 45 días.
- Cobro de daño: PreAuth → tarjeta → seguro → transferencia → estudio jurídico.
- Todo cobro debe tener: fotos + cotización + notificación fehaciente + log.
