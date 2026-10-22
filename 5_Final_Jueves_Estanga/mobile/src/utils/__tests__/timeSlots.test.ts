import { generarSlots, esMismaFecha, HORA_INICIO, HORA_FIN, BUFFER_MINUTOS } from '../timeSlots';

describe('TimeSlots Utility (Bloque 3)', () => {
  it('debe generar todos los slots como disponibles para una fecha futura', () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    const slots = generarSlots(manana);

    expect(slots.length).toBe(31); // 06:00 a 21:00 cada 30 min = 31 slots
    expect(slots[0].label).toBe('06:00');
    expect(slots[slots.length - 1].label).toBe('21:00');
    expect(slots.every((s) => s.disponible)).toBe(true);
  });

  it('debe filtrar slots pasados y aplicar buffer de 60 minutos si la fecha es hoy', () => {
    const hoy = new Date();
    // Simular que son las 15:30
    const ahora = new Date(hoy);
    ahora.setHours(15, 30, 0, 0);

    const slots = generarSlots(hoy, ahora);

    // Con buffer de 60 min, el primer horario disponible debe ser 16:30 o posterior
    const slotsPasados = slots.filter((s) => s.hora < 16 || (s.hora === 16 && s.minuto < 30));
    expect(slotsPasados.every((s) => !s.disponible)).toBe(true);

    const slot1630 = slots.find((s) => s.label === '16:30');
    expect(slot1630?.disponible).toBe(true);
  });

  it('debe marcar todos los slots como no disponibles si es tarde en el día de hoy', () => {
    const hoy = new Date();
    // Simular que son las 21:30 (después del cierre)
    const noche = new Date(hoy);
    noche.setHours(21, 30, 0, 0);

    const slots = generarSlots(hoy, noche);
    expect(slots.every((s) => !s.disponible)).toBe(true);
  });

  it('debe identificar correctamente si dos fechas caen el mismo día calendario', () => {
    const d1 = new Date(2026, 9, 10, 10, 0);
    const d2 = new Date(2026, 9, 10, 18, 45);
    const d3 = new Date(2026, 9, 11, 10, 0);

    expect(esMismaFecha(d1, d2)).toBe(true);
    expect(esMismaFecha(d1, d3)).toBe(false);
  });
});
