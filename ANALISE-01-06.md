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
Módulo	Arquivos
Auth	controller, service, module
Users	controller, service, module
Rides	controller, service, module
Route Points	controller, service, module
Snapshots	controller, service, module
Sync	controller, service, module
Uploads	controller, service, module
Health	controller, service, module
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
Página	Arquivo
Home	pages/Home.tsx
Ride	pages/Ride.tsx
Login	pages/Login.tsx
Signup	pages/Signup.tsx
Debug	pages/Debug.tsx
Stores (Zustand):
Store	Arquivo	Propósito
ride.store.ts	✅ Completa	Ciclo de vida RideSession, Haversine distance, métricas em tempo real, eventos via eventBus
gps.store.ts	✅ Completa	Posição, orientação, heading
runtime.store.ts	✅ Completa	Modos de renderização (GPS_ONLY, MAP_FOCUS, CAMERA_RECORD, LOW_BATTERY, FUTURE_AR_MODE)
auth.store.ts	✅ Completa	Tokens, sessão, persistência localStorage, selectors granulares
camera.store.ts	🟡 Parcial	Estado da câmera
minimap.store.ts	✅ Completa	Mapa reduzido
Services:
Service	Arquivo
auth.service.ts	✅ Completo
api.service.ts	✅ Completo
api.init.ts	✅
sync.service.ts	✅ Completo
connectivity.service.ts	✅
gps.service.ts	✅
storage.service.ts	🟡
recovery.service.ts	🟡
API Layer:
- client.ts → ApiClient completo com interceptors, retry exponencial (3 tentativas, 1s/2s/4s), timeout (5s), dedup de GET, AbortController
- endpoints.ts → Constantes de rotas
- interceptors.ts → Injeção de token JWT
- types.ts → 300+ linhas de tipos para todas as DTOs do backend
Componentes:
Componente	Status
Map.tsx	✅
OverlayManager.tsx	✅
HudWidgets.tsx	✅
CameraSurface.tsx	🟡
MinimapOverlay.tsx	✅
AuthBootstrap.tsx	✅
ProtectedRoute.tsx	✅
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
Package	Arquivos
@cycling/types	src/index.ts, src/events.ts
@cycling/ui	src/index.ts
@cycling/utils	src/eventBus.ts
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
Área
Arquitetura/Documentação
Infra (Docker/DB)
Backend (NestJS + Prisma)
Autenticação (Backend)
Frontend - Runtime/HUD/GPS
Frontend - Auth Store + Pages
Frontend - API Layer
Frontend - Sync Service
Frontend - Camera
Frontend - Ride History UI
Testes
CI/CD
Gravação de Vídeo
Funcionalidades Sociais
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