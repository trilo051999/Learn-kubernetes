import { Router } from 'express';
import * as jobController from '../controllers/jobController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/submit', authenticate, jobController.submitJob);
router.get('/status/:id', jobController.getJobStatus);

export default router;
