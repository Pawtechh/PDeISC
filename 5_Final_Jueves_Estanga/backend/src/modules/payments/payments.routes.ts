import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { validateBody } from '../../middlewares/validateBody';
import {
  createPreferenceSchema,
  createPreAuthSchema,
  simulatePaymentSchema,
} from './payments.schemas';
import {
  createPreference,
  createPreAuth,
  handleWebhook,
  simulatePayment,
  getPaymentByRental,
} from './payments.controller';

const router = Router();

router.post('/preference', requireAuth, validateBody(createPreferenceSchema), createPreference);
router.post('/pre-auth', requireAuth, validateBody(createPreAuthSchema), createPreAuth);
router.post('/webhook', handleWebhook);
router.post('/simulate', requireAuth, validateBody(simulatePaymentSchema), simulatePayment);
router.get('/rental/:rentalId', requireAuth, getPaymentByRental);

export default router;
