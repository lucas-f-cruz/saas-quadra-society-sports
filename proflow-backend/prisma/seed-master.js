// Script de seed — cria seu login master (área /master, separada dos donos de arena).
//
// Como usar:
//   1. Ajuste EMAIL_MASTER e SENHA_MASTER abaixo.
//   2. Rode: node prisma/seed-master.js
//
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const EMAIL_MASTER = 'lucasifrn2012@gmail.com';
const SENHA_MASTER = 'Leg291021@'; // precisa ter pelo menos 6 caracteres

async function main() {
  const senhaHash = await bcrypt.hash(SENHA_MASTER, 10);

  const existente = await prisma.adminMaster.findUnique({ where: { email: EMAIL_MASTER } });

  const admin = existente
    ? await prisma.adminMaster.update({ where: { email: EMAIL_MASTER }, data: { senhaHash } })
    : await prisma.adminMaster.create({ data: { email: EMAIL_MASTER, senhaHash } });

  console.log(existente ? 'Login master atualizado:' : 'Login master criado:', admin.email);
  console.log('');
  console.log('Acesse em /master/login com:');
  console.log('  email:', EMAIL_MASTER);
  console.log('  senha:', SENHA_MASTER);
}

main()
  .catch((err) => {
    console.error('Erro ao rodar o seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
