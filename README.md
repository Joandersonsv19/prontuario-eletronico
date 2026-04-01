# Prontuário Eletrônico — Atenção Básica em Saúde

Sistema web de prontuário eletrônico para ensino em enfermagem, com supervisão acadêmica em tempo real.

---

## Pré-requisitos

- **Node.js** 22.x ou superior → https://nodejs.org
- **pnpm** 10.x → `npm install -g pnpm`
- **MySQL** 8.x ou MariaDB 10.6+ (ou TiDB, PlanetScale)
- **Git** (opcional)

---

## Instalação Local (passo a passo)

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
cp env.example .env
```

Edite o arquivo `.env` e preencha obrigatoriamente:

```env
DATABASE_URL=mysql://root:sua_senha@localhost:3306/prontuario_eletronico
JWT_SECRET=string_aleatoria_longa_aqui
```

Para gerar um JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Criar o banco de dados

```bash
mysql -u root -p -e "CREATE DATABASE prontuario_eletronico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. Aplicar as migrações (criar tabelas)

```bash
pnpm drizzle-kit migrate
```

### 5. Importar os dados CIAP-2 (683 diagnósticos)

```bash
mysql -u root -p prontuario_eletronico < ciap2_seed.sql
```

### 6. Iniciar em modo desenvolvimento

```bash
pnpm dev
```

Acesse: **http://localhost:3000**

---

## Build de Produção

```bash
# Gerar bundle otimizado
pnpm build

# Iniciar servidor de produção
node dist/index.js
```

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia em modo desenvolvimento com hot-reload |
| `pnpm build` | Gera bundle de produção em `dist/` |
| `pnpm start` | Inicia o servidor de produção |
| `pnpm test` | Executa os 15 testes automatizados |
| `pnpm drizzle-kit migrate` | Aplica migrações do banco de dados |
| `pnpm drizzle-kit generate` | Gera novas migrações a partir do schema |

---

## Autenticação fora do Manus

O sistema usa OAuth do Manus por padrão. Para rodar de forma independente, você precisa substituir o sistema de autenticação. Há duas opções:

### Opção A — Autenticação própria com usuário/senha (recomendada)

Instale as dependências necessárias:

```bash
pnpm add bcrypt
pnpm add -D @types/bcrypt
```

**1. Adicione a coluna de senha ao schema** (`drizzle/schema.ts`):

```typescript
// Adicione dentro da tabela users:
passwordHash: varchar("password_hash", { length: 255 }),
username: varchar("username", { length: 100 }),
```

**2. Gere e aplique a migração:**

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

**3. Substitua `server/_core/oauth.ts`** pelo seguinte código:

```typescript
import bcrypt from 'bcrypt';
import type { Express, Request, Response } from 'express';
import { SignJWT } from 'jose';
import * as db from '../db';
import { getSessionCookieOptions } from './cookies';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';
import { ENV } from './env';

export function registerOAuthRoutes(app: Express) {
  // Registro de novo usuário
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { username, password, name, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username e password são obrigatórios' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const openId = `local_${username}_${Date.now()}`;
    try {
      await db.upsertUser({ openId, name, email, loginMethod: 'local' });
      // Salvar passwordHash e username diretamente no banco
      const dbConn = await db.getDb();
      await dbConn!.execute(
        'UPDATE users SET password_hash = ?, username = ? WHERE open_id = ?',
        [passwordHash, username, openId]
      );
      res.json({ success: true });
    } catch {
      res.status(409).json({ error: 'Usuário já existe' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const dbConn = await db.getDb();
    const [rows] = await dbConn!.execute(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    ) as any;
    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const secretKey = new TextEncoder().encode(ENV.cookieSecret);
    const token = await new SignJWT({ openId: user.openId, appId: 'local', name: user.name ?? username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('365d')
      .sign(secretKey);
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ success: true, user: { name: user.name, email: user.email } });
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
```

**4. Atualize `client/src/const.ts`** para apontar para o login local:

```typescript
export { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';

// Redireciona para a página de login local
export const getLoginUrl = () => '/login';
```

**5. Crie a página de login** (`client/src/pages/Login.tsx`) com formulário de usuário/senha que faça POST para `/api/auth/login`.

**6. Adicione a rota `/login`** em `client/src/App.tsx`.

### Opção B — Manter Manus OAuth (dentro do ecossistema Manus)

Publique o projeto via botão **Publish** no painel do Manus. A autenticação funciona sem alterações.

---

## Deploy em Produção

### Com PM2 (VPS/Ubuntu)

```bash
npm install -g pm2
pnpm build
pm2 start dist/index.js --name prontuario-eletronico
pm2 startup && pm2 save
```

### Com Nginx (proxy reverso + WebSocket)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        # OBRIGATÓRIO para Socket.io funcionar:
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Com Docker

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```bash
docker build -t prontuario-eletronico .
docker run -p 3000:3000 --env-file .env prontuario-eletronico
```

---

## Estrutura do Banco de Dados

| Tabela | Descrição |
|---|---|
| `users` | Usuários autenticados |
| `pacientes` | Cadastro de pacientes (isolado por usuário) |
| `atendimentos` | Registros de atendimentos |
| `prontuarios` | Prontuário SOAP (1:1 com atendimento) |
| `diagnosticos` | Diagnósticos CIAP-2 por prontuário |
| `sinais_vitais` | Sinais vitais por prontuário |
| `prescricoes` | Prescrições por prontuário |
| `ciap2` | 683 códigos da Classificação Internacional de Atenção Primária |
| `codigos_convite` | Códigos gerados pelo professor para supervisão |
| `conexoes_supervisao` | Conexões ativas aluno-professor |
| `sessoes_supervisao` | Histórico de sessões de supervisão |

---

## Funcionalidade de Supervisão Acadêmica

A supervisão usa **Socket.io** no path `/api/socket.io`. Para testar:

1. Abra o sistema em dois navegadores diferentes (ou um normal + um anônimo)
2. **Navegador A (Professor):** acesse **Supervisão Acadêmica → Gerar código**
3. **Navegador B (Aluno):** abra um prontuário → clique **"Conectar ao Professor"** → insira o código
4. O professor verá o aluno na lista e poderá acompanhar o preenchimento em tempo real

> **Importante:** O Nginx deve ter `proxy_set_header Connection "upgrade"` para o WebSocket funcionar em produção.

---

## Testes

```bash
pnpm test
```

15 testes automatizados cobrindo autenticação, routers de pacientes, atendimentos, prontuários, sinais vitais, prescrições e supervisão.

---

## Tecnologias

React 19 · Vite 7 · TailwindCSS 4 · shadcn/ui · tRPC 11 · Express 4 · Drizzle ORM · MySQL · Socket.io 4 · PDFKit · Zod · TypeScript 5

---

*Sistema desenvolvido com Manus AI — Março de 2026*
