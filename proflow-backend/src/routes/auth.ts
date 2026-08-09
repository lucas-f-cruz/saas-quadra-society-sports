import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { gerarSlugUnico } from '../lib/slug';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

const signupSchema = z.object({
  nomeArena: z.string().min(2, 'Nome da arena precisa ter pelo menos 2 caracteres'),
  nomeUsuario: z.string().min(2, 'Nome precisa ter pelo menos 2 caracteres'),
  email: z.string().email(),
  senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
});

router.post('/signup', async (req, res) => {
  // Desativado por padrão — nesse modelo, é o dono do SaaS quem cadastra cada
  // cliente pela área /master, em vez de deixar qualquer um se cadastrar sozinho.
  // Para reativar o cadastro público, defina PERMITIR_SIGNUP_PUBLICO=true no .env.
  if (process.env.PERMITIR_SIGNUP_PUBLICO !== 'true') {
    return res.status(403).json({ erro: 'Cadastro público desativado. Fale com o suporte para criar sua conta.' });
  }

  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { nomeArena, nomeUsuario, email, senha } = parsed.data;

  const emailExistente = await prisma.usuario.findUnique({ where: { email } });
  if (emailExistente) {
    return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail' });
  }

  const slug = await gerarSlugUnico(nomeArena);
  const senhaHash = await bcrypt.hash(senha, 10);

  const { arena, usuario } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const arena = await tx.arena.create({ data: { nome: nomeArena, slug } });
    const usuario = await tx.usuario.create({
      data: { nome: nomeUsuario, email, senhaHash, arenaId: arena.id },
    });
    return { arena, usuario };
  });

  const token = jwt.sign(
    { usuarioId: usuario.id, arenaId: usuario.arenaId, tokenVersion: usuario.tokenVersion },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    arena: { id: arena.id, nome: arena.nome, slug: arena.slug },
  });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { email, senha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }

  // Incrementa a versão do token — qualquer sessão feita com o token anterior
  // (em outro dispositivo/navegador) deixa de ser válida a partir de agora.
  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { tokenVersion: { increment: 1 } },
  });

  const token = jwt.sign(
    { usuarioId: usuarioAtualizado.id, arenaId: usuarioAtualizado.arenaId, tokenVersion: usuarioAtualizado.tokenVersion },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    usuario: { id: usuarioAtualizado.id, nome: usuarioAtualizado.nome, email: usuarioAtualizado.email },
  });
});

export default router;
