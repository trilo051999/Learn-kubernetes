import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { connectRedis, redisClient } from './config/redis';
import jobRoutes from './routes/jobRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middlewares/errorHandler';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003']
  })
);

// Apply Redis-backed rate limiting only outside of unit testing environment
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      // @ts-ignore - node-redis client compatibility wrapper
      sendCommand: (...args: string[]) => redisClient.sendCommand(args)
    })
  });
  app.use(limiter);
}

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
