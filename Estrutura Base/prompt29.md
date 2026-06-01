Sprint 6 — Testes

Hoje praticamente inexistentes.

Prioridade:

Frontend
Vitest
React Testing Library
Backend
Jest
Supertest
Sprint 7 — Primeiro MVP Público

Quando concluir os itens acima, você terá:

✅ Login
✅ Cadastro
✅ GPS
✅ Runtime HUD
✅ Mapa
✅ Histórico
✅ Perfil
✅ Sync Offline
✅ Backend Persistente
✅ PWA Instalável




RESPOSTA:


Both builds succeed. Let me finalize the todo list.
# Todos
[✓] Instalar dependências de teste (backend: jest + supertest, frontend: vitest + RTL)
[✓] Configurar Jest para backend (jest.config.ts, tsconfig update)
[✓] Escrever testes backend: Health, Auth, Users, Rides, RoutePoints, Snapshots, Sync
[✓] Configurar Vitest para frontend (vitest.config.ts, setup)
[✓] Escrever testes frontend: UI components, stores, pages, layout
[✓] Executar todos os testes e garantir sucesso
Sprint 6 concluído. Resumo:
Backend — 42 testes, 7 suites (Jest + Supertest)
Suite	Testes	Cobertura
HealthController	5	health, ready, alive
AuthController	6	signup, signin, refresh
UsersController	3	profile CRUD
RidesController	8	CRUD + pagination + ownership
RoutePointsController	5	single/bulk/delete/pagination
SnapshotsController	6	create/list/status/delete
SyncController	9	create/list/status/complete/stats
Frontend — 69 testes, 17 suites (Vitest + RTL)
Suite	Testes	O quê
UI: Button	8	variants, loading, icons, click
UI: Modal	6	open/close, escape, overlay, scroll lock
UI: Tabs/Card/Badge/StatCard/...	23	variants, rendering
UI: Sidebar/BottomNav	3	nav links, title
Stores: Auth	10	state transitions, persistence
Stores: History	5	fetch, pagination, error
Stores: Settings	4	defaults, merge, reset
Stores: Profile	4	optimistic update, rollback
Bug corrigido
- auth.service.ts — generateTokens() passava exp no payload E expiresIn nas options, causando conflito no jsonwebtoken@9. Removido exp do payload.
Como rodar
# Backend
cd apps/api && npx jest

# Frontend
cd apps/web && npx vitest run

# Tudo
cd apps/api && npx jest && cd ../web && npx vitest run


