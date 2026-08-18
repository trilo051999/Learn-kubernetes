import express from 'express';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import jobRoutes from './routes/jobRoutes';
import { errorHandler } from './middlewares/errorHandler';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount the job routes
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
