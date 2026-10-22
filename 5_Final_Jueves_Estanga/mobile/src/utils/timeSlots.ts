/**
 * Utilidades para generación dinámica y filtrado de Time Slots de Sede Central
 * Reglas de negocio:
 * - Operación: 06:00 a 21:00 hs
 * - Intervalos de 30 minutos
 * - Buffer de anticipación para reservas de HOY: 60 minutos
 */

export const HORA_INICIO = 6;
export const HORA_FIN = 21;
export const BUFFER_MINUTOS = 60;

export interface TimeSlot {
  hora: number;
  minuto: number;
  label: string;
  disponible: boolean;
  razon?: string;
}

export function esMismaFecha(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface OccupiedRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Genera slots de horarios y calcula disponibilidad según fecha, hora actual y reservas ocupadas
 */
export function generarSlots(
  fechaSeleccionada: Date,
  ahora: Date = new Date(),
  occupiedRanges: OccupiedRange[] = [],
  duracionHoras: number = 0
): TimeSlot[] {
  const esHoy = esMismaFecha(fechaSeleccionada, ahora);
  const slots: TimeSlot[] = [];
  const umbralTiempo = ahora.getTime() + BUFFER_MINUTOS * 60 * 1000;

  for (let hora = HORA_INICIO; hora <= HORA_FIN; hora++) {
    for (const minuto of [0, 30]) {
      // 21:00 es el cierre; no hay slot 21:30
      if (hora === HORA_FIN && minuto > 0) continue;

      const slotStart = new Date(fechaSeleccionada);
      slotStart.setHours(hora, minuto, 0, 0);
      const effectiveDuration = duracionHoras > 0 ? duracionHoras : 1;
      const slotEnd = new Date(slotStart.getTime() + effectiveDuration * 60 * 60 * 1000);

      const noPasoBuffer = !esHoy || slotStart.getTime() >= umbralTiempo;
      const exceedsClosing = duracionHoras > 0 && hora + (minuto > 0 ? 0.5 : 0) + duracionHoras > HORA_FIN;

      let isOccupied = false;
      if (occupiedRanges && occupiedRanges.length > 0) {
        isOccupied = occupiedRanges.some((range) => {
          const rStart = new Date(range.start).getTime();
          const rEnd = new Date(range.end).getTime();
          return (
            (rStart <= slotStart.getTime() && rEnd > slotStart.getTime()) ||
            (rStart < slotEnd.getTime() && rEnd >= slotEnd.getTime()) ||
            (rStart >= slotStart.getTime() && rEnd <= slotEnd.getTime())
          );
        });
      }

      const disponible = noPasoBuffer && !isOccupied && !exceedsClosing;

      const hh = String(hora).padStart(2, '0');
      const mm = String(minuto).padStart(2, '0');

      let razon: string | undefined;
      if (!noPasoBuffer) {
        razon = 'Hora ya pasada o con menos de 1h de preparación';
      } else if (exceedsClosing) {
        razon = 'Excede el horario de atención (cierre 21:00 hs)';
      } else if (isOccupied) {
        razon = 'Horario ya reservado para esta tabla';
      }

      slots.push({
        hora,
        minuto,
        label: `${hh}:${mm}`,
        disponible,
        razon,
      });
    }
  }

  return slots;
}

