// Script de seed — cria a Arena piloto e o usuário de login de uma vez.
//
// Como usar:
//   1. Ajuste os valores em NOME_ARENA, SLUG_ARENA, NOME_USUARIO, EMAIL_USUARIO, SENHA abaixo se quiser.
//   2. Rode: node prisma/seed.js
//
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NOME_ARENA = 'Arena Bela Vista';
const SLUG_ARENA = 'arena-bela-vista';
const NOME_USUARIO = 'Lucas';
const EMAIL_USUARIO = 'lucasifrn2012@gmail.com';
const SENHA = 'ms123456'; // precisa ter pelo menos 6 caracteres (regra do backend)

async function main() {
  // Evita duplicar se você rodar o script mais de uma vez
  const arenaExistente = await prisma.arena.findUnique({ where: { slug: SLUG_ARENA } });
  const arena = arenaExistente
    ? arenaExistente
    : await prisma.arena.create({ data: { nome: NOME_ARENA, slug: SLUG_ARENA } });

  console.log('Arena pronta:', arena.nome, '| id:', arena.id);

  const senhaHash = await bcrypt.hash(SENHA, 10);

  const usuarioExistente = await prisma.usuario.findUnique({ where: { email: EMAIL_USUARIO } });

  const usuario = usuarioExistente
    ? await prisma.usuario.update({
        where: { email: EMAIL_USUARIO },
        data: { nome: NOME_USUARIO, senhaHash, arenaId: arena.id },
      })
    : await prisma.usuario.create({
        data: { nome: NOME_USUARIO, email: EMAIL_USUARIO, senhaHash, arenaId: arena.id },
      });

  console.log(usuarioExistente ? 'Usuário atualizado:' : 'Usuário criado:', usuario.email);
  console.log('');
  console.log('Login no painel:');
  console.log('  email:', EMAIL_USUARIO);
  console.log('  senha:', SENHA);
}

main()
  .catch((err) => {
    console.error('Erro ao rodar o seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
