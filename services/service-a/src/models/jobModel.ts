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
  // Store initial job hash data
  await redisClient.hSet(`job:${jobId}`, 'status', 'pending');
  await redisClient.hSet(`job:${jobId}`, 'submittedAt', new Date().toISOString());

  // Push job ID into the Redis list queue
  await redisClient.lPush('job_queue', jobId);
}

export async function getJobStatus(jobId: string): Promise<JobData | null> {
  const data = await redisClient.hGetAll(`job:${jobId}`);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return data as unknown as JobData;
}
