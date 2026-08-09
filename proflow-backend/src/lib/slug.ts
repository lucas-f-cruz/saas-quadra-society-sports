import { prisma } from './prisma';

export function slugify(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Garante um slug único, adicionando um sufixo numérico se precisar
// (ex: "arena-central", "arena-central-2", "arena-central-3"...)
export async function gerarSlugUnico(nome: string): Promise<string> {
  const base = slugify(nome) || 'arena';
  let slug = base;
  let contador = 1;
  while (await prisma.arena.findUnique({ where: { slug } })) {
    contador += 1;
    slug = `${base}-${contador}`;
  }
  return slug;
}
