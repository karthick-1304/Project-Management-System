import { Router } from 'express';
import * as ctrl from '../controllers/task.controller.js';
import { requireAuth } from '../middleware/auth.js';

// Project-scoped task routes: mounted at /api/projects/:projectId/tasks
export const projectTaskRoutes = Router({ mergeParams: true });
projectTaskRoutes.use(requireAuth);
projectTaskRoutes.get('/', ctrl.list);
projectTaskRoutes.post('/', ctrl.create);

// Task-scoped routes: mounted at /api/tasks
export const taskRoutes = Router();
taskRoutes.use(requireAuth);
taskRoutes.get('/:id', ctrl.detail);
taskRoutes.patch('/:id', ctrl.update);
taskRoutes.patch('/:id/status', ctrl.updateStatus);
taskRoutes.delete('/:id', ctrl.remove);
