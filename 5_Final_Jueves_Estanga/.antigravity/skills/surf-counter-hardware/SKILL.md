# SKILL: surf-counter-hardware

## Propósito
Gestión de hardware y periféricos móviles para el mostrador físico de la Sede Central Playa Grande:
1. Inspección fotográfica de tablas (cámara móvil).
2. Firma digital táctil conforme Ley 25.506.
3. Identificación y trazabilidad por código QR / Barcode.

## 1. Inspección Fotográfica de 4 Puntos
Toda entrega y devolución debe auditar fotográficamente los 4 puntos de impacto crítico:
- **Nose (Punta)**: Sensible a golpes contra la arena o piedras.
- **Rails (Cantos Izquierdo/Derecho)**: Fisuras por transporte o golpes de remada.
- **Tail (Cola)**: Golpes al apoyar la tabla en el piso.
- **Quillas / Cajas de Quillas (Fin Boxes)**: Roturas al tocar fondo o arrancamiento por leash.

## 2. Firma Digital Táctil (Ley 25.506)
- El cliente debe rubricar el contrato en un pad táctil (Signature Canvas) en pantalla.
- La firma se convierte a formato vectorial SVG o imagen PNG base64 y se asocia al hash del contrato criptográfico (`contratoHash` SHA-256).

## 3. Escaneo y Generación de Códigos QR
- Cada tabla en inventario posee un identificador QR único: `SRMDP-BOARD-{ID}`.
- El mostrador permite escanear o ingresar el código al instante para cargar el formulario de Check-in o Check-out en menos de 5 segundos.
