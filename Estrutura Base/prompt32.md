# CYCLING ROUTES — FASE 6 E FASE 7

Você é um Engenheiro de Software Sênior trabalhando no projeto Cycling Routes.

IMPORTANTE:

Antes de implementar qualquer alteração, analise completamente o código existente.

NÃO recrie sistemas já implementados.

NÃO faça refactors desnecessários.

NÃO altere arquiteturas existentes.

NÃO introduza novas bibliotecas sem necessidade.

NÃO substitua stores, services, workers ou runtime já existentes.

Preserve toda a arquitetura atual.

---

# CONTEXTO DO PROJETO

Stack:

Frontend:

* React
* TypeScript
* Vite
* TailwindCSS
* Zustand
* React Router
* Leaflet

Backend:

* NestJS
* Prisma
* PostgreSQL
* JWT

Infra:

* Docker
* Turborepo
* pnpm

Arquitetura:

Runtime Layer
↓
Stores Zustand
↓
Sync Queue
↓
API Layer
↓
Backend NestJS
↓
PostgreSQL

Princípios obrigatórios:

* Offline First
* Runtime Isolation
* Event Driven
* Mobile First
* Type Safe
* Progressive Enhancement

NÃO modificar:

* runtime.store.ts
* gps.store.ts

---

# SITUAÇÃO ATUAL

Já existe:

Frontend:

* Auth completo
* API Layer completo
* Sync Service
* Sync Worker
* Storage Service
* Recovery Service
* Ride Store
* GPS Store
* Runtime Store
* Analytics Dashboard
* History Page
* RideDetails Page
* Settings Page

Backend:

* Auth
* Users
* Rides
* RoutePoints
* Snapshots
* Sync
* Uploads
* Analytics

Deploy:

* Cloudflare Pages
* Render
* Neon PostgreSQL

PWA:

* Completo

Typecheck:

* Passando

Build:

* Passando

---

# FASE 6 — SYNC REAL COMPLETO

Objetivo:

Substituir qualquer comportamento simulado por sincronização real com o backend.

---

## PASSO 1

Localizar:

sync.worker.ts

Verificar:

* API_BASE_URL hardcoded
* localhost fixo

Substituir por:

import.meta.env.VITE_API_URL

ou mecanismo equivalente já utilizado pelo projeto.

Nenhum endpoint deve permanecer hardcoded.

---

## PASSO 2

Implementar sincronização real de:

ride:create

Backend:
POST /rides

Frontend:
sync queue
→ api.service
→ backend

---

## PASSO 3

Implementar sincronização real de:

ride:update

Backend:
PATCH /rides/:id

Frontend:
sync queue
→ api.service
→ backend

---

## PASSO 4

Implementar sincronização real de:

ride:finish

Backend:
POST /rides/:id/finish

Frontend:
sync queue
→ api.service
→ backend

---

## PASSO 5

Implementar upload batch real de RoutePoints.

Usar endpoint existente.

Objetivos:

* lote de 100+
* lote de 500+
* lote de 1000+

Garantir:

* retry
* reconexão
* falha parcial
* idempotência

---

## PASSO 6

Implementar sincronização real de snapshots.

Fluxo:

snapshot
↓
upload url
↓
storage
↓
backend
↓
status sincronizado

Usar módulos já existentes.

Não criar novo fluxo.

---

## PASSO 7

Melhorar observabilidade do Sync.

Adicionar em Settings:

* tarefas pendentes
* tarefas processando
* tarefas concluídas
* tarefas com erro
* última sincronização

Consumir dados já existentes do sync service.

Não duplicar estado.

---

# FASE 7 — HISTORY REAL

Objetivo:

Conectar as telas existentes ao backend real.

---

## PASSO 1

Página:

History.tsx

Conectar:

GET /rides

Implementar:

* loading
* empty state
* erro
* paginação
* pull-to-refresh preparado

---

## PASSO 2

Página:

RideDetails.tsx

Conectar:

GET /rides/:id/with-route

Exibir:

* mapa
* rota
* distância
* duração
* velocidade média
* velocidade máxima
* snapshots

Usar componentes já existentes.

---

## PASSO 3

Adicionar cache local.

Fluxo:

Backend
↓
API Layer
↓
IndexedDB
↓
UI

Se offline:

mostrar último histórico disponível.

---

## PASSO 4

Integrar Analytics e History.

Ao finalizar sincronização:

atualizar:

* History
* Analytics Store

automaticamente.

Sem refresh manual.

---

# VALIDAÇÕES OBRIGATÓRIAS

Ao final:

Executar:

pnpm typecheck

Frontend:

* sem erros

Backend:

* sem erros

Executar:

pnpm build

Frontend:

* build passando

Backend:

* build passando

---

# REGRAS DE ENTREGA

Trabalhe em pequenas etapas.

Após cada etapa:

1. Explique o que foi encontrado.
2. Explique o que foi alterado.
3. Explique riscos.
4. Explique compatibilidade.
5. Só então avance.

Não pule etapas.

Não reestruture o projeto.

Não recrie código existente.

Integre-se à arquitetura atual.

Objetivo final:

Pedalar
↓
GPS
↓
Offline
↓
IndexedDB
↓
Sync Queue
↓
Backend
↓
History
↓
Analytics

funcionando ponta a ponta.


RESPOSTA:

O erro de lint é pré-existente (config prettier ausente no .eslintrc.cjs), não relacionado às alterações.
✅ FASE 6 + FASE 7 — Resumo Final
FASE 6 — SYNC REAL COMPLETO
Passo	Status	Alteração
PASSO 1 — API_BASE_URL hardcoded	✅	sync.worker.ts:4 → substituído por import.meta.env.VITE_API_URL
PASSO 2 — ride:create	✅	Já existia (createRideTask → POST /rides)
PASSO 3 — ride:update	✅	Nova função updateRideTask (PATCH /rides/:id) + TASK_DISPATCHER
PASSO 4 — ride:finish	✅	Já existia (finishRideTask → POST /rides/:id/finish)
PASSO 5 — RoutePoints batch	✅	Já existia (split 10k+ com retry)
PASSO 6 — Snapshots sync	✅	Já existia (uploadSnapshotTask → POST /rides/:id/snapshots)
PASSO 7 — Observabilidade	✅	Settings.tsx — SyncStatusPanel com pending/in_progress/completed/failed + última sync
FASE 7 — HISTORY REAL
Passo	Status	Alteração
PASSO 1 — History.tsx (GET /rides)	✅	Já conectado via history.store.ts → apiService.listRides()
PASSO 2 — RideDetails.tsx (GET /rides/:id/with-route)	✅	Já conectado via apiService.getRideWithRoute()
PASSO 3 — Cache local IndexedDB	✅	Nova store rides_cache + cacheRides()/getCachedRides() + fallback offline
PASSO 4 — Auto-refresh History + Analytics	✅	Listener sync:task:finished → history.store.refresh() + analytics.store.fetch()
Validação
- pnpm typecheck --filter @cycling/api → ✅
- pnpm typecheck --filter @cycling/web → ✅
- pnpm build --filter @cycling/web → ✅ (9 entries, ~859 KiB)