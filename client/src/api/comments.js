import { apiFetch } from './client.js';

export const commentsApi = {
  list: (taskId) => apiFetch(`/tasks/${taskId}/comments`),
  create: (taskId, { message, file }) => {
    const fd = new FormData();
    fd.append('message', message);
    if (file) fd.append('file', file);
    return apiFetch(`/tasks/${taskId}/comments`, { method: 'POST', body: fd });
  },
  remove: (commentId) => apiFetch(`/comments/${commentId}`, { method: 'DELETE' }),
  attachmentUrl: (attachmentId) => apiFetch(`/attachments/${attachmentId}/url`),
};
