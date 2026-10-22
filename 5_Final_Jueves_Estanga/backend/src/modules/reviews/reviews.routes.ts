import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { loyaltyService } from '../loyalty/loyalty.service';

const router = Router();

router.post('/', requireAuth, requireRole('CONSUMER'), async (req, res, next) => {
  try {
    const consumerId = (req as any).user.id;
    const result = await loyaltyService.createVerifiedReview(consumerId, req.body);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/board/:boardId', async (req, res, next) => {
  try {
    const result = await loyaltyService.getBoardReviews(req.params.boardId as string);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
