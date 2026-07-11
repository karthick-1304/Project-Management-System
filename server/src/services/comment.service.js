import { query } from '../config/db.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getProjectRole } from './access.service.js';

/** Resolve the project for a task and assert the user is a collaborator. */
async function requireTaskAccess(userId, taskId) {
  const { rows } = await query('SELECT id, project_id FROM tasks WHERE id = $1', [taskId]);
  const task = rows[0];
  if (!task) throw new HttpError(404, 'Task not found');
  const role = await getProjectRole(userId, task.project_id);
  if (!role) throw new HttpError(403, 'You do not have access to this task');
  return { task, role };
}

function mapComment(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    message: row.message,
    createdAt: row.created_at,
    createdBy: row.created_by,
    authorName: row.author_name || null,
    attachments: [],
  };
}

export async function listComments(userId, taskId) {
  await requireTaskAccess(userId, taskId);
  const { rows } = await query(
    `SELECT c.id, c.task_id, c.message, c.created_at, c.created_by, u.name AS author_name
       FROM comments c LEFT JOIN users u ON u.id = c.created_by
      WHERE c.task_id = $1 ORDER BY c.created_at ASC`,
    [taskId]
  );
  const comments = rows.map(mapComment);
  if (comments.length) {
    const ids = comments.map((c) => c.id);
    const { rows: atts } = await query(
      `SELECT a.id, a.comment_id, a.file_url, a.file_name, a.uploaded_at, u.name AS uploaded_by_name
         FROM attachments a LEFT JOIN users u ON u.id = a.uploaded_by
        WHERE a.comment_id = ANY($1) ORDER BY a.uploaded_at ASC`,
      [ids]
    );
    const byComment = {};
    for (const a of atts) {
      (byComment[a.comment_id] ||= []).push({
        id: a.id,
        fileUrl: a.file_url,
        fileName: a.file_name,
        uploadedAt: a.uploaded_at,
        uploadedByName: a.uploaded_by_name,
      });
    }
    for (const c of comments) c.attachments = byComment[c.id] || [];
  }
  return comments;
}

export async function createComment(userId, taskId, message) {
  await requireTaskAccess(userId, taskId);
  if (!message?.trim()) throw new HttpError(400, 'Comment message is required');
  const { rows } = await query(
    `INSERT INTO comments (task_id, message, created_by) VALUES ($1, $2, $3) RETURNING id`,
    [taskId, message.trim(), userId]
  );
  return rows[0].id;
}

/** Delete a comment. Allowed for the author or the project owner. */
export async function deleteComment(userId, commentId) {
  const { rows } = await query(
    `SELECT c.id, c.created_by, t.project_id
       FROM comments c JOIN tasks t ON t.id = c.task_id
      WHERE c.id = $1`,
    [commentId]
  );
  const comment = rows[0];
  if (!comment) throw new HttpError(404, 'Comment not found');

  const role = await getProjectRole(userId, comment.project_id);
  if (!role) throw new HttpError(403, 'You do not have access to this comment');
  const isAuthor = comment.created_by === userId;
  const isOwner = role === 'owner';
  if (!isAuthor && !isOwner)
    throw new HttpError(403, 'You can only delete your own comments');

  await query('DELETE FROM comments WHERE id = $1', [commentId]);
  return { ok: true };
}

export async function getCommentForAttachment(userId, commentId) {
  const { rows } = await query(
    `SELECT c.id, c.task_id, t.project_id FROM comments c JOIN tasks t ON t.id = c.task_id WHERE c.id = $1`,
    [commentId]
  );
  const comment = rows[0];
  if (!comment) throw new HttpError(404, 'Comment not found');
  const role = await getProjectRole(userId, comment.project_id);
  if (!role) throw new HttpError(403, 'You do not have access to this comment');
  return comment;
}
