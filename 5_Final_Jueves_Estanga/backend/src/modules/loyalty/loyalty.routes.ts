import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { validateBody } from '../../middlewares/validateBody';
import { redeemPointsSchema, createReviewSchema } from './loyalty.schemas';
import {
  getLoyalty,
  calculateDiscount,
  createReview,
  getBoardReviews,
  getPendingReviews,
} from './loyalty.controller';

const router = Router();

// Rutas públicas de reseñas por tabla
router.get('/reviews/board/:boardId', getBoardReviews);

// Rutas autenticadas
router.use(requireAuth);

router.get('/balance', getLoyalty);
router.post('/redeem', validateBody(redeemPointsSchema), calculateDiscount);
router.post('/reviews', validateBody(createReviewSchema), createReview);
router.get('/reviews/pending', getPendingReviews);

export default router;
