import { Router } from 'express';
import * as jobController from '../controllers/jobController';

const router = Router();

router.post('/submit', jobController.submitJob);
router.get('/status/:id', jobController.getJobStatus);

export default router;
