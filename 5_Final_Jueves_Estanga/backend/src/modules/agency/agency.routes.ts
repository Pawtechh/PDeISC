import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import { agencyCheckInSchema, agencyCheckOutSchema } from './agency.schemas';
import {
  checkIn,
  checkOut,
  getDailySchedule,
  getAgencyMetrics,
} from './agency.controller';

const router = Router();

// Todas las rutas requieren rol de AGENCIA (Operador de Sede Central)
router.use(requireAuth);
router.use(requireRole('AGENCIA'));

router.post('/checkin', validateBody(agencyCheckInSchema), checkIn);
router.post('/checkout', validateBody(agencyCheckOutSchema), checkOut);
router.get('/schedule', getDailySchedule);
router.get('/metrics', getAgencyMetrics);

export default router;
