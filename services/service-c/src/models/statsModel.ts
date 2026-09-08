import { redisClient } from '../config/redis';

export interface StatsResponse {
  queueLength: number;
  totalSubmitted: number;
  totalCompleted: number;
  totalFailed: number;
  averageProcessingTimeMs: number;
}

export async function getStats(): Promise<StatsResponse> {
  // Query queue length and atomic counters in parallel
  const [queueLength, totalSubmittedStr, totalCompletedStr, totalFailedStr, totalTimeStr] =
    await Promise.all([
      redisClient.lLen('job_queue'),
      redisClient.get('stats:total_submitted'),
      redisClient.get('stats:total_completed'),
      redisClient.get('stats:total_failed'),
      redisClient.get('stats:total_processing_time_ms')
    ]);

  const totalSubmitted = parseInt(totalSubmittedStr || '0', 10);
  const totalCompleted = parseInt(totalCompletedStr || '0', 10);
  const totalFailed = parseInt(totalFailedStr || '0', 10);
  const totalProcessingTimeMs = parseFloat(totalTimeStr || '0');

  const averageProcessingTimeMs =
    totalCompleted > 0 ? parseFloat((totalProcessingTimeMs / totalCompleted).toFixed(2)) : 0;

  return {
    queueLength,
    totalSubmitted,
    totalCompleted,
    totalFailed,
    averageProcessingTimeMs
  };
}
