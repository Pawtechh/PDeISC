const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const ownerId = '71156b2d-2f48-4041-b117-603eaf9e90e3';
  const consumer = await prisma.user.findFirst({ where: { role: 'CONSUMER' } });
  const board = await prisma.board.findFirst({ where: { ownerId } });

  if (!consumer || !board) {
    console.error('Consumer or board not found');
    process.exit(1);
  }

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  // 1. Limpiar rentals anteriores de prueba si existían
  await prisma.insuranceClaim.deleteMany({
    where: { rentalId: { in: ['rental-verify-clean-1', 'rental-verify-damage-1'] } }
  }).catch(() => {});

  await prisma.rental.deleteMany({
    where: { id: { in: ['rental-verify-clean-1', 'rental-verify-damage-1'] } }
  }).catch(() => {});

  // 2. Crear Rental Limpio (DEVUELTA dentro de 24h) para probar "Aprobar Sin Daños"
  await prisma.rental.create({
    data: {
      id: 'rental-verify-clean-1',
      consumerId: consumer.id,
      boardId: board.id,
      fechaInicio: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      fechaFinEstimada: twoHoursAgo,
      fechaDevolucionReal: twoHoursAgo,
      horas: 3,
      precioBase: 12000,
      descuento: 0,
      precioSeguro: 2000,
      precioTotal: 14000,
      gananciaOwner: 13300,
      gananciaAgencia: 700,
      estado: 'DEVUELTA',
      descripcionDanio: null,
      lavada: true,
      multaLavado: 0,
      fotosRetiro: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      fotosDevolucion: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
    }
  });

  // 3. Crear Rental con Daño (PENDIENTE_REVISION) para probar "Aprobar con Daños" / "Reportar Daño"
  await prisma.rental.create({
    data: {
      id: 'rental-verify-damage-1',
      consumerId: consumer.id,
      boardId: board.id,
      fechaInicio: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      fechaFinEstimada: oneHourAgo,
      fechaDevolucionReal: oneHourAgo,
      horas: 3,
      precioBase: 12000,
      descuento: 0,
      precioSeguro: 2000,
      precioTotal: 14000,
      gananciaOwner: 13300,
      gananciaAgencia: 700,
      estado: 'PENDIENTE_REVISION',
      descripcionDanio: 'Golpe visible de 4cm en canto izquierdo con fisura en fibra',
      lavada: true,
      multaLavado: 0,
      fotosRetiro: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      fotosDevolucion: ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800'],
    }
  });

  console.log('✅ Seeded 2 test rentals for owner verification:');
  console.log(' - rental-verify-clean-1 (DEVUELTA, 2h ago)');
  console.log(' - rental-verify-damage-1 (PENDIENTE_REVISION, 1h ago)');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
