import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(autenticar);

const reservaSchema = z.object({
  quadraId: z.string(),
  data: z.string(), // "2026-08-15"
  horaInicio: z.string(), // "19:00"
  horaFim: z.string(),
  valor: z.number().positive(),
  jogadorNome: z.string().min(1),
  jogadorTelefone: z.string().min(8),
  jogadorEmail: z.string().email().optional(),
});

async function quadraPertenceAArena(quadraId: string, arenaId: string) {
  const quadra = await prisma.quadra.findFirst({ where: { id: quadraId, arenaId } });
  return !!quadra;
}

// Lista todas as reservas da arena (todas as quadras) num intervalo de datas —
// usada pra mostrar a movimentação do mês inteiro sem precisar escolher um dia.
router.get('/', async (req: AuthRequest, res) => {
  const { inicio, fim } = req.query;
  if (typeof inicio !== 'string' || typeof fim !== 'string') {
    return res.status(400).json({ erro: 'Informe inicio e fim (ex: ?inicio=2026-08-01&fim=2026-08-31)' });
  }

  const reservas = await prisma.reserva.findMany({
    where: {
      quadra: { arenaId: req.arenaId },
      data: { gte: new Date(inicio), lte: new Date(fim) },
    },
    include: { quadra: { select: { nome: true } } },
    orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
  });

  res.json(reservas);
});

// Agenda de uma quadra num dia específico — usado no dashboard do painel
router.get('/agenda/:quadraId', async (req: AuthRequest, res) => {
  const { data } = req.query;
  if (typeof data !== 'string') {
    return res.status(400).json({ erro: 'Informe a data (ex: ?data=2026-08-15)' });
  }

  const pertence = await quadraPertenceAArena(req.params.quadraId, req.arenaId as string);
  if (!pertence) return res.status(404).json({ erro: 'Quadra não encontrada' });

  const reservas = await prisma.reserva.findMany({
    where: {
      quadraId: req.params.quadraId,
      data: new Date(data),
      status: { not: 'CANCELADO' },
    },
    orderBy: { horaInicio: 'asc' },
  });

  res.json(reservas);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = reservaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const pertence = await quadraPertenceAArena(parsed.data.quadraId, req.arenaId as string);
  if (!pertence) return res.status(404).json({ erro: 'Quadra não encontrada' });

  try {
    const reserva = await prisma.reserva.create({
      data: {
        ...parsed.data,
        data: new Date(parsed.data.data),
        status: 'PENDENTE_PAGAMENTO',
      },
    });
    res.status(201).json(reserva);
  } catch (err) {
    // Constraint @@unique([quadraId, data, horaInicio]) barra choque de horário
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ erro: 'Esse horário já está reservado' });
    }
    throw err;
  }
});

router.patch('/:id/confirmar', async (req: AuthRequest, res) => {
  const reserva = await prisma.reserva.findUnique({ where: { id: req.params.id } });
  if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada' });

  const pertence = await quadraPertenceAArena(reserva.quadraId, req.arenaId as string);
  if (!pertence) return res.status(404).json({ erro: 'Reserva não encontrada' });

  const atualizada = await prisma.reserva.update({
    where: { id: req.params.id },
    data: { status: 'CONFIRMADO' },
  });

  res.json(atualizada);
});

router.patch('/:id/cancelar', async (req: AuthRequest, res) => {
  const reserva = await prisma.reserva.findUnique({ where: { id: req.params.id } });
  if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada' });

  const pertence = await quadraPertenceAArena(reserva.quadraId, req.arenaId as string);
  if (!pertence) return res.status(404).json({ erro: 'Reserva não encontrada' });

  const atualizada = await prisma.reserva.update({
    where: { id: req.params.id },
    data: { status: 'CANCELADO' },
  });

  res.json(atualizada);
});

export default router;
