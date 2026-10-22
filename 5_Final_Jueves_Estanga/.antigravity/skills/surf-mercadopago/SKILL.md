# SKILL: surf-mercadopago

## Propósito
Integración de la pasarela de pagos líder en Argentina (Mercado Pago) para el cobro del alquiler y la retención de garantías de caución en Surf Rental MDP.

## Modos de Operación
1. **Checkout Pro / Preferencias de Pago**:
   - Generación de preferencia con `items`: alquiler de tabla + accesorios seleccionados (neoprene, leash, parafina) + seguro obligatorio.
   - Retorno de `init_point` y `sandbox_init_point` para redirección o apertura en web/mobile.
2. **Cobro Presencial con QR en Mostrador**:
   - Generación de código QR dinámico interoperable en la pantalla del mostrador para cobro instantáneo al surfista mediante la app de Mercado Pago o billeteras bancarias argentinas (MODO, Cuenta DNI, BNA+).
3. **Webhooks e IPN**:
   - Endpoint `POST /api/payments/mercadopago/webhook` que recibe la notificación de pago (`payment.created`, `payment.updated`).
   - Al confirmarse el pago (`status: 'approved'`), transiciona automáticamente el alquiler a `CONFIRMADA`.
