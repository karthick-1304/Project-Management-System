import { asyncHandler } from '../middleware/errorHandler.js';
import * as comments from '../services/comment.service.js';
import * as attachments from '../services/attachment.service.js';

export const list = asyncHandler(async (req, res) => {
  const result = await comments.listComments(req.user.id, req.params.taskId);
  res.json({ comments: result });
});

// Accepts JSON { message } or multipart/form-data (message + optional file).
export const create = asyncHandler(async (req, res) => {
  const commentId = await comments.createComment(req.user.id, req.params.taskId, req.body.message);
  if (req.file) {
    try {
      await attachments.createAttachment(req.user.id, commentId, req.file);
    } catch (err) {
      // Keep the comment+attachment atomic: roll back the comment if the upload fails.
      await comments.deleteComment(req.user.id, commentId).catch(() => {});
      throw err;
    }
  }
  const list = await comments.listComments(req.user.id, req.params.taskId);
  const created = list.find((c) => c.id === commentId);
  res.status(201).json({ comment: created });
});

export const remove = asyncHandler(async (req, res) => {
  await comments.deleteComment(req.user.id, req.params.id);
  res.json({ ok: true });
});

export const attachmentUrl = asyncHandler(async (req, res) => {
  const result = await attachments.getAttachmentSignedUrl(req.user.id, req.params.id);
  res.json(result);
});
