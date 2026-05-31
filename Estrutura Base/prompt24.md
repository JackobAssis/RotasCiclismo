# CYCLING ROUTES — TECH LEAD EXECUTION PROMPT

Você é o Arquiteto Principal e Desenvolvedor Senior responsável pela continuação do projeto Cycling Routes.

Sua função NÃO é reinventar a arquitetura.

Sua função é continuar exatamente do estado atual do projeto, respeitando todas as decisões já tomadas.

---

# CONTEXTO DO PROJETO

Cycling Routes é um aplicativo PWA para ciclistas com:

* GPS em tempo real
* HUD visual
* Runtime adaptativo
* Modo câmera
* Sistema offline-first
* Sincronização backend
* Histórico de rotas
* Segurança e rastreamento

Arquitetura:

Monorepo Turborepo + pnpm

apps/
├── api (NestJS)
└── web (React + Vite)

packages/
├── types
├── ui
└── utils

Stack:

Frontend:

* React
* TypeScript
* Zustand
* Tailwind
* React Router
* Leaflet

Backend:

* NestJS
* Prisma
* PostgreSQL
* PostGIS
* JWT
* bcrypt

Infra:

* Docker
* Turbo
* pnpm workspaces

---

# PRINCÍPIOS OBRIGATÓRIOS

NUNCA QUEBRE ESTES PRINCÍPIOS

## 1. Runtime é Sagrado

A camada Runtime NÃO pode ser modificada estruturalmente.

Ela já possui:

* runtime.store
* gps.store
* ride.store
* camera.store
* minimap.store

e seus comportamentos devem continuar funcionando.

---

## 2. Offline First

Tudo deve funcionar sem internet.

Fluxo obrigatório:

Ride
↓
IndexedDB
↓
Sync Queue
↓
Backend

Jamais:

Ride
↓
Backend diretamente

---

## 3. Event Driven

Comunicação entre módulos deve ocorrer por:

* EventBus
* Stores
* Services

Evite acoplamento direto.

---

## 4. Type Safety

Proibido:

* any
* unknown sem justificativa
* casts desnecessários

Utilizar tipos compartilhados de:

@cycling/types

---

## 5. Arquitetura Modular

Não criar arquivos gigantes.

Separar:

* stores
* services
* hooks
* components
* workers
* types

---

# ESTADO ATUAL

## Backend

Status:

85% concluído

Já existe:

* Auth Module
* Users Module
* Rides Module
* RoutePoints Module
* Snapshots Module
* Sync Module
* Uploads Module
* Health Module

Prisma possui:

* User
* Ride
* RoutePoint
* Snapshot
* SyncTask

Endpoints existem.

---

## Frontend

Status:

85% concluído

Já existe:

* Runtime Modes
* GPS Tracking
* Ride Tracking
* HUD
* Camera Runtime
* Minimap
* EventBus
* Recovery Service
* Storage Service
* Sync Service
* Auth Store
* API Layer

---

# PROBLEMAS CONHECIDOS

1.

Corrigir incompatibilidades Leaflet

Map.tsx
MinimapOverlay.tsx

Instalar:

@types/leaflet

Validar versões:

leaflet
react-leaflet

---

2.

Garantir build dos packages:

@cycling/types
@cycling/utils
@cycling/ui

---

3.

Validar Docker

docker-compose up -d

---

4.

Validar Prisma

prisma generate
prisma migrate

---

# OBJETIVO DA SPRINT ATUAL

Concluir a integração completa frontend ↔ backend.

Prioridade máxima:

SYNC REAL

---

# ETAPA 1

Validar Infraestrutura

Checklist:

* pnpm install
* build dos packages
* docker compose
* prisma generate
* prisma migrate
* backend start
* frontend start

Corrigir qualquer erro encontrado.

---

# ETAPA 2

Implementar Sync Queue Real

Hoje:

Ride Store
↓
Storage Service

Objetivo:

Ride Store
↓
Storage Service
↓
Sync Queue
↓
API Layer
↓
Backend

Implementar:

POST /rides

POST /route-points/bulk

POST /snapshots

POST /sync/tasks

Atualizar estados:

PENDING
PROCESSING
COMPLETED
FAILED

Implementar retry.

Implementar tratamento de falha.

Implementar reconexão automática.

---

# ETAPA 3

Storage Adapter

Criar:

services/storage.adapter.ts

Responsabilidades:

* persistir localmente
* restaurar sessões
* sincronizar
* resolver conflitos
* expor API única para stores

Objetivo:

Stores não devem conhecer IndexedDB.

---

# ETAPA 4

Ride History

Criar:

pages/RideHistory.tsx

pages/RideDetail.tsx

Funcionalidades:

Listagem:

* distância
* duração
* data
* status

Detalhes:

* mapa
* trajeto
* fotos
* velocidade média
* velocidade máxima

Consumir backend real.

---

# ETAPA 5

Profile

Criar:

pages/Profile.tsx

pages/Settings.tsx

Mostrar:

* avatar
* nome
* estatísticas
* logout

---

# CRITÉRIOS DE QUALIDADE

Antes de finalizar qualquer etapa:

1.

Executar mentalmente fluxo completo.

2.

Verificar:

* imports
* exports
* aliases
* tipos

3.

Garantir:

pnpm build

sem erros.

4.

Evitar código duplicado.

5.

Adicionar comentários apenas quando agregarem valor.

---

# FORMATO DE ENTREGA

Para cada etapa:

1. Explicar objetivo.

2. Explicar arquitetura utilizada.

3. Mostrar arquivos criados.

4. Mostrar arquivos modificados.

5. Mostrar riscos.

6. Mostrar próximos passos.

7. Atualizar progresso da sprint.

NÃO PULE ETAPAS.

NÃO CRIE NOVAS FEATURES.

FOQUE SOMENTE EM CONCLUIR A INTEGRAÇÃO E TRANSFORMAR O PROJETO EM UM MVP UTILIZÁVEL.

Objetivo final:

Login
↓
Iniciar pedal
↓
GPS registra rota
↓
Dados salvos localmente
↓
Sync Queue envia ao backend
↓
PostgreSQL persiste
↓
Histórico exibe rota
↓
Usuário visualiza trajeto completo

Quando este fluxo estiver funcionando, a sprint estará concluída


OBS:  Prompt baseado na analise em um momento do projeto, analise:

Aqui está a análise completa e detalhada do projeto Cycling Routes (RotasCiclismo):
📋 ANÁLISE COMPLETA DO PROJETO
1. VISÃO GERAL
Cycling Routes é um sistema integrado de navegação GPS, fitness e segurança para ciclistas, com foco em:
- Navegação GPS em tempo real com mapas interativos
- Gravação de conteúdo com câmera integrada e HUD visual
- Tracking de desempenho físico (velocidade, distância, duração, calorias)
- Segurança e rastreamento com histórico de localização e SOS
- Arquitetura PWA para instalação mobile e funcionamento offline
2. ESTRUTURA DO MONOREPO
RotasCiclismo/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend React + Vite + PWA
├── packages/
│   ├── types/        # Tipos compartilhados (SyncTask, RoutePoint, RideSession)
│   ├── ui/           # Componentes reutilizáveis (esqueleto)
│   └── utils/        # Utilitários compartilhados (eventBus)
├── docs/             # Documentação técnica (6 arquivos)
├── Estrutura Base/   # Planejamento inicial (30 arquivos)
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
Gerenciamento: Turborepo 1.10 + pnpm workspaces
3. STACK TECNOLÓGICO
Camada	Tecnologia
Frontend	React + TypeScript
Build	Vite
UI	TailwindCSS
Mapas	Leaflet + React-Leaflet
Estado	Zustand
Rotas	React Router DOM
Backend	NestJS
ORM	Prisma
DB	PostgreSQL + PostGIS
Auth	JWT (Passport) + bcrypt
Monorepo	Turbo + pnpm
4. BACKEND (NestJS) — apps/api/
Status: MVP completo ✅ (~40 endpoints, 8 módulos)
Módulos Implementados:
Módulo	Arquivos	Endpoints
Auth	controller, service, module	3 (POST /auth/signup, signin, refresh)
Users	controller, service, module	2 (GET/PATCH /users/:id)
Rides	controller, service, module	6 (CRUD + finish + with-route)
Route Points	controller, service, module	3 (single, bulk, query)
Snapshots	controller, service, module	3 (CRUD + status)
Sync	controller, service, module	4 (tasks CRUD + stats)
Uploads	controller, service, module	2 (url + stats)
Health	controller, service, module	3 (/health, /ready, /alive)
Prisma Schema — 11 modelos:
- User (id, email, username, passwordHash, displayName, avatar, bio, privacyLevel, theme, language, timestamps)
- Ride (id, userId, startedAt, finishedAt, status, mode, distance, duration, avg/max speed, elevationGain/Loss, calories, start/end coords, title, description, tags, weather, terrainType, localOnly, isPublic, likes)
- RoutePoint (id, rideId, latitude, longitude, altitude, speed, heading, accuracy, altitudeAccuracy, timestamp)
- Snapshot (id, rideId, userId, imageUrl, thumbnailUrl, coords, fileSize, mimeType, uploadStatus)
- SyncTask (id, userId, type, rideId, payload JSON, attempts, maxAttempts, status, priority, scheduledFor)
- VideoRecording, Follow, Achievement, Comment, RideAnalytics, SafetyEvent (scaffolds futuros)
Config (src/config/config.ts):
- Porta, node_env, log_level, database_url, jwt_secret/expires, cors_origin, storage_type, upload_dir, redis_url
Segurança:
- ✅ bcrypt (10 rounds), JWT (7d access, 30d refresh), CORS, class-validator DTOs, guards de ownership
- ❌ Rate limiting, 2FA, audit logging (faltando)
5. FRONTEND (React PWA) — apps/web/
Status: ~60% — Runtime/HUD/GPS funcionais, Auth integrado, Camera parcial
Páginas:
Página	Arquivo	Status
Home	pages/Home.tsx	🟡 Funcional básica
Ride	pages/Ride.tsx	✅ Completa (orquestração total)
Login	pages/Login.tsx	✅ Implementada
Signup	pages/Signup.tsx	✅ Implementada
Debug	pages/Debug.tsx	✅ Painel de testes
Stores (Zustand):
Store	Arquivo	Propósito
ride.store.ts	✅ Completa	Ciclo de vida RideSession, Haversine distance, métricas em tempo real, eventos via eventBus
gps.store.ts	✅ Completa	Posição, orientação, heading
runtime.store.ts	✅ Completa	Modos de renderização (GPS_ONLY, MAP_FOCUS, CAMERA_RECORD, LOW_BATTERY, FUTURE_AR_MODE)
auth.store.ts	✅ Completa	Tokens, sessão, persistência localStorage, selectors granulares
camera.store.ts	🟡 Parcial	Estado da câmera
minimap.store.ts	✅ Completa	Mapa reduzido
Services:
Service	Arquivo	Status
auth.service.ts	✅ Completo	Signup/signin/logout/refresh/restoreSession
api.service.ts	✅ Completo	Wrapper sobre apiClient para chamadas tipadas
api.init.ts	✅	Inicialização de interceptors
sync.service.ts	✅ Completo	Worker queue, polling, retry com backoff, eventos
connectivity.service.ts	✅	Detecção online/offline
gps.service.ts	✅	Serviço GPS nativo
storage.service.ts	🟡	LocalStorage/IndexedDB
recovery.service.ts	🟡	Recuperação de sessão
API Layer:
- client.ts → ApiClient completo com interceptors, retry exponencial (3 tentativas, 1s/2s/4s), timeout (5s), dedup de GET, AbortController
- endpoints.ts → Constantes de rotas
- interceptors.ts → Injeção de token JWT
- types.ts → 300+ linhas de tipos para todas as DTOs do backend
Componentes:
Componente	Status	Descrição
Map.tsx	✅	Leaflet + OpenStreetMap, polilinha, marcador
OverlayManager.tsx	✅	Registry de widgets HUD
HudWidgets.tsx	✅	5 widgets (Speed, Distance, Duration, GPS Status, Recording Status)
CameraSurface.tsx	🟡	Integração câmera
MinimapOverlay.tsx	✅	Mapa reduzido
AuthBootstrap.tsx	✅	Bootstrap de autenticação
ProtectedRoute.tsx	✅	Guard de rotas
Workers:
- gps.worker.ts → Thread separada para GPS
- sync.worker.ts → Thread para processamento de fila de sync
Módulos Funcionais:
src/modules/
├── auth/       (tipos + index)
├── camera/     (tipos + index)
├── gps/        (tipos + index)
├── hud/        (componentes Speed, types, index)
├── rides/      (tipos + index)
└── runtime/    (tipos + index — 563 linhas de definições de modos)
6. SISTEMA DE RUNTIME (Diferencial do Projeto)
O módulo runtime é um sistema sofisticado de modos de renderização adaptativos:
- 4 modos ativos: GPS_ONLY, MAP_FOCUS, CAMERA_RECORD, LOW_BATTERY
- 1 futuro: FUTURE_AR_MODE
- Cada modo define: visibilidade/opacidade/escala dos layers (mapa, câmera, minimap, HUD)
- Transições automáticas por bateria (<15% → LOW_BATTERY, >25% → GPS_ONLY)
- Caching de rendering profiles para performance O(1)
- Completamente isolado da lógica de negócio (GPS, rides, camera)
7. ARQUITETURA DE INTEGRAÇÃO
Documentada em FRONTEND_INTEGRATION_ARCHITECTURE.md (799 linhas):
User → Runtime (GPS, Motion, Camera, HUD, Acessibilidade)
         ↓
     Zustand Stores (ride, gps, camera, runtime)
         ↓
     Sync Queue (batching local)
         ↓
     API Layer (client, interceptors, auth)
         ↓
     Backend (NestJS + Prisma + PostgreSQL)
Princípios:
- Offline-first: tudo funciona sem servidor
- Runtime sagrado: camada de runtime nunca é modificada
- Batching: GPS points enviados em lotes de 100-1000
- Degradação graciosa: funciona em 10 Mbps, 1 Mbps, offline
8. PACKAGES COMPARTILHADOS
Package	Arquivos	Conteúdo
@cycling/types	src/index.ts, src/events.ts	RoutePoint, RideSession, Snapshot, SyncTask, SyncWorker types
@cycling/ui	src/index.ts	Esqueleto (vazio)
@cycling/utils	src/eventBus.ts	EventBus compartilhado
9. DOCUMENTAÇÃO
docs/ (6 arquivos técnicos):
- INDEX.md — Índice da implementação realtime
- realtime-visual-implementation.md — Guia completo
- hud-widget-architecture.md — Arquitetura dos widgets HUD
- developer-guide.md — Guia do desenvolvedor
- frontend-module-map.md — Mapa dos módulos
- runtime-flow-diagram.md — Diagrama de fluxo runtime
Estrutura Base/ (30 arquivos de planejamento):
- ideia-base.md — Conceito do produto (navegação, fitness, segurança, filmagem)
- arquitetura-do-sistema.md — Arquitetura técnica detalhada
- ferramentas-tecnologias.md — Definição da stack
- 23 prompts de desenvolvimento + decisoes, estruturacao, modelagem, ux-ui
Documentos raiz:
- BACKEND_ARCHITECTURE.md (561 linhas) — Guia completo da arquitetura backend
- BACKEND_IMPLEMENTATION_SUMMARY.md (520 linhas) — Resumo da implementação
- FRONTEND_INTEGRATION_ARCHITECTURE.md (799 linhas) — Plano de integração
- API_QUICK_REFERENCE.md (538 linhas) — Referência rápida da API
- DEPLOYMENT_CHECKLIST.md (395 linhas) — Checklist de deploy
- PROJECT_STATUS.md (336 linhas) — Status geral do projeto
- STEP1_API_LAYER.md, STEP2_AUTH_INTEGRATION.md — Passos de implementação
10. STATUS POR ÁREA
Área	Status
Arquitetura/Documentação	✅ Completa
Infra (Docker/DB)	✅ Completa
Backend (NestJS + Prisma)	✅ MVP Completo
Autenticação (Backend)	✅ Completa
Frontend - Runtime/HUD/GPS	✅ Completo
Frontend - Auth Store + Pages	✅ Completo
Frontend - API Layer	✅ Completo
Frontend - Sync Service	✅ Completo
Frontend - Camera	🟡 Parcial
Frontend - Ride History UI	❌ Não iniciado
Testes	❌ Não iniciado
CI/CD	❌ Não iniciado
Gravação de Vídeo	❌ Não iniciado
Funcionalidades Sociais	❌ Não iniciado
11. GAPS & OBSERVAÇÕES
⚠️ Problemas Técnicos Conhecidos:
1. Incompatibilidade react-leaflet v3/v4 — Erros de tipo em Map.tsx e MinimapOverlay.tsx (props como center, attribution, icon, radius)
2. Falta @types/leaflet — TypeScript acusa erros
3. Workspace packages — @cycling/types, @cycling/utils precisam de build
4. Sync service não conectado ao backend real — Usa apenas storage local (storageService)
5. Sem testes — Zero testes automatizados em todo o projeto
6. Sem CI/CD pipeline — Nenhum workflow de integração contínua
🎯 Próximos Passos Imediatos (Sprint Atual):
1. Instalar @types/leaflet e corrigir componentes Map
2. Rodar pnpm install e pnpm build nos workspace packages
3. Subir PostgreSQL com docker-compose up -d
4. Rodar migrations Prisma
5. Iniciar dev servers e testar fluxo de auth completo
6. Conectar sync queue do frontend ao backend (Step 3 da integração)
7. Implementar página de Ride History


RESPOSTA:





Started Docker containers and checked setup requirements
Perfeito! ✅ Docker Compose iniciou com sucesso. Agora vou completar ETAPA 1 com Prisma:

Executed terminal commands for Docker and Prisma
Schema Prisma tem relações incompletas. Vou corrigir:

Reviewed schema.prisma and checked lines 1 to 320
Encontrei os erros de schema. Vou corrigir as relações bidirecionais:

Updated schema.prisma
