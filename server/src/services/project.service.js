import { query, withTransaction } from '../config/db.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getProjectRole, requireProjectAccess, requireProjectOwner } from './access.service.js';
import { logActivity, LOG } from './log.service.js';
import {
  sendCollaboratorAddedEmail,
  sendCollaboratorRemovedEmail,
} from './email.service.js';

const COUNT_SELECT = `
  (SELECT count(*) FROM project_collaborators c WHERE c.project_id = p.id)::int AS collaborator_count,
  (SELECT count(*) FROM tasks t WHERE t.project_id = p.id)::int AS total_tasks,
  (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'todo')::int AS todo_count,
  (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'inprogress')::int AS inprogress_count,
  (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done')::int AS done_count
`;

function mapProject(row) {
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    description: row.description,
    status: row.status,
    myRole: row.my_role,
    createdAt: row.created_at,
    createdBy: row.created_by,
    counts: {
      collaborators: row.collaborator_count,
      total: row.total_tasks,
      todo: row.todo_count,
      inprogress: row.inprogress_count,
      done: row.done_count,
    },
  };
}

/** List projects the user is a collaborator on, with counts, filters, and sort. */
export async function listProjects(userId, { search, status, role, sort, dir } = {}) {
  const params = [userId];
  const where = ['pc.user_id = $1'];

  if (search) {
    params.push(`%${search}%`);
    where.push(`p.name ILIKE $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`p.status = $${params.length}`);
  }
  if (role) {
    params.push(role);
    where.push(`pc.role = $${params.length}`);
  }

  const sortCol = sort === 'name' ? 'p.name' : 'p.created_at';
  const sortDir = dir === 'asc' ? 'ASC' : 'DESC';

  const { rows } = await query(
    `SELECT p.id, p.name, p.key, p.description, p.status, p.created_at, p.created_by,
            pc.role AS my_role, ${COUNT_SELECT}
       FROM projects p
       JOIN project_collaborators pc ON pc.project_id = p.id
      WHERE ${where.join(' AND ')}
      ORDER BY ${sortCol} ${sortDir}`,
    params
  );
  return rows.map(mapProject);
}

export async function getProject(userId, projectId) {
  const myRole = await requireProjectAccess(userId, projectId);
  const { rows } = await query(
    `SELECT p.id, p.name, p.key, p.description, p.status, p.created_at, p.created_by,
            $2::text AS my_role, ${COUNT_SELECT},
            u.name AS created_by_name
       FROM projects p
       LEFT JOIN users u ON u.id = p.created_by
      WHERE p.id = $1`,
    [projectId, myRole]
  );
  const project = mapProject(rows[0]);
  project.createdByName = rows[0].created_by_name;
  project.collaborators = await getCollaborators(projectId);
  return project;
}

export async function getCollaborators(projectId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, pc.role
       FROM project_collaborators pc
       JOIN users u ON u.id = pc.user_id
      WHERE pc.project_id = $1
      ORDER BY pc.role, u.name`,
    [projectId]
  );
  return rows;
}

async function resolveUserIdsByEmail(emails) {
  if (!emails?.length) return [];
  const norm = emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  if (!norm.length) return [];
  const { rows } = await query(
    `SELECT id, email FROM users WHERE lower(email) = ANY($1)`,
    [norm]
  );
  return rows;
}

export async function createProject(userId, { name, key, description, status, collaboratorEmails }) {
  if (!name?.trim()) throw new HttpError(400, 'Project name is required');
  if (!key?.trim()) throw new HttpError(400, 'Project key is required');

  // Validate collaborator emails up front — reject (and create nothing) if any
  // are not registered users.
  const requestedEmails = [
    ...new Set((collaboratorEmails || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean)),
  ];
  const found = await resolveUserIdsByEmail(requestedEmails);
  const foundEmails = new Set(found.map((u) => u.email.toLowerCase()));
  const missing = requestedEmails.filter((e) => !foundEmails.has(e));
  if (missing.length) {
    throw new HttpError(
      400,
      `These emails are not registered users: ${missing.join(', ')}. Project was not created.`
    );
  }

  const project = await withTransaction(async (client) => {
    let row;
    try {
      const res = await client.query(
        `INSERT INTO projects (name, key, description, status, created_by, updated_by)
         VALUES ($1, $2, $3, COALESCE($4, 'Active')::project_status, $5, $5)
         RETURNING id, name, key, description, status, created_at, created_by`,
        [name.trim(), key.trim().toUpperCase(), description || null, status || null, userId]
      );
      row = res.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        const field = /name/.test(err.detail || '') ? 'name' : 'key';
        throw new HttpError(409, `A project with this ${field} already exists`);
      }
      throw err;
    }

    // Creator is owner.
    await client.query(
      `INSERT INTO project_collaborators (project_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [row.id, userId]
    );

    // Add members (skip the creator if present). Emails were validated above.
    const members = found.filter((u) => u.id !== userId);
    for (const m of members) {
      await client.query(
        `INSERT INTO project_collaborators (project_id, user_id, role)
         VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
        [row.id, m.id]
      );
    }

    await logActivity(
      {
        projectId: row.id,
        actionType: LOG.PROJECT_CREATED,
        message: `Project "${row.name}" created`,
        actionBy: userId,
      },
      client
    );

    return { row, members };
  });

  // Email notifications (outside the transaction).
  const inviter = await getUserBrief(userId);
  await Promise.all(
    project.members.map((m) =>
      sendCollaboratorAddedEmail(m.email, project.row, inviter).catch(() => {})
    )
  );

  return getProject(userId, project.row.id);
}

export async function updateProject(userId, projectId, { name, key, description, status }) {
  await requireProjectOwner(userId, projectId);
  const fields = [];
  const params = [];
  const add = (col, val) => {
    params.push(val);
    fields.push(`${col} = $${params.length}`);
  };
  if (name !== undefined) add('name', name.trim());
  if (key !== undefined) add('key', key.trim().toUpperCase());
  if (description !== undefined) add('description', description);
  if (status !== undefined) add('status', status);
  if (!fields.length) return getProject(userId, projectId);

  params.push(userId);
  fields.push(`updated_by = $${params.length}`);
  params.push(projectId);

  try {
    await query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${params.length}`, params);
  } catch (err) {
    if (err.code === '23505') {
      const field = /name/.test(err.detail || '') ? 'name' : 'key';
      throw new HttpError(409, `A project with this ${field} already exists`);
    }
    throw err;
  }
  return getProject(userId, projectId);
}

export async function deleteProject(userId, projectId) {
  await requireProjectOwner(userId, projectId);
  await query('DELETE FROM projects WHERE id = $1', [projectId]);
  return { ok: true };
}

export async function addCollaborator(userId, projectId, email) {
  await requireProjectOwner(userId, projectId);
  const [target] = await resolveUserIdsByEmail([email]);
  if (!target) throw new HttpError(404, 'No user found with that email');

  const existing = await getProjectRole(target.id, projectId);
  if (existing) throw new HttpError(409, 'User is already a collaborator');

  await query(
    `INSERT INTO project_collaborators (project_id, user_id, role) VALUES ($1, $2, 'member')`,
    [projectId, target.id]
  );

  const [project, inviter] = await Promise.all([getProjectBrief(projectId), getUserBrief(userId)]);
  sendCollaboratorAddedEmail(target.email, project, inviter).catch(() => {});
  return getCollaborators(projectId);
}

export async function removeCollaborator(userId, projectId, targetUserId) {
  await requireProjectOwner(userId, projectId);
  const role = await getProjectRole(targetUserId, projectId);
  if (!role) throw new HttpError(404, 'User is not a collaborator');
  if (role === 'owner') throw new HttpError(400, 'The project owner cannot be removed');

  const target = await getUserBrief(targetUserId);
  await query('DELETE FROM project_collaborators WHERE project_id = $1 AND user_id = $2', [
    projectId,
    targetUserId,
  ]);

  const [project, remover] = await Promise.all([getProjectBrief(projectId), getUserBrief(userId)]);
  if (target?.email) sendCollaboratorRemovedEmail(target.email, project, remover).catch(() => {});
  return getCollaborators(projectId);
}

/** Project activity log (all tasks + project events), newest first. */
export async function getProjectLogs(userId, projectId) {
  await requireProjectAccess(userId, projectId);
  const { rows } = await query(
    `SELECT l.id, l.action_type, l.message, l.action_at, l.task_id,
            u.name AS action_by_name, t.task_key
       FROM logs l
       LEFT JOIN users u ON u.id = l.action_by
       LEFT JOIN tasks t ON t.id = l.task_id
      WHERE l.project_id = $1
      ORDER BY l.action_at DESC`,
    [projectId]
  );
  return rows.map((r) => ({
    id: r.id,
    actionType: r.action_type,
    message: r.message,
    actionAt: r.action_at,
    taskId: r.task_id,
    taskKey: r.task_key,
    actionByName: r.action_by_name,
  }));
}

// --- small helpers ---
async function getUserBrief(userId) {
  const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
  return rows[0] || null;
}
async function getProjectBrief(projectId) {
  const { rows } = await query('SELECT id, name, key FROM projects WHERE id = $1', [projectId]);
  return rows[0] || null;
}
