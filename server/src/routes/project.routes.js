import { Router } from 'express';
import * as ctrl from '../controllers/project.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.detail);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/logs', ctrl.logs);
router.post('/:id/collaborators', ctrl.addCollaborator);
router.delete('/:id/collaborators/:userId', ctrl.removeCollaborator);

export default router;
