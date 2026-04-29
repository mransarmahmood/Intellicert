import { create } from 'zustand';
import { api, clearToken, getToken, setToken } from './api';

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'superadmin';
  email_verified: boolean;
};

type State = {
  user: AuthUser | null;
  loading: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<State>((set) => ({
  user: null,
  loading: true,
  bootstrap: async () => {
    if (!getToken()) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const res = await api<{ user: AuthUser }>('/auth/me');
      set({ user: res.user, loading: false });
    } catch {
      clearToken();
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.user.role !== 'superadmin' && res.user.role !== 'admin') {
      throw new Error('Admin access required');
    }
    setToken(res.token);
    set({ user: res.user });
  },
  logout: async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearToken();
    set({ user: null });
  },
}));
