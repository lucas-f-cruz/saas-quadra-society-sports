import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(autenticar);

const quadraSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
});

// Lista apenas as quadras da arena do usuário logado
router.get('/', async (req: AuthRequest, res) => {
  const quadras = await prisma.quadra.findMany({
    where: { arenaId: req.arenaId },
    include: { regrasPreco: true },
  });
  res.json(quadras);
});

router.post('/', async (req: AuthRequest, res) => {
  const parsed = quadraSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const quadra = await prisma.quadra.create({
    data: { ...parsed.data, arenaId: req.arenaId as string },
  });

  res.status(201).json(quadra);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const parsed = quadraSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  // Garante que a quadra pertence à arena do usuário antes de editar
  const quadra = await prisma.quadra.findFirst({
    where: { id: req.params.id, arenaId: req.arenaId },
  });
  if (!quadra) return res.status(404).json({ erro: 'Quadra não encontrada' });

  const atualizada = await prisma.quadra.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  res.json(atualizada);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const quadra = await prisma.quadra.findFirst({
    where: { id: req.params.id, arenaId: req.arenaId },
  });
  if (!quadra) return res.status(404).json({ erro: 'Quadra não encontrada' });

  await prisma.quadra.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
