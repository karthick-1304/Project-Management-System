import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { getSupabase } from '../config/storage.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getCommentForAttachment } from './comment.service.js';
import { getProjectRole } from './access.service.js';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function safeName(name = 'file') {
  return name.replace(/[^\w.\-]+/g, '_').slice(0, 100);
}

/** Upload a file to Supabase Storage and record an attachment row. */
export async function createAttachment(userId, commentId, file) {
  const supabase = getSupabase();
  if (!supabase)
    throw new HttpError(503, 'File storage is not configured (missing Supabase service key)');
  if (!file) throw new HttpError(400, 'No file provided');
  if (file.size > MAX_BYTES) throw new HttpError(413, 'File exceeds the 10 MB limit');

  // Access check: user must be a collaborator on the comment's project.
  await getCommentForAttachment(userId, commentId);

  const path = `${commentId}/${crypto.randomUUID()}-${safeName(file.originalname)}`;
  const { error } = await supabase.storage
    .from(env.supabase.bucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw new HttpError(502, `Upload failed: ${error.message}`);

  const { rows } = await query(
    `INSERT INTO attachments (comment_id, file_url, file_name, uploaded_by)
     VALUES ($1, $2, $3, $4) RETURNING id, file_url, file_name, uploaded_at`,
    [commentId, path, file.originalname, userId]
  );
  return {
    id: rows[0].id,
    fileName: rows[0].file_name,
    uploadedAt: rows[0].uploaded_at,
  };
}

/** Return a short-lived signed download URL for an attachment. */
export async function getAttachmentSignedUrl(userId, attachmentId) {
  const supabase = getSupabase();
  if (!supabase) throw new HttpError(503, 'File storage is not configured');
  const { rows } = await query(
    `SELECT a.file_url, a.file_name, t.project_id
       FROM attachments a
       JOIN comments c ON c.id = a.comment_id
       JOIN tasks t ON t.id = c.task_id
      WHERE a.id = $1`,
    [attachmentId]
  );
  const att = rows[0];
  if (!att) throw new HttpError(404, 'Attachment not found');
  const role = await getProjectRole(userId, att.project_id);
  if (!role) throw new HttpError(403, 'You do not have access to this attachment');

  const { data, error } = await supabase.storage
    .from(env.supabase.bucket)
    .createSignedUrl(att.file_url, 60 * 10, { download: att.file_name });
  if (error) throw new HttpError(502, `Could not create download link: ${error.message}`);
  return { url: data.signedUrl, fileName: att.file_name };
}
