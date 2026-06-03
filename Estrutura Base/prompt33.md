# CONTEXTO

Estou trabalhando no projeto RotasCiclismo.

Stack:

* Frontend: React + Vite + TypeScript + Zustand
* Backend: NestJS + Prisma
* Banco: Neon PostgreSQL
* Deploy Frontend: Cloudflare Pages
* Deploy Backend: Railway

URLs:

Frontend:
https://rotasciclismo.pages.dev

Backend:
https://cycling-api.up.railway.app

Problemas atuais:

1. CORS bloqueando requisições do frontend para o backend

Erro:

Access to fetch at 'https://cycling-api.up.railway.app/api/auth/signup'
from origin 'https://rotasciclismo.pages.dev'
has been blocked by CORS policy

2. Endpoint de health retornando 404

Erro:

GET https://cycling-api.up.railway.app/api/health
404 Not Found

3. Signup falha devido ao problema acima

---

# OBJETIVO

Realizar uma auditoria completa do backend NestJS e corrigir:

* CORS
* Global Prefix
* Health endpoint
* Configuração Railway
* Variáveis de ambiente
* Deploy inconsistente

---

# TAREFAS

## ETAPA 1 — AUDITORIA

Verificar:

### main.ts

Confirmar:

```ts
app.setGlobalPrefix('api');
```

e

```ts
app.enableCors(...)
```

Analisar se a configuração atual permite:

https://rotasciclismo.pages.dev

### app.module.ts

Verificar se:

* HealthModule está importado
* AuthModule está importado
* ConfigModule está correto

### Health Controller

Confirmar existência de:

GET /health

ou

GET /api/health

e identificar qual rota deveria responder.

---

## ETAPA 2 — CORRIGIR CORS

Implementar configuração segura.

Aceitar:

* https://rotasciclismo.pages.dev
* http://localhost:5173

Exemplo esperado:

```ts
app.enableCors({
  origin: [
    'https://rotasciclismo.pages.dev',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
});
```

Se existir variável:

CORS_ORIGIN

integrar corretamente.

---

## ETAPA 3 — VALIDAR GLOBAL PREFIX

Garantir que:

```ts
app.setGlobalPrefix('api');
```

esteja sendo aplicado.

Após isso os endpoints devem responder:

```text
/api/health
/api/auth/signup
/api/auth/signin
```

e não versões sem prefixo.

---

## ETAPA 4 — VALIDAR HEALTH

Criar ou corrigir controller:

```ts
GET /api/health
```

Retorno esperado:

```json
{
  "status": "ok"
}
```

Criar também:

```ts
GET /api/health/ready
```

Retorno esperado:

```json
{
  "status": "ready"
}
```

---

## ETAPA 5 — AUDITORIA RAILWAY

Verificar:

* Procfile
* package.json
* build command
* start command

Confirmar:

```bash
pnpm install
pnpm prisma generate
pnpm build
pnpm start
```

Verificar se Railway está executando a versão mais recente.

Identificar qualquer motivo para:

```text
/api/health
```

retornar 404.

---

## ETAPA 6 — LOGS

Adicionar logs temporários no bootstrap:

```ts
Logger.log(`Environment: ${process.env.NODE_ENV}`);
Logger.log(`API Prefix: /api`);
Logger.log(`CORS Enabled`);
```

Confirmar nos logs do Railway.

---

## ETAPA 7 — TESTES

Após as correções:

Executar e validar:

```bash
curl https://cycling-api.up.railway.app/api/health
```

```bash
curl https://cycling-api.up.railway.app/api/health/ready
```

```bash
curl -X POST \
https://cycling-api.up.railway.app/api/auth/signup
```

Validar também preflight:

```bash
curl -X OPTIONS
```

Confirmar presença dos headers:

```text
Access-Control-Allow-Origin
Access-Control-Allow-Methods
Access-Control-Allow-Headers
```

---

# SAÍDA ESPERADA

Forneça:

1. Diagnóstico da causa raiz.
2. Arquivos modificados.
3. Código completo das correções.
4. Checklist de deploy Railway.
5. Passo a passo para validar a correção após novo deploy.

Não refatore outras partes do projeto.
Foque apenas em:

* CORS
* Health endpoint
* Prefix /api
* Railway deploy
* Signup funcionando entre Cloudflare Pages e Railway.
