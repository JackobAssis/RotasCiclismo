Você é um Arquiteto de Software, Especialista em UX Mobile, PWA, GPS, Leaflet, Geolocalização, Performance Web e QA.

Analise COMPLETAMENTE este projeto de ciclismo.

Objetivo:
Transformar o sistema em um aplicativo estável, profissional, responsivo e utilizável em smartphones Android.

Realize uma auditoria completa.

Analise:

1. Estrutura do projeto
- organização de pastas
- modularização
- duplicação de código
- responsabilidades dos componentes
- acoplamento excessivo

2. Interface
- elementos desproporcionais
- botões muito grandes ou pequenos
- textos ilegíveis
- problemas de responsividade
- sobreposição de componentes
- acessibilidade
- UX para uso durante pedaladas

3. Sistema GPS
- obtenção da localização
- centralização automática do mapa
- atualização em tempo real
- precisão
- tratamento de perda de sinal
- consumo de bateria

4. Leaflet/OpenStreetMap
- inicialização do mapa
- gerenciamento de marcadores
- zoom automático
- performance
- vazamentos de memória

5. Sistema de Câmera
- verificar implementação
- verificar permissões
- verificar fluxo de abertura
- verificar exibição de vídeo
- identificar bugs

6. Performance
- gargalos
- renders desnecessários
- listeners duplicados
- timers duplicados
- consumo de memória
- consumo de CPU

7. Compatibilidade Mobile
- Android Chrome
- PWA
- orientação retrato
- orientação paisagem
- diferentes resoluções

8. Bugs
Identifique:
- bugs críticos
- bugs médios
- bugs leves
- funcionalidades incompletas
- funcionalidades quebradas

9. Segurança
- permissões
- armazenamento local
- validações
- tratamento de erros

10. Código
- trechos problemáticos
- más práticas
- oportunidades de refatoração

Ao final gere:

# RELATÓRIO DE AUDITORIA

Com:

## Problemas Críticos
(lista)

## Problemas Médios
(lista)

## Problemas Menores
(lista)

## Melhorias Recomendadas
(lista)

## Roadmap de Correção

Fase 1 - Correções Críticas
Fase 2 - GPS
Fase 3 - Interface
Fase 4 - Câmera
Fase 5 - Performance
Fase 6 - Refatoração

Para cada item informar:

- arquivo
- problema encontrado
- impacto
- solução sugerida
- nível de dificuldade
- prioridade

NÃO altere código.

Somente analise e gere o relatório.



RESPOSTA:


RELATÓRIO DE AUDITORIA - RotasCiclismo
Resumo da Arquitetura Atual
Monorepo Turborepo (pnpm) com frontend React + Vite + Zustand + Tailwind + Leaflet, backend NestJS + Prisma + PostgreSQL. O frontend tem arquitetura modular com stores, services, hooks, workers e sistema de runtime modes (GPS_ONLY, CAMERA_RECORD, MAP_FOCUS, LOW_BATTERY). O projeto compila sem erros TypeScript.
Problemas Críticos
1. GPS Service é placeholder não funcional
- Arquivo: apps/web/src/services/gps.service.ts
- Problema: Apenas 7 linhas. startWatch() retorna null. stopWatch() é vazia. O serviço não implementa navigator.geolocation.watchPosition.
- Impacto: CRÍTICO - O sistema de tracking GPS, funcionalidade central do app, não existe. O app usa dados mock.
- Solução: Implementar startWatch() com navigator.geolocation.watchPosition, gerenciamento de watchId, tratamento de erros e cleanup.
- Dificuldade: Média | Prioridade: 1
2. Mock GPS ativado por padrão em produção
- Arquivo: apps/web/src/App.tsx:62
- Problema: <RidePage enableMockGPS={true} />. Em produção, o app roda com dados GPS falsos (movimento senoidal em São Paulo).
- Impacto: CRÍTICO - App completamente inútil para ciclismo real se implantado como está.
- Solução: enableMockGPS deve ser false por padrão ou vinculado a import.meta.env.DEV.
- Dificuldade: Mínima | Prioridade: 1
3. Hook useWatchPosition nunca é utilizado
- Arquivo: apps/web/src/hooks/useWatchPosition.ts
- Problema: O hook existe e integra com gps.store, mas a RidePage nunca o chama. A RidePage usa createMockGPSUpdates() diretamente. O gps.store nunca tem startTracking() chamado.
- Impacto: CRÍTICO - Todo o ecossistema GPS (store, worker, hooks) existe mas é inoperante.
- Solução: Substituir createMockGPSUpdates na RidePage por useWatchPosition(true).
- Dificuldade: Média | Prioridade: 1
4. Service Worker customizado vazio sobrescreve configuração do Workbox
- Arquivo: apps/web/src/service-worker.ts
- Problema: Apenas install (skipWaiting) e activate (claim). Sem cache strategy, sem offline fallback. O vite.config.ts configura Workbox com globPatterns e navigateFallback, mas o service-worker customizado substitui o gerado pelo plugin.
- Impacto: CRÍTICO - PWA não funciona offline. Cache é zero. App sem funcionalidade offline.
- Solução: Remover service-worker.ts customizado e deixar apenas o gerado pelo vite-plugin-pwa, ou implementar cache strategies completas.
- Dificuldade: Média | Prioridade: 1
5. Parse manual de JWT no frontend
- Arquivo: apps/web/src/utils/tokenManager.ts:148-163
- Problema: decodeToken() faz atob(parts[1].replace(...)) manual. JWT payload pode ser grande (>4KB com btoa), e atob quebra com caracteres non-Latin1. Também expõe estrutura do token.
- Impacto: ALTO - Pode quebrar o login se o payload do JWT contiver caracteres especiais ou for extenso.
- Solução: Usar biblioteca como jwt-decode ou validar pelo backend. Nunca parsear JWT manualmente no frontend.
- Dificuldade: Baixa | Prioridade: 2
6. Remontagem completa do mapa ao mudar modo de runtime
- Arquivo: apps/web/src/components/Map.tsx:214-282
- Problema: Quando shouldShowMap muda de true para false e vice-versa, o MapContainer é totalmente desmontado/remontado. Isso recria a instância Leaflet do zero, perde tiles carregados e causa flicker.
- Impacto: ALTO - Consumo extra de CPU/memória em transições de modo. Experiência ruim com flicker.
- Solução: Usar CSS visibility: hidden/visible ou opacity em vez de render condicional. Manter o MapContainer montado sempre.
- Dificuldade: Média | Prioridade: 2
7. Instância do connectivityService sem cleanup em hot-reload
- Arquivo: apps/web/src/services/connectivity.service.ts:249
- Problema: connectivityService é instanciado como singleton no módulo com setInterval de health check a cada 30s. Em hot-reload do Vite, o módulo é reexecutado criando múltiplos intervals e listeners.
- Impacto: ALTO - Vazamento de memória em desenvolvimento. Múltiplos health checks simultâneos.
- Solução: Implementar destroy() e chamar cleanup. Ou usar um singleton com verificação de inicialização prévia.
- Dificuldade: Baixa | Prioridade: 2
Problemas Médios
8. EventBus listeners registrados sem cleanup retornado
- Arquivos: apps/web/src/services/storage.service.ts (linhas 102-225), apps/web/src/stores/ride.store.ts:216-229
- Problema: eventBus.on() retorna uma função unsub(), mas ela nunca é chamada. Se o módulo for recarregado (hot-reload), novos listeners são adicionados sem remover os antigos.
- Impacto: MÉDIO - Listeners duplicados em dev. Eventos processados múltiplas vezes.
- Solução: Armazenar funções unsub e chamá-las em cleanup.
- Dificuldade: Baixa | Prioridade: 3
9. setTimeout para invalidateSize sem limpeza em unmount
- Arquivo: apps/web/src/components/MinimapOverlay.tsx:30-37
- Problema: setTimeout(() => map.invalidateSize(), 120) no MapInner. Se o componente desmontar antes do timeout, o callback executa em mapa desmontado, causando erro.
- Impacto: MÉDIO - Erros silenciosos em console e potencial memory leak.
- Solução: Armazenar timeoutRef e limpar no return do useEffect.
- Dificuldade: Baixa | Prioridade: 3
10. Import de tipos com caminho relativo longo e frágil
- Arquivos: apps/web/src/stores/ride.store.ts:2, gps.store.ts:2, camera.store.ts:2
- Problema: ../../../../packages/types/src/index - caminho relativo que quebra se a estrutura mudar. Deveria usar alias do monorepo (ex: @project/types).
- Impacto: MÉDIO - Manutenção frágil. Refatorações de estrutura quebram imports.
- Solução: Configurar aliases no tsconfig.json do web app para apontar para os pacotes internos.
- Dificuldade: Baixa | Prioridade: 4
11. Streaming de pontos (recovery) concorre com escrita ativa
- Arquivo: apps/web/src/services/storage.service.ts:346-375 e apps/web/src/services/recovery.service.ts:17-51
- Problema: streamPointsForRide abre um cursor IDB para ler pontos enquanto flushPointsBatch continua escrevendo. Pode haver race condition se uma pedalada estiver ativa durante o recovery.
- Impacto: MÉDIO - Pontos podem ser perdidos ou duplicados no恢复.
- Solução: Implementar mutex de leitura/escrita no IndexedDB ou usar um único store ativo por vez.
- Dificuldade: Alta | Prioridade: 3
12. Tema claro no componente de loading do AuthBootstrap
- Arquivo: apps/web/src/components/AuthBootstrap.tsx:70 e ProtectedRoute.tsx:41
- Problema: bg-white dark:bg-neutral-950 - o projeto inteiro usa tema escuro, mas o loading inicial usa fundo branco. Causa flash branco na inicialização.
- Impacto: MÉDIO - Experiência visual quebrada no startup. Flash branco.
- Solução: Usar bg-dark-950 diretamente, sem tema claro.
- Dificuldade: Mínima | Prioridade: 3
13. console.warn sem guard de produção
- Arquivos: Diversos (camera.store.ts:79, runtime.store.ts:118, storage.service.ts:68, etc.)
- Problema: console.warn com informações internas expostas em produção.
- Impacto: MÉDIO - Poluição de console, informação interna vazada.
- Solução: Criar logger utilitário que silencia em produção.
- Dificuldade: Baixa | Prioridade: 4
14. Ícones PWA em SVG em vez de PNG
- Arquivo: apps/web/public/manifest.json:13-23
- Problema: Manifest declara ícones como image/svg+xml. Suporte a SVG em ícones PWA é inconsistente no Android. Muitos launchers ignoram SVG.
- Impacto: MÉDIO - Ícone pode não aparecer ao instalar o PWA no Android.
- Solução: Gerar ícones PNG em múltiplos tamanhos (192, 512) e referenciá-los no manifest.
- Dificuldade: Baixa | Prioridade: 3
15. Câmera: autoplay pode ser bloqueado em mobile
- Arquivo: apps/web/src/components/CameraSurface.tsx:38-40
- Problema: el.play() é chamado sem interação do usuário. Navegadores mobile (especialmente Chrome Android) bloqueiam autoplay de vídeo sem gesto do usuário.
- Impacto: MÉDIO - Câmera pode iniciar mas o vídeo não renderizar até interação.
- Solução: Adicionar um overlay "Toque para ativar câmera" que chama play() no click.
- Dificuldade: Baixa | Prioridade: 3
Problemas Menores
16. Uso de window as any para dados globais (type safety)
- Arquivo: apps/web/src/stores/gps.store.ts:91
- Problema: (window as any).__gps_cleanup - poluição do objeto window sem tipagem.
- Impacto: BAIXO - Perde type safety, mas funcional.
- Solução: Usar declare global { interface Window { __gps_cleanup?: () => void } }.
- Dificuldade: Mínima | Prioridade: 5
17. Cálculo de distância recalculado em cada addPoint sem memoização
- Arquivo: apps/web/src/stores/ride.store.ts:120-179
- Problema: Haversine calculado para cada ponto (O(1) por ponto é aceitável, mas o cálculo usa Math.sin/cos repetidamente).
- Impacto: BAIXO - Operação matemática leve, mas chamada a 1Hz durante pedalada.
- Solução: Pré-calcular em worker ou usar aproximações para pontos muito próximos.
- Dificuldade: Média | Prioridade: 5
18. Input range/botões sem min e max definidos no componente de debug
- Arquivo: apps/web/src/pages/Ride.tsx (botões de modo)
- Problema: Botões na RidePage não têm aria-label ou role adequados para acessibilidade.
- Impacto: BAIXO - Acessibilidade comprometida para leitores de tela.
- Solução: Adicionar aria-label e aria-pressed nos botões de modo.
- Dificuldade: Mínima | Prioridade: 5
19. BottomNav com 6 itens para mobile
- Arquivo: apps/web/src/components/layout/BottomNav.tsx:3-10
- Problema: 6 itens de navegação. Guideline do Material Design recomenda máximo de 5. Em telas pequenas, os textos ficam truncados.
- Impacto: BAIXO - UI apertada em dispositivos muito pequenos (320px width).
- Solução: Reduzir para 5 itens, mover "Settings" e "Debug" para o Perfil.
- Dificuldade: Baixa | Prioridade: 5
20. Duplicação de código: sampleRoutePoints definido duas vezes
- Arquivos: apps/web/src/components/Map.tsx:38-54 e MinimapOverlay.tsx:11-18
- Problema: A mesma função sampleRoutePoints está definida em dois lugares com implementação idêntica.
- Impacto: BAIXO - Violação DRY, manutenção duplicada.
- Solução: Mover para packages/utils ou src/utils.
- Dificuldade: Mínima | Prioridade: 5
21. Botões de controle da pedalada sem touch-action: manipulation
- Arquivo: apps/web/src/pages/Ride.tsx:316-344
- Problema: Botões Pausar/Retomar/Finalizar não têm CSS touch-action: manipulation, o que pode causar delay de 300ms em alguns navegadores mobile.
- Impacto: BAIXO - Micro-atraso na resposta ao toque.
- Solução: Adicionar touch-action: manipulation via Tailwind (touch-action-manipulation).
- Dificuldade: Mínima | Prioridade: 5
Melhorias Recomendadas
MR1 - Sistema de Logger Centralizado
Criar src/lib/logger.ts com níveis (debug, info, warn, error) que silencia em produção. Substituir todos os console.warn, console.log e console.error diretos.
MR2 - Progressive Route Sampling com Web Worker
Implementar algoritmo Douglas-Peucker no gps.worker.ts (atualmente placeholder) para simplificação de rotas em background, em vez de amostragem uniforme que pode perder curvas importantes.
MR3 - Transições CSS entre Runtime Modes
Em vez de render condicional (que desmonta componentes), usar class transitions com opacity, scale, transform para transições suaves entre GPS_ONLY, CAMERA_RECORD, MAP_FOCUS.
MR4 - Estado de tracking na RidePage para GPS real
Implementar indicador de "GPS signal lost" quando watchPosition falhar, com fallback para última posição conhecida e contagem regressiva para pausa automática.
MR5 - Testes E2E para fluxo de pedalada
Criar teste Cypress/Playwright para: abrir /ride, verificar que GPS mock está desativado (em produção), iniciar pedalada, pausar, finalizar.
MR6 - Limpeza de dados antigos do IndexedDB
Implementar política de retenção: apagar sessões com mais de 30 dias e seus pontos associados para evitar crescimento infinito do IndexedDB.
Roadmap de Correção
Fase 1 - Correções Críticas (Prioridade Máxima)
#	Arquivo	Problema	Prioridade
1	services/gps.service.ts	GPS service não implementado	P0
2	App.tsx:62	Mock GPS ativado em produção	P0
3	pages/Ride.tsx	RidePage não usa tracking real	P0
4	service-worker.ts	SW vazio, offline quebrado	P0
5	tokenManager.ts	Parse manual de JWT	P0
Fase 2 - GPS e Tracking
#	Arquivo	Problema	Prioridade
6	stores/gps.store.ts	Store OK mas não conectada à UI	P1
7	hooks/useWatchPosition.ts	Hook existe mas não usado	P1
8	workers/gps.worker.ts	Worker de GPS é placeholder	P1
9	pages/Ride.tsx	Remover mock GPS em produção	P1
Fase 3 - Interface e UX
#	Arquivo	Problema	Prioridade
10	components/Map.tsx	Remontagem do mapa em modo change	P1
11	AuthBootstrap.tsx	Flash branco no loading	P2
12	BottomNav.tsx	6 itens na bottom nav	P2
13	Ride.tsx	touch-action nos botões	P3
Fase 4 - Câmera
#	Arquivo	Problema	Prioridade
14	CameraSurface.tsx	Autoplay bloqueado em mobile	P2
15	camera.store.ts	Sem tratamento de erro específico por tipo	P2
16	modules/camera/types.ts	Verificar se tipos de câmera estão completos	P3
Fase 5 - Performance e Memória
#	Arquivo	Problema	Prioridade
17	connectivity.service.ts	Múltiplos intervals em hot-reload	P1
18	storage.service.ts	EventBus listeners sem cleanup	P2
19	MinimapOverlay.tsx	setTimeout sem cleanup	P2
20	ride.store.ts	Cálculo Haversine em cada ponto	P3
Fase 6 - Refatoração e Manutenibilidade
#	Arquivo	Problema	Prioridade
21	Múltiplos	console.warn sem guard	P2
22	Múltiplos	Imports por caminho relativo longo	P2
23	Map.tsx/MinimapOverlay.tsx	sampleRoutePoints duplicado	P3
24	manifest.json	Ícones SVG precisam de PNG	P2
25	Múltiplos	window as any sem tipagem	P3
Métricas do Projeto
- Arquivos fonte frontend: ~75 TS/TSX
- Stores Zustand: 14
- Services: 8 (2 placeholders: gps.service, gps.worker)
- Componentes React: 28
- Páginas: 10
- Workers Web: 2 (1 placeholder: gps.worker)
- Hooks: 4
- Testes: 17 suites (Vitest/RTL)
Conclusão
O projeto tem arquitetura excelente no papel: monorepo organizado, stores modulares, runtime modes, PWA configurado, sistema de sync offline, recovery service. Porém, as funcionalidades centrais (GPS, Mapa real, Service Worker, Camera) estão em estado de placeholder ou mock.
O maior risco é que o GPS real nunca foi testado - todo o ecossistema GPS foi construído (store, worker, hooks, service) mas a integração final (chamar useWatchPosition na RidePage em vez de mock) não foi feita. Isso sugere que o projeto pode ter sido desenvolvido parcialmente por IA ou em etapas sem validação funcional completa.
Prioridade zero: Conectar o pipeline GPS real e desativar o mock antes de qualquer deploy em produção.