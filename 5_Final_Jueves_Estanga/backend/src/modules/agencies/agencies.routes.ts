import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import { registerAgencySchema, updateMyAgencySchema } from './agencies.schemas';
import {
  listZones,
  listAgencies,
  getAgencyProfile,
  registerAgency,
  updateMyAgency,
} from './agencies.controller';

const router = Router();

router.get('/zones', listZones);
router.get('/agencies', listAgencies);
router.get('/agencies/:slugOrId', getAgencyProfile);
router.post('/agencies/register', validateBody(registerAgencySchema), registerAgency);
router.patch(
  '/agencies/mine',
  requireAuth,
  requireRole('AGENCIA', 'SUPER_ADMIN'),
  validateBody(updateMyAgencySchema),
  updateMyAgency
);

export default router;
