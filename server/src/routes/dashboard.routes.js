import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDashboard } from '../services/dashboard.service.js';

const router = Router();
router.use(requireAuth);
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await getDashboard(req.user.id);
    res.json(data);
  })
);

export default router;
