import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import quadraRoutes from './routes/quadras';
import regraPrecoRoutes from './routes/regrasPreco';
import reservaRoutes from './routes/reservas';
import publicRoutes from './routes/public';
import arenaRoutes from './routes/arena';
import masterRoutes from './routes/master';

dotenv.config();

const app = express();

// Em produção, defina CORS_ORIGIN no .env com o domínio real do painel
// (ex: https://proflow-admin.vercel.app). Sem essa variável, aceita
// qualquer origem — ok pra desenvolvimento local, mas não pra produção.
const origensPermitidas = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

// Impede o navegador de guardar em cache as respostas da API — sem isso,
// reabrir uma tela logo depois de salvar pode mostrar dado antigo (304).
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Rotas públicas
app.use('/auth', authRoutes);
app.use('/public', publicRoutes);

// Rotas do painel admin (autenticadas — ver middleware/auth.ts)
app.use('/quadras', quadraRoutes);
app.use('/regras-preco', regraPrecoRoutes);
app.use('/reservas', reservaRoutes);
app.use('/arena', arenaRoutes);
app.use('/master', masterRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`ProFlow backend rodando na porta ${PORT}`);
});
