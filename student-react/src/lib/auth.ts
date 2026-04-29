import { create } from 'zustand';
import { api, clearToken, getToken, setToken } from './api';
// Types come from the Laravel backend via spatie/laravel-typescript-transformer.
// Regenerate with `composer types` (or `php artisan typescript:transform`).
import type { User, Subscription as BackendSubscription, AuthResponse } from '../../../backend/resources/types/api-literals';

export type AuthUser = User;
export type Subscription = BackendSubscription | null;

type State = {
  user: AuthUser | null;
  subscription: Subscription;
  loading: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<State>((set) => ({
  user: null,
  subscription: null,
  loading: true,
  bootstrap: async () => {
    if (!getToken()) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const res = await api<AuthResponse>('/auth/me');
      set({ user: res.user, subscription: res.subscription, loading: false });
    } catch {
      clearToken();
      set({ user: null, loading: false });
    }
  },
  login: async (email, password) => {
    const res = await api<AuthResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    if (res.token) setToken(res.token);
    set({ user: res.user, subscription: res.subscription });
  },
  register: async (email, password, name) => {
    const res = await api<AuthResponse>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name }) }
    );
    if (res.token) setToken(res.token);
    set({ user: res.user, subscription: res.subscription });
  },
  logout: async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    clearToken();
    set({ user: null, subscription: null });
  },
}));
