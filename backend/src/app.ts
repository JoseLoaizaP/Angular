import express, { Application } from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

export const createApp = (): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/list', taskRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
