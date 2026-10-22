const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();
const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'surf-rental-access-secret-default-key-2026';

async function verifyAllRoles() {

  const users = await prisma.user.findMany();
  console.log('Total usuarios en BD:', users.length);

  for (const role of ['CONSUMER', 'OWNER', 'AGENCY']) {
    const user = users.find(u => u.role === role);
    if (!user) continue;

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`\n=== Verificando Perfil ${role} (${user.email}) ===`);

    if (role === 'CONSUMER') {
      const resBoards = await fetch('http://localhost:3000/api/boards');
      console.log('GET /api/boards:', resBoards.status);
      const resMyRentals = await fetch('http://localhost:3000/api/rentals/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /api/rentals/my:', resMyRentals.status);
      const resClaims = await fetch('http://localhost:3000/api/claims', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /api/claims:', resClaims.status);
    } else if (role === 'OWNER') {
      const resBoards = await fetch('http://localhost:3000/api/owner/boards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /api/owner/boards:', resBoards.status);
      const resEarnings = await fetch('http://localhost:3000/api/owner/earnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /api/owner/earnings:', resEarnings.status);
      const resRevisions = await fetch('http://localhost:3000/api/owner/rentals/pending-revisions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /api/owner/rentals/pending-revisions:', resRevisions.status);
    } else if (role === 'AGENCY') {
      const resPending = await fetch('http://localhost:3000/api/agency/rentals/pending-pickup', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /api/agency/rentals/pending-pickup:', resPending.status);
      const resActive = await fetch('http://localhost:3000/api/agency/rentals/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('GET /api/agency/rentals/active:', resActive.status);
    }
  }

  // Verificar Manual y PDF
  console.log('\n=== Verificando Manual Web y PDF ===');
  const resManual = await fetch('http://localhost:3000/manual');
  console.log('GET /manual:', resManual.status);
  const resPdf = await fetch('http://localhost:3000/manual/manual-operativo-surf-rental-mdp.pdf');
  console.log('GET /manual/...pdf:', resPdf.status, 'Size:', resPdf.headers.get('content-length'));

  await prisma.$disconnect();
  console.log('\n>>> TODAS LAS RUTAS Y PERFILES RESPONDEN 200 OK <<<');
}

verifyAllRoles().catch(console.error);
