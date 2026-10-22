# SKILL: surf-marine-forecast

## Propósito
Integración y presentación del reporte oceanográfico y meteorológico en tiempo real para las playas de Mar del Plata (foco en Sede Central Playa Grande, coordenadas: -38.0305, -57.5310).

## Fuentes de Datos
- **Open-Meteo Marine API**: Endpoint público sin API key ni costos (`https://marine-api.open-meteo.com/v1/marine`).
- Variables clave:
  - `wave_height`: Altura de ola en metros.
  - `wave_period`: Periodo del swell en segundos (>9s es calidad alta, <7s es viento local).
  - `wave_direction`: Dirección del swell (SE y S son las mejores direcciones para Playa Grande).
  - `wind_speed_10m`: Velocidad del viento.
  - `wind_direction_10m`: Dirección del viento (Viento Oeste/Sudoeste es Offshore/Glasé; Este/Noreste es Onshore/Picado).

## Reglas de Negocio Oceanográficas
1. **Bandera de Seguridad en Playa**:
   - `VERDE`: Ola < 1.2m, viento < 20 km/h. Seguro para todos los niveles.
   - `AMARILLA`: Ola 1.2m - 2.2m o viento 20-35 km/h. Precaución, recomendado nivel intermedio/avanzado.
   - `ROJA`: Ola > 2.2m o viento > 35 km/h o tormenta eléctrica. Suspensión preventiva de alquileres para principiantes.

2. **Recomendación de Tabla según Mar**:
   - Ola < 0.8m o fofa: Recomendar `Longboard` (70-80L) o `Softboard / Funboard` (+45L).
   - Ola 0.9m - 1.5m con buen periodo: Recomendar `Fish` (28-35L) o `Funboard`.
   - Ola > 1.5m consistente: Recomendar `Shortboard` técnica.
