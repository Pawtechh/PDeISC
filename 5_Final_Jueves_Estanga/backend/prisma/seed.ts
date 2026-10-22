import { PrismaClient, Role, BoardStatus, RentalStatus, ClaimStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed Integral y Realista para Surf Rental MDP...');

  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // 1. USUARIOS: 1 AGENCIA, 3 OWNERS, 5 CONSUMERS
  const agencia = await prisma.user.upsert({
    where: { email: 'mostrador@surf.com' },
    update: { passwordHash, activo: true, role: Role.AGENCIA },
    create: {
      email: 'mostrador@surf.com',
      passwordHash,
      nombre: 'Operador Mostrador Playa Grande',
      telefono: '+54 223 555-0303',
      dni: '30444555',
      role: Role.AGENCIA,
      activo: true,
    },
  });

  const owner1 = await prisma.user.upsert({
    where: { email: 'owner@surf.com' },
    update: { passwordHash, activo: true, role: Role.OWNER },
    create: {
      email: 'owner@surf.com',
      passwordHash,
      nombre: 'Martín Shaper MDP',
      telefono: '+54 223 555-0201',
      dni: '28987654',
      role: Role.OWNER,
      activo: true,
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'owner2@surf.com' },
    update: { passwordHash, activo: true, role: Role.OWNER },
    create: {
      email: 'owner2@surf.com',
      passwordHash,
      nombre: 'Lucas Peralta Shaper',
      telefono: '+54 223 555-0202',
      dni: '31234567',
      role: Role.OWNER,
      activo: true,
    },
  });

  const owner3 = await prisma.user.upsert({
    where: { email: 'owner3@surf.com' },
    update: { passwordHash, activo: true, role: Role.OWNER },
    create: {
      email: 'owner3@surf.com',
      passwordHash,
      nombre: 'Camila Costa Surf Crafts',
      telefono: '+54 223 555-0203',
      dni: '33456789',
      role: Role.OWNER,
      activo: true,
    },
  });

  const consumer1 = await prisma.user.upsert({
    where: { email: 'consumer@surf.com' },
    update: { passwordHash, activo: true, role: Role.CONSUMER, puntos: 350 },
    create: {
      email: 'consumer@surf.com',
      passwordHash,
      nombre: 'Gonzalo Surfista',
      telefono: '+54 223 555-0101',
      dni: '35123456',
      role: Role.CONSUMER,
      puntos: 350,
      puntosSancion: 0,
      activo: true,
    },
  });

  const consumer2 = await prisma.user.upsert({
    where: { email: 'consumer2@surf.com' },
    update: { passwordHash, activo: true, role: Role.CONSUMER, puntos: 200 },
    create: {
      email: 'consumer2@surf.com',
      passwordHash,
      nombre: 'Florencia Rider',
      telefono: '+54 223 555-0102',
      dni: '36234567',
      role: Role.CONSUMER,
      puntos: 200,
      puntosSancion: 0,
      activo: true,
    },
  });

  const consumer3 = await prisma.user.upsert({
    where: { email: 'consumer3@surf.com' },
    update: { passwordHash, activo: true, role: Role.CONSUMER, puntos: 480 },
    create: {
      email: 'consumer3@surf.com',
      passwordHash,
      nombre: 'Santiago Olas',
      telefono: '+54 223 555-0103',
      dni: '37345678',
      role: Role.CONSUMER,
      puntos: 480,
      puntosSancion: 0,
      activo: true,
    },
  });

  const consumer4 = await prisma.user.upsert({
    where: { email: 'consumer4@surf.com' },
    update: { passwordHash, activo: true, role: Role.CONSUMER, puntos: 120 },
    create: {
      email: 'consumer4@surf.com',
      passwordHash,
      nombre: 'Agustina Point',
      telefono: '+54 223 555-0104',
      dni: '38456789',
      role: Role.CONSUMER,
      puntos: 120,
      puntosSancion: 0,
      activo: true,
    },
  });

  const consumer5 = await prisma.user.upsert({
    where: { email: 'consumer5@surf.com' },
    update: { passwordHash, activo: true, role: Role.CONSUMER, puntos: 90 },
    create: {
      email: 'consumer5@surf.com',
      passwordHash,
      nombre: 'Mateo Quequén',
      telefono: '+54 223 555-0105',
      dni: '39567890',
      role: Role.CONSUMER,
      puntos: 90,
      puntosSancion: 0,
      activo: true,
    },
  });

  console.log('✅ 9 Usuarios listos (1 AGENCIA, 3 OWNERS, 5 CONSUMERS).');

  // 2. TABLAS DE SURF: 18 Tablas (6 por owner)
  const boardsData = [
    // Owner 1 (Martín Shaper)
    {
      id: 'board-seed-1',
      ownerId: owner1.id,
      titulo: 'Channel Islands FishBeard 5\'8',
      marca: 'Channel Islands',
      modelo: 'FishBeard',
      medidas: '5\'8 x 19 3/8 x 2 3/8',
      volumenLitros: 29.2,
      tipoTabla: 'Fish',
      precioHora: 6000.0,
      valorTasadoUsd: 750.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/fish-1.jpg',
        '/images/boards/fish-2.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-001',
      polizaAseguradora: 'La Segunda Seguros',
    },
    {
      id: 'board-seed-2',
      ownerId: owner1.id,
      titulo: 'Lost Driver 2.0 Pro Performance',
      marca: 'Lost',
      modelo: 'Driver 2.0',
      medidas: '6\'0 x 19 x 2 1/2',
      volumenLitros: 31.0,
      tipoTabla: 'Shortboard',
      precioHora: 6500.0,
      valorTasadoUsd: 820.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/shortboard-1.jpg',
        '/images/boards/shortboard-2.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-002',
      polizaAseguradora: 'Sancor Seguros',
    },
    {
      id: 'board-seed-3',
      ownerId: owner1.id,
      titulo: 'Torq Classic Longboard 9\'1',
      marca: 'Torq',
      modelo: 'Classic Longboard',
      medidas: '9\'1 x 22 3/4 x 3 1/8',
      volumenLitros: 72.0,
      tipoTabla: 'Longboard',
      precioHora: 7000.0,
      valorTasadoUsd: 900.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/longboard-1.jpg',
        '/images/boards/longboard-2.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-003',
      polizaAseguradora: 'Rivadavia Seguros',
    },
    {
      id: 'board-seed-4',
      ownerId: owner1.id,
      titulo: 'UVA Retro Single Fin 7\'2',
      marca: 'UVA Surfboards',
      modelo: 'Single Fin 72',
      medidas: '7\'2 x 21 1/2 x 2 7/8',
      volumenLitros: 50.5,
      tipoTabla: 'Funboard',
      precioHora: 5500.0,
      valorTasadoUsd: 650.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/funboard-1.jpg',
        '/images/boards/funboard-2.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-004',
      polizaAseguradora: 'La Segunda Seguros',
    },
    {
      id: 'board-seed-5',
      ownerId: owner1.id,
      titulo: 'Catch Surf Odysea Skipper 6\'0',
      marca: 'Catch Surf',
      modelo: 'Odysea Skipper',
      medidas: '6\'0 x 21 1/2 x 3',
      volumenLitros: 48.0,
      tipoTabla: 'Funboard',
      precioHora: 4800.0,
      valorTasadoUsd: 500.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/funboard-2.jpg',
        '/images/boards/funboard-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-005',
      polizaAseguradora: 'Sancor Seguros',
    },
    {
      id: 'board-seed-6',
      ownerId: owner1.id,
      titulo: 'Naish Mana All-Around SUP 10\'0',
      marca: 'Naish',
      modelo: 'Mana 100',
      medidas: '10\'0 x 33 x 4 3/4',
      volumenLitros: 190.0,
      tipoTabla: 'SUP',
      precioHora: 8000.0,
      valorTasadoUsd: 1200.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/sup-1.jpg',
        '/images/boards/sup-2.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-006',
      polizaAseguradora: 'Rivadavia Seguros',
    },

    // Owner 2 (Lucas Peralta)
    {
      id: 'board-seed-7',
      ownerId: owner2.id,
      titulo: 'Al Merrick Happy Everyday 5\'10',
      marca: 'Channel Islands',
      modelo: 'Happy Everyday',
      medidas: '5\'10 x 19 3/4 x 2 1/2',
      volumenLitros: 30.9,
      tipoTabla: 'Shortboard',
      precioHora: 6800.0,
      valorTasadoUsd: 880.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/shortboard-2.jpg',
        '/images/boards/shortboard-3.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-007',
      polizaAseguradora: 'La Segunda Seguros',
    },
    {
      id: 'board-seed-8',
      ownerId: owner2.id,
      titulo: 'Firewire Sunday Rob Machado 6\'4',
      marca: 'Firewire',
      modelo: 'Sunday',
      medidas: '6\'4 x 20 3/4 x 3',
      volumenLitros: 45.1,
      tipoTabla: 'Funboard',
      precioHora: 7200.0,
      valorTasadoUsd: 950.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/funboard-1.jpg',
        '/images/boards/funboard-3.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-008',
      polizaAseguradora: 'Sancor Seguros',
    },
    {
      id: 'board-seed-9',
      ownerId: owner2.id,
      titulo: 'NSP Elements HDT Longboard 9\'2',
      marca: 'NSP',
      modelo: 'Elements HDT',
      medidas: '9\'2 x 22 7/8 x 3 3/16',
      volumenLitros: 77.4,
      tipoTabla: 'Longboard',
      precioHora: 6200.0,
      valorTasadoUsd: 800.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/longboard-2.jpg',
        '/images/boards/longboard-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-009',
      polizaAseguradora: 'Rivadavia Seguros',
    },
    {
      id: 'board-seed-10',
      ownerId: owner2.id,
      titulo: 'JS Industries Monsta Box 2020 5\'9',
      marca: 'JS Industries',
      modelo: 'Monsta Box',
      medidas: '5\'9 x 19 x 2 5/16',
      volumenLitros: 27.0,
      tipoTabla: 'Shortboard',
      precioHora: 6400.0,
      valorTasadoUsd: 810.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/shortboard-3.jpg',
        '/images/boards/shortboard-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-010',
      polizaAseguradora: 'La Segunda Seguros',
    },
    {
      id: 'board-seed-11',
      ownerId: owner2.id,
      titulo: 'Morey Mach 7 Pro Bodyboard 42"',
      marca: 'Morey',
      modelo: 'Mach 7 Pro',
      medidas: '42" x 21.5" x 2.25"',
      volumenLitros: null,
      tipoTabla: 'Bodyboard',
      precioHora: 3000.0,
      valorTasadoUsd: 220.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/bodyboard-1.jpg',
        '/images/boards/bodyboard-2.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-011',
      polizaAseguradora: 'Sancor Seguros',
    },
    {
      id: 'board-seed-12',
      ownerId: owner2.id,
      titulo: 'Fanatic Fly Allwave SUP 9\'6',
      marca: 'Fanatic',
      modelo: 'Fly Allwave',
      medidas: '9\'6 x 32 x 4.5',
      volumenLitros: 174.0,
      tipoTabla: 'SUP',
      precioHora: 7800.0,
      valorTasadoUsd: 1100.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/sup-2.jpg',
        '/images/boards/sup-3.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-012',
      polizaAseguradora: 'Rivadavia Seguros',
    },

    // Owner 3 (Camila Costa)
    {
      id: 'board-seed-13',
      ownerId: owner3.id,
      titulo: 'DHD Phoenix Summer Twin 5\'7',
      marca: 'DHD',
      modelo: 'Phoenix',
      medidas: '5\'7 x 19 7/8 x 2 7/16',
      volumenLitros: 30.5,
      tipoTabla: 'Fish',
      precioHora: 6700.0,
      valorTasadoUsd: 840.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/fish-2.jpg',
        '/images/boards/fish-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-013',
      polizaAseguradora: 'La Segunda Seguros',
    },
    {
      id: 'board-seed-14',
      ownerId: owner3.id,
      titulo: 'Pyzel Ghost John John Florence 6\'1',
      marca: 'Pyzel',
      modelo: 'Ghost',
      medidas: '6\'1 x 19 1/4 x 2 9/16',
      volumenLitros: 31.7,
      tipoTabla: 'Shortboard',
      precioHora: 7500.0,
      valorTasadoUsd: 920.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/shortboard-4.jpg',
        '/images/boards/shortboard-2.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-014',
      polizaAseguradora: 'Sancor Seguros',
    },
    {
      id: 'board-seed-15',
      ownerId: owner3.id,
      titulo: 'Bing Levitator Noserider 9\'4',
      marca: 'Bing',
      modelo: 'Levitator',
      medidas: '9\'4 x 23 1/4 x 3 1/8',
      volumenLitros: 79.0,
      tipoTabla: 'Longboard',
      precioHora: 7400.0,
      valorTasadoUsd: 1050.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/longboard-3.jpg',
        '/images/boards/longboard-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-015',
      polizaAseguradora: 'Rivadavia Seguros',
    },
    {
      id: 'board-seed-16',
      ownerId: owner3.id,
      titulo: 'Modern Highline Poly 6\'8',
      marca: 'Modern',
      modelo: 'Highline Poly',
      medidas: '6\'8 x 21 3/4 x 2 3/4',
      volumenLitros: 46.5,
      tipoTabla: 'Funboard',
      precioHora: 5600.0,
      valorTasadoUsd: 680.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/funboard-3.jpg',
        '/images/boards/funboard-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-016',
      polizaAseguradora: 'La Segunda Seguros',
    },
    {
      id: 'board-seed-17',
      ownerId: owner3.id,
      titulo: 'Hubboards Hubb Edition Quad Core 41.5"',
      marca: 'Hubboards',
      modelo: 'Hubb Edition',
      medidas: '41.5" x 21" x 2.2"',
      volumenLitros: null,
      tipoTabla: 'Bodyboard',
      precioHora: 3200.0,
      valorTasadoUsd: 260.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/bodyboard-2.jpg',
        '/images/boards/bodyboard-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-017',
      polizaAseguradora: 'Sancor Seguros',
    },
    {
      id: 'board-seed-18',
      ownerId: owner3.id,
      titulo: 'Starboard Whopper SUP 10\'0',
      marca: 'Starboard',
      modelo: 'Whopper',
      medidas: '10\'0 x 34 x 4.3',
      volumenLitros: 171.0,
      tipoTabla: 'SUP',
      precioHora: 8200.0,
      valorTasadoUsd: 1250.0,
      estado: BoardStatus.DISPONIBLE,
      fotos: [
        '/images/boards/sup-3.jpg',
        '/images/boards/sup-1.jpg',
      ],
      polizaSeguroNumero: 'POL-SURF-MDP-018',
      polizaAseguradora: 'Rivadavia Seguros',
    },
  ];

  for (const b of boardsData) {
    await prisma.board.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }
  console.log(`✅ ${boardsData.length} Tablas de surf insertadas en catálogo (6 por cada Owner).`);

  // 3. RENTALS: 14 Alquileres en diversos estados
  const now = new Date();
  const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const anteayer = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const tresDiasAtras = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const manana = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const pasadoManana = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const rentalsData = [
    // Alquiler 0: ACTIVA y cancelable para Consumer 1 (más de 72h)
    {
      id: 'rental-seed-0',
      consumerId: consumer1.id,
      boardId: 'board-seed-5',
      fechaInicio: new Date(now.getTime() + 96 * 60 * 60 * 1000),
      fechaFinEstimada: new Date(now.getTime() + 100 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 24000.0,
      descuento: 0.0,
      precioSeguro: 1200.0,
      precioTotal: 25200.0,
      gananciaOwner: 22800.0,
      gananciaAgencia: 1200.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.ACTIVA,
      contratoHash: 'sha256_mock_hash_rental_0',
    },
    // Alquiler 1: DEVUELTA y con reseña (Consumer 1)
    {
      id: 'rental-seed-1',
      consumerId: consumer1.id,
      boardId: 'board-seed-1',
      fechaInicio: tresDiasAtras,
      fechaFinEstimada: new Date(tresDiasAtras.getTime() + 4 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(tresDiasAtras.getTime() + 4 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 24000.0,
      descuento: 0.0,
      precioSeguro: 1200.0,
      precioTotal: 25200.0,
      gananciaOwner: 22800.0,
      gananciaAgencia: 1200.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      multaLavado: 0.0,
      contratoHash: 'sha256_mock_hash_rental_1',
    },
    // Alquiler 2: DEVUELTA con multa de salitre (Consumer 1)
    {
      id: 'rental-seed-2',
      consumerId: consumer1.id,
      boardId: 'board-seed-3',
      fechaInicio: anteayer,
      fechaFinEstimada: new Date(anteayer.getTime() + 8 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(anteayer.getTime() + 8 * 60 * 60 * 1000),
      horas: 8,
      precioBase: 56000.0,
      descuento: 14000.0, // 25% OFF día completo
      precioSeguro: 2100.0,
      precioTotal: 44100.0,
      gananciaOwner: 39900.0,
      gananciaAgencia: 2100.0,
      puntosGanados: 80,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: false, // No lavada -> Multa $10.000
      multaLavado: 10000.0,
      contratoHash: 'sha256_mock_hash_rental_2',
    },
    // Alquiler 3: EN_CURSO (En el agua en este momento!) (Consumer 1)
    {
      id: 'rental-seed-3',
      consumerId: consumer1.id,
      boardId: 'board-seed-2',
      fechaInicio: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      fechaFinEstimada: new Date(now.getTime() + 2 * 60 * 60 * 1000),
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
      fotosRetiro: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      firmaRetiroUrl: 'data:image/svg+xml;base64,mock_signature_retiro',
      contratoHash: 'sha256_mock_hash_rental_3',
    },
    // Alquiler 4: ACTIVA / PENDIENTE para retiro hoy en sede (Consumer 2)
    {
      id: 'rental-seed-4',
      consumerId: consumer2.id,
      boardId: 'board-seed-4',
      fechaInicio: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      fechaFinEstimada: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 22000.0,
      descuento: 0.0,
      precioSeguro: 1100.0,
      precioTotal: 23100.0,
      gananciaOwner: 20900.0,
      gananciaAgencia: 1100.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.PENDIENTE,
      contratoHash: 'sha256_mock_hash_rental_4',
    },
    // Alquiler 5: PENDIENTE_REVISION (Devuelta con daño para revisión del owner) (Consumer 2)
    {
      id: 'rental-seed-5',
      consumerId: consumer2.id,
      boardId: 'board-seed-7',
      fechaInicio: ayer,
      fechaFinEstimada: new Date(ayer.getTime() + 4 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(ayer.getTime() + 4 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 27200.0,
      descuento: 0.0,
      precioSeguro: 1360.0,
      precioTotal: 28560.0,
      gananciaOwner: 25840.0,
      gananciaAgencia: 1360.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.PENDIENTE_REVISION,
      fotosRetiro: ['https://images.unsplash.com/photo-1537519646099-335112f03225?w=800'],
      fotosDevolucion: ['https://images.unsplash.com/photo-1537519646099-335112f03225?w=800'],
      lavada: true,
      multaLavado: 0.0,
      contratoHash: 'sha256_mock_hash_rental_5',
    },
    // Alquiler 6: CANCELADA con reembolso del 70% (Consumer 3)
    {
      id: 'rental-seed-6',
      consumerId: consumer3.id,
      boardId: 'board-seed-8',
      fechaInicio: pasadoManana,
      fechaFinEstimada: new Date(pasadoManana.getTime() + 4 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 28800.0,
      descuento: 0.0,
      precioSeguro: 1440.0,
      precioTotal: 30240.0,
      gananciaOwner: 0.0,
      gananciaAgencia: 0.0,
      puntosGanados: 0,
      puntosUsados: 0,
      estado: RentalStatus.CANCELADA,
      contratoHash: 'sha256_mock_hash_rental_6',
    },
    // Alquiler 7: DEVUELTA y reseñada (Consumer 3)
    {
      id: 'rental-seed-7',
      consumerId: consumer3.id,
      boardId: 'board-seed-9',
      fechaInicio: new Date(tresDiasAtras.getTime() - 24 * 60 * 60 * 1000),
      fechaFinEstimada: new Date(tresDiasAtras.getTime() - 20 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(tresDiasAtras.getTime() - 20 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 24800.0,
      descuento: 0.0,
      precioSeguro: 1240.0,
      precioTotal: 26040.0,
      gananciaOwner: 23560.0,
      gananciaAgencia: 1240.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      contratoHash: 'sha256_mock_hash_rental_7',
    },
    // Alquiler 8: EN_CURSO (En el agua por Consumer 4)
    {
      id: 'rental-seed-8',
      consumerId: consumer4.id,
      boardId: 'board-seed-13',
      fechaInicio: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      fechaFinEstimada: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 26800.0,
      descuento: 0.0,
      precioSeguro: 1340.0,
      precioTotal: 28140.0,
      gananciaOwner: 25460.0,
      gananciaAgencia: 1340.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.EN_CURSO,
      fotosRetiro: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      firmaRetiroUrl: 'data:image/svg+xml;base64,mock_signature_retiro_8',
      contratoHash: 'sha256_mock_hash_rental_8',
    },
    // Alquiler 9: ACTIVA para mañana (Consumer 4)
    {
      id: 'rental-seed-9',
      consumerId: consumer4.id,
      boardId: 'board-seed-14',
      fechaInicio: manana,
      fechaFinEstimada: new Date(manana.getTime() + 4 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 30000.0,
      descuento: 0.0,
      precioSeguro: 1500.0,
      precioTotal: 31500.0,
      gananciaOwner: 28500.0,
      gananciaAgencia: 1500.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.ACTIVA,
      contratoHash: 'sha256_mock_hash_rental_9',
    },
    // Alquiler 10: DEVUELTA y reseñada (Consumer 5)
    {
      id: 'rental-seed-10',
      consumerId: consumer5.id,
      boardId: 'board-seed-15',
      fechaInicio: new Date(tresDiasAtras.getTime() - 48 * 60 * 60 * 1000),
      fechaFinEstimada: new Date(tresDiasAtras.getTime() - 40 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(tresDiasAtras.getTime() - 40 * 60 * 60 * 1000),
      horas: 8,
      precioBase: 59200.0,
      descuento: 14800.0, // 25% OFF día completo
      precioSeguro: 2220.0,
      precioTotal: 46620.0,
      gananciaOwner: 42180.0,
      gananciaAgencia: 2220.0,
      puntosGanados: 80,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      contratoHash: 'sha256_mock_hash_rental_10',
    },
    // Alquiler 11: DEVUELTA (Consumer 1)
    {
      id: 'rental-seed-11',
      consumerId: consumer1.id,
      boardId: 'board-seed-16',
      fechaInicio: new Date(tresDiasAtras.getTime() - 10 * 60 * 60 * 1000),
      fechaFinEstimada: new Date(tresDiasAtras.getTime() - 6 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(tresDiasAtras.getTime() - 6 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 22400.0,
      descuento: 0.0,
      precioSeguro: 1120.0,
      precioTotal: 23520.0,
      gananciaOwner: 21280.0,
      gananciaAgencia: 1120.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.DEVUELTA,
      lavada: true,
      contratoHash: 'sha256_mock_hash_rental_11',
    },
    // Alquiler 12: RECLAMO activo (Consumer 5)
    {
      id: 'rental-seed-12',
      consumerId: consumer5.id,
      boardId: 'board-seed-10',
      fechaInicio: ayer,
      fechaFinEstimada: new Date(ayer.getTime() + 4 * 60 * 60 * 1000),
      fechaDevolucionReal: new Date(ayer.getTime() + 4 * 60 * 60 * 1000),
      horas: 4,
      precioBase: 25600.0,
      descuento: 0.0,
      precioSeguro: 1280.0,
      precioTotal: 26880.0,
      gananciaOwner: 24320.0,
      gananciaAgencia: 1280.0,
      puntosGanados: 40,
      puntosUsados: 0,
      estado: RentalStatus.RECLAMO,
      lavada: true,
      contratoHash: 'sha256_mock_hash_rental_12',
    },
  ];

  for (const r of rentalsData) {
    await prisma.rental.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }
  console.log(`✅ ${rentalsData.length} Alquileres creados con estados variados.`);

  // Actualizar estados de tablas correspondientes a los alquileres activos
  await prisma.board.update({
    where: { id: 'board-seed-2' },
    data: { estado: BoardStatus.ALQUILADA },
  });
  await prisma.board.update({
    where: { id: 'board-seed-13' },
    data: { estado: BoardStatus.ALQUILADA },
  });

  // 4. RECLAMOS DE SEGURO (3 claims en distintos estados)
  const claimsData = [
    {
      id: 'claim-seed-1',
      rentalId: 'rental-seed-5',
      reportadoPorId: owner2.id,
      montoReclamado: 18000.0,
      descripcion: 'Fisura en el tail provocada por impacto contra el fondo en La Paloma. Requiere resina epoxi y fibra.',
      fotosDano: ['https://images.unsplash.com/photo-1537519646099-335112f03225?w=800'],
      presupuestoReparacionUrl: 'https://surfrental.mdp/presupuestos/presupuesto-tail-001.pdf',
      estado: ClaimStatus.NOTIFICADO,
      notificadoAt: now,
      plazoDisputaVence: new Date(now.getTime() + 20 * 60 * 60 * 1000), // Vence en 20h
    },
    {
      id: 'claim-seed-2',
      rentalId: 'rental-seed-12',
      reportadoPorId: owner2.id,
      montoReclamado: 12500.0,
      descripcion: 'Caja de quilla central rajada. El surfista alega que la quilla venía floja.',
      fotosDano: ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'],
      estado: ClaimStatus.DISPUTADO,
      notificadoAt: ayer,
      plazoDisputaVence: new Date(ayer.getTime() + 24 * 60 * 60 * 1000),
    },
    {
      id: 'claim-seed-3',
      rentalId: 'rental-seed-2',
      reportadoPorId: agencia.id,
      montoReclamado: 10000.0,
      descripcion: 'Falta de quilla lateral izquierda al momento del reingreso.',
      fotosDano: ['https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800'],
      estado: ClaimStatus.RESUELTO_OWNER,
      resolucionAgencia: 'Se verificó en fotos de entrega que la quilla estaba colocada. Corresponde deducción de garantía.',
      notificadoAt: anteayer,
      cobradoAt: ayer,
    },
  ];

  for (const c of claimsData) {
    await prisma.insuranceClaim.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
  }
  console.log(`✅ ${claimsData.length} Reclamos creados (NOTIFICADO, DISPUTADO, RESUELTO_OWNER).`);

  // 5. RESEÑAS VERIFICADAS (20 reseñas)
  const reviewsData = [
    { id: 'rev-seed-1', rentalId: 'rental-seed-1', boardId: 'board-seed-1', userId: consumer1.id, calificacion: 5, comentario: 'Increíble FishBeard, vuela en las olas de Playa Grande. Súper ágil y rápida en secciones tubulares.' },
    { id: 'rev-seed-2', rentalId: 'rental-seed-7', boardId: 'board-seed-9', userId: consumer3.id, calificacion: 5, comentario: 'Noserider impecable para los días de viento calmo en La Perla. Muy estable.' },
    { id: 'rev-seed-3', rentalId: 'rental-seed-10', boardId: 'board-seed-15', userId: consumer5.id, calificacion: 5, comentario: 'Una obra de arte clásica. Te parás en la punta con total seguridad.' },
    { id: 'rev-seed-4', rentalId: 'rental-seed-11', boardId: 'board-seed-16', userId: consumer1.id, calificacion: 4, comentario: 'Muy buena opción para días intermedios. Buen volumen para remar fácil.' },
    // Reseñas adicionales asociadas a tablas
    { id: 'rev-seed-5', rentalId: 'rental-seed-2', boardId: 'board-seed-3', userId: consumer1.id, calificacion: 5, comentario: 'La Torq 9\'1 es excelente para días suaves. La parafina estaba recién peinada.' },
  ];

  for (const rev of reviewsData) {
    await prisma.review.upsert({
      where: { id: rev.id },
      update: rev,
      create: rev,
    });
  }

  // Crear 15 reseñas más sobre distintas tablas para alcanzar 20 reseñas
  const extraReviews = [
    { id: 'rev-extra-1', boardId: 'board-seed-1', userId: consumer2.id, calificacion: 5, comentario: 'Súper recomendada, ideal para el swell de primavera.' },
    { id: 'rev-extra-2', boardId: 'board-seed-2', userId: consumer3.id, calificacion: 5, comentario: 'Una tabla pro, responde en cada quiebre con precisión.' },
    { id: 'rev-extra-3', boardId: 'board-seed-2', userId: consumer4.id, calificacion: 4, comentario: 'Muy técnica pero excelente si tenés buen nivel.' },
    { id: 'rev-extra-4', boardId: 'board-seed-3', userId: consumer2.id, calificacion: 5, comentario: 'La mejor longboard que alquilé en Mar del Plata.' },
    { id: 'rev-extra-5', boardId: 'board-seed-4', userId: consumer5.id, calificacion: 4, comentario: 'Súper divertida para correr derechas suaves en Varese.' },
    { id: 'rev-extra-6', boardId: 'board-seed-5', userId: consumer1.id, calificacion: 5, comentario: 'La Catch Surf no se rompe con nada, pura diversión.' },
    { id: 'rev-extra-7', boardId: 'board-seed-6', userId: consumer3.id, calificacion: 5, comentario: 'El remo Naish es comodísimo y la tabla muy estable.' },
    { id: 'rev-extra-8', boardId: 'board-seed-7', userId: consumer4.id, calificacion: 5, comentario: 'Happy Everyday hace honor a su nombre: vuela.' },
    { id: 'rev-extra-9', boardId: 'board-seed-8', userId: consumer5.id, calificacion: 5, comentario: 'El diseño de Machado es una delicia de remar.' },
    { id: 'rev-extra-10', boardId: 'board-seed-9', userId: consumer1.id, calificacion: 4, comentario: 'Muy buen estado de conservación y quilla firme.' },
    { id: 'rev-extra-11', boardId: 'board-seed-10', userId: consumer2.id, calificacion: 5, comentario: 'Rápida y con buen grip para acelerar en el pocket.' },
    { id: 'rev-extra-12', boardId: 'board-seed-13', userId: consumer3.id, calificacion: 5, comentario: 'Twin fin perfecta para olas medianas con fuerza.' },
    { id: 'rev-extra-13', boardId: 'board-seed-14', userId: consumer4.id, calificacion: 5, comentario: 'Ghost de Pyzel: potencia pura, agarre fantástico.' },
    { id: 'rev-extra-14', boardId: 'board-seed-15', userId: consumer2.id, calificacion: 5, comentario: 'Elegancia clásica en el agua. Gran atención en la sede.' },
    { id: 'rev-extra-15', boardId: 'board-seed-18', userId: consumer5.id, calificacion: 5, comentario: 'Travesía hermosa desde Playa Grande hasta Cabo Corrientes con este SUP.' },
  ];

  // Para las 15 reseñas adicionales, necesitamos alquileres correspondientes únicos debido al @unique de rentalId
  for (let i = 0; i < extraReviews.length; i++) {
    const rev = extraReviews[i];
    const rentalDummyId = `rental-rev-dummy-${i + 1}`;
    await prisma.rental.upsert({
      where: { id: rentalDummyId },
      update: {},
      create: {
        id: rentalDummyId,
        consumerId: rev.userId,
        boardId: rev.boardId,
        fechaInicio: new Date(now.getTime() - (5 + i) * 24 * 60 * 60 * 1000),
        fechaFinEstimada: new Date(now.getTime() - (5 + i) * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        fechaDevolucionReal: new Date(now.getTime() - (5 + i) * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        horas: 4,
        precioBase: 24000.0,
        precioTotal: 25200.0,
        gananciaOwner: 22800.0,
        gananciaAgencia: 1200.0,
        estado: RentalStatus.DEVUELTA,
        lavada: true,
      },
    });

    await prisma.review.upsert({
      where: { id: rev.id },
      update: {
        rentalId: rentalDummyId,
        boardId: rev.boardId,
        userId: rev.userId,
        calificacion: rev.calificacion,
        comentario: rev.comentario,
      },
      create: {
        id: rev.id,
        rentalId: rentalDummyId,
        boardId: rev.boardId,
        userId: rev.userId,
        calificacion: rev.calificacion,
        comentario: rev.comentario,
      },
    });
  }

  console.log(`✅ 20 Reseñas verificadas insertadas exitosamente.`);
  console.log('🏁 SEED COMPLETO: Base de datos MySQL poblada con datos 100% realistas.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
