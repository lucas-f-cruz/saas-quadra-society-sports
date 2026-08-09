import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function Login() {
  const { login, carregando } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            ProFlow
          </div>
          <p className="text-sm text-muted-foreground">Entre para gerenciar sua arena</p>
        </CardHeader>
        <CardContent>
          {erro && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={carregando} className="mt-1 w-full">
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
