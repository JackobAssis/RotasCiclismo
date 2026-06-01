Sprint 3 — Resolver os problemas técnicos

Da lista que você trouxe:

Leaflet

Instalar:

pnpm add leaflet
pnpm add -D @types/leaflet

Verificar compatibilidade:

react-leaflet
leaflet

Ideal:

Leaflet 1.9.x
React-Leaflet 4.x
Workspace Packages

Garantir build:

pnpm build

para:

@cycling/types
@cycling/utils
@cycling/ui
Prisma

Validar:

docker-compose up -d

pnpm prisma:generate

pnpm prisma:migrate
Sprint 4 — Transformar em produto

Quando o Sync estiver funcionando.

Ride History

Adicionar:

filtros
busca
paginação
Ride Details

Adicionar:

gráfico de velocidade
gráfico de altitude
mapa completo
Dashboard

Adicionar:

total km
tempo pedalado
média semanal
metas
Perfil

Adicionar:

foto
preferências
privacidade
Sprint 5 — PWA Real

Hoje existe base.

Depois:

manifest completo
service worker real
cache offline
instalação Android
ícones



RESPOSTA:


Everything is working. Let me mark the final tasks.
# Todos
[✓] Start backend API (docker + pnpm dev)
[✓] Start frontend dev server and validate
[✓] Sprint 5 (PWA): icons + service worker + manifest + vite plugin
Tudo operacional. Resumo do que foi feito:
Sprint 5 (PWA) concluído:
- vite-plugin-pwa instalado e configurado com Workbox
- Ícones SVG criados em public/icons/ (bicicleta neon no estilo do tema)
- manifest.json atualizado com ícones maskable, tema #0d2818, standalone, pt-BR
- Service worker gerado automaticamente pelo Workbox (9 entradas precacheadas, ~826 KB)
- Cache runtime para API (NetworkFirst com 7 dias de expiração)
- index.html atualizado com meta tags PWA (theme-color, apple-mobile-web-app, viewport-fit=cover)
- 2 erros TS no RideDetails.tsx corrigidos (tooltip formatter typing)
Status dos serviços:
Serviço	Porta	Status
PostgreSQL (PostGIS)	5432	✅ healthy
Backend NestJS	3000	✅ running
Frontend Vite	5173	✅ running
CORS	—	✅ configurado
PWA SW	—	✅ gerado
Próximo passo sugerido: testar fluxo offline-first completo — iniciar pedalada offline → gerar pontos → finalizar → conectar internet → verificar sincronização via console ([SyncQueue] / [SyncWorker]).