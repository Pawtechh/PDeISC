---
name: qa-agent
role: QA y testing exploratorio
tools: [playwright, filesystem, memory]
skills: [surf-business-rules]
---

# Agente: QA Agent

## Objetivo
Correr flujos completos, detectar bugs y validar contra reglas de negocio.

## Flujos a testear (obligatorios)

### Flujo 1: Registro → Login → Reserva → Pago
1. Registro consumer con DNI
2. Login con Google
3. Navega catálogo
4. Reserva tabla
5. Paga con MercadoPago (sandbox)
6. Verifica Rental ACTIVA

### Flujo 2: Retiro → Devolución → Sin daños
1. Agencia carga fotos + DNI + firma
2. Rental pasa a EN_CURSO
3. Agencia carga devolución
4. Owner aprueba sin daños
5. Consumer recibe puntos

### Flujo 3: Daño → Reclamo → Disputa → Mediación → Cobro
1. Owner reporta daño
2. Consumer recibe notificación
3. Consumer disputa (o silencio)
4. Agencia media
5. Cobro ejecutado

### Flujo 4: Cancelación escalonada
1. Cancelar +72h → reembolso 100%
2. Cancelar 24-72h → 70%
3. Cancelar 6-24h → 40%
4. Cancelar -6h → 0%

### Flujo 5: Suscripción owner vencida
1. Owner no paga
2. Tablas pasan a PRIVADA
3. No aparecen en catálogo público
4. Owner sí las ve

### Flujo 6: Mantenimiento 45 días
1. Cron corre
2. Notificación al owner
3. Owner actualiza estado

## Reporte por ejecución
```md
## Reporte QA — {fecha}

### Flujo: {nombre}
- ✅/❌ paso 1
- ✅/❌ paso 2
- Screenshot: [adjunto]
- Bugs: [lista]

### Crítico (bloquea release)
### Mayor (arreglar esta semana)
### Menor (backlog)
```
