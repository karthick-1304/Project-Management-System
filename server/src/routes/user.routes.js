import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../config/db.js';

const router = Router();
router.use(requireAuth);

// Lightweight user lookup for assignee / collaborator pickers.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.query || '').trim();
    const params = [];
    let where = '';
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE name ILIKE $1 OR email ILIKE $1`;
    }
    const { rows } = await query(
      `SELECT id, name, email FROM users ${where} ORDER BY name LIMIT 20`,
      params
    );
    res.json({ users: rows });
  })
);

export default router;
