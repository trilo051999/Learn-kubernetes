import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as jobModel from '../models/jobModel';

export async function submitJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobId = uuidv4();
    await jobModel.enqueueJob(jobId);
    res.status(202).json({ jobId, status: 'submitted' });
  } catch (err) {
    next(err);
  }
}

export async function getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const jobData = await jobModel.getJobStatus(id as string);

    if (!jobData) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(jobData);
  } catch (err) {
    next(err);
  }
}
