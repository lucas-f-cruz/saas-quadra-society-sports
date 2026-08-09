import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface MasterRequest extends Request {
  adminId?: string;
}

// Token separado do fluxo de dono de arena — carrega tipo: 'master' pra
// impedir que um token de dono de arena seja usado pra acessar essa área,
// e vice-versa.
export function autenticarMaster(req: MasterRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      adminId: string;
      tipo: string;
    };

    if (payload.tipo !== 'master') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    req.adminId = payload.adminId;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}
