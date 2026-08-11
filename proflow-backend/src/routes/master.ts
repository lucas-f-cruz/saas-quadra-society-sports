import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { gerarSlugUnico } from '../lib/slug';
import { autenticarMaster } from '../middleware/masterAuth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { email, senha } = parsed.data;

  const admin = await prisma.adminMaster.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ erro: 'E-mail ou senha incorretos' });

  const senhaValida = await bcrypt.compare(senha, admin.senhaHash);
  if (!senhaValida) return res.status(401).json({ erro: 'E-mail ou senha incorretos' });

  const token = jwt.sign({ adminId: admin.id, tipo: 'master' }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

router.use(autenticarMaster);

const CAMPOS_ARENA_DETALHE = {
  id: true,
  nome: true,
  slug: true,
  logoUrl: true,
  telefone: true,
  whatsapp: true,
  instagram: true,
  criadoEm: true,
} as const;

// Lista todas as arenas cadastradas, com contagem de quadras e usuários.
router.get('/arenas', async (_req, res) => {
  const arenas = await prisma.arena.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      _count: { select: { quadras: true, usuarios: true } },
      usuarios: { select: { email: true, nome: true }, take: 1 },
    },
  });

  res.json(
    arenas.map(
      (a: {
        id: string;
        nome: string;
        slug: string;
        criadoEm: Date;
        _count: { quadras: number; usuarios: number };
        usuarios: { email: string; nome: string }[];
      }) => ({
        id: a.id,
        nome: a.nome,
        slug: a.slug,
        criadoEm: a.criadoEm,
        totalQuadras: a._count.quadras,
        donoEmail: a.usuarios[0]?.email ?? null,
        donoNome: a.usuarios[0]?.nome ?? null,
      })
    )
  );
});

// Detalhe de uma arena — usado pra abrir o formulário de edição de identidade/contato.
router.get('/arenas/:id', async (req, res) => {
  const arena = await prisma.arena.findUnique({
    where: { id: req.params.id },
    select: CAMPOS_ARENA_DETALHE,
  });
  if (!arena) return res.status(404).json({ erro: 'Arena não encontrada' });
  res.json(arena);
});

const identidadeSchema = z.object({
  logoUrl: z.string().or(z.literal('')).optional(),
  telefone: z.string().or(z.literal('')).optional(),
  whatsapp: z.string().or(z.literal('')).optional(),
  instagram: z.string().or(z.literal('')).optional(),
});

// Atualiza logo/contato de uma arena já existente.
router.patch('/arenas/:id', async (req, res) => {
  const parsed = identidadeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const arena = await prisma.arena.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: CAMPOS_ARENA_DETALHE,
  });

  res.json(arena);
});

const novaArenaSchema = z.object({
  nomeArena: z.string().min(2),
  nomeUsuario: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  logoUrl: z.string().or(z.literal('')).optional(),
  telefone: z.string().or(z.literal('')).optional(),
  whatsapp: z.string().or(z.literal('')).optional(),
  instagram: z.string().or(z.literal('')).optional(),
});

// Cadastra um cliente novo (arena + primeiro usuário/dono) — o que antes era
// o /auth/signup público, agora só você consegue fazer.
router.post('/arenas', async (req, res) => {
  const parsed = novaArenaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { nomeArena, nomeUsuario, email, senha, logoUrl, telefone, whatsapp, instagram } = parsed.data;

  const emailExistente = await prisma.usuario.findUnique({ where: { email } });
  if (emailExistente) {
    return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail' });
  }

  const slug = await gerarSlugUnico(nomeArena);
  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    const { arena, usuario } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const arena = await tx.arena.create({
        data: { nome: nomeArena, slug, logoUrl, telefone, whatsapp, instagram },
      });
      const usuario = await tx.usuario.create({
        data: { nome: nomeUsuario, email, senhaHash, arenaId: arena.id },
      });
      return { arena, usuario };
    });

    res.status(201).json({
      arena: { id: arena.id, nome: arena.nome, slug: arena.slug },
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail' });
    }
    throw err;
  }
});

// Exclui uma arena e tudo relacionado a ela (quadras, horários, reservas, o
// usuário dono) — ação irreversível.
router.delete('/arenas/:id', async (req, res) => {
  const arena = await prisma.arena.findUnique({ where: { id: req.params.id } });
  if (!arena) return res.status(404).json({ erro: 'Arena não encontrada' });

  await prisma.arena.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
