import { apiFetch } from './client.js';

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return s ? `?${s}` : '';
};

export const projectsApi = {
  list: (params) => apiFetch(`/projects${qs(params)}`),
  create: (body) => apiFetch('/projects', { method: 'POST', body }),
  get: (id) => apiFetch(`/projects/${id}`),
  update: (id, body) => apiFetch(`/projects/${id}`, { method: 'PATCH', body }),
  remove: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
  logs: (id) => apiFetch(`/projects/${id}/logs`),
  addCollaborator: (id, email) =>
    apiFetch(`/projects/${id}/collaborators`, { method: 'POST', body: { email } }),
  removeCollaborator: (id, userId) =>
    apiFetch(`/projects/${id}/collaborators/${userId}`, { method: 'DELETE' }),
};
