import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ChevronLeft, ChevronRight, MessageCircle, Phone } from 'lucide-react';
import { api } from '../api/client';
import type { ArenaPublica, DisponibilidadeDia, PagamentoPix, SlotPublico } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function paraChaveData(d: Date) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function paraDataLocal(chave: string) {
  const [ano, mes, dia] = chave.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

const PERIODO_LABEL: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
};

export function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [arena, setArena] = useState<ArenaPublica | null>(null);
  const [quadraId, setQuadraId] = useState('');

  const [mesAtual, setMesAtual] = useState(() => new Date());
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia[]>([]);
  const [carregandoMes, setCarregandoMes] = useState(false);

  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<SlotPublico[]>([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState<SlotPublico | null>(null);
  const [dataConfirmada, setDataConfirmada] = useState<Date | null>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pagamento, setPagamento] = useState<PagamentoPix | null>(null);
  const [qrImagem, setQrImagem] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [carregandoArena, setCarregandoArena] = useState(true);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [logoQuebrada, setLogoQuebrada] = useState(false);

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!slug) return;
    api
      .get<ArenaPublica>(`/public/arenas/${slug}`, { skipAuth: true })
      .then((a) => {
        setArena(a);
        if (a.quadras.length > 0) setQuadraId(a.quadras[0].id);
      })
      .catch(() => setNaoEncontrada(true))
      .finally(() => setCarregandoArena(false));
  }, [slug]);

  function buscarDisponibilidade() {
    if (!quadraId) return;
    setCarregandoMes(true);
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth() + 1;
    api
      .get<DisponibilidadeDia[]>(`/public/quadras/${quadraId}/disponibilidade?ano=${ano}&mes=${mes}`, { skipAuth: true })
      .then(setDisponibilidade)
      .finally(() => setCarregandoMes(false));
  }

  useEffect(() => {
    buscarDisponibilidade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quadraId, mesAtual]);

  useEffect(() => {
    if (!quadraId || !dataSelecionada) {
      setSlots([]);
      return;
    }
    setCarregandoSlots(true);
    setSlotSelecionado(null);
    api
      .get<SlotPublico[]>(`/public/quadras/${quadraId}/agenda?data=${paraChaveData(dataSelecionada)}`, { skipAuth: true })
      .then(setSlots)
      .finally(() => setCarregandoSlots(false));
  }, [quadraId, dataSelecionada]);

  useEffect(() => {
    if (!pagamento) {
      setQrImagem(null);
      return;
    }
    QRCode.toDataURL(pagamento.payload, { width: 240, margin: 1 })
      .then(setQrImagem)
      .catch(() => setQrImagem(null));
  }, [pagamento]);

  const diasDisponiveis = disponibilidade.filter((d) => d.status === 'disponivel').map((d) => paraDataLocal(d.dia));
  const diasLotados = disponibilidade.filter((d) => d.status === 'lotado').map((d) => paraDataLocal(d.dia));

  function irParaMesAnterior() {
    setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function irParaProximoMes() {
    setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  const mesEhAtual = mesAtual.getFullYear() === hoje.getFullYear() && mesAtual.getMonth() === hoje.getMonth();

  async function handleReservar() {
    if (!slotSelecionado || !dataSelecionada) return;
    setEnviando(true);
    setErro(null);
    try {
      const resp = await api.post<{ pagamento: PagamentoPix | null }>(
        '/public/reservas',
        {
          quadraId,
          data: paraChaveData(dataSelecionada),
          horaInicio: slotSelecionado.horaInicio,
          horaFim: slotSelecionado.horaFim,
          valor: slotSelecionado.preco,
          jogadorNome: nome,
          jogadorEmail: email,
          jogadorTelefone: telefone,
        },
        { skipAuth: true }
      );
      setDataConfirmada(dataSelecionada);
      setPagamento(resp.pagamento);
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar a reserva');
    } finally {
      setEnviando(false);
    }
  }

  function handleVoltarParaCalendario() {
    setSucesso(false);
    setDataSelecionada(undefined);
    setSlotSelecionado(null);
    setDataConfirmada(null);
    setPagamento(null);
    setQrImagem(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setErro(null);
    setCopiado(false);
    buscarDisponibilidade();
  }

  function handleCopiarPix() {
    if (!pagamento) return;
    navigator.clipboard.writeText(pagamento.payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (carregandoArena) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (naoEncontrada || !arena) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Essa arena não foi encontrada. Confira o link e tente novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sucesso && slotSelecionado && dataConfirmada) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary text-xl">✓</div>
            <h1 className="mb-1 text-lg font-bold">Solicitação enviada!</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              {dataConfirmada.toLocaleDateString('pt-BR')} · {slotSelecionado.horaInicio} – {slotSelecionado.horaFim}
            </p>

            {pagamento ? (
              <div className="mb-5 rounded-lg border-2 border-border bg-muted/50 p-4 text-left">
                <p className="mb-3 text-center text-sm">
                  {pagamento.tipo === 'CINQUENTA_ANTES' ? (
                    <>Pague <strong>50% agora</strong> pra confirmar — o resto é pago no local.</>
                  ) : (
                    <>Pague o valor <strong>total agora</strong> pra confirmar sua reserva.</>
                  )}
                </p>
                <p className="mb-4 text-center text-2xl font-extrabold text-primary">
                  R$ {pagamento.valorAPagar.toFixed(2)}
                </p>
                {qrImagem && (
                  <img src={qrImagem} alt="QR Code Pix" className="mx-auto mb-4 h-48 w-48 rounded-md border border-border" />
                )}
                <Button type="button" variant="outline" className="w-full" onClick={handleCopiarPix}>
                  {copiado ? 'Código copiado!' : 'Copiar código Pix'}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Abra o app do seu banco, escolha Pix Copia e Cola ou escaneie o QR Code acima.
                </p>
              </div>
            ) : (
              <p className="mb-5 text-sm text-muted-foreground">
                Sua reserva está aguardando a confirmação do pagamento pela arena. Você será avisado por WhatsApp ou e-mail.
              </p>
            )}

            <Button type="button" variant="outline" className="w-full" onClick={handleVoltarParaCalendario}>
              OK
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{arena.nome}</h1>
            {(arena.whatsapp || arena.telefone || arena.instagram) && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {arena.whatsapp && (
                  <a
                    href={`https://wa.me/55${arena.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    title={`WhatsApp: ${arena.whatsapp}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-110"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                )}
                {arena.telefone && !arena.whatsapp && (
                  <span title={arena.telefone} className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                )}
                {arena.instagram && (
                  <a
                    href={`https://instagram.com/${arena.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    title={arena.instagram}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white transition-transform hover:scale-110"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
          {arena.quadras.length > 1 && (
            <Select value={quadraId} onValueChange={(v) => { setQuadraId(v); setDataSelecionada(undefined); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {arena.quadras.map((q) => (
                  <SelectItem key={q.id} value={q.id}>{q.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </header>

        {arena.quadras.length === 0 ? (
          <Card><CardContent className="pt-6 text-sm text-muted-foreground">Essa arena ainda não tem quadras cadastradas.</CardContent></Card>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
              {arena.logoUrl && !logoQuebrada ? (
                <img
                  src={arena.logoUrl}
                  alt={arena.nome}
                  className="hidden h-auto w-56 self-stretch rounded-lg border-2 border-border bg-card object-contain p-2 md:block"
                  onError={() => setLogoQuebrada(true)}
                />
              ) : (
                <span className="hidden w-56 items-center justify-center self-stretch rounded-lg border-2 border-border bg-secondary text-5xl font-bold text-primary md:flex">
                  {arena.nome.charAt(0).toUpperCase()}
                </span>
              )}

              <Card className="w-full self-start md:w-auto">
                <CardContent className="pt-4">
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  month={mesAtual}
                  onMonthChange={setMesAtual}
                  hideNavigation
                  disabled={{ before: hoje }}
                  modifiers={{ disponivel: diasDisponiveis, lotado: diasLotados }}
                  modifiersClassNames={{
                    disponivel: 'text-primary font-semibold [&>button]:bg-secondary',
                    lotado: 'text-destructive [&>button]:bg-destructive/10',
                  }}
                />
                <div className="flex items-center justify-center gap-3 px-3 pb-1">
                  <button
                    type="button"
                    onClick={irParaMesAnterior}
                    disabled={mesEhAtual}
                    aria-label="Mês anterior"
                    className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-border bg-card text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[110px] text-center text-xs font-medium text-muted-foreground">
                    {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={irParaProximoMes}
                    aria-label="Próximo mês"
                    className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-border bg-card text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 border-t-2 border-border px-3 pb-1 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-secondary" />Disponível</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive/10" />Lotado</span>
                </div>
                {carregandoMes && <p className="px-3 pb-2 text-xs text-muted-foreground">Atualizando calendário...</p>}
              </CardContent>
            </Card>
            </div>

            <div>
              {!dataSelecionada ? (
                <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
                  Escolha uma data no calendário para ver os horários.
                </div>
              ) : carregandoSlots ? (
                <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  Carregando horários...
                </div>
              ) : slots.length === 0 ? (
                <div className="flex h-full min-h-[180px] items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
                  Nenhum horário configurado para esse dia.
                </div>
              ) : (
                <>
                  <p className="mb-3 text-sm font-semibold">{dataSelecionada.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                    {slots.map((slot) => (
                      <button
                        key={slot.horaInicio}
                        disabled={!slot.disponivel}
                        onClick={() => setSlotSelecionado(slot)}
                        className={`flex flex-col items-start gap-1 rounded-lg border px-3.5 py-3 text-left transition-colors ${
                          !slot.disponivel
                            ? 'cursor-not-allowed border-2 border-border bg-muted opacity-50'
                            : slotSelecionado?.horaInicio === slot.horaInicio
                            ? 'border-primary bg-secondary'
                            : 'border-2 border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <span className="font-mono text-sm font-semibold">{slot.horaInicio}</span>
                        <span className="text-xs text-muted-foreground">{PERIODO_LABEL[slot.periodo]} · R$ {slot.preco.toFixed(2)}</span>
                        {!slot.disponivel && <Badge variant="destructive" className="mt-0.5">Ocupado</Badge>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {slotSelecionado && (
                <Card className="mt-5 max-w-md">
                  <CardHeader className="pb-3">
                    <p className="text-sm font-semibold">
                      {slotSelecionado.horaInicio} – {slotSelecionado.horaFim} · R$ {slotSelecionado.preco.toFixed(2)}
                    </p>
                    {arena.aceitaPagamento && (
                      <p className="text-xs text-muted-foreground">
                        {arena.tipoPagamento === 'CINQUENTA_ANTES'
                          ? `Pagamento de 50% via Pix na confirmação (R$ ${(slotSelecionado.preco * 0.5).toFixed(2)})`
                          : 'Pagamento total via Pix na confirmação'}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {erro && (
                      <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
                    )}
                    <div className="mb-4 flex flex-col gap-3.5">
                      <div className="flex flex-col gap-1.5">
                        <Label>Nome completo</Label>
                        <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>E-mail</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Telefone (WhatsApp)</Label>
                        <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="84 99999-9999" required />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={enviando || !nome || !email || !telefone}
                      onClick={handleReservar}
                    >
                      {enviando ? 'Enviando...' : 'Solicitar Agendamento'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}