import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(autenticar);

const regraSchema = z.object({
  quadraId: z.string(),
  periodo: z.enum(['MANHA', 'TARDE', 'NOITE']),
  horaInicio: z.string(),
  horaFim: z.string(),
  duracaoMinutos: z.number().int().refine((v) => v === 60 || v === 90, {
    message: 'duracaoMinutos deve ser 60 ou 90',
  }),
  preco: z.number().positive(),
});

// Confere que a quadra referenciada pertence à arena do usuário logado
async function quadraPertenceAArena(quadraId: string, arenaId: string) {
  const quadra = await prisma.quadra.findFirst({ where: { id: quadraId, arenaId } });
  return !!quadra;
}

router.post('/', async (req: AuthRequest, res) => {
  const parsed = regraSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const pertence = await quadraPertenceAArena(parsed.data.quadraId, req.arenaId as string);
  if (!pertence) return res.status(404).json({ erro: 'Quadra não encontrada' });

  const regra = await prisma.regraPreco.create({ data: parsed.data });
  res.status(201).json(regra);
});

router.get('/quadra/:quadraId', async (req: AuthRequest, res) => {
  const pertence = await quadraPertenceAArena(req.params.quadraId, req.arenaId as string);
  if (!pertence) return res.status(404).json({ erro: 'Quadra não encontrada' });

  const regras = await prisma.regraPreco.findMany({ where: { quadraId: req.params.quadraId } });
  res.json(regras);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const regra = await prisma.regraPreco.findUnique({ where: { id: req.params.id } });
  if (!regra) return res.status(404).json({ erro: 'Regra não encontrada' });

  const pertence = await quadraPertenceAArena(regra.quadraId, req.arenaId as string);
  if (!pertence) return res.status(404).json({ erro: 'Regra não encontrada' });

  await prisma.regraPreco.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
