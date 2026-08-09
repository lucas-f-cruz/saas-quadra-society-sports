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

app.use(cors());
app.use(express.json());

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
