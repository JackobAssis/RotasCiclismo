Você é um desenvolvedor Frontend Senior trabalhando em um projeto já existente chamado Cycling Routes.

IMPORTANTE:
O projeto NÃO está começando do zero.

Grande parte da arquitetura, backend, stores, serviços, runtime, autenticação, GPS, sincronização offline, workers e integrações já existem e estão implementados.

Seu objetivo NÃO é criar lógica de negócio.

Seu objetivo é criar a ESTRUTURA VISUAL BASE do frontend para consumir os sistemas já existentes.

==================================================
TECNOLOGIAS OBRIGATÓRIAS
==================================================

Frontend:
- React
- TypeScript
- Vite
- TailwindCSS
- Zustand (já existente)
- React Router DOM
- Leaflet (já existente)

Backend:
- NestJS
- Prisma
- PostgreSQL

Arquitetura:
- Monorepo Turbo
- pnpm workspaces

==================================================
REGRA PRINCIPAL
==================================================

NÃO modificar:

- API Layer
- Auth Service
- Runtime Store
- Ride Store
- GPS Store
- Camera Store
- Sync Service
- Workers
- EventBus
- Backend

Tudo isso já existe.

O frontend deve APENAS consumir esses sistemas.

==================================================
OBJETIVO
==================================================

Criar uma interface visual moderna e organizada para o projeto.

O foco é criar:

- Layout
- Navegação
- Componentes visuais
- Dashboard
- Páginas
- Estrutura de UI

Mesmo que alguns dados sejam exibidos inicialmente como placeholders.

==================================================
ESTILO VISUAL
==================================================

Tema principal:

- Dark Theme
- Preto
- Verde Neon
- Verde Escuro

Inspirado em:

- Painéis futuristas
- Sistemas de navegação
- HUD de veículos
- Jarvis
- Laboratório digital
- Interface cyberpunk limpa

Características:

- Visual moderno
- Minimalista
- Responsivo
- Mobile First
- Bordas suaves
- Glassmorphism leve
- Ícones simples
- Boa legibilidade

==================================================
ESTRUTURA DE TELAS
==================================================

1. LOGIN

Campos:

- Email
- Senha

Botões:

- Entrar
- Criar conta

Consumir páginas já existentes:

- Login.tsx
- Signup.tsx

==================================================
2. HOME DASHBOARD
==================================================

Tela principal após login.

Exibir:

- Saudação ao usuário
- Última atividade
- Distância total
- Tempo pedalado
- Velocidade média
- Botão iniciar pedal

Cards modernos.

==================================================
3. RIDE SCREEN
==================================================

Tela principal de pedal.

Layout:

Topo:
- Status GPS
- Status bateria
- Status gravação

Centro:
- Mapa

Sobre o mapa:
- Widgets HUD existentes

Rodapé:
- Iniciar
- Pausar
- Finalizar
- Runtime Mode

Consumir componentes existentes:

- Map
- OverlayManager
- HudWidgets
- CameraSurface
- MinimapOverlay

==================================================
4. HISTORY SCREEN
==================================================

Histórico de pedaladas.

Lista de rides.

Cada card:

- Data
- Distância
- Duração
- Velocidade média

Clique abre detalhes.

==================================================
5. RIDE DETAILS
==================================================

Exibir:

- Mapa da rota
- Métricas
- Snapshots
- Informações gerais

==================================================
6. PROFILE SCREEN
==================================================

Exibir:

- Avatar
- Nome
- Email

Configurações:

- Tema
- Idioma
- Privacidade

==================================================
7. SETTINGS SCREEN
==================================================

Configurações gerais:

- Offline Sync
- Runtime Modes
- GPS
- Câmera
- Acessibilidade

==================================================
8. DEBUG SCREEN
==================================================

Interface visual para o sistema Debug já existente.

Mostrar:

- Eventos
- Sync Queue
- Runtime State
- GPS State
- Ride State

==================================================
LAYOUT GLOBAL
==================================================

Criar:

AppLayout

Com:

- Sidebar desktop
- Bottom navigation mobile

Menu:

- Home
- Pedalar
- Histórico
- Perfil
- Configurações
- Debug

==================================================
COMPONENTES REUTILIZÁVEIS
==================================================

Criar componentes base:

- PageHeader
- Card
- StatCard
- Section
- EmptyState
- LoadingState
- Button
- IconButton
- Modal
- Drawer
- Tabs
- Badge

==================================================
RESPONSIVIDADE
==================================================

Mobile First.

Prioridade:

1. Smartphone
2. Tablet
3. Desktop

==================================================
RESULTADO ESPERADO
==================================================

Criar um frontend visual completo e organizado para o projeto existente.

Não alterar lógica de negócio.

Não reimplementar stores.

Não recriar APIs.

Não modificar runtime.

Apenas construir a camada visual que consome os sistemas já existentes e deixar o projeto com aparência de aplicativo real pronto para evolução.


RESPOSTA:


 Thought: 284ms
Implementação concluída. Aqui está o resumo do que foi criado/modificado:
Estrutura Visual Criada
Tema Dark Neon
- tailwind.config.cjs — Cores neon (verde #39ff14), dark (preto), shadows neon, fontes
- styles/index.css — Glassmorphism, neon-glow, scrollbar custom, Leaflet dark
Componentes Reutilizáveis (components/ui/)
Componente	Descrição
Button	primary/secondary/ghost/danger, loading, ícones
IconButton	Botão circular com variantes
Card	default/glass/neon/flat com padding
StatCard	Card de métrica com label, valor, ícone, trend
PageHeader	Título + subtítulo + ações
Section	Seção com título opcional
EmptyState	Estado vazio com ícone e action
LoadingState	Spinner com mensagem, fullPage
Modal	Overlay modal com backdrop blur
Drawer	Slide-in left/right/bottom
Tabs	Abas horizontais estilizadas
Badge	Status badge success/warning/danger/info
Layout Global (components/layout/)
- Sidebar — Desktop (640px+), navegação com ícones, versão do app
- BottomNav — Mobile (<640px), 5 abas inferiores
- AppLayout — Wrapper com <Outlet /> para rotas protegidas
Páginas
Página	Status
Login.tsx	Refatorada com tema neon (lógica preservada)
Signup.tsx	Refatorada com tema neon (lógica preservada)
Home.tsx	Dashboard com saudação, stats cards, botão "Iniciar Pedal"
Ride.tsx	Refatorada com tema neon (toda lógica preservada)
Debug.tsx	Refatorada com cards neon, badges, layout responsivo
History.tsx	Nova — Lista de pedaladas com cards
RideDetails.tsx	Nova — Detalhes da pedalada (placeholder)
Profile.tsx	Nova — Avatar, stats, configurações da conta
Settings.tsx	Nova — Abas: Sync Offline, GPS, Câmera, Acessibilidade
Roteamento (App.tsx)
- Rotas públicas: /login, /signup
- Rotas protegidas com AppLayout: /, /history, /history/:rideId, /profile, /settings, /debug
- Rota protegida standalone: /ride (tela cheia, sem layout)
Nenhuma store, service, API layer, worker ou lógica de negócio foi modificada.