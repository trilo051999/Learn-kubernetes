import dotenv from 'dotenv';
import http from 'http';
import client from 'prom-client';
import { connectRedis, redisClient } from './config/redis';
import * as cpuWorkloads from './workloads/cpuWorkloads';
import * as jobModel from './models/jobModel';

// Load environment variables
dotenv.config();

// ==========================================
// 📈 Prometheus Metrics Instrumentation
// ==========================================

export const register = new client.Registry();

// Add default CPU/Memory metrics
client.collectDefaultMetrics({ register });

// Define custom worker metrics
const jobsProcessedCounter = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed by this worker',
  labelNames: ['status']
});

const jobProcessingTimeHistogram = new client.Histogram({
  name: 'job_processing_time_seconds',
  help: 'Histogram of job processing times in seconds',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
});

const jobErrorsCounter = new client.Counter({
  name: 'job_errors_total',
  help: 'Total number of job processing failures'
});

// Register metrics
register.registerMetric(jobsProcessedCounter);
register.registerMetric(jobProcessingTimeHistogram);
register.registerMetric(jobErrorsCounter);

// Expose a lightweight HTTP server on port 3001 to serve Prometheus metrics
const METRICS_PORT = process.env.METRICS_PORT || 3001;
const metricsServer = http.createServer(async (req, res) => {
  if (req.url === '/metrics') {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

metricsServer.listen(METRICS_PORT, () => {
  console.log(`Worker metrics server listening on port ${METRICS_PORT}`);
});

// ==========================================
// 🚀 Main Worker Loop
// ==========================================

async function runWorker(): Promise<void> {
  try {
    await connectRedis();
    console.log('Worker connected to Redis successfully. Waiting for jobs...');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  }

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
      const processingTimeSeconds = parseFloat(processingTimeMs) / 1000;

      // Track metric observations
      jobsProcessedCounter.inc({ status: 'success' });
      jobProcessingTimeHistogram.observe(processingTimeSeconds);

      // Save success status and statistics
      await jobModel.setJobCompleted(
        jobId,
        processingTimeMs,
        'CPU operations processed successfully'
      );

      console.log(`[Worker] Job completed: ${jobId} in ${processingTimeMs}ms`);
    } catch (err) {
      console.error('Error processing job:', err);
      // Track failed metric observations
      jobsProcessedCounter.inc({ status: 'error' });
      jobErrorsCounter.inc();

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
