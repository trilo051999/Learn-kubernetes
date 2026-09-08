import dotenv from 'dotenv';
// Load environment variables before module imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectRedis } from './config/redis';
import statsRoutes from './routes/statsRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { startMetricsScheduler } from './config/metrics';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(helmet());

// Resolve CORS allowed origins from environment with development defaults
const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:5173'
];

const resolveCorsOrigin = (): cors.CorsOptions['origin'] => {
  const originEnv = process.env.CORS_ORIGIN;
  if (!originEnv) {
    return defaultCorsOrigins;
  }
  const trimmed = originEnv.trim();
  if (trimmed === '*') {
    return '*';
  }
  return trimmed.split(',').map((o) => o.trim()).filter(Boolean);
};

app.use(
  cors({
    origin: resolveCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

// Health check endpoint for Kubernetes liveness and readiness probes
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'healthy' });
});

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

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };
