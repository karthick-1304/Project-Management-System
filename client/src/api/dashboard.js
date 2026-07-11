import { apiFetch } from './client.js';

export const dashboardApi = {
  get: () => apiFetch('/dashboard'),
};
