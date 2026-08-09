import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../api/client';
import type { Quadra, Reserva } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function primeiroDiaDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function ultimoDiaDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(dataIso: string) {
  return new Date(dataIso.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
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

export function Reservas() {
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [reservasDoMes, setReservasDoMes] = useState<Reserva[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    quadraId: '',
    data: hoje(),
    horaInicio: '19:00',
    horaFim: '20:00',
    valor: '',
    jogadorNome: '',
    jogadorTelefone: '',
  });

  useEffect(() => {
    api.get<Quadra[]>('/quadras').then((qs) => {
      setQuadras(qs);
      if (qs.length > 0) setForm((f) => ({ ...f, quadraId: qs[0].id }));
    });
  }, []);

  async function carregarMovimentacaoDoMes() {
    setCarregandoLista(true);
    try {
      const rs = await api.get<Reserva[]>(
        `/reservas?inicio=${primeiroDiaDoMes()}&fim=${ultimoDiaDoMes()}`
      );
      setReservasDoMes(rs);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar reservas');
    } finally {
      setCarregandoLista(false);
    }
  }

  useEffect(() => {
    carregarMovimentacaoDoMes();
  }, []);

  async function handleCriarReserva(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await api.post('/reservas', {
        ...form,
        valor: Number(form.valor),
      });
      setForm((f) => ({ ...f, jogadorNome: '', jogadorTelefone: '', valor: '' }));
      await carregarMovimentacaoDoMes();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar reserva');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarPagamento(id: string) {
    try {
      await api.patch(`/reservas/${id}/confirmar`);
      setReservasDoMes((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'CONFIRMADO' } : r)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao confirmar');
    }
  }

  async function cancelarReserva(id: string) {
    if (!confirm('Cancelar essa reserva?')) return;
    try {
      await api.patch(`/reservas/${id}/cancelar`);
      setReservasDoMes((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'CANCELADO' } : r)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  }

  return (
    <Layout>
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Reservas</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre uma reserva manual — por exemplo, quando o jogador liga ou manda mensagem em vez de reservar pelo link.
        </p>
      </div>

      {erro && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleCriarReserva}>
            <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>Quadra</Label>
                <Select value={form.quadraId} onValueChange={(v) => setForm({ ...form, quadraId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {quadras.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Hora início</Label>
                <Input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Hora fim</Label>
                <Input type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} required />
              </div>
              <div />
              <div className="flex flex-col gap-1.5">
                <Label>Nome do jogador</Label>
                <Input value={form.jogadorNome} onChange={(e) => setForm({ ...form, jogadorNome: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Telefone</Label>
                <Input value={form.jogadorTelefone} onChange={(e) => setForm({ ...form, jogadorTelefone: e.target.value })} required />
              </div>
            </div>
            <Button type="submit" disabled={salvando || !form.quadraId}>
              {salvando ? 'Salvando...' : 'Criar reserva'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mb-3 text-sm font-semibold">Movimentação deste mês</p>

      {carregandoLista ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : reservasDoMes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Nenhuma reserva neste mês ainda.
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Quadra</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservasDoMes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{formatarData(r.data)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.horaInicio} – {r.horaFim}</TableCell>
                  <TableCell>{r.quadra?.nome ?? '—'}</TableCell>
                  <TableCell>{r.jogadorNome} · {r.jogadorTelefone}</TableCell>
                  <TableCell>R$ {Number(r.valor).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                  <TableCell>
                    {r.status === 'PENDENTE_PAGAMENTO' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => confirmarPagamento(r.id)}>Confirmar</Button>
                        <Button size="sm" variant="destructive" onClick={() => cancelarReserva(r.id)}>Cancelar</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Layout>
  );
}
