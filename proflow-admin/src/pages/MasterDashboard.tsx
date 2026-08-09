import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { masterApi } from '../api/masterClient';
import { useMasterAuth } from '../context/MasterAuthContext';
import { lerImagemComoBase64 } from '../lib/imagem';
import type { ArenaResumo } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Upload } from 'lucide-react';

interface ArenaDetalhe {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  telefone: string | null;
  whatsapp: string | null;
  instagram: string | null;
}

export function MasterDashboard() {
  const { logout, admin } = useMasterAuth();
  const [arenas, setArenas] = useState<ArenaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nomeArena, setNomeArena] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [criado, setCriado] = useState<{ email: string; senha: string; slug: string } | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const [editando, setEditando] = useState<ArenaDetalhe | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function carregarArenas() {
    setCarregando(true);
    try {
      const dados = await masterApi.get<ArenaResumo[]>('/master/arenas');
      setArenas(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar arenas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarArenas();
  }, []);

  async function handleSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>, aoLer: (b64: string) => void) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    try {
      const base64 = await lerImagemComoBase64(arquivo);
      aoLer(base64);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao processar imagem');
    }
  }

  async function handleCriarArena(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setCriado(null);
    try {
      const resp = await masterApi.post<{ arena: { slug: string }; usuario: { email: string } }>(
        '/master/arenas',
        { nomeArena, nomeUsuario, email, senha, logoUrl, telefone, whatsapp, instagram }
      );
      setCriado({ email: resp.usuario.email, senha, slug: resp.arena.slug });
      setNomeArena('');
      setNomeUsuario('');
      setEmail('');
      setSenha('');
      setLogoUrl('');
      setTelefone('');
      setWhatsapp('');
      setInstagram('');
      if (inputArquivoRef.current) inputArquivoRef.current.value = '';
      await carregarArenas();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar cliente');
    } finally {
      setSalvando(false);
    }
  }

  async function abrirEdicao(id: string) {
    setErro(null);
    try {
      const detalhe = await masterApi.get<ArenaDetalhe>(`/master/arenas/${id}`);
      setEditando(detalhe);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar arena');
    }
  }

  async function handleSalvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setSalvandoEdicao(true);
    setErro(null);
    try {
      await masterApi.patch(`/master/arenas/${editando.id}`, {
        logoUrl: editando.logoUrl,
        telefone: editando.telefone,
        whatsapp: editando.whatsapp,
        instagram: editando.instagram,
      });
      setEditando(null);
      await carregarArenas();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b-2 border-border bg-card px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-base font-extrabold tracking-tight">
          <span className="h-2 w-2 rounded-full bg-accent" />
          ProFlow Master
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair {admin ? `(${admin.email})` : ''}</span>
        </button>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastre um novo dono de arena e acompanhe os já existentes.</p>
        </div>

        {erro && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
        )}

        {criado && (
          <Card className="mb-6 border-primary">
            <CardContent className="pt-6">
              <p className="mb-2 text-sm font-semibold text-primary">Cliente criado! Passe esses dados pra ele:</p>
              <div className="overflow-x-auto rounded-md bg-secondary px-4 py-3 font-mono text-xs">
                <p>Link do painel: {window.location.origin}/login</p>
                <p>E-mail: {criado.email}</p>
                <p>Senha: {criado.senha}</p>
                <p>Link de agendamento: {window.location.origin}/agendar/{criado.slug}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Novo cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCriarArena}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acesso</p>
              <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Nome da arena</Label>
                  <Input value={nomeArena} onChange={(e) => setNomeArena(e.target.value)} placeholder="Ex: Arena Central" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Nome do dono</Label>
                  <Input value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>E-mail de login</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Senha inicial</Label>
                  <Input type="text" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
                </div>
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identidade e contato (opcional)</p>
              <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-3">
                    {logoUrl && <img src={logoUrl} alt="Prévia da logo" className="h-12 w-12 rounded-full border-2 border-border object-cover" />}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => inputArquivoRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="h-4 w-4" />
                      {logoUrl ? 'Trocar imagem' : 'Escolher do computador'}
                    </Button>
                    <input
                      ref={inputArquivoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSelecionarArquivo(e, setLogoUrl)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Telefone</Label>
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(84) 99999-9999" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>WhatsApp</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(84) 99999-9999" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Instagram</Label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@suaarena" />
                </div>
              </div>

              <Button type="submit" disabled={salvando}>
                {salvando ? 'Criando...' : 'Criar cliente'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {editando && (
          <Card className="mb-8 border-accent">
            <CardHeader>
              <CardTitle className="text-base">Editando: {editando.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvarEdicao}>
                <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-3">
                      {editando.logoUrl && (
                        <img src={editando.logoUrl} alt="Prévia da logo" className="h-12 w-12 rounded-full border-2 border-border object-cover" />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('arquivo-edicao')?.click()}
                        className="gap-1.5"
                      >
                        <Upload className="h-4 w-4" />
                        {editando.logoUrl ? 'Trocar imagem' : 'Escolher do computador'}
                      </Button>
                      <input
                        id="arquivo-edicao"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSelecionarArquivo(e, (b64) => setEditando((ed) => ed && { ...ed, logoUrl: b64 }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Telefone</Label>
                    <Input value={editando.telefone ?? ''} onChange={(e) => setEditando({ ...editando, telefone: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>WhatsApp</Label>
                    <Input value={editando.whatsapp ?? ''} onChange={(e) => setEditando({ ...editando, whatsapp: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Instagram</Label>
                    <Input value={editando.instagram ?? ''} onChange={(e) => setEditando({ ...editando, instagram: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={salvandoEdicao}>
                    {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditando(null)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="mb-3 text-sm font-semibold">Arenas cadastradas</p>

        {carregando ? (
          <div className="rounded-lg border-2 border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : arenas.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arena</TableHead>
                    <TableHead>Dono</TableHead>
                    <TableHead>Quadras</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arenas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell>{a.donoNome ?? '—'} {a.donoEmail ? `(${a.donoEmail})` : ''}</TableCell>
                      <TableCell>{a.totalQuadras}</TableCell>
                      <TableCell className="font-mono text-xs">/agendar/{a.slug}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => abrirEdicao(a.id)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
