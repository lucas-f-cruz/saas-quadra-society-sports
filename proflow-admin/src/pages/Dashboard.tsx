import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../api/client';
import type { Quadra, Reserva } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<Reserva['status'], string> = {
  PENDENTE_PAGAMENTO: 'Aguardando pagamento',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
};

const STATUS_VARIANT: Record<Reserva['status'], 'pending' | 'success' | 'destructive'> = {
  PENDENTE_PAGAMENTO: 'pending',
  CONFIRMADO: 'success',
  CANCELADO: 'destructive',
};

export function Dashboard() {
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [quadraId, setQuadraId] = useState<string>('');
  const [data, setData] = useState(hoje());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<Quadra[]>('/quadras').then((qs) => {
      setQuadras(qs);
      if (qs.length > 0) setQuadraId(qs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!quadraId) return;
    setCarregando(true);
    setErro(null);
    api
      .get<Reserva[]>(`/reservas/agenda/${quadraId}?data=${data}`)
      .then(setReservas)
      .catch((err) => setErro(err instanceof Error ? err.message : 'Erro ao carregar agenda'))
      .finally(() => setCarregando(false));
  }, [quadraId, data]);

  async function confirmarPagamento(id: string) {
    try {
      await api.patch(`/reservas/${id}/confirmar`);
      setReservas((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'CONFIRMADO' } : r)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao confirmar');
    }
  }

  async function cancelarReserva(id: string) {
    if (!confirm('Cancelar essa reserva?')) return;
    try {
      await api.patch(`/reservas/${id}/cancelar`);
      setReservas((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'CANCELADO' } : r)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  }

  const quadraAtual = quadras.find((q) => q.id === quadraId);

  return (
    <Layout>
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">Horários reservados na quadra selecionada.</p>
      </div>

      {erro && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex min-w-[200px] flex-col gap-1.5">
          <Label>Quadra</Label>
          <Select value={quadraId} onValueChange={setQuadraId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {quadras.map((q) => (
                <SelectItem key={q.id} value={q.id}>{q.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Data</Label>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-44" />
        </div>
      </div>

      {quadras.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Cadastre uma quadra primeiro para ver a agenda.
        </div>
      ) : carregando ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Carregando agenda...
        </div>
      ) : reservas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Nenhuma reserva para esse dia{quadraAtual ? ` na ${quadraAtual.nome}` : ''}.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reservas.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm"
            >
              <div>
                <div className="font-mono text-sm font-semibold">{r.horaInicio} – {r.horaFim}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {r.jogadorNome} · {r.jogadorTelefone} · R$ {Number(r.valor).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                {r.status === 'PENDENTE_PAGAMENTO' && (
                  <>
                    <Button size="sm" onClick={() => confirmarPagamento(r.id)}>Confirmar</Button>
                    <Button size="sm" variant="destructive" onClick={() => cancelarReserva(r.id)}>Cancelar</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
