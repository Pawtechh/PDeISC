import {
  calculateRentalQuote,
  calculateCancellationRefund,
  validateOperatingHours,
} from '../pricing.engine';

describe('Pricing Engine Pure Tests (MP5 Reglas de Negocio)', () => {
  const baseNow = new Date('2026-11-01T10:00:00Z');

  describe('calculateRentalQuote', () => {
    it('debe calcular tarifa regular sin descuentos para 2 horas', () => {
      // Fecha en 2 días (no anticipada, < 8 horas)
      const fechaInicio = new Date('2026-11-03T10:00:00Z');
      const quote = calculateRentalQuote({
        precioHora: 4000,
        horas: 2,
        fechaInicio,
        ahora: baseNow,
      });

      expect(quote.precioBase).toBe(8000);
      expect(quote.descuentos).toHaveLength(0);
      expect(quote.descuentoTotal).toBe(0);
      expect(quote.precioTotal).toBe(8000);
      // Split 5% agencia / 95% owner
      expect(quote.gananciaAgencia).toBe(400); // 8000 * 0.05
      expect(quote.gananciaOwner).toBe(7600); // 8000 * 0.95
      expect(quote.puntosGanados).toBe(20); // 2h * 10
    });

    it('debe aplicar 25% de descuento por día completo (>= 8 horas)', () => {
      const fechaInicio = new Date('2026-11-03T08:00:00Z');
      const quote = calculateRentalQuote({
        precioHora: 4000,
        horas: 8,
        fechaInicio,
        ahora: baseNow,
      });

      const precioBase = 4000 * 8; // 32000
      const descEsperado = Math.round(precioBase * 0.25); // 8000
      expect(quote.precioBase).toBe(32000);
      expect(quote.descuentoTotal).toBe(descEsperado);
      expect(quote.precioTotal).toBe(24000);
      expect(quote.descuentos.some((d) => d.tipo === 'DIA_COMPLETO')).toBe(true);
      expect(quote.puntosGanados).toBe(80);
    });

    it('debe aplicar 10% de descuento por reserva anticipada (+7 días)', () => {
      // 10 días de anticipación
      const fechaInicio = new Date('2026-11-11T10:00:00Z');
      const quote = calculateRentalQuote({
        precioHora: 4000,
        horas: 3,
        fechaInicio,
        ahora: baseNow,
      });

      const precioBase = 12000;
      const descAnticipado = Math.round(precioBase * 0.10); // 1200
      expect(quote.precioBase).toBe(12000);
      expect(quote.descuentoTotal).toBe(descAnticipado);
      expect(quote.precioTotal).toBe(10800);
      expect(quote.descuentos.some((d) => d.tipo === 'ANTICIPADA')).toBe(true);
    });

    it('debe combinar descuento día completo (25%) + reserva anticipada (10%)', () => {
      const fechaInicio = new Date('2026-11-15T08:00:00Z'); // 14 días después
      const quote = calculateRentalQuote({
        precioHora: 5000,
        horas: 8,
        fechaInicio,
        ahora: baseNow,
      });

      const precioBase = 40000;
      expect(quote.precioBase).toBe(precioBase);
      const descDia = precioBase * 0.25; // 10000
      const descAnt = precioBase * 0.10; // 4000
      expect(quote.descuentoTotal).toBe(descDia + descAnt); // 14000
      expect(quote.precioTotal).toBe(26000); // 40000 - 14000
    });

    it('debe aplicar descuento por puntos de fidelidad (100 pts: 5%, 250 pts: 10%, 500 pts: 15%)', () => {
      const fechaInicio = new Date('2026-11-03T10:00:00Z');
      const quote100 = calculateRentalQuote({
        precioHora: 4000,
        horas: 2,
        fechaInicio,
        ahora: baseNow,
        puntosUsados: 100,
      });
      expect(quote100.descuentoTotal).toBe(8000 * 0.05); // 400

      const quote250 = calculateRentalQuote({
        precioHora: 4000,
        horas: 2,
        fechaInicio,
        ahora: baseNow,
        puntosUsados: 250,
      });
      expect(quote250.descuentoTotal).toBe(8000 * 0.10); // 800

      const quote500 = calculateRentalQuote({
        precioHora: 4000,
        horas: 2,
        fechaInicio,
        ahora: baseNow,
        puntosUsados: 500,
      });
      expect(quote500.descuentoTotal).toBe(8000 * 0.15); // 1200
    });
  });

  describe('calculateCancellationRefund (Política Escalonada)', () => {
    const total = 10000;
    const inicio = new Date('2026-11-10T12:00:00Z');

    it('debe reembolsar 100% con más de 72 horas de anticipación', () => {
      // 80 horas antes
      const cancelacion = new Date('2026-11-07T04:00:00Z');
      const refund = calculateCancellationRefund(total, inicio, cancelacion);

      expect(refund.porcentajeReembolso).toBe(1.0);
      expect(refund.montoReembolso).toBe(10000);
      expect(refund.montoPenalidad).toBe(0);
    });

    it('debe reembolsar 70% entre 24 y 72 horas de anticipación (30% penalidad)', () => {
      // 48 horas antes
      const cancelacion = new Date('2026-11-08T12:00:00Z');
      const refund = calculateCancellationRefund(total, inicio, cancelacion);

      expect(refund.porcentajeReembolso).toBe(0.70);
      expect(refund.montoReembolso).toBe(7000);
      expect(refund.montoPenalidad).toBe(3000);
    });

    it('debe reembolsar 40% entre 6 y 24 horas de anticipación (60% penalidad)', () => {
      // 12 horas antes
      const cancelacion = new Date('2026-11-10T00:00:00Z');
      const refund = calculateCancellationRefund(total, inicio, cancelacion);

      expect(refund.porcentajeReembolso).toBe(0.40);
      expect(refund.montoReembolso).toBe(4000);
      expect(refund.montoPenalidad).toBe(6000);
    });

    it('debe reembolsar 0% con menos de 6 horas de anticipación (100% penalidad)', () => {
      // 3 horas antes
      const cancelacion = new Date('2026-11-10T09:00:00Z');
      const refund = calculateCancellationRefund(total, inicio, cancelacion);

      expect(refund.porcentajeReembolso).toBe(0.0);
      expect(refund.montoReembolso).toBe(0);
      expect(refund.montoPenalidad).toBe(10000);
    });
  });

  describe('validateOperatingHours (Sede 06:00 a 21:00)', () => {
    it('debe aprobar reserva dentro de las 6:00 a 21:00 hs', () => {
      const inicio = new Date('2026-11-10T08:00:00');
      const fin = new Date('2026-11-10T12:00:00');
      const validation = validateOperatingHours(inicio, fin);
      expect(validation.isValid).toBe(true);
    });

    it('debe rechazar retiro antes de las 6:00 hs', () => {
      const inicio = new Date('2026-11-10T05:00:00');
      const fin = new Date('2026-11-10T09:00:00');
      const validation = validateOperatingHours(inicio, fin);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('06:00');
    });

    it('debe rechazar devolución después de las 21:00 hs', () => {
      const inicio = new Date('2026-11-10T19:00:00');
      const fin = new Date('2026-11-10T22:00:00');
      const validation = validateOperatingHours(inicio, fin);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('21:00');
    });
  });
});
