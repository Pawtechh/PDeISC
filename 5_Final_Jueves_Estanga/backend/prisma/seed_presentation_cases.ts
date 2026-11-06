import { PrismaClient, Role, BoardStatus, RentalStatus, ClaimStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏄 Generando Casos Completos de Demostración para Presentación...');

  // 1. Obtener o crear el usuario de prueba de Hernán
  let hernan = await prisma.user.findFirst({
    where: { email: 'hernantrabajo123@gmail.com' },
  });

  if (!hernan) {
    hernan = await prisma.user.create({
      data: {
        email: 'hernantrabajo123@gmail.com',
        nombre: 'Hernán Pocorena',
        dni: '39876543',
        dniFotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
        puntos: 180,
        role: Role.CONSUMER,
        activo: true,
      },
    });
  } else {
    hernan = await prisma.user.update({
      where: { id: hernan.id },
      data: {
        dni: hernan.dni || '39876543',
        dniFotoUrl: hernan.dniFotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
        puntos: Math.max(hernan.puntos, 180),
      },
    });
  }

  // Obtener agencia y owner
  const agencia = await prisma.user.findFirst({ where: { role: Role.AGENCIA } });
  const owner2 = await prisma.user.findFirst({ where: { email: 'owner2@surf.com' } });

  const now = new Date();

  // CASO 1: RESERVA PROGRAMADA PARA RETIRAR HOY (a las 16:30 hs)
  // Estado: PENDIENTE / ACTIVA para retiro express en mostrador de Playa Grande
  const fechaInicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30, 0);
  const fechaFinHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30, 0);

  await prisma.rental.upsert({
    where: { id: 'demo-retiro-hoy' },
    update: {
      consumerId: hernan.id,
      boardId: 'board-seed-1',
      fechaInicio: fechaInicioHoy,
      fechaFinEstimada: fechaFinHoy,
      horas: 4,
      precioBase: 24000.0,
      descuento: 0.0,
      precioSeguro: 1200.0,
      precioTotal: 25200.0,
      gananciaOwner: 22800.0,
      gananciaAgencia: 1200.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.PENDIENTE,
      contratoHash: 'sha256_demo_contrato_retiro_hoy',
    },
    create: {
      id: 'demo-retiro-hoy',
      consumerId: hernan.id,
      boardId: 'board-seed-1',
      fechaInicio: fechaInicioHoy,
      fechaFinEstimada: fechaFinHoy,
      horas: 4,
      precioBase: 24000.0,
      descuento: 0.0,
      precioSeguro: 1200.0,
      precioTotal: 25200.0,
      gananciaOwner: 22800.0,
      gananciaAgencia: 1200.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.PENDIENTE,
      contratoHash: 'sha256_demo_contrato_retiro_hoy',
    },
  });

  // CASO 2: TABLA EN EL AGUA (ALQUILER EN CURSO EN ESTE MOMENTO)
  // Retirada hace 1h 30m, termina en 2h 30m
  const fechaRetiroEnCurso = new Date(now.getTime() - 90 * 60 * 1000);
  const fechaFinEnCurso = new Date(now.getTime() + 150 * 60 * 1000);

  await prisma.rental.upsert({
    where: { id: 'demo-en-el-agua' },
    update: {
      consumerId: hernan.id,
      boardId: 'board-seed-2',
      fechaInicio: fechaRetiroEnCurso,
      fechaFinEstimada: fechaFinEnCurso,
      horas: 4,
      precioBase: 26000.0,
      descuento: 0.0,
      precioSeguro: 1300.0,
      precioTotal: 27300.0,
      gananciaOwner: 24700.0,
      gananciaAgencia: 1300.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.EN_CURSO,
      fotosRetiro: ['/images/boards/fish-2.jpg'],
      firmaRetiroUrl: 'data:image/svg+xml;base64,mock_firma_retiro_hernan',
      contratoHash: 'sha256_demo_contrato_en_el_agua',
    },
    create: {
      id: 'demo-en-el-agua',
      consumerId: hernan.id,
      boardId: 'board-seed-2',
      fechaInicio: fechaRetiroEnCurso,
      fechaFinEstimada: fechaFinEnCurso,
      horas: 4,
      precioBase: 26000.0,
      descuento: 0.0,
      precioSeguro: 1300.0,
      precioTotal: 27300.0,
      gananciaOwner: 24700.0,
      gananciaAgencia: 1300.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.EN_CURSO,
      fotosRetiro: ['/images/boards/fish-2.jpg'],
      firmaRetiroUrl: 'data:image/svg+xml;base64,mock_firma_retiro_hernan',
      contratoHash: 'sha256_demo_contrato_en_el_agua',
    },
  });

  await prisma.board.update({
    where: { id: 'board-seed-2' },
    data: { estado: BoardStatus.ALQUILADA },
  });

  // CASO 3: ALQUILER DEVUELTO CON RETRASO / MORA (Horas extra penalizadas)
  const fechaInicioAyer = new Date(now.getTime() - 28 * 60 * 60 * 1000);
  const fechaFinEstimadaAyer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fechaDevolucionTarde = new Date(now.getTime() - 20 * 60 * 60 * 1000); // 4 horas tarde

  await prisma.rental.upsert({
    where: { id: 'demo-devuelta-tarde' },
    update: {
      consumerId: hernan.id,
      boardId: 'board-seed-3',
      fechaInicio: fechaInicioAyer,
      fechaFinEstimada: fechaFinEstimadaAyer,
      fechaDevolucionReal: fechaDevolucionTarde,
      horas: 4,
      precioBase: 28000.0,
      descuento: 0.0,
      precioSeguro: 1400.0,
      precioTotal: 35000.0, // Incluye recargo por mora
      gananciaOwner: 31000.0,
      gananciaAgencia: 4000.0,
      puntosGanados: 20,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      multaLavado: 0.0,
      contratoHash: 'sha256_demo_contrato_devuelta_tarde',
    },
    create: {
      id: 'demo-devuelta-tarde',
      consumerId: hernan.id,
      boardId: 'board-seed-3',
      fechaInicio: fechaInicioAyer,
      fechaFinEstimada: fechaFinEstimadaAyer,
      fechaDevolucionReal: fechaDevolucionTarde,
      horas: 4,
      precioBase: 28000.0,
      descuento: 0.0,
      precioSeguro: 1400.0,
      precioTotal: 35000.0,
      gananciaOwner: 31000.0,
      gananciaAgencia: 4000.0,
      puntosGanados: 20,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      multaLavado: 0.0,
      contratoHash: 'sha256_demo_contrato_devuelta_tarde',
    },
  });

  // CASO 4: ALQUILER CON DAÑO REPORTADO / SINIESTRO DE SEGURO (InsuranceClaim)
  const fechaInicioDano = new Date(now.getTime() - 50 * 60 * 60 * 1000);
  const fechaFinDano = new Date(now.getTime() - 46 * 60 * 60 * 1000);

  await prisma.rental.upsert({
    where: { id: 'demo-con-dano' },
    update: {
      consumerId: hernan.id,
      boardId: 'board-seed-7',
      fechaInicio: fechaInicioDano,
      fechaFinEstimada: fechaFinDano,
      fechaDevolucionReal: fechaFinDano,
      horas: 4,
      precioBase: 27200.0,
      descuento: 0.0,
      precioSeguro: 1360.0,
      precioTotal: 28560.0,
      gananciaOwner: 25840.0,
      gananciaAgencia: 1360.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.RECLAMO,
      fotosRetiro: ['/images/boards/shortboard-2.jpg'],
      fotosDevolucion: ['/images/boards/shortboard-2.jpg'],
      descripcionDanio: 'Impacto fuerte en tail contra fondo rocoso. Fibra de vidrio astillada y núcleo expuesto.',
      lavada: true,
      contratoHash: 'sha256_demo_contrato_con_dano',
    },
    create: {
      id: 'demo-con-dano',
      consumerId: hernan.id,
      boardId: 'board-seed-7',
      fechaInicio: fechaInicioDano,
      fechaFinEstimada: fechaFinDano,
      fechaDevolucionReal: fechaFinDano,
      horas: 4,
      precioBase: 27200.0,
      descuento: 0.0,
      precioSeguro: 1360.0,
      precioTotal: 28560.0,
      gananciaOwner: 25840.0,
      gananciaAgencia: 1360.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.RECLAMO,
      fotosRetiro: ['/images/boards/shortboard-2.jpg'],
      fotosDevolucion: ['/images/boards/shortboard-2.jpg'],
      descripcionDanio: 'Impacto fuerte en tail contra fondo rocoso. Fibra de vidrio astillada y núcleo expuesto.',
      lavada: true,
      contratoHash: 'sha256_demo_contrato_con_dano',
    },
  });

  // Reclamo de seguro asociado al caso 4
  await prisma.insuranceClaim.upsert({
    where: { id: 'claim-demo-hernan' },
    update: {
      rentalId: 'demo-con-dano',
      reportadoPorId: owner2?.id || agencia!.id,
      montoReclamado: 22500.0,
      descripcion: 'Fisura profunda en tail derecho por golpe en fondo de piedra de Playa Grande. Requiere saneamiento y laminado epoxi.',
      fotosDano: ['/images/boards/shortboard-2.jpg'],
      presupuestoReparacionUrl: 'https://surfrental.mdp/presupuestos/presupuesto-shaper-042.pdf',
      estado: ClaimStatus.NOTIFICADO,
      notificadoAt: now,
      plazoDisputaVence: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'claim-demo-hernan',
      rentalId: 'demo-con-dano',
      reportadoPorId: owner2?.id || agencia!.id,
      montoReclamado: 22500.0,
      descripcion: 'Fisura profunda en tail derecho por golpe en fondo de piedra de Playa Grande. Requiere saneamiento y laminado epoxi.',
      fotosDano: ['/images/boards/shortboard-2.jpg'],
      presupuestoReparacionUrl: 'https://surfrental.mdp/presupuestos/presupuesto-shaper-042.pdf',
      estado: ClaimStatus.NOTIFICADO,
      notificadoAt: now,
      plazoDisputaVence: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // CASO 5: ALQUILER DEVUELTO EXITOSO CON RESEÑA 5 ESTRELLAS Y PUNTOS
  const fechaInicioExitosa = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const fechaFinExitosa = new Date(now.getTime() - 68 * 60 * 60 * 1000);

  await prisma.rental.upsert({
    where: { id: 'demo-devuelta-exitosa' },
    update: {
      consumerId: hernan.id,
      boardId: 'board-seed-4',
      fechaInicio: fechaInicioExitosa,
      fechaFinEstimada: fechaFinExitosa,
      fechaDevolucionReal: fechaFinExitosa,
      horas: 4,
      precioBase: 22000.0,
      descuento: 0.0,
      precioSeguro: 1100.0,
      precioTotal: 23100.0,
      gananciaOwner: 20900.0,
      gananciaAgencia: 1100.0,
      puntosGanados: 50,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      multaLavado: 0.0,
      contratoHash: 'sha256_demo_contrato_exitosa',
    },
    create: {
      id: 'demo-devuelta-exitosa',
      consumerId: hernan.id,
      boardId: 'board-seed-4',
      fechaInicio: fechaInicioExitosa,
      fechaFinEstimada: fechaFinExitosa,
      fechaDevolucionReal: fechaFinExitosa,
      horas: 4,
      precioBase: 22000.0,
      descuento: 0.0,
      precioSeguro: 1100.0,
      precioTotal: 23100.0,
      gananciaOwner: 20900.0,
      gananciaAgencia: 1100.0,
      puntosGanados: 50,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      multaLavado: 0.0,
      contratoHash: 'sha256_demo_contrato_exitosa',
    },
  });

  await prisma.review.upsert({
    where: { rentalId: 'demo-devuelta-exitosa' },
    update: {
      calificacion: 5,
      comentario: 'Excelente tabla, súper ágil y rápida en el agua de Playa Grande. La atención en sede y el encerado fueron impecables.',
    },
    create: {
      rentalId: 'demo-devuelta-exitosa',
      boardId: 'board-seed-4',
      userId: hernan.id,
      calificacion: 5,
      comentario: 'Excelente tabla, súper ágil y rápida en el agua de Playa Grande. La atención en sede y el encerado fueron impecables.',
    },
  });

  console.log('✅ Casos de prueba inyectados con éxito en la base de datos TiDB:');
  console.log('   1. Retiro Hoy (16:30 hs): id "demo-retiro-hoy" (PENDIENTE)');
  console.log('   2. Tabla en el Agua: id "demo-en-el-agua" (EN_CURSO)');
  console.log('   3. Devuelta con Retraso/Mora: id "demo-devuelta-tarde" (DEVUELTA + MORA)');
  console.log('   4. Daño reportado / Siniestro: id "demo-con-dano" (RECLAMO activo)');
  console.log('   5. Devuelta Impecable 5 Estrellas: id "demo-devuelta-exitosa" (DEVUELTA + REVIEW)');
}

main()
  .catch((e) => {
    console.error('Error generando casos demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
