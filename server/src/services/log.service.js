import { query } from '../config/db.js';

/**
 * Record an activity log entry.
 * @param client - optional pg client (to run inside an existing transaction)
 */
export async function logActivity(
  { projectId, taskId = null, actionType, message = null, actionBy },
  client = null
) {
  const runner = client || { query };
  await runner.query(
    `INSERT INTO logs (project_id, task_id, action_type, message, action_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [projectId, taskId, actionType, message, actionBy]
  );
}

export const LOG = {
  PROJECT_CREATED: 'PROJECT_CREATED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_DELETED: 'TASK_DELETED',
};
