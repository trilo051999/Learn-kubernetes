import dotenv from 'dotenv';
// Load environment variables from .env before imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { connectRedis, redisClient } from './config/redis';
import jobRoutes from './routes/jobRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

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

let limiter: express.RequestHandler | undefined;

// Wrapper middleware to execute rate limiter once initialized asynchronously
app.use((req, res, next) => {
  if (limiter) {
    limiter(req, res, next);
  } else {
    next();
  }
});

// Health check endpoint for Kubernetes liveness and readiness probes
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Mount the routes
app.use('/auth', authRoutes);
app.use(jobRoutes);

// Register global error handler after all routes
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to Redis database
    await connectRedis();
    console.log('Redis connected successfully.');

    // Initialize Redis-backed rate limiter after Redis is connected
    if (process.env.NODE_ENV !== 'test') {
      limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
          // @ts-ignore - node-redis client compatibility wrapper
          sendCommand: (...args: string[]) => redisClient.sendCommand(args)
        })
      });
    }

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`Service A is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };
