import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import {
  createClaimSchema,
  consumerRespondClaimSchema,
  agencyMediateClaimSchema,
} from './claims.schemas';
import {
  createClaim,
  getClaims,
  getClaimById,
  consumerRespond,
  agencyMediate,
  processExpired,
  executeCharge,
} from './claims.controller';

const router = Router();

// Todas las rutas requieren usuario autenticado
router.use(requireAuth);

router.post('/', validateBody(createClaimSchema), createClaim);
router.get('/mine', getClaims);
router.get('/', getClaims);
router.get('/:id', getClaimById);

// Respuesta del consumidor (Aceptar o Disputar dentro de 24h)
router.post(
  '/:id/respond',
  requireRole('CONSUMER'),
  validateBody(consumerRespondClaimSchema),
  consumerRespond
);
router.post(
  '/:id/dispute',
  requireRole('CONSUMER'),
  validateBody(consumerRespondClaimSchema),
  consumerRespond
);

// Mediación formal arbitral por la Agencia (operador en mostrador)
router.post(
  '/:id/mediate',
  requireRole('AGENCIA'),
  validateBody(agencyMediateClaimSchema),
  agencyMediate
);
router.patch(
  '/:id/resolve',
  requireRole('AGENCIA'),
  validateBody(agencyMediateClaimSchema),
  agencyMediate
);

// Job/Trigger para vencer reclamos pasadas 24h sin respuesta ("Silencio = Aceptación")
router.post('/cron/check-expired', requireRole('AGENCIA'), processExpired);

// Ejecución manual de cobro sobre pre-autorización (Agencia)
router.post('/:id/charge', requireRole('AGENCIA'), executeCharge);

export default router;
