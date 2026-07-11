import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((token, u) => {
    if (token) localStorage.setItem('token', token);
    setUser(u);
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (credentials) => {
      const { token, user: u } = await authApi.login(credentials);
      setSession(token, u);
      return u;
    },
    [setSession]
  );

  const register = useCallback(
    async (payload) => {
      const { token, user: u } = await authApi.register(payload);
      setSession(token, u);
      return u;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* stateless — ignore network errors on logout */
    }
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, refresh: loadUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
