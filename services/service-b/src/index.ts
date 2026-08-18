import dotenv from 'dotenv';
import { connectRedis, redisClient } from './config/redis';
import * as cpuWorkloads from './workloads/cpuWorkloads';
import * as jobModel from './models/jobModel';

// Load environment variables
dotenv.config();

async function runWorker(): Promise<void> {
  try {
    // Establish connection to Redis
    await connectRedis();
    console.log('Worker connected to Redis successfully. Waiting for jobs...');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  }

  // Infinite processing loop
  while (true) {
    let jobId: string | null = null;
    try {
      // Blocking pop from list
      const popped = await redisClient.brPop('job_queue', 0);
      
      if (!popped) continue;

      jobId = popped.element;
      console.log(`[Worker] Started processing job: ${jobId}`);

      // Set job status to processing
      await jobModel.setJobProcessing(jobId);

      const startTime = process.hrtime();

      // Trigger heavy CPU calculations
      cpuWorkloads.calculatePrimes();
      cpuWorkloads.hashPassword();
      cpuWorkloads.generateAndSortArray();

      const diff = process.hrtime(startTime);
      const processingTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

      // Save success status and statistics
      await jobModel.setJobCompleted(
        jobId,
        processingTimeMs,
        'CPU operations processed successfully'
      );

      console.log(`[Worker] Job completed: ${jobId} in ${processingTimeMs}ms`);
    } catch (err) {
      console.error('Error processing job:', err);
      if (jobId) {
        try {
          const errorDetails = (err as Error).message || 'Unknown processing error';
          await jobModel.setJobFailed(jobId, errorDetails);
        } catch (redisErr) {
          console.error('Failed to write error state to Redis:', redisErr);
        }
      }
    }
  }
}

runWorker();
