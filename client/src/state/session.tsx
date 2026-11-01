import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, setAuthToken } from '../services/api';
import { KEYS, storage } from '../services/storage';
import { User } from '../types';

export interface SessionUser extends User {
  driver?: any;
}

interface SessionCtx {
  user: SessionUser | null;
  signIn: (phone: string, password: string) => Promise<SessionUser>;
  signUp: (data: { fullName: string; phoneNumber: string; password: string }) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  restore: () => Promise<SessionUser | null>;
  setBalance: (balance: number) => void;
}

const Ctx = createContext<SessionCtx | null>(null);

/** Normalises both login payloads (camelCase) and profile payloads (snake_case). */
export function normalizeUser(raw: any): SessionUser {
  return {
    id: raw.id,
    fullName: raw.fullName ?? raw.full_name ?? '',
    phoneNumber: raw.phoneNumber ?? raw.phone_number ?? '',
    email: raw.email ?? undefined,
    role: raw.role,
    walletBalance: Number(raw.walletBalance ?? raw.wallet_balance ?? 0),
    driver: raw.driver ?? null,
  };
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);

  const persist = async (token: string, u: SessionUser) => {
    setAuthToken(token);
    await storage.set(KEYS.token, token);
    await storage.set(KEYS.user, JSON.stringify(u));
    setUser(u);
  };

  const signIn = useCallback(async (phone: string, password: string) => {
    const res = await api.login(phone, password);
    const u = normalizeUser(res.user);
    await persist(res.token, u);
    return u;
  }, []);

  const signUp = useCallback(async (data: { fullName: string; phoneNumber: string; password: string }) => {
    const res = await api.register({ ...data, role: 'passenger' });
    const u = normalizeUser({ ...res.user, walletBalance: 0 });
    await persist(res.token, u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await storage.remove(KEYS.token);
    await storage.remove(KEYS.user);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      const u = normalizeUser(profile);
      setUser(prev => ({ ...(prev || u), ...u, driver: u.driver ?? prev?.driver }));
      await storage.set(KEYS.user, JSON.stringify(u));
    } catch {
      // keep cached user when offline
    }
  }, []);

  const restore = useCallback(async () => {
    const token = await storage.get(KEYS.token);
    const cached = await storage.get(KEYS.user);
    if (!token || !cached) return null;
    setAuthToken(token);
    try {
      const u = JSON.parse(cached) as SessionUser;
      setUser(u);
      return u;
    } catch {
      return null;
    }
  }, []);

  const setBalance = useCallback((balance: number) => {
    setUser(prev => (prev ? { ...prev, walletBalance: balance } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signUp, signOut, refresh, restore, setBalance }),
    [user, signIn, signUp, signOut, refresh, restore, setBalance]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useSession = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession must be used within SessionProvider');
  return c;
};
