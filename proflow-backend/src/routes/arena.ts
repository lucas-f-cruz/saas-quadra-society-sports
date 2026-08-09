import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(autenticar);

const CAMPOS_ARENA = {
  id: true,
  nome: true,
  slug: true,
  logoUrl: true,
  telefone: true,
  whatsapp: true,
  instagram: true,
  chavePix: true,
  cidadePix: true,
  tipoPagamento: true,
} as const;

// O dono só consegue LER logo/contato aqui (pra ver como está configurado) —
// quem edita identidade/contato é o admin master, pela área /master.
router.get('/', async (req: AuthRequest, res) => {
  const arena = await prisma.arena.findUnique({
    where: { id: req.arenaId },
    select: CAMPOS_ARENA,
  });
  if (!arena) return res.status(404).json({ erro: 'Arena não encontrada' });
  res.json(arena);
});

const configSchema = z.object({
  chavePix: z.string().min(1).optional(),
  cidadePix: z.string().min(1).optional(),
  tipoPagamento: z.enum(['CINQUENTA_ANTES', 'CEM_ANTES', 'SEM_ANTECIPACAO']).optional(),
});

router.patch('/', async (req: AuthRequest, res) => {
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const arena = await prisma.arena.update({
    where: { id: req.arenaId },
    data: parsed.data,
    select: CAMPOS_ARENA,
  });

  res.json(arena);
});

export default router;
