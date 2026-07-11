import { apiFetch } from './client.js';

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return s ? `?${s}` : '';
};

export const tasksApi = {
  list: (projectId, params) => apiFetch(`/projects/${projectId}/tasks${qs(params)}`),
  create: (projectId, body) =>
    apiFetch(`/projects/${projectId}/tasks`, { method: 'POST', body }),
  get: (id) => apiFetch(`/tasks/${id}`),
  logs: (id) => apiFetch(`/tasks/${id}/logs`),
  update: (id, body) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body }),
  updateStatus: (id, status) =>
    apiFetch(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  remove: (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
};
