import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../api/client';
import type { Quadra, RegraPreco } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PERIODOS = [
  { valor: 'MANHA', label: 'Manhã' },
  { valor: 'TARDE', label: 'Tarde' },
  { valor: 'NOITE', label: 'Noite' },
] as const;

export function Quadras() {
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nomeQuadra, setNomeQuadra] = useState('');
  const [tipoQuadra, setTipoQuadra] = useState('');
  const [salvandoQuadra, setSalvandoQuadra] = useState(false);

  const [quadraSelecionada, setQuadraSelecionada] = useState<string | null>(null);
  const [novaRegra, setNovaRegra] = useState({
    periodo: 'MANHA' as RegraPreco['periodo'],
    horaInicio: '08:00',
    horaFim: '13:00',
    duracaoMinutos: 60,
    preco: '',
  });
  const [salvandoRegra, setSalvandoRegra] = useState(false);

  async function carregarQuadras() {
    setCarregando(true);
    try {
      const dados = await api.get<Quadra[]>('/quadras');
      setQuadras(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar quadras');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarQuadras();
  }, []);

  async function handleCriarQuadra(e: FormEvent) {
    e.preventDefault();
    setSalvandoQuadra(true);
    setErro(null);
    try {
      await api.post('/quadras', { nome: nomeQuadra, tipo: tipoQuadra });
      setNomeQuadra('');
      setTipoQuadra('');
      await carregarQuadras();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar quadra');
    } finally {
      setSalvandoQuadra(false);
    }
  }

  async function handleExcluirQuadra(id: string) {
    if (!confirm('Excluir esta quadra? Essa ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/quadras/${id}`);
      await carregarQuadras();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir quadra');
    }
  }

  async function handleCriarRegra(e: FormEvent) {
    e.preventDefault();
    if (!quadraSelecionada) return;
    setSalvandoRegra(true);
    setErro(null);
    try {
      await api.post('/regras-preco', {
        quadraId: quadraSelecionada,
        periodo: novaRegra.periodo,
        horaInicio: novaRegra.horaInicio,
        horaFim: novaRegra.horaFim,
        duracaoMinutos: Number(novaRegra.duracaoMinutos),
        preco: Number(novaRegra.preco),
      });
      setNovaRegra({ periodo: 'MANHA', horaInicio: '08:00', horaFim: '13:00', duracaoMinutos: 60, preco: '' });
      await carregarQuadras();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar regra de preço');
    } finally {
      setSalvandoRegra(false);
    }
  }

  async function handleExcluirRegra(id: string) {
    try {
      await api.delete(`/regras-preco/${id}`);
      await carregarQuadras();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao excluir regra');
    }
  }

  return (
    <Layout>
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Quadras</h1>
        <p className="text-sm text-muted-foreground">Cadastre suas quadras e defina preços por período do dia.</p>
      </div>

      {erro && (
        <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleCriarQuadra}>
            <div className="mb-4 grid grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nomeQuadra">Nome da quadra</Label>
                <Input
                  id="nomeQuadra"
                  value={nomeQuadra}
                  onChange={(e) => setNomeQuadra(e.target.value)}
                  placeholder="Ex: Quadra 1"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tipoQuadra">Tipo</Label>
                <Input
                  id="tipoQuadra"
                  value={tipoQuadra}
                  onChange={(e) => setTipoQuadra(e.target.value)}
                  placeholder="Ex: society, beach tennis"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={salvandoQuadra}>
              {salvandoQuadra ? 'Salvando...' : 'Adicionar quadra'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {carregando ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Carregando quadras...
        </div>
      ) : quadras.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Nenhuma quadra cadastrada ainda. Adicione a primeira acima.
        </div>
      ) : (
        quadras.map((quadra) => (
          <Card className="mb-5" key={quadra.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">
                {quadra.nome}
                <span className="ml-2 text-sm font-normal text-muted-foreground">{quadra.tipo}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuadraSelecionada(quadraSelecionada === quadra.id ? null : quadra.id)}
                >
                  {quadraSelecionada === quadra.id ? 'Fechar' : 'Gerenciar preços'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleExcluirQuadra(quadra.id)}>
                  Excluir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {quadra.regrasPreco.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quadra.regrasPreco.map((regra) => (
                      <TableRow key={regra.id}>
                        <TableCell>{PERIODOS.find((p) => p.valor === regra.periodo)?.label}</TableCell>
                        <TableCell className="font-mono text-xs">{regra.horaInicio} – {regra.horaFim}</TableCell>
                        <TableCell>{regra.duracaoMinutos} min</TableCell>
                        <TableCell>R$ {Number(regra.preco).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => handleExcluirRegra(regra.id)}>
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {quadraSelecionada === quadra.id && (
                <form
                  onSubmit={handleCriarRegra}
                  className={quadra.regrasPreco.length > 0 ? 'mt-5 border-t border-border pt-5' : ''}
                >
                  <div className="mb-4 grid grid-cols-2 gap-3.5 md:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label>Período</Label>
                      <Select
                        value={novaRegra.periodo}
                        onValueChange={(v) => setNovaRegra({ ...novaRegra, periodo: v as RegraPreco['periodo'] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PERIODOS.map((p) => (
                            <SelectItem key={p.valor} value={p.valor}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Duração</Label>
                      <Select
                        value={String(novaRegra.duracaoMinutos)}
                        onValueChange={(v) => setNovaRegra({ ...novaRegra, duracaoMinutos: Number(v) })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="90">1h30</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={novaRegra.preco}
                        onChange={(e) => setNovaRegra({ ...novaRegra, preco: e.target.value })}
                        placeholder="120.00"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Hora início</Label>
                      <Input
                        type="time"
                        value={novaRegra.horaInicio}
                        onChange={(e) => setNovaRegra({ ...novaRegra, horaInicio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Hora fim</Label>
                      <Input
                        type="time"
                        value={novaRegra.horaFim}
                        onChange={(e) => setNovaRegra({ ...novaRegra, horaFim: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" disabled={salvandoRegra}>
                    {salvandoRegra ? 'Salvando...' : 'Adicionar regra de preço'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Layout>
  );
}
