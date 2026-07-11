import { query, withTransaction } from '../config/db.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getProjectRole, requireProjectAccess } from './access.service.js';
import { logActivity, LOG } from './log.service.js';

const VALID_STATUS = ['todo', 'inprogress', 'done'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

function mapTask(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    taskKey: row.task_key,
    title: row.title,
    description: row.description,
    assignee: row.assignee,
    assigneeName: row.assignee_name || null,
    assigneeEmail: row.assignee_email || null,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByName: row.created_by_name || null,
    updatedAt: row.updated_at,
  };
}

const TASK_SELECT = `
  SELECT t.*, a.name AS assignee_name, a.email AS assignee_email,
         cb.name AS created_by_name
    FROM tasks t
    LEFT JOIN users a ON a.id = t.assignee
    LEFT JOIN users cb ON cb.id = t.created_by
`;

/** Load a task with project role and computed permissions for the user. */
async function loadTaskWithPerms(userId, taskId) {
  const { rows } = await query(`${TASK_SELECT} WHERE t.id = $1`, [taskId]);
  const row = rows[0];
  if (!row) throw new HttpError(404, 'Task not found');
  const role = await getProjectRole(userId, row.project_id);
  if (!role) throw new HttpError(403, 'You do not have access to this task');

  const isOwner = role === 'owner';
  const isCreator = row.created_by === userId;
  const isAssignee = row.assignee === userId;

  const permissions = {
    canView: true,
    canEdit: isOwner || isCreator, // title/desc/assignee/priority/due date
    canDelete: isOwner || isCreator,
    canChangeStatus: isOwner || isCreator || isAssignee, // move on kanban
  };
  return { task: mapTask(row), row, role, permissions };
}

export async function listTasks(userId, projectId, { status, priority, search } = {}) {
  await requireProjectAccess(userId, projectId);
  const params = [projectId];
  const where = ['t.project_id = $1'];

  // status/priority accept a single value or a comma-separated list (multi-select).
  const toList = (v) =>
    (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => s.trim()).filter(Boolean);
  const statusList = toList(status).filter((s) => VALID_STATUS.includes(s));
  const priorityList = toList(priority).filter((p) => VALID_PRIORITY.includes(p));

  if (statusList.length) {
    params.push(statusList);
    where.push(`t.status = ANY($${params.length})`);
  }
  if (priorityList.length) {
    params.push(priorityList);
    where.push(`t.priority = ANY($${params.length})`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(t.title ILIKE $${params.length} OR t.task_key ILIKE $${params.length})`);
  }
  const { rows } = await query(
    `${TASK_SELECT} WHERE ${where.join(' AND ')} ORDER BY t.created_at ASC`,
    params
  );
  return rows.map(mapTask);
}

export async function getTask(userId, taskId) {
  const { task, permissions } = await loadTaskWithPerms(userId, taskId);
  return { task, permissions };
}

export async function createTask(userId, projectId, data) {
  const role = await requireProjectAccess(userId, projectId); // owner or member may create
  if (!role) throw new HttpError(403, 'You do not have access to this project');
  const { title, description, assignee, dueDate, priority, status } = data;
  if (!title?.trim()) throw new HttpError(400, 'Task title is required');
  if (priority && !VALID_PRIORITY.includes(priority)) throw new HttpError(400, 'Invalid priority');
  if (status && !VALID_STATUS.includes(status)) throw new HttpError(400, 'Invalid status');
  if (assignee) await assertAssigneeIsCollaborator(assignee, projectId);

  const created = await withTransaction(async (client) => {
    const { rows: keyRows } = await client.query('SELECT next_task_key($1) AS key', [projectId]);
    const taskKey = keyRows[0].key;
    const { rows } = await client.query(
      `INSERT INTO tasks (project_id, task_key, title, description, assignee, due_date, priority, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7,'medium')::task_priority, COALESCE($8,'todo')::task_status, $9, $9)
       RETURNING id`,
      [
        projectId,
        taskKey,
        title.trim(),
        description || null,
        assignee || null,
        dueDate || null,
        priority || null,
        status || null,
        userId,
      ]
    );
    await logActivity(
      {
        projectId,
        taskId: rows[0].id,
        actionType: LOG.TASK_CREATED,
        message: `Task ${taskKey} created`,
        actionBy: userId,
      },
      client
    );
    return rows[0].id;
  });

  const { task } = await getTask(userId, created);
  return task;
}

export async function updateTask(userId, taskId, patch) {
  const { row, permissions } = await loadTaskWithPerms(userId, taskId);
  if (!permissions.canEdit)
    throw new HttpError(403, 'Only the project owner or task creator can edit this task');

  const fields = [];
  const params = [];
  const add = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };

  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new HttpError(400, 'Task title is required');
    add('title', patch.title.trim());
  }
  if (patch.description !== undefined) add('description', patch.description);
  if (patch.assignee !== undefined) {
    if (patch.assignee) await assertAssigneeIsCollaborator(patch.assignee, row.project_id);
    add('assignee', patch.assignee || null);
  }
  if (patch.dueDate !== undefined) add('due_date', patch.dueDate || null);
  if (patch.priority !== undefined) {
    if (!VALID_PRIORITY.includes(patch.priority)) throw new HttpError(400, 'Invalid priority');
    add('priority', patch.priority);
  }
  if (patch.status !== undefined) {
    if (!VALID_STATUS.includes(patch.status)) throw new HttpError(400, 'Invalid status');
    add('status', patch.status);
  }
  if (!fields.length) return (await getTask(userId, taskId)).task;

  params.push(userId);
  fields.push(`updated_by = $${params.length}`);
  params.push(taskId);

  await withTransaction(async (client) => {
    await client.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${params.length}`, params);
    await logActivity(
      {
        projectId: row.project_id,
        taskId,
        actionType: LOG.TASK_UPDATED,
        message: `Task ${row.task_key} updated`,
        actionBy: userId,
      },
      client
    );
  });
  return (await getTask(userId, taskId)).task;
}

/** Status-only change; allowed for owner/creator/assignee (kanban move). */
export async function updateStatus(userId, taskId, status) {
  const { row, permissions } = await loadTaskWithPerms(userId, taskId);
  if (!VALID_STATUS.includes(status)) throw new HttpError(400, 'Invalid status');
  if (!permissions.canChangeStatus)
    throw new HttpError(403, 'You cannot change the status of this task');
  if (row.status === status) return (await getTask(userId, taskId)).task;

  await withTransaction(async (client) => {
    await client.query('UPDATE tasks SET status = $1, updated_by = $2 WHERE id = $3', [
      status,
      userId,
      taskId,
    ]);
    await logActivity(
      {
        projectId: row.project_id,
        taskId,
        actionType: LOG.TASK_UPDATED,
        message: `Task ${row.task_key} moved to ${status}`,
        actionBy: userId,
      },
      client
    );
  });
  return (await getTask(userId, taskId)).task;
}

export async function deleteTask(userId, taskId) {
  const { row, permissions } = await loadTaskWithPerms(userId, taskId);
  if (!permissions.canDelete)
    throw new HttpError(403, 'Only the project owner or task creator can delete this task');

  await withTransaction(async (client) => {
    // Log before delete; task_id will null out via ON DELETE SET NULL but keeps project history.
    await logActivity(
      {
        projectId: row.project_id,
        taskId,
        actionType: LOG.TASK_DELETED,
        message: `Task ${row.task_key} ("${row.title}") deleted`,
        actionBy: userId,
      },
      client
    );
    await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  });
  return { ok: true };
}

/** Activity log entries for a single task, newest first. */
export async function getTaskLogs(userId, taskId) {
  const { row } = await loadTaskWithPerms(userId, taskId);
  const { rows } = await query(
    `SELECT l.id, l.action_type, l.message, l.action_at, u.name AS action_by_name
       FROM logs l LEFT JOIN users u ON u.id = l.action_by
      WHERE l.task_id = $1 ORDER BY l.action_at DESC`,
    [taskId]
  );
  return rows.map((r) => ({
    id: r.id,
    actionType: r.action_type,
    message: r.message,
    actionAt: r.action_at,
    actionByName: r.action_by_name,
  }));
}

async function assertAssigneeIsCollaborator(assigneeId, projectId) {
  const role = await getProjectRole(assigneeId, projectId);
  if (!role) throw new HttpError(400, 'Assignee must be a collaborator on the project');
}
