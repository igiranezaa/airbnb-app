/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { useStore } from '../../../store/StoreContext';

const AUTH_STORAGE_KEY    = 'liston:is-authenticated';
const AUTH_EMAIL_KEY      = 'liston:user-email';
const AUTH_NAME_KEY       = 'liston:user-name';
const AUTH_ROLE_KEY       = 'liston:user-role';
const AUTH_ID_KEY         = 'liston:user-id';
const AUTH_VERIFIED_KEY   = 'liston:email-verified';
const TOKEN_KEY           = 'token';

export interface LoginError {
  message: string;
  locked?: boolean;
  lockedUntil?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  userEmail: string;
  userName: string;
  userRole: string;
  userId: string;
  emailVerified: boolean;
  login: (email: string, password: string) => Promise<true | LoginError>;
  register: (name: string, email: string, username: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: 'GUEST' | 'HOST') => Promise<boolean>;
  updateLocalName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { dispatch: storeDispatch } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) === 'true');
  const [userEmail, setUserEmail]   = useState(() => localStorage.getItem(AUTH_EMAIL_KEY) || '');
  const [userName, setUserName]     = useState(() => localStorage.getItem(AUTH_NAME_KEY) || '');
  const [userRole, setUserRole]     = useState(() => localStorage.getItem(AUTH_ROLE_KEY) || '');
  const [userId, setUserId]         = useState(() => localStorage.getItem(AUTH_ID_KEY) || '');
  const [emailVerified, setEmailVerified] = useState(() => localStorage.getItem(AUTH_VERIFIED_KEY) === 'true');

  const applyAuthUser = useCallback((user: { id?: string; name?: string; email?: string; role?: string; emailVerified?: boolean }) => {
    const resolvedEmail    = user.email ?? '';
    const resolvedName     = user.name ?? resolvedEmail;
    const resolvedRole     = user.role ?? '';
    const resolvedId       = user.id ?? '';
    const resolvedVerified = user.emailVerified ?? false;

    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    localStorage.setItem(AUTH_EMAIL_KEY, resolvedEmail);
    localStorage.setItem(AUTH_NAME_KEY, resolvedName);
    localStorage.setItem(AUTH_ROLE_KEY, resolvedRole);
    localStorage.setItem(AUTH_ID_KEY, resolvedId);
    localStorage.setItem(AUTH_VERIFIED_KEY, String(resolvedVerified));
    setUserEmail(resolvedEmail);
    setUserName(resolvedName);
    setUserRole(resolvedRole);
    setUserId(resolvedId);
    setEmailVerified(resolvedVerified);
    setIsAuthenticated(true);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_NAME_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_ID_KEY);
    localStorage.removeItem(AUTH_VERIFIED_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUserEmail('');
    setUserName('');
    setUserRole('');
    setUserId('');
    setEmailVerified(false);
    setIsAuthenticated(false);
    storeDispatch({ type: 'RESET' });
  }, [storeDispatch]);

  useEffect(() => {
    if (!import.meta.env.VITE_API_URL || !localStorage.getItem(TOKEN_KEY)) return;

    let cancelled = false;
    async function syncSession() {
      try {
        const { data: me } = await api.get<{ id?: string; name?: string; email?: string; role?: string; emailVerified?: boolean }>('/auth/me');
        if (cancelled) return;

        const previousRole = localStorage.getItem(AUTH_ROLE_KEY) || '';
        const previousId = localStorage.getItem(AUTH_ID_KEY) || '';
        applyAuthUser(me);
        if (previousRole !== (me.role ?? '') || previousId !== (me.id ?? '')) {
          queryClient.clear();
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          queryClient.clear();
        }
      }
    }

    syncSession();
    return () => {
      cancelled = true;
    };
  }, [applyAuthUser, clearAuth, queryClient]);

  async function login(email: string, password: string): Promise<true | LoginError> {
    if (import.meta.env.VITE_API_URL) {
      try {
        const { data: loginData } = await api.post<{ token?: string; accessToken?: string }>(
          '/auth/login',
          { email, password }
        );

        const token = loginData.token ?? loginData.accessToken ?? '';
        if (!token) return { message: 'Login failed.' };
        localStorage.setItem(TOKEN_KEY, token);

        const { data: me } = await api.get<{ id?: string; name?: string; email?: string; role?: string; emailVerified?: boolean }>('/auth/me');

        applyAuthUser({ ...me, email: me.email ?? email });
        queryClient.clear();
        return true;
      } catch (err: unknown) {
        localStorage.removeItem(TOKEN_KEY);
        const e = err as { response?: { status?: number; data?: { error?: string; lockedUntil?: string } } };
        const status = e?.response?.status;
        const data   = e?.response?.data;
        if (status === 423) {
          return { message: data?.error ?? 'Account locked.', locked: true, lockedUntil: data?.lockedUntil };
        }
        return { message: data?.error ?? 'Wrong email or password.' };
      }
    }

    // Dev fallback
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    localStorage.setItem(AUTH_EMAIL_KEY, email);
    localStorage.setItem(AUTH_NAME_KEY, email);
    setUserEmail(email);
    setUserName(email);
    setIsAuthenticated(true);
    return true;
  }

  async function register(name: string, email: string, username: string, password: string, role: string): Promise<boolean> {
    try {
      await api.post('/auth/register', { name, email, username, password, role });
      const result = await login(email, password);
      return result === true;
    } catch {
      return false;
    }
  }

  // FR-013: switch between GUEST and HOST without re-registration
  async function switchRole(role: 'GUEST' | 'HOST'): Promise<boolean> {
    try {
      const { data } = await api.patch<{ token?: string; role?: 'GUEST' | 'HOST' }>('/auth/switch-role', { role });
      if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
      const resolvedRole = data.role ?? role;
      localStorage.setItem(AUTH_ROLE_KEY, resolvedRole);
      setUserRole(resolvedRole);
      queryClient.clear();
      return true;
    } catch {
      return false;
    }
  }

  function updateLocalName(name: string) {
    localStorage.setItem(AUTH_NAME_KEY, name);
    setUserName(name);
  }

  function logout() {
    clearAuth();
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userName, userRole, userId, emailVerified, login, register, logout, switchRole, updateLocalName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
