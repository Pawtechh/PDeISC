import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import {
  requestPayoutSchema,
  completeMaintenanceSchema,
  createOwnerClaimSchema,
} from './owner.schemas';
import {
  getMyBoards,
  getEarnings,
  requestPayout,
  getPendingRevisions,
  getRentalInspection,
  approveRevision,
  completeMaintenance,
  reportDamageClaim,
  triggerMaintenanceCheck,
} from './owner.controller';

const router = Router();

// Todas las rutas requieren autenticación y rol OWNER
router.use(requireAuth);
router.use(requireRole('OWNER'));

router.get('/boards', getMyBoards);
router.get('/earnings', getEarnings);
router.post('/payout', validateBody(requestPayoutSchema), requestPayout);
router.get('/rentals/pending-revisions', getPendingRevisions);
router.get('/rentals/:rentalId/inspection', getRentalInspection);
router.post('/rentals/:rentalId/approve', approveRevision);
router.post(
  '/boards/:boardId/maintenance',
  validateBody(completeMaintenanceSchema),
  completeMaintenance
);
router.post('/claims', validateBody(createOwnerClaimSchema), reportDamageClaim);
router.post('/maintenance/check', triggerMaintenanceCheck);

export default router;
