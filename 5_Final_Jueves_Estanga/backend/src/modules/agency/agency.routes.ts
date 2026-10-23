import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import { agencyCheckInSchema, agencyCheckOutSchema, updateCommissionSchema } from './agency.schemas';
import {
  checkIn,
  checkOut,
  getDailySchedule,
  getAgencyMetrics,
  getCommission,
  updateCommission,
} from './agency.controller';

const router = Router();

// Rutas de consulta y actualización de comisión desde la web
// Protegidas mediante validación de contraseña especial de seguridad de la agencia
router.get('/commission', getCommission);
router.put('/commission', validateBody(updateCommissionSchema), updateCommission);
router.post('/commission', validateBody(updateCommissionSchema), updateCommission);

// Todas las rutas operativas de mostrador requieren sesión activa con rol AGENCIA
router.use(requireAuth);
router.use(requireRole('AGENCIA'));

router.post('/checkin', validateBody(agencyCheckInSchema), checkIn);
router.post('/checkout', validateBody(agencyCheckOutSchema), checkOut);
router.get('/schedule', getDailySchedule);
router.get('/metrics', getAgencyMetrics);

export default router;
