import { Router } from 'express';
import * as statsController from '../controllers/statsController';

const router = Router();

router.get('/stats', statsController.getStats);
router.get('/metrics', statsController.getMetrics);

export default router;
