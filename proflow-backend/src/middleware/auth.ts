import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  usuarioId?: string;
  arenaId?: string;
}

// Cada token carrega o usuarioId e o arenaId, garantindo que um dono de
// arena só acesse dados da própria arena (isolamento multi-tenant).
//
// Também carrega tokenVersion — conferimos contra o valor salvo no banco pra
// impedir que a mesma conta fique logada em dois lugares ao mesmo tempo
// (sessão única): a cada novo login, tokenVersion é incrementado, e qualquer
// token anterior emitido com a versão antiga passa a ser rejeitado aqui.
export async function autenticar(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      usuarioId: string;
      arenaId: string;
      tokenVersion: number;
    };

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.usuarioId },
      select: { tokenVersion: true },
    });

    if (!usuario || usuario.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ erro: 'Sessão encerrada — sua conta foi acessada em outro dispositivo' });
    }

    req.usuarioId = payload.usuarioId;
    req.arenaId = payload.arenaId;

    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}
