import { redisClient } from '../config/redis';

export async function setJobProcessing(jobId: string): Promise<void> {
  await redisClient.hSet(`job:${jobId}`, {
    status: 'processing',
    startedAt: new Date().toISOString()
  });
}

export async function setJobCompleted(
  jobId: string,
  processingTimeMs: string,
  result: string
): Promise<void> {
  await redisClient.hSet(`job:${jobId}`, {
    status: 'completed',
    processedAt: new Date().toISOString(),
    processingTimeMs,
    result
  });
  // Maintain atomic counters for cluster-wide metrics aggregation
  await redisClient.incr('stats:total_completed');
  await redisClient.incrByFloat('stats:total_processing_time_ms', parseFloat(processingTimeMs));
  // 24 hour TTL to prevent unbounded Redis memory growth
  await redisClient.expire(`job:${jobId}`, 86400);
}

export async function setJobFailed(jobId: string, errorDetails: string): Promise<void> {
  await redisClient.hSet(`job:${jobId}`, {
    status: 'error',
    errorDetails
  });
  // Maintain atomic counters for cluster-wide metrics aggregation
  await redisClient.incr('stats:total_failed');
  // 24 hour TTL to prevent unbounded Redis memory growth
  await redisClient.expire(`job:${jobId}`, 86400);
}
