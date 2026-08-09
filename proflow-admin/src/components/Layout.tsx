import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, LayoutGrid, ListChecks, LogOut, Menu, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'Agenda', icon: CalendarDays, end: true },
  { to: '/quadras', label: 'Quadras', icon: LayoutGrid, end: false },
  { to: '/reservas', label: 'Reservas', icon: ListChecks, end: false },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, end: false },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, usuario } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Barra superior — só aparece no mobile */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2 text-base font-extrabold tracking-tight">
          <span className="h-2 w-2 rounded-full bg-primary" />
          ProFlow
        </div>
        <button
          onClick={() => setMenuAberto(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Fundo escurecido atrás do menu mobile aberto */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 border-r border-border bg-card p-4 transition-transform md:static md:z-auto md:w-56 md:translate-x-0',
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="h-2 w-2 rounded-full bg-primary" />
            ProFlow
          </div>
          <button
            onClick={() => setMenuAberto(false)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                  isActive && 'bg-secondary text-primary'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-auto flex items-center gap-2.5 border-t border-border px-3 pt-4 text-sm text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair {usuario ? `(${usuario.nome})` : ''}
        </button>
      </aside>

      <main className="flex-1 px-5 py-9 pt-20 md:px-10 md:pt-9">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
