import { redisClient } from '../config/redis';

export async function setJobProcessing(jobId: string): Promise<void> {
  await redisClient.hSet(`job:${jobId}`, 'status', 'processing');
  await redisClient.hSet(`job:${jobId}`, 'startedAt', new Date().toISOString());
}

export async function setJobCompleted(
  jobId: string,
  processingTimeMs: string,
  result: string
): Promise<void> {
  await redisClient.hSet(`job:${jobId}`, 'status', 'completed');
  await redisClient.hSet(`job:${jobId}`, 'processedAt', new Date().toISOString());
  await redisClient.hSet(`job:${jobId}`, 'processingTimeMs', processingTimeMs);
  await redisClient.hSet(`job:${jobId}`, 'result', result);
}

export async function setJobFailed(jobId: string, errorDetails: string): Promise<void> {
  await redisClient.hSet(`job:${jobId}`, 'status', 'error');
  await redisClient.hSet(`job:${jobId}`, 'errorDetails', errorDetails);
}
