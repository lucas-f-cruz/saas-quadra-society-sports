import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { gerarSlots, calcularStatusDia } from '../lib/agenda';
import { gerarPayloadPix } from '../lib/pix';

const router = Router();

// Dados da arena + lista de quadras, pra montar a página de agendamento a partir do slug.
router.get('/arenas/:slug', async (req, res) => {
  const arena = await prisma.arena.findUnique({
    where: { slug: req.params.slug },
    include: { quadras: { select: { id: true, nome: true, tipo: true } } },
  });

  if (!arena) return res.status(404).json({ erro: 'Arena não encontrada' });

  res.json({
    id: arena.id,
    nome: arena.nome,
    slug: arena.slug,
    quadras: arena.quadras,
    logoUrl: arena.logoUrl,
    telefone: arena.telefone,
    whatsapp: arena.whatsapp,
    instagram: arena.instagram,
    aceitaPagamento: !!arena.chavePix && arena.tipoPagamento !== 'SEM_ANTECIPACAO',
    tipoPagamento: arena.tipoPagamento,
  });
});

// Horários de um dia: cada um marcado como livre ou ocupado, com preço.
router.get('/quadras/:quadraId/agenda', async (req, res) => {
  const { data } = req.query;
  if (typeof data !== 'string') {
    return res.status(400).json({ erro: 'Informe a data (ex: ?data=2026-08-15)' });
  }

  const quadra = await prisma.quadra.findUnique({
    where: { id: req.params.quadraId },
    include: { regrasPreco: true },
  });
  if (!quadra) return res.status(404).json({ erro: 'Quadra não encontrada' });

  const slots = gerarSlots(
    quadra.regrasPreco.map((r: { periodo: string; horaInicio: string; horaFim: string; duracaoMinutos: number; preco: unknown }) => ({
      periodo: r.periodo,
      horaInicio: r.horaInicio,
      horaFim: r.horaFim,
      duracaoMinutos: r.duracaoMinutos,
      preco: Number(r.preco),
    }))
  );

  const reservas = await prisma.reserva.findMany({
    where: { quadraId: req.params.quadraId, data: new Date(data), status: { not: 'CANCELADO' } },
    select: { horaInicio: true, status: true },
  });
  const ocupados = new Map(reservas.map((r: { horaInicio: string; status: string }) => [r.horaInicio, r.status]));

  res.json(
    slots.map((slot) => ({
      ...slot,
      disponivel: !ocupados.has(slot.horaInicio),
      status: ocupados.get(slot.horaInicio) ?? null,
    }))
  );
});

// Status de cada dia do mês (disponível / lotado / sem horário configurado),
// pra colorir o calendário na página pública sem precisar buscar dia a dia.
router.get('/quadras/:quadraId/disponibilidade', async (req, res) => {
  const { ano, mes } = req.query;
  if (typeof ano !== 'string' || typeof mes !== 'string') {
    return res.status(400).json({ erro: 'Informe ano e mes (ex: ?ano=2026&mes=8)' });
  }

  const quadra = await prisma.quadra.findUnique({
    where: { id: req.params.quadraId },
    include: { regrasPreco: true },
  });
  if (!quadra) return res.status(404).json({ erro: 'Quadra não encontrada' });

  const totalSlots = gerarSlots(
    quadra.regrasPreco.map(
      (r: { periodo: string; horaInicio: string; horaFim: string; duracaoMinutos: number; preco: unknown }) => ({
        periodo: r.periodo,
        horaInicio: r.horaInicio,
        horaFim: r.horaFim,
        duracaoMinutos: r.duracaoMinutos,
        preco: Number(r.preco),
      })
    )
  ).length;

  const anoNum = Number(ano);
  const mesNum = Number(mes); // 1-12
  const inicioMes = new Date(Date.UTC(anoNum, mesNum - 1, 1));
  const fimMes = new Date(Date.UTC(anoNum, mesNum, 1));

  const reservas = await prisma.reserva.findMany({
    where: {
      quadraId: req.params.quadraId,
      status: { not: 'CANCELADO' },
      data: { gte: inicioMes, lt: fimMes },
    },
    select: { data: true },
  });

  const ocupadosPorDia = new Map<string, number>();
  for (const r of reservas as { data: Date }[]) {
    const chave = r.data.toISOString().slice(0, 10);
    ocupadosPorDia.set(chave, (ocupadosPorDia.get(chave) ?? 0) + 1);
  }

  const diasNoMes = new Date(Date.UTC(anoNum, mesNum, 0)).getUTCDate();
  const dias = Array.from({ length: diasNoMes }, (_, i) => {
    const dia = String(i + 1).padStart(2, '0');
    const mesStr = String(mesNum).padStart(2, '0');
    const chave = `${anoNum}-${mesStr}-${dia}`;
    return {
      dia: chave,
      status: calcularStatusDia(totalSlots, ocupadosPorDia.get(chave) ?? 0),
    };
  });

  res.json(dias);
});

const reservaPublicaSchema = z.object({
  quadraId: z.string(),
  data: z.string(),
  horaInicio: z.string(),
  horaFim: z.string(),
  valor: z.number().positive(),
  jogadorNome: z.string().min(1),
  jogadorTelefone: z.string().min(8),
  jogadorEmail: z.string().email(),
});

// Criação da reserva pelo próprio jogador — sempre nasce PENDENTE_PAGAMENTO,
// já que o pagamento (Pix) é confirmado depois pelo dono da arena no painel.
// Se a arena já tiver chave Pix cadastrada, devolve o código Pix pronto pra pagar.
router.post('/reservas', async (req, res) => {
  const parsed = reservaPublicaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const quadra = await prisma.quadra.findUnique({
    where: { id: parsed.data.quadraId },
    include: { arena: true },
  });
  if (!quadra) return res.status(404).json({ erro: 'Quadra não encontrada' });

  try {
    const reserva = await prisma.reserva.create({
      data: {
        ...parsed.data,
        data: new Date(parsed.data.data),
        status: 'PENDENTE_PAGAMENTO',
      },
    });

    const { arena } = quadra;
    let pagamento = null;

    if (arena.chavePix && arena.tipoPagamento !== 'SEM_ANTECIPACAO') {
      const percentual = arena.tipoPagamento === 'CINQUENTA_ANTES' ? 0.5 : 1;
      const valorAPagar = Number((parsed.data.valor * percentual).toFixed(2));

      pagamento = {
        tipo: arena.tipoPagamento,
        valorAPagar,
        chavePix: arena.chavePix,
        payload: gerarPayloadPix({
          chave: arena.chavePix,
          nomeRecebedor: arena.nome,
          cidade: arena.cidadePix ?? 'BRASIL',
          valor: valorAPagar,
          identificador: reserva.id.slice(0, 20),
        }),
      };
    }

    res.status(201).json({ reserva, pagamento });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ erro: 'Esse horário acabou de ser reservado por outra pessoa' });
    }
    throw err;
  }
});

export default router;
