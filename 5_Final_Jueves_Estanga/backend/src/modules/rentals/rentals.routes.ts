import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import {
  quoteRentalSchema,
  createRentalSchema,
  cancelRentalSchema,
} from './rentals.schemas';
import {
  getQuote,
  createRental,
  getMyRentals,
  getRentalById,
  cancelRental,
  registrarRetiro,
  registrarDevolucion,
  evaluarDanos,
  signRentalBiometric,
} from './rentals.controller';

const router = Router();

router.post('/quote', validateBody(quoteRentalSchema), getQuote);
router.post('/', requireAuth, validateBody(createRentalSchema), createRental);
router.get('/my', requireAuth, getMyRentals);
router.get('/mine', requireAuth, getMyRentals);
router.post('/sign-biometric', requireAuth, signRentalBiometric);
router.post('/:id/biometric-sign', requireAuth, signRentalBiometric);
router.get('/:id', requireAuth, getRentalById);
router.post('/:id/cancel', requireAuth, validateBody(cancelRentalSchema), cancelRental);
router.post('/:id/retiro', requireAuth, requireRole('AGENCIA'), registrarRetiro);
router.post('/:id/devolucion', requireAuth, requireRole('AGENCIA'), registrarDevolucion);
router.post('/:id/evaluacion', requireAuth, requireRole('OWNER', 'AGENCIA'), evaluarDanos);

export default router;
