import { Router } from 'express';
import * as boardsController from './boards.controller';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireRole } from '../../middlewares/requireRole';
import { validateBody } from '../../middlewares/validateBody';
import { createBoardSchema, updateBoardSchema } from './boards.schemas';

const router = Router();

// Endpoints públicos
router.get('/', boardsController.listBoards);
router.get('/mine', requireAuth, requireRole('OWNER', 'AGENCIA'), boardsController.getMyBoards);
router.get('/:id', boardsController.getBoard);
router.get('/:id/availability', boardsController.getAvailability);
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { loyaltyService } = await import('../loyalty/loyalty.service');
    const result = await loyaltyService.getBoardReviews(req.params.id as string);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// Endpoints protegidos para OWNERS y AGENCIA
router.post(
  '/',
  requireAuth,
  requireRole('OWNER', 'AGENCIA'),
  validateBody(createBoardSchema),
  boardsController.createBoard
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('OWNER', 'AGENCIA'),
  validateBody(updateBoardSchema),
  boardsController.updateBoard
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('OWNER', 'AGENCIA'),
  boardsController.deleteBoard
);

export default router;
