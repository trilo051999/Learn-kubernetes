import { Request, Response, NextFunction } from 'express';
import * as statsModel from '../models/statsModel';
import { register } from '../config/metrics';

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await statsModel.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    next(err);
  }
}
