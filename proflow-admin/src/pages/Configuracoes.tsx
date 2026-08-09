import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../api/client';
import type { ArenaConfig } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Configuracoes() {
  const [arena, setArena] = useState<ArenaConfig | null>(null);
  const [chavePix, setChavePix] = useState('');
  const [cidadePix, setCidadePix] = useState('');
  const [tipoPagamento, setTipoPagamento] = useState<'CINQUENTA_ANTES' | 'CEM_ANTES' | 'SEM_ANTECIPACAO'>('SEM_ANTECIPACAO');

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    api
      .get<ArenaConfig>('/arena')
      .then((a) => {
        setArena(a);
        setChavePix(a.chavePix ?? '');
        setCidadePix(a.cidadePix ?? '');
        setTipoPagamento(a.tipoPagamento);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function handleSalvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    try {
      const atualizada = await api.patch<ArenaConfig>('/arena', { chavePix, cidadePix, tipoPagamento });
      setArena(atualizada);
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setSalvando(false);
    }
  }

  const linkPublico = arena ? `${window.location.origin}/agendar/${arena.slug}` : '';

  return (
    <Layout>
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados de pagamento e link público da sua arena.</p>
      </div>

      {carregando ? (
        <div className="rounded-lg border-2 border-dashed border-border py-14 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : (
        <>
          {arena && (
            <Card className="mb-5">
              <CardContent className="pt-6">
                <p className="mb-1.5 text-sm font-semibold">Link público de agendamento</p>
                <p className="mb-3 text-sm text-muted-foreground">Compartilhe esse link com seus clientes.</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input readOnly value={linkPublico} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(linkPublico)}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Logo, telefone, WhatsApp e Instagram são configurados pelo suporte antes de liberar seu acesso. Fale com quem te passou o login pra ajustar.
                </p>
              </CardContent>
            </Card>
          )}

          {erro && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
          )}
          {sucesso && (
            <div className="mb-4 rounded-md bg-secondary px-3 py-2 text-sm text-primary">
              Configurações salvas com sucesso.
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSalvar} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="chavePix">Chave Pix</Label>
                  <Input
                    id="chavePix"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cadastrando a chave, a página de agendamento passa a mostrar QR Code Pix pro jogador pagar na hora.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cidadePix">Cidade (usada no QR Code)</Label>
                  <Input
                    id="cidadePix"
                    value={cidadePix}
                    onChange={(e) => setCidadePix(e.target.value)}
                    placeholder="Ex: Ceará-Mirim"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Como cobrar o pagamento</Label>
                  <Select value={tipoPagamento} onValueChange={(v) => setTipoPagamento(v as typeof tipoPagamento)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEM_ANTECIPACAO">Pagamento presencial — não cobra nada antes</SelectItem>
                      <SelectItem value="CINQUENTA_ANTES">50% adiantado via Pix, 50% no local</SelectItem>
                      <SelectItem value="CEM_ANTES">100% adiantado via Pix, no momento da reserva</SelectItem>
                    </SelectContent>
                  </Select>
                  {tipoPagamento !== 'SEM_ANTECIPACAO' && !chavePix && (
                    <p className="text-xs text-destructive">Cadastre uma chave Pix acima pra esse modo funcionar.</p>
                  )}
                </div>

                <Button type="submit" disabled={salvando} className="mt-1 w-fit">
                  {salvando ? 'Salvando...' : 'Salvar configurações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </Layout>
  );
}
