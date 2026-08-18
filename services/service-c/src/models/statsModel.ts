import { redisClient } from '../config/redis';

export interface StatsResponse {
  queueLength: number;
  totalSubmitted: number;
  totalCompleted: number;
  totalFailed: number;
  averageProcessingTimeMs: number;
}

export async function getStats(): Promise<StatsResponse> {
  // Query current list length
  const queueLength = await redisClient.lLen('job_queue');

  // Fetch all job keys
  const keys = await redisClient.keys('job:*');
  
  let totalSubmitted = keys.length;
  let totalCompleted = 0;
  let totalFailed = 0;
  let totalProcessingTimeMs = 0;

  for (const key of keys) {
    const job = await redisClient.hGetAll(key);
    if (job && Object.keys(job).length > 0) {
      if (job.status === 'completed') {
        totalCompleted++;
        if (job.processingTimeMs) {
          totalProcessingTimeMs += parseFloat(job.processingTimeMs);
        }
      } else if (job.status === 'error') {
        totalFailed++;
      }
    }
  }

  const averageProcessingTimeMs = totalCompleted > 0 
    ? parseFloat((totalProcessingTimeMs / totalCompleted).toFixed(2))
    : 0;

  return {
    queueLength,
    totalSubmitted,
    totalCompleted,
    totalFailed,
    averageProcessingTimeMs
  };
}
