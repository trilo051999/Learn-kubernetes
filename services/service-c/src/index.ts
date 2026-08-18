import express from 'express';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import statsRoutes from './routes/statsRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { startMetricsScheduler } from './config/metrics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Mount the statistics routes
app.use(statsRoutes);

// Register global error handler
app.use(errorHandler);

async function startServer() {
  try {
    // 1. Connect to Redis
    await connectRedis();
    console.log('Redis connected successfully in Service C.');

    // 2. Start the Prometheus polling metrics scheduler
    startMetricsScheduler();
    console.log('Prometheus metrics aggregation scheduler active.');

    // 3. Start Listening
    app.listen(PORT, () => {
      console.log(`Service C is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize Service C server:', err);
    process.exit(1);
  }
}

startServer();
