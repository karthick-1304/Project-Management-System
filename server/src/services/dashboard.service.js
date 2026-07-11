import { query } from '../config/db.js';

/**
 * Dashboard metrics scoped to the user:
 * - totalProjects: projects the user collaborates on (owner or member)
 * - task counts (total/completed/pending): tasks assigned to the user
 * - recentTasks: latest tasks across the user's projects, by updated_at
 */
export async function getDashboard(userId) {
  const [projects, taskCounts, recent] = await Promise.all([
    query('SELECT count(*)::int AS n FROM project_collaborators WHERE user_id = $1', [userId]),
    query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE status = 'done')::int AS completed,
         count(*) FILTER (WHERE status <> 'done')::int AS pending
       FROM tasks WHERE assignee = $1`,
      [userId]
    ),
    query(
      `SELECT t.id, t.task_key, t.title, t.status, t.priority, t.due_date, t.updated_at,
              p.id AS project_id, p.name AS project_name, p.key AS project_key,
              a.name AS assignee_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN project_collaborators pc ON pc.project_id = p.id AND pc.user_id = $1
         LEFT JOIN users a ON a.id = t.assignee
        ORDER BY t.updated_at DESC
        LIMIT 8`,
      [userId]
    ),
  ]);

  return {
    totalProjects: projects.rows[0].n,
    totalTasks: taskCounts.rows[0].total,
    completedTasks: taskCounts.rows[0].completed,
    pendingTasks: taskCounts.rows[0].pending,
    recentTasks: recent.rows.map((r) => ({
      id: r.id,
      taskKey: r.task_key,
      title: r.title,
      status: r.status,
      priority: r.priority,
      dueDate: r.due_date,
      updatedAt: r.updated_at,
      projectId: r.project_id,
      projectName: r.project_name,
      projectKey: r.project_key,
      assigneeName: r.assignee_name,
    })),
  };
}
