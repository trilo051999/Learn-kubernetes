import client from 'prom-client';
import * as statsModel from '../models/statsModel';

// Create a Registry
export const register = new client.Registry();

// Collect standard node/process metrics
client.collectDefaultMetrics({ register });

// Define custom metrics as Gauges to dynamically query and set values from Redis
export const totalJobsSubmitted = new client.Gauge({
  name: 'total_jobs_submitted',
  help: 'Total number of jobs submitted in the system'
});

export const totalJobsCompleted = new client.Gauge({
  name: 'total_jobs_completed',
  help: 'Total number of jobs successfully processed'
});

export const queueLengthGauge = new client.Gauge({
  name: 'queue_length',
  help: 'Current backlog length of the Redis queue'
});

// Register custom metrics
register.registerMetric(totalJobsSubmitted);
register.registerMetric(totalJobsCompleted);
register.registerMetric(queueLengthGauge);

// Background worker to poll Redis and update Prometheus metrics
export function startMetricsScheduler(): void {
  setInterval(async () => {
    try {
      const stats = await statsModel.getStats();
      queueLengthGauge.set(stats.queueLength);
      totalJobsSubmitted.set(stats.totalSubmitted);
      totalJobsCompleted.set(stats.totalCompleted);
    } catch (err) {
      console.error('Failed to update Prometheus gauges from Redis:', err);
    }
  }, 5000); // Runs every 5 seconds
}
