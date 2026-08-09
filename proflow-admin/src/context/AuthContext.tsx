import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { Usuario } from '../types';

interface SignupInput {
  nomeArena: string;
  nomeUsuario: string;
  email: string;
  senha: string;
}

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  signup: (dados: SignupInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem('proflow_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [carregando, setCarregando] = useState(false);

  async function login(email: string, senha: string) {
    setCarregando(true);
    try {
      const resp = await api.post<{ token: string; usuario: Usuario }>(
        '/auth/login',
        { email, senha },
        { skipAuth: true }
      );
      localStorage.setItem('proflow_token', resp.token);
      localStorage.setItem('proflow_usuario', JSON.stringify(resp.usuario));
      setUsuario(resp.usuario);
    } finally {
      setCarregando(false);
    }
  }

  async function signup(dados: SignupInput) {
    setCarregando(true);
    try {
      const resp = await api.post<{ token: string; usuario: Usuario }>(
        '/auth/signup',
        dados,
        { skipAuth: true }
      );
      localStorage.setItem('proflow_token', resp.token);
      localStorage.setItem('proflow_usuario', JSON.stringify(resp.usuario));
      setUsuario(resp.usuario);
    } finally {
      setCarregando(false);
    }
  }

  function logout() {
    localStorage.removeItem('proflow_token');
    localStorage.removeItem('proflow_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
