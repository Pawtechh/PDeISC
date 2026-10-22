import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const boardImages: Record<string, string[]> = {
  'board-seed-1': [
    'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-2': [
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537519646099-335112f03225?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-3': [
    'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-4': [
    'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-5': [
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537519646099-335112f03225?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-6': [
    'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-7': [
    'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-8': [
    'https://images.unsplash.com/photo-1692566755914-516e4d40520b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-9': [
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-10': [
    'https://images.unsplash.com/photo-1537519646099-335112f03225?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-11': [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-12': [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-13': [
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-14': [
    'https://images.unsplash.com/photo-1537519646099-335112f03225?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-15': [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-16': [
    'https://images.unsplash.com/photo-1776347503185-f0c97da79fd1?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1716272648974-b5834c728b8a?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-17': [
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  ],
  'board-seed-18': [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=800&auto=format&fit=crop&q=80',
  ],
};

async function main() {
  console.log('🔄 Actualizando fotos de tablas en la base de datos...');
  for (const [id, fotos] of Object.entries(boardImages)) {
    const updated = await prisma.board.update({
      where: { id },
      data: { fotos },
    }).catch(err => {
      console.warn(`No se pudo actualizar ${id}:`, err.message);
      return null;
    });
    if (updated) {
      console.log(`✅ [${updated.tipoTabla}] ${updated.titulo} -> ${fotos.length} fotos`);
    }
  }

  // Si hay alguna otra tabla creada en la base de datos sin imágenes de tabla, asignarle según tipo
  const otherBoards = await prisma.board.findMany({
    where: {
      id: { notIn: Object.keys(boardImages) },
    },
  });

  for (const b of otherBoards) {
    let fallbackFotos = boardImages['board-seed-2'];
    if (b.tipoTabla === 'Longboard') fallbackFotos = boardImages['board-seed-3'];
    else if (b.tipoTabla === 'Fish') fallbackFotos = boardImages['board-seed-1'];
    else if (b.tipoTabla === 'Funboard') fallbackFotos = boardImages['board-seed-4'];
    else if (b.tipoTabla === 'SUP') fallbackFotos = boardImages['board-seed-6'];
    else if (b.tipoTabla === 'Bodyboard') fallbackFotos = boardImages['board-seed-11'];

    await prisma.board.update({
      where: { id: b.id },
      data: { fotos: fallbackFotos },
    });
    console.log(`✅ [Otro - ${b.tipoTabla}] ${b.titulo} -> actualizado`);
  }

  console.log('🎉 Todas las tablas tienen ahora sus fotos respectivas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
