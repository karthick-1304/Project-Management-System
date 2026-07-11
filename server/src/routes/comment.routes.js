import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/comment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Task-scoped comment routes: mounted at /api/tasks/:taskId/comments
export const taskCommentRoutes = Router({ mergeParams: true });
taskCommentRoutes.use(requireAuth);
taskCommentRoutes.get('/', ctrl.list);
taskCommentRoutes.post('/', upload.single('file'), ctrl.create);

// Comment/attachment routes: mounted at /api
export const commentRoutes = Router();
commentRoutes.use(requireAuth);
commentRoutes.delete('/comments/:id', ctrl.remove);
commentRoutes.get('/attachments/:id/url', ctrl.attachmentUrl);
