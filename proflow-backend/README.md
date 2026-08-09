# ProFlow — Backend

Backend do ProFlow (SaaS de agendamento de quadras) em Node.js + TypeScript + Express + Prisma.

## Setup

1. Instale as dependências:
   ```
   npm install
   ```

2. Copie o `.env.example` para `.env` e ajuste `DATABASE_URL` com os dados do seu MySQL:
   ```
   cp .env.example .env
   ```

3. Rode a primeira migration (isso cria as tabelas no banco):
   ```
   npx prisma migrate dev --name init
   ```

4. Suba o servidor em modo desenvolvimento:
   ```
   npm run dev
   ```

O servidor sobe em `http://localhost:3333` por padrão.

## Criar o primeiro usuário/arena (Arena piloto)

Ainda não existe rota de cadastro pública (o SaaS por enquanto só tem 1 cliente, cadastrado manualmente). Use o Prisma Studio pra inserir os dados iniciais:

```
npx prisma studio
```

Isso abre uma interface visual no navegador para criar:
1. Uma `Arena` (nome, slug)
2. Um `Usuario` vinculado a ela — **atenção**: o campo `senhaHash` precisa ser um hash bcrypt, não a senha em texto puro. Gere um hash rapidamente rodando no terminal:
   ```
   node -e "console.log(require('bcryptjs').hashSync('sua-senha-aqui', 10))"
   ```
   (precisa rodar `npm install` antes)

## Rotas principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login do dono da arena |
| GET | `/quadras` | Lista quadras da arena logada |
| POST | `/quadras` | Cria quadra |
| POST | `/regras-preco` | Cria regra de preço/horário para uma quadra |
| GET | `/reservas/agenda/:quadraId?data=YYYY-MM-DD` | Agenda de um dia |
| POST | `/reservas` | Cria reserva (status inicial: PENDENTE_PAGAMENTO) |
| PATCH | `/reservas/:id/confirmar` | Marca reserva como paga/confirmada |
| PATCH | `/reservas/:id/cancelar` | Cancela reserva |

Todas as rotas exceto `/auth/login` exigem o header:
```
Authorization: Bearer <token recebido no login>
```

## Próximos passos

- Painel admin em React consumindo essa API
- Rota pública de agendamento para o jogador (sem necessidade de login)
- Cadastro de novas arenas (quando o SaaS for além do cliente piloto)
