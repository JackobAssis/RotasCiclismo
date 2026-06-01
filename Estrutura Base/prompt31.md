# CONTEXTO

Você está trabalhando no projeto Cycling Routes.

O projeto NÃO está em fase inicial.

A arquitetura principal já existe e está funcional.

NÃO recrie sistemas já implementados.

NÃO substitua arquiteturas existentes.

NÃO introduza frameworks novos.

NÃO faça refactors desnecessários.

Sua missão é continuar a evolução do produto seguindo exatamente a arquitetura existente.

Antes de alterar qualquer arquivo:

1. Leia toda a estrutura do projeto.
2. Leia os documentos:
   - PROJECT_STATUS.md
   - BACKEND_ARCHITECTURE.md
   - FRONTEND_INTEGRATION_ARCHITECTURE.md
   - BACKEND_IMPLEMENTATION_SUMMARY.md
   - API_QUICK_REFERENCE.md
   - DEPLOYMENT_CHECKLIST.md
3. Analise a implementação atual.
4. Identifique o que já existe.
5. Só implemente o que estiver faltando.

--------------------------------------------------

# ESTADO ATUAL DO PROJETO

Stack:

Frontend:
- React
- TypeScript
- Vite
- TailwindCSS
- Zustand
- React Router
- Leaflet
- PWA

Backend:
- NestJS
- Prisma
- PostgreSQL

Infraestrutura:
- Docker
- Turborepo
- pnpm workspaces

Deploy planejado:

Frontend:
- Cloudflare Pages

Backend:
- Render

Banco:
- Neon PostgreSQL

--------------------------------------------------

# ARQUITETURA QUE DEVE SER PRESERVADA

Camadas:

Runtime Layer
↓
Stores (Zustand)
↓
Sync Queue
↓
API Layer
↓
Backend

Princípios obrigatórios:

- Offline First
- Runtime Isolation
- Event Driven
- Mobile First
- Type Safe
- Progressive Enhancement

NÃO modificar:

- runtime.store
- gps.store
- ride.store
- runtime profiles
- sistema HUD
- sync worker architecture

Apenas integrar e evoluir.

--------------------------------------------------

# FASE 1
# INFRAESTRUTURA E PRODUÇÃO

Objetivo:

Preparar o projeto para ambiente real.

Implementar:

## Backend

Adicionar prefixo global:

main.ts

app.setGlobalPrefix('api');

Garantir compatibilidade com:

VITE_API_URL=https://backend-url/api

--------------------------------------------------

## Segurança

Instalar e configurar:

- Helmet
- Compression
- Throttler

Implementar:

Rate limit global

Exemplo:

100 requests/min

Endpoints de auth:

10 requests/min

--------------------------------------------------

## Logs

Implementar logging estruturado.

Preferência:

nestjs-pino

Registrar:

- requests
- errors
- warnings
- auth failures
- sync failures

--------------------------------------------------

## Variáveis de Ambiente

Validar todas usando schema.

Produzir:

.env.example completo

Separar:

development
staging
production

--------------------------------------------------

# FASE 2
# DEPLOY CLOUD

Objetivo:

Preparar deploy.

--------------------------------------------------

## Backend Render

Criar:

render.yaml

Configurar:

- Build
- Start command
- Environment variables

--------------------------------------------------

## Banco Neon

Preparar:

DATABASE_URL

Prisma production migration workflow

Scripts:

pnpm prisma:migrate:prod

pnpm prisma:deploy

--------------------------------------------------

## Frontend Cloudflare Pages

Garantir:

vite build funcionando

Configurar:

_routes.json
_headers

PWA funcionando em produção.

--------------------------------------------------

# FASE 3
# PWA PRODUÇÃO

Objetivo:

Transformar aplicação em PWA utilizável.

--------------------------------------------------

Validar:

manifest.json

Criar:

ícones:

- 192x192
- 512x512

Splash screens

Theme color

Background color

--------------------------------------------------

Implementar:

Install Prompt

Componente:

InstallPwaBanner

Fluxo:

Usuário acessa
↓
Browser detecta suporte
↓
Exibe banner
↓
Instalar aplicativo

--------------------------------------------------

Implementar:

Offline Screen

Quando backend indisponível:

mostrar status visual

mas manter runtime funcional.

--------------------------------------------------

# FASE 4
# TESTE REAL DE CAMPO

Objetivo:

Validar fluxo completo.

Criar:

TEST_PLAN.md

Cobrir:

--------------------------------------------------

Cenário 1

Online

Login
↓
Iniciar pedal
↓
GPS
↓
Finalizar
↓
Sync backend

--------------------------------------------------

Cenário 2

Offline

Login já existente
↓
Internet desligada
↓
Pedalada
↓
Salvar localmente

--------------------------------------------------

Cenário 3

Reconexão

Internet volta
↓
Sync worker
↓
Upload ride
↓
Upload route points
↓
Upload snapshots

--------------------------------------------------

Criar checklist de validação.

--------------------------------------------------

# FASE 5
# ANALYTICS

Objetivo:

Adicionar valor ao produto.

Criar Dashboard Analytics.

Página:

/analytics

--------------------------------------------------

Métricas:

- Total de km
- Total de pedaladas
- Total de horas
- Velocidade média
- Maior velocidade
- Distância média

--------------------------------------------------

Gráficos:

- semanal
- mensal

Usar:

Recharts

--------------------------------------------------

Criar:

analytics.store.ts

analytics.service.ts

Integrar backend existente.

--------------------------------------------------

# FASE 6
# VÍDEO (DIFERENCIAL DO PRODUTO)

Objetivo:

Aproveitar infraestrutura já existente.

Arquivos já existentes:

- CameraSurface
- camera.store
- Runtime CAMERA_RECORD

NÃO recriar.

Evoluir.

--------------------------------------------------

Implementar:

MediaRecorder API

Fluxo:

Entrar em CAMERA_RECORD
↓
Iniciar gravação
↓
Gerar arquivo webm
↓
Parar gravação
↓
Persistir localmente
↓
Criar SyncTask
↓
Upload posterior

--------------------------------------------------

Criar:

video.service.ts

video.store.ts

--------------------------------------------------

Integrar:

sync.worker

para upload futuro.

--------------------------------------------------

# FASE 7
# QUALIDADE

Objetivo:

Fortalecer produto.

--------------------------------------------------

Criar testes para:

Analytics
Video
PWA
Sync

--------------------------------------------------

Meta:

Frontend:
100+ testes

Backend:
60+ testes

--------------------------------------------------

# REGRAS DE EXECUÇÃO

A cada etapa:

1. Analisar código existente.
2. Verificar se já existe implementação.
3. Não duplicar funcionalidades.
4. Não criar versões paralelas.
5. Reutilizar stores e services existentes.
6. Manter compatibilidade total.

Ao finalizar cada fase:

Gerar:

- Resumo técnico
- Arquivos alterados
- Arquivos criados
- Riscos identificados
- Próxima fase recomendada

Comece pela FASE 1 e execute apenas uma fase por vez.
Não avance para a próxima fase sem concluir e validar a fase atual.



RESPOSTA:


Lint error is pre-existing (missing prettier config). The typecheck passes successfully. Let me now generate the final summary.
# Todos
[✓] FASE 1: Analisar código existente do backend e frontend
[✓] FASE 1.1: Adicionar global prefix '/api' + dotenv + Helmet + Compression no backend main.ts
[✓] FASE 1.2: Instalar dependências (@nestjs/throttler, helmet, compression, nestjs-pino)
[✓] FASE 1.3: Configurar ThrottlerModule + rate limit no app.module.ts
[✓] FASE 1.4: Implementar logging estruturado com nestjs-pino
[✓] FASE 1.5: Env validation com Zod + .env.example completo + .env.development/.staging/.production
[•] Gerar resumo técnico da FASE 1
+ Thought: 291ms
Let me verify the env files are consistent.
→Read apps/api/.env.example 
+ Thought: 311ms
# Todos
[✓] FASE 1: Analisar código existente do backend e frontend
[✓] FASE 1.1: Adicionar global prefix '/api' + dotenv + Helmet + Compression no backend main.ts
[✓] FASE 1.2: Instalar dependências (@nestjs/throttler, helmet, compression, nestjs-pino)
[✓] FASE 1.3: Configurar ThrottlerModule + rate limit no app.module.ts
[✓] FASE 1.4: Implementar logging estruturado com nestjs-pino
[✓] FASE 1.5: Env validation com Zod + .env.example completo + .env.development/.staging/.production
[✓] Gerar resumo técnico da FASE 1
+ Thought: 205ms
✅ FASE 1 — Resumo Técnico
Arquivos modificados
Arquivo	Alteração
apps/api/src/main.ts	Global prefix /api, dotenv, Helmet, Compression
apps/api/src/app.module.ts	ThrottlerModule (100 req/min), LoggerModule (nestjs-pino)
apps/api/src/config/config.ts	Zod schema validation, typed config
apps/api/src/modules/auth/auth.controller.ts	Rate limit 10 req/min via @Throttle
apps/api/src/modules/health/health.controller.ts	@SkipThrottle para health checks
apps/api/.env.example	Comentários completos, Neon/S3 hints
apps/api/.env / .env.local	JWT secrets atualizados (32+ chars)
Arquivos criados
Arquivo	Finalidade
apps/api/.env.development	Config para dev local
apps/api/.env.staging	Config para staging/Neon
apps/api/.env.production	Config para produção
Dependências instaladas
@nestjs/throttler, helmet@7, compression, nestjs-pino, pino-http, pino, pino-pretty (dev)
Riscos identificados
- Config loadConfig() roda em escopo de módulo (app.module.ts) — depende de import 'dotenv/config' em main.ts executar antes. A ordem de imports CommonJS garante isso.
- Helmet v7 (CommonJS) compatível com NestJS — v8 seria ESM-only e quebraria.
- JWT_SECRET agora exige 32+ chars — .env existente foi atualizado.
Próxima fase recomendada
FASE 2: Deploy Cloud — render.yaml, Neon migration workflow, Cloudflare Pages config.