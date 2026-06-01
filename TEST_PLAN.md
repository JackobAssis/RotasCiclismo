# TEST PLAN — Cycling Routes

**Versão:** 1.0.0  
**Data:** 31 de maio de 2026  
**Status:** Rascunho

---

## Objetivo

Validar o fluxo completo de ponta a ponta do sistema Cycling Routes, cobrindo os cenários **Online**, **Offline**, e **Reconexão**. O foco é garantir que a arquitetura *offline-first* funcione corretamente — a runtime permanece funcional independente do estado da rede, e os dados são sincronizados quando a conexão é restabelecida.

---

## Pré-requisitos

### Ambiente
- [ ] Backend rodando localmente (ou em staging) — `apps/api`
- [ ] Frontend rodando — `apps/web` (Vite dev server)
- [ ] Banco de dados PostgreSQL acessível via DATABASE_URL
- [ ] Migrations Prisma aplicadas (`pnpm prisma:migrate`)
- [ ] Docker Compose ativo (se local) — `docker-compose up -d`

### Dados de Teste
- [ ] Conta de usuário criada via `POST /auth/signup` (email + senha válidos)
- [ ] Token JWT obtido via `POST /auth/signin`
- [ ] Pelo menos 1 ride finalizada no banco (para validação de histórico)

### Limpeza
- [ ] IndexedDB limpo (via DevTools > Application > Clear storage)
- [ ] Console limpo para monitoramento de logs
- [ ] Nenhuma sync task pendente no backend (`/sync/stats` deve retornar zeros)

---

## Cenário 1 — Online (Fluxo Completo)

**Objetivo:** Validar o fluxo básico com conectividade total — login, pedalada em tempo real e sincronização imediata com o backend.

### Fluxo

```
Login
  ↓
Iniciar pedal
  ↓
GPS tracking (60s+)
  ↓
Finalizar pedal
  ↓
Sync para backend (automático)
```

### Passos

| # | Ação | Verificação |
|---|------|-------------|
| 1.1 | Abrir o app no navegador | Página de login exibida corretamente |
| 1.2 | Fazer login com credenciais válidas | Redirecionado para Home; token armazenado no localStorage |
| 1.3 | Navegar para `/ride` | RidePage carrega com mapa, HUD e botões de controle |
| 1.4 | Clicar **Start** | `ride.store.status` muda para `active`; GPS começa a coletar pontos |
| 1.5 | Aguardar 60+ segundos simulando movimento | Mapa exibe polyline da rota; widgets atualizando (velocidade, distância, duração) |
| 1.6 | Clicar **Stop** / **Finish** | `ride.store.status` muda para `finished` |
| 1.7 | Observar sync queue | Sync tasks `RIDE_CREATE`, `ROUTE_POINTS_UPLOAD`, `RIDE_FINISH` criadas no IndexedDB |
| 1.8 | Aguardar processamento do worker | Worker consome as tasks; `POST /api/rides`, `POST /api/rides/:id/points/bulk`, `POST /api/rides/:id/finish` são chamados |
| 1.9 | Verificar backend | `GET /api/rides` retorna a ride criada; `GET /api/rides/:id/with-route` retorna pontos GPS |
| 1.10 | Navegar para `/history` | Ride aparece na lista com métricas corretas |

### Assertivas Técnicas

- [ ] `POST /auth/signin` retorna `200` com `accessToken` + `refreshToken`
- [ ] `POST /api/rides` retorna `201` com `status: "ACTIVE"`
- [ ] `POST /api/rides/:id/points/bulk` retorna `201` com `{ created: N }`
- [ ] `POST /api/rides/:id/finish` retorna `200` com `status: "FINISHED"`
- [ ] `GET /api/sync/stats` retorna `completed > 0` e `failed === 0`
- [ ] Índice `rideId_idx` no IndexedDB contém todos os pontos da ride
- [ ] Widgets HUD mostram valores coerentes (velocidade > 0, distância > 0)

---

## Cenário 2 — Offline (Resiliência)

**Objetivo:** Validar que o sistema funciona sem conectividade — login persistido, pedalada completa salva localmente, sem perda de dados.

### Fluxo

```
Login pré-existente (já autenticado)
  ↓
Desligar internet (DevTools > Network > Offline)
  ↓
Iniciar pedal
  ↓
GPS tracking (60s+)
  ↓
Finalizar pedal
  ↓
Dados salvos no IndexedDB
```

### Passos

| # | Ação | Verificação |
|---|------|-------------|
| 2.1 | Fazer login (garantir sessão ativa) | Token salvo no localStorage |
| 2.2 | Abrir DevTools > Network > Offline | App continua funcional; indicador offline aparece |
| 2.3 | Navegar para `/ride` | RidePage carrega normalmente (runtime independente) |
| 2.4 | Clicar **Start** e pedalar por 30-60s | Mapa e HUD funcionando; pontos sendo coletados |
| 2.5 | Tirar snapshot (se câmera disponível) | Snapshot salvo no IndexedDB |
| 2.6 | Clicar **Finish** | Ride finalizada localmente |
| 2.7 | Verificar IndexedDB | `sessions` contém a ride com `finishedAt` preenchido; `route_points` contém pontos; `sync_queue` tem tasks pendentes |
| 2.8 | Tentar acessar `/history` | Lista vazia (backend inacessível) mas cache local mostra rides se implementado |
| 2.9 | Verificar que runtime continua estável | Nenhum crash, nenhum erro em loop |

### Assertivas Técnicas

- [ ] `status` do `connectivityService` muda para `offline` (indicador vermelho visível)
- [ ] `ride.store.status` transita `idle → active → finished` sem depender de rede
- [ ] `storageService.enqueueSyncTask()` persiste tasks no IndexedDB com `status: "pending"`
- [ ] `sync.service` não tenta processar tasks enquanto offline (verifica `navigator.onLine`)
- [ ] Route points são coletados e armazenados em `route_points` no IndexedDB
- [ ] Nenhum `unhandled rejection` ou erro no console relacionado a fetch
- [ ] `recoveryService` conseguiria restaurar a sessão se o app fosse fechado e reaberto

---

## Cenário 3 — Reconexão (Sync Tardio)

**Objetivo:** Validar o sincronismo automático dos dados acumulados offline quando a conexão é restabelecida.

### Fluxo

```
Internet desligada (durante pedal)
  ↓
Pedal finalizado offline
  ↓
Religar internet
  ↓
Sync worker detecta tasks pendentes
  ↓
Upload ride → Upload route points → Upload snapshots
  ↓
Tasks marcadas como completed
```

### Passos

| # | Ação | Verificação |
|---|------|-------------|
| 3.1 | Repetir Cenário 2 (pedal completo offline) | Tasks pendentes no IndexedDB |
| 3.2 | Abrir DevTools > Network > Online | Sync worker detecta `online` event |
| 3.3 | Observar processamento da sync queue | Tasks são enviadas na ordem correta: `RIDE_CREATE` → `ROUTE_POINTS_UPLOAD` → `SNAPSHOT_UPLOAD` (se houver) → `RIDE_FINISH` |
| 3.4 | Verificar no backend se ride foi criada | `GET /api/rides/:id` retorna a ride |
| 3.5 | Verificar pontos GPS no backend | `GET /api/rides/:id/with-route` retorna pontos |
| 3.6 | Verificar snapshots no backend | `GET /api/rides/:id/snapshots` retorna snapshots (se houver) |
| 3.7 | Verificar stats de sync | `GET /api/sync/stats` com `failed === 0` |
| 3.8 | Navegar para `/history` | Ride aparece na lista com métricas corretas e rota visível |
| 3.9 | Fechar e reabrir o app | Sessão restaurada via `recoveryService`; ride aparece no histórico |

### Assertivas Técnicas

- [ ] Evento `online` do browser dispara `syncService.processQueueOnce()`
- [ ] `sync.worker` recebe comando `processTasks` com batch de tasks
- [ ] Ordem de execução respeita dependências: `RIDE_CREATE` antes de `ROUTE_POINTS_UPLOAD` antes de `RIDE_FINISH`
- [ ] `POST /api/sync/tasks` é chamado (ou endpoints diretos: `/rides`, `/rides/:id/points/bulk`, etc.)
- [ ] Em caso de falha HTTP (5xx), worker retenta com backoff exponencial (1s, 2s, 4s, máx 5s)
- [ ] Task é removida do IndexedDB após `completed`
- [ ] Task permanece como `failed` no IndexedDB se exceder retries
- [ ] App pode ser fechado durante sync; ao reabrir, tasks pendentes são retomadas

---

## Checklist de Validação

### Autenticação

- [ ] `POST /auth/signup` cria conta e retorna tokens
- [ ] `POST /auth/signin` retorna tokens para credenciais válidas
- [ ] `POST /auth/refresh` renova access token
- [ ] Token inválido retorna `401`
- [ ] Sessão restaurada do localStorage ao recarregar o app
- [ ] Logout limpa tokens e redireciona para login

### Ride Lifecycle

- [ ] `startRide` cria sessão no IndexedDB
- [ ] `addPoint` persiste pontos no IndexedDB (batch a cada 1s via `requestIdleCallback`)
- [ ] `finishRide` atualiza sessão com métricas finais
- [ ] Mapa renderiza polyline atualizada a cada ponto
- [ ] HUD reflete métricas em tempo real (distância, velocidade, duração)

### Sync Queue

- [ ] `RIDE_CREATE` task enfileirada ao iniciar pedal
- [ ] `ROUTE_POINTS_UPLOAD` task enfileirada ao finalizar (com batch de pontos)
- [ ] `SNAPSHOT_UPLOAD` task enfileirada para cada snapshot
- [ ] `RIDE_FINISH` task enfileirada ao finalizar
- [ ] Tasks processadas em ordem FIFO por ride
- [ ] Tasks com falha são retentadas (até 5 tentativas, backoff exponencial)
- [ ] Tasks completadas são removidas do IndexedDB

### Sync Worker

- [ ] Worker criado na inicialização do `sync.service`
- [ ] Worker recebe `setAccessToken` e injeta em todas as requests
- [ ] Worker faz fetch com `Content-Type: application/json` e `Authorization: Bearer`
- [ ] Worker reporta progresso via `postMessage` (started → progress → success/failure)
- [ ] Timeout de 30s por request; retry até 2 vezes
- [ ] Worker não bloqueia a UI (executa em thread separada)
- [ ] Worker pode ser cancelado via `cancelTasks`

### Offline / Reconexão

- [ ] `connectivityService` detecta `navigator.onLine` e faz health check a cada 30s
- [ ] Indicador offline aparece imediatamente ao perder conexão
- [ ] Runtime (GPS, HUD, câmera) funciona sem backend
- [ ] Sync não tenta processar enquanto offline
- [ ] Ao reconectar, sync queue retoma automaticamente
- [ ] Dados sincronizados aparecem no histórico

### PWA

- [ ] Manifest carrega corretamente (`/manifest.json`)
- [ ] Service worker registrado (`sw.js`)
- [ ] `beforeinstallprompt` dispara (Chrome/Edge)
- [ ] Banner de instalação aparece
- [ ] App funciona offline (página inicial, rides cacheadas)
- [ ] Splash screen exibe theme_color `#0d2818`

### Segurança / Infraestrutura

- [ ] Helmet ativo (headers de segurança nas respostas)
- [ ] Compression ativo (respostas comprimidas com gzip)
- [ ] Rate limit global: 100 req/min
- [ ] Rate limit auth: 10 req/min (signup, signin, refresh)
- [ ] Global prefix `/api` ativo em todas as rotas
- [ ] CORS configurado para origin do frontend
- [ ] Zod valida env vars na inicialização

---

## Métricas de Sucesso

| Métrica | Critério |
|---------|----------|
| Perda de dados offline | **0%** — todos os pontos GPS devem ser recuperados |
| Erros de sync | **< 1%** — menos de 1% das tasks falham permanentemente |
| Tempo de sync após reconexão | **< 30s** para 1000 pontos |
| Latência de health check | **< 2s** para considerar online |
| Uso de CPU (worker) | **< 5%** durante sync |
| Responsividade UI durante sync | **Sem travamentos** — worker em thread separada |

---

## Observações

- Testes devem ser executados em **dispositivo mobile real** (iOS Safari ou Android Chrome) para validar PWA, GPS real e câmera
- Para testes desktop, usar **Chrome DevTools > Sensors** para simular localização
- Mock GPS disponível via `enableMockGPS=true` no componente `RidePage`
- O IndexedDB pode ser inspecionado em: DevTools > Application > IndexedDB > `cycling_system_v1`
- Backend logs estruturados com `nestjs-pino` — monitorar `stdout` para validação de requests
- Rate limit de auth (10 req/min) pode ser atingido durante testes repetidos — aguardar 1 minuto

---

## Histórico de Revisão

| Data | Versão | Autor | Alteração |
|------|--------|-------|-----------|
| 31/05/2026 | 1.0.0 | Sistema | Criação inicial |
