import { Router } from 'express';
import * as statsController from '../controllers/statsController';
import { verifyAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.get('/stats', verifyAdmin, statsController.getStats);
router.get('/metrics', statsController.getMetrics);

export default router;
