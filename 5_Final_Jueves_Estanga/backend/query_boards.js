const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const boards = await prisma.board.findMany({
    select: { id: true, ownerId: true, titulo: true, marca: true, modelo: true, medidas: true, estado: true }
  });
  console.log("Found " + boards.length + " boards:");
  console.log(JSON.stringify(boards, null, 2));
}
main().finally(() => prisma.$disconnect());
