import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { prisma } from '../../config/prisma';

const router = Router();

router.use(requireAuth);

router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        dniFotoUrl: true,
        role: true,
        puntos: true,
        puntosSancion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', async (req, res, next) => {
  try {
    const { nombre, telefono, dniFotoUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        nombre: nombre || undefined,
        telefono: telefono || undefined,
        dniFotoUrl: dniFotoUrl || undefined,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        dniFotoUrl: true,
        role: true,
        puntos: true,
        puntosSancion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
