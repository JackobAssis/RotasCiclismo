Goal
- Evoluir o produto Cycling Routes seguindo exatamente a arquitetura existente, implementando as fases 1 a 4 conforme prompt31.md.
Constraints & Preferences
- NÃO recriar sistemas já implementados, NÃO substituir arquiteturas existentes, NÃO introduzir frameworks novos, NÃO fazer refactors desnecessários.
- Stack: React/Vite/TailwindCSS/Zustand/Leaflet (frontend) + NestJS/Prisma/PostgreSQL (backend) + Docker/Turborepo/pnpm (infra).
- Offline First, Runtime Isolation, Event Driven, Mobile First, Type Safe, Progressive Enhancement.
- NÃO modificar runtime.store, gps.store.
- Uma fase por vez, concluir e validar antes de avançar.
- Preservar camadas: Runtime Layer → Stores (Zustand) → Sync Queue → API Layer → Backend.
- Deploy: Cloudflare Pages (frontend), Render (backend), Neon PostgreSQL (banco).
Progress
Done
- FASE 1 – Infraestrutura e Produção: Global prefix /api, dotenv, Helmet, Compression; ThrottlerModule (100 req/min global, 10 req/min auth); LoggerModule (nestjs-pino); Zod env validation; .env.example completo + .env.development/.staging/.production; rate limit no AuthController, @SkipThrottle no HealthController.
- FASE 2 – Deploy Cloud: render.yaml (web service + PostgreSQL free); scripts prisma:migrate:prod, prisma:deploy, postinstall no package.json do backend; _routes.json e _headers no frontend (Cloudflare Pages SPA); import.meta.env.VITE_API_URL no client.ts; .env.production no frontend; PWA build funcional (vite build).
- FASE 3 – PWA Produção: Manifest completo com display_override, categories, scope, start_url; componente InstallPwaBanner (beforeinstallprompt); componente OfflineIndicator (connectivityService); hook useConnectivity; animação slide-up no Tailwind; integração em App.tsx.
- FASE 4 – Teste Real de Campo: TEST_PLAN.md criado na raiz do projeto, cobrindo Cenário 1 (Online: login → pedal → sync), Cenário 2 (Offline: sessão persistida → dados locais), Cenário 3 (Reconexão: sync worker → upload batch), Checklist de Validação completo (autenticação, ride lifecycle, sync queue, sync worker, offline/reconexão, PWA, segurança/infra), Métricas de Sucesso.
- Ferramentas instaladas: @nestjs/throttler, helmet@7, compression, nestjs-pino, pino-http, pino, pino-pretty, @types/compression.
In Progress
- (none)
Blocked
- (none)
Key Decisions
- Helmet v7 (CommonJS) usado em vez de v8 (ESM-only) para compatibilidade com module: commonjs do NestJS.
- JWT secrets exigem mínimo 32 caracteres (Zod) – .env e .env.local atualizados.
- Runtime caching do Workbox removido para calls cross-origin (API em domínio diferente) – sync queue do IndexedDB é o mecanismo correto de offline-first.
- import.meta.env.VITE_API_URL usado no client.ts em vez de process.env.VITE_API_URL (não disponível no browser).
Next Steps
- Iniciar FASE 5 quando solicitado (análise de nova feature/pendência).
Critical Context
- Backend typecheck (pnpm typecheck --filter @cycling/api): ✅ passa.
- Frontend typecheck (pnpm typecheck --filter @cycling/web): ✅ passa.
- Frontend build (pnpm build --filter @cycling/web): ✅ passa (PWA gerado, 9 entries precached, ~831 KiB).
- Lint do backend (pnpm lint --filter @cycling/api): ❌ falha por prettier config ausente no .eslintrc.cjs (pré-existente, não relacionado às alterações).
- connectivityService usa health check em /api/health a cada 30s; o sync.worker tem API_BASE_URL = 'http://localhost:3000/api' hardcoded — precisa ser atualizado para produção.
- recoveryService restaura sessões não finalizadas do IndexedDB ao iniciar o app.
- sync.service cria Worker a partir de src/workers/sync.worker.ts e gerencia fila de tasks com polling a cada 10s.

✅ FASE 5 — Concluída
Backend (novo módulo analytics)
Arquivo	Função
apps/api/src/modules/analytics/analytics.service.ts	Agrega rides FINISHED → métricas + agrupamento semanal/mensal
apps/api/src/modules/analytics/analytics.controller.ts	GET /api/analytics (protegido JWT)
apps/api/src/modules/analytics/analytics.module.ts	Módulo NestJS registrado
apps/api/src/app.module.ts	Import do AnalyticsModule
Frontend
Arquivo	Função
apps/web/src/api/endpoints.ts	ANALYTICS_ENDPOINTS
apps/web/src/api/types.ts	AnalyticsResponseDto, WeeklyData, MonthlyData
apps/web/src/services/api.service.ts	Método getAnalytics()
apps/web/src/stores/analytics.store.ts	Zustand store (idle/loading/loaded/error)
apps/web/src/pages/Analytics.tsx	Página com 6 StatCards + 3 gráficos (Recharts)
apps/web/src/App.tsx	Rota /analytics adicionada
apps/web/src/components/layout/BottomNav.tsx	Item "Analytics" (◈)
apps/web/src/components/layout/Sidebar.tsx	Item "Analytics" (◈)
Métricas exibidas
- Resumo Geral: 6 StatCards (pedaladas, distância total, tempo total, velocidade média, maior velocidade, distância média)
- Gráfico 1: BarChart — Distância por semana
- Gráfico 2: BarChart — Distância por mês
- Gráfico 3: LineChart — Velocidade média por semana
Validação
- pnpm typecheck --filter @cycling/api → ✅
- pnpm typecheck --filter @cycling/web → ✅
- pnpm build --filter @cycling/web → ✅ (9 entries precached, ~856 KiB)