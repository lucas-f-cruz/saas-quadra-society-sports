import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { MasterAdmin } from '../types';

interface MasterAuthContextValue {
  admin: MasterAdmin | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const MasterAuthContext = createContext<MasterAuthContextValue | undefined>(undefined);

export function MasterAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<MasterAdmin | null>(() => {
    const salvo = localStorage.getItem('proflow_master_admin');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [carregando, setCarregando] = useState(false);

  async function login(email: string, senha: string) {
    setCarregando(true);
    try {
      const resp = await api.post<{ token: string; admin: MasterAdmin }>(
        '/master/login',
        { email, senha },
        { skipAuth: true }
      );
      localStorage.setItem('proflow_master_token', resp.token);
      localStorage.setItem('proflow_master_admin', JSON.stringify(resp.admin));
      setAdmin(resp.admin);
    } finally {
      setCarregando(false);
    }
  }

  function logout() {
    localStorage.removeItem('proflow_master_token');
    localStorage.removeItem('proflow_master_admin');
    setAdmin(null);
  }

  return (
    <MasterAuthContext.Provider value={{ admin, carregando, login, logout }}>
      {children}
    </MasterAuthContext.Provider>
  );
}

export function useMasterAuth() {
  const ctx = useContext(MasterAuthContext);
  if (!ctx) throw new Error('useMasterAuth precisa estar dentro de MasterAuthProvider');
  return ctx;
}
