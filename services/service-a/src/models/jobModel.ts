import { redisClient } from '../config/redis';

export interface JobData {
  status: string;
  submittedAt?: string;
  startedAt?: string;
  processedAt?: string;
  processingTimeMs?: string;
  result?: string;
}

export async function enqueueJob(jobId: string): Promise<void> {
  // Store initial job hash data in a single command
  await redisClient.hSet(`job:${jobId}`, {
    status: 'pending',
    submittedAt: new Date().toISOString()
  });

  // Push job ID into the Redis list queue
  await redisClient.lPush('job_queue', jobId);

  // Maintain atomic counter for cluster-wide metrics aggregation
  await redisClient.incr('stats:total_submitted');
}

export async function getJobStatus(jobId: string): Promise<JobData | null> {
  const data = await redisClient.hGetAll(`job:${jobId}`);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return data as unknown as JobData;
}
