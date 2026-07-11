import { apiFetch } from './client.js';

export const authApi = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
  changePassword: (body) => apiFetch('/auth/change-password', { method: 'POST', body }),
  forgotPassword: (body) => apiFetch('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body) => apiFetch('/auth/reset-password', { method: 'POST', body }),
};
