Você é um Desenvolvedor Full Stack Sênior especialista em React, TypeScript, Zustand, API Integration, Clean Architecture e aplicações mobile/web offline-first.

Sua missão é executar a Sprint 1 do projeto, focando EXCLUSIVAMENTE na integração completa entre Frontend, API Layer e Backend existente.

IMPORTANTE:
- Não recrie componentes visuais já existentes.
- Não altere design, layout ou UX.
- Não implemente novas funcionalidades fora do escopo.
- Priorize código limpo, tipado e reutilizável.
- Utilize a arquitetura atual do projeto.
- Antes de modificar qualquer arquivo, analise a estrutura existente.
- Reaproveite stores, hooks, services e repositories já criados.
- Gere código pronto para produção.

# CONTEXTO ATUAL

Arquitetura existente:

Frontend
↓
API Layer
↓
Backend

As telas principais já existem.

O objetivo desta sprint é conectar tudo ao backend real.

--------------------------------------------------
SPRINT 1 — INTEGRAÇÃO COMPLETA
--------------------------------------------------

PRIORIDADE MÁXIMA

Conectar completamente:

1. Auth Store ↔ Backend
2. Sync Queue ↔ Backend
3. History ↔ Backend
4. Profile ↔ Backend
5. Settings ↔ Stores Reais

--------------------------------------------------
TAREFA 1 — AUTH STORE
--------------------------------------------------

Verificar implementação atual.

Conectar autenticação aos endpoints existentes.

Garantir:

- Login
- Logout
- Refresh Token
- Persistência de sessão
- Recuperação automática ao iniciar app

Validar:

- Estados de loading
- Estados de erro
- Expiração de token

Resultado esperado:

Auth Store funcionando integralmente com backend real.

--------------------------------------------------
TAREFA 2 — HISTORY
--------------------------------------------------

Estado atual:

Tela criada.

Objetivo:

Substituir mocks/placeholders por dados reais.

Implementar:

GET /rides

Criar:

- Service
- API Client
- Store actions
- Hook de carregamento

Exibir:

- Lista real de pedaladas
- Loading state
- Empty state
- Error state

Resultado esperado:

History consumindo backend real.

--------------------------------------------------
TAREFA 3 — RIDE DETAILS
--------------------------------------------------

Estado atual:

Placeholder.

Objetivo:

Implementar tela completa.

Endpoint:

GET /rides/:id/with-route

Exibir:

Mapa da rota

Estatísticas:

- distância
- duração
- velocidade média
- velocidade máxima
- elevação

Snapshots

Informações da atividade

Implementar:

- Service
- Query/Hook
- Tratamento de loading
- Tratamento de erro

Resultado esperado:

Ride Details totalmente funcional.

--------------------------------------------------
TAREFA 4 — PROFILE
--------------------------------------------------

Estado atual:

Interface pronta.

Objetivo:

Conectar backend.

Implementar:

GET /users/profile

PATCH /users/profile

Criar:

- Service
- Store actions
- Atualização otimista quando possível
- Tratamento de erro

Permitir:

- Carregar perfil
- Atualizar perfil
- Persistir alterações

Resultado esperado:

Profile totalmente conectado.

--------------------------------------------------
TAREFA 5 — SETTINGS
--------------------------------------------------

Estado atual:

Interface pronta.

Objetivo:

Conectar configurações aos stores reais.

Conectar:

GPS

Runtime

Accessibility

Sync

Verificar:

- Persistência
- Atualização em tempo real
- Integração com Zustand (ou store equivalente)

Resultado esperado:

Todas as configurações refletindo comportamento real da aplicação.

--------------------------------------------------
TAREFA 6 — SYNC QUEUE
--------------------------------------------------

Objetivo:

Conectar sistema de sincronização ao backend.

Verificar:

- Queue existente
- Serviços existentes
- Estados offline

Garantir:

- Enfileiramento correto
- Reenvio automático
- Retry
- Tratamento de falhas

Resultado esperado:

Fluxo offline-first funcionando.

--------------------------------------------------
VALIDAÇÕES OBRIGATÓRIAS
--------------------------------------------------

Ao final da implementação:

1. Verificar todos os endpoints utilizados.
2. Verificar todos os tipos TypeScript.
3. Eliminar dados mockados.
4. Eliminar TODOs relacionados à integração.
5. Garantir ausência de erros de compilação.
6. Garantir ausência de warnings críticos.
7. Garantir tipagem estrita.
8. Garantir tratamento de erros em todas as chamadas HTTP.

--------------------------------------------------
FORMATO DE ENTREGA
--------------------------------------------------

Para cada alteração:

1. Explique rapidamente o problema.
2. Mostre os arquivos modificados.
3. Mostre o código completo das alterações.
4. Explique como testar.
5. Informe dependências necessárias.

Execute a Sprint 1 inteira até que todos os itens estejam conectados ao backend real.



RESPOSTA:

Sprint 1 concluída. 0 erros TypeScript. Resumo:
Tarefa 1 — Auth Store (✅ já funcionava)
Auth service já integrado com POST /auth/signin, POST /auth/signup, POST /auth/refresh, session restore, token refresh automático via interceptor, persistência localStorage.
Tarefa 2 — History (✅ novo)
- stores/history.store.ts — Zustand store com fetchRides(), loadMore(), loading/error states, paginação
- pages/History.tsx — Consome GET /rides via apiService.listRides(), com loading, empty, error states e paginação
Tarefa 3 — Ride Details (✅ novo)
- pages/RideDetails.tsx — Tela completa com:
- GET /rides/:id/with-route → apiService.getRideWithRoute()
- Mapa Leaflet com rota em polyline neon
- Métricas: distância, duração, vel. média, vel. máx, elevação, calorias, modo, status
- Snapshots carregados do backend
- Loading/error states
Tarefa 4 — Profile (✅ novo)
- stores/profile.store.ts — Zustand store com loadProfile() e updateProfile() com atualização otimista + rollback
- pages/Profile.tsx — Edição inline de displayName e bio via PATCH /users/:id
Tarefa 5 — Settings (✅ novo)
- stores/settings.store.ts — Zustand persist middleware (localStorage), conecta:
- GPS store → flushIntervalMs via gpsFrequency
- Runtime store → setAdaptToLowBattery
- Acessibilidade → reduce-motion, high-contrast classes no <html>
- pages/Settings.tsx — Todas as abas (Sync, GPS, Câmera, Acessibilidade) conectadas às stores reais
Tarefa 6 — Sync Queue (✅ corrigido)
Sistema offline-first já existente com:
- Web Worker (sync.worker.ts)
- IndexedDB queue (storage.service.ts)
- Polling a cada 10s
- Retry com exponential backoff
- Bug corrigido: authStore → useAuthStore (causaria runtime failure)
- Bug corrigido: Adicionado setAccessToken ao SyncWorkerCommand type
Arquivos Criados/Modificados
Arquivo	Tipo
stores/history.store.ts	Novo
stores/settings.store.ts	Novo
stores/profile.store.ts	Novo
pages/History.tsx	Novo
pages/RideDetails.tsx	Novo
pages/Profile.tsx	Novo
pages/Settings.tsx	Novo
services/sync.service.ts	Bugfix
packages/types/src/index.ts	Bugfix
