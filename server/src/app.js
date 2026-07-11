import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import userRoutes from './routes/user.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  // Health check
  app.get('/api/health', async (req, res) => {
    let db = 'unknown';
    try {
      await pool.query('SELECT 1');
      db = 'up';
    } catch {
      db = 'down';
    }
    res.json({ status: 'ok', db, time: new Date().toISOString() });
  });

  // Feature routes
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/users', userRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
