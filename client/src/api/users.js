import { apiFetch } from './client.js';

export const usersApi = {
  search: (query) => apiFetch(`/users${query ? `?query=${encodeURIComponent(query)}` : ''}`),
};
