import { query } from '../config/db.js';
import { HttpError } from '../middleware/errorHandler.js';

/** Returns 'owner' | 'member' | null for a user on a project. */
export async function getProjectRole(userId, projectId) {
  const { rows } = await query(
    `SELECT role FROM project_collaborators WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  return rows[0]?.role || null;
}

/** Throws 404 if project missing, 403 if the user is not a collaborator. Returns role. */
export async function requireProjectAccess(userId, projectId) {
  const { rows } = await query('SELECT 1 FROM projects WHERE id = $1', [projectId]);
  if (!rows[0]) throw new HttpError(404, 'Project not found');
  const role = await getProjectRole(userId, projectId);
  if (!role) throw new HttpError(403, 'You do not have access to this project');
  return role;
}

/** Throws 403 unless the user is the project owner. */
export async function requireProjectOwner(userId, projectId) {
  const role = await requireProjectAccess(userId, projectId);
  if (role !== 'owner') throw new HttpError(403, 'Only the project owner can perform this action');
  return role;
}
