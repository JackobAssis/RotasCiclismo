# FASE 3 — Experiência de Pedalada (UX)

> Relatório de análise da tela de pedalada (`/ride`).
> Foco: qualidade de uso real durante uma pedalada de ciclismo.
> Nenhum código foi alterado — apenas análise.

---

## 1. Leitura Rápida (glance < 1s)

### Estado Atual

Todos os 5 widgets HUD usam tema claro (`bg-white/90`, `text-gray-600`, `text-blue-600`) sobre fundo escuro (`bg-dark-950`). A tela inteira tem tema dark, mas os widgets são ilhas de tema claro. Isso causa fadiga visual e baixa legibilidade em movimento.

### Classificação de Elementos

| Elemento | Essencial | Importante | Dispensável |
|---|---|---|---|
| Velocidade atual | ✅ | — | — |
| Distância total | — | ✅ | — |
| Duração | — | ✅ | — |
| Status GPS | ✅ | — | — |
| Status gravação | ✅ | — | — |
| Precisão GPS (±Xm) | — | — | ✅ |
| Texto "GPS + Camera" | — | — | ✅ |
| Modo de gravação label | — | — | ✅ |
| Painel debug (showDebugPanel) | — | — | ✅ |
| Barra de status inferior | — | — | ✅ (debug apenas) |
| RuntimeModeControls | — | — | ✅ (debug apenas) |

### Problemas Identificados

**P1.** Widgets em tema claro (`bg-white/90`) em app dark — inconsistência visual, contraste reduzido em luz solar.
**P2.** `text-xs` (12px) para labels — difícil ler em movimento.
**P3.** `text-gray-600` em labels — contraste ~5:1, insuficiente para luz solar direta.
**P4.** Precisão GPS (±Xm) ocupa espaço sem utilidade prática para o ciclista.
**P5.** Painel `RuntimeModeControls` e barra de status inferior ocupam ~40% da tela com informações de debug.
**P6.** HUD opacity 0.8-0.9 reduz ainda mais a legibilidade.

---

## 2. Hierarquia Visual

### Hierarquia Atual (por prioridade no OverlayManager)

1. GPS Status (priority 15) ← superestimado
2. Recording Status (priority 15) ← superestimado
3. Speed (priority 10)
4. Distance (priority 9)
5. Duration (priority 8)

### Hierarquia Proposta

| Informação | Destaque | Tamanho sugerido | Posição |
|---|---|---|---|
| **Velocidade** | Principal | `text-5xl` (48px) | Centro, terço inferior |
| **Distância** | Secundário | `text-2xl` (24px) | Abaixo da velocidade |
| **Duração** | Contextual | `text-base` (16px) | Junto da distância |
| **Status GPS** | Indicador | `text-sm` (14px) | Canto superior (compacto) |
| **Gravação** | Indicador | `text-sm` (14px) | Canto superior (compacto) |

### Problemas

**P7.** Velocidade (métrica mais importante) tem prioridade menor que GPS Status.
**P8.** Duração usa `text-2xl` (24px) — mesmo tamanho de Speed, poluição visual.
**P9.** Três widgets (Speed, Distance, Duration) competem no terço inferior com mesmo tamanho.
**P10.** Unidade "km/h" e "km" em `text-xs` — fácil de ignorar, mas essencial para contexto.

---

## 3. Uso sob Luz Solar (Modo Outdoor)

### Estado Atual

- Widgets: `bg-white/90` — reflexivo, ofuscante em sol forte
- Cores: pastéis (yellow-50, red-100, green-100, blue-50) — lavadas no sol
- Sombras: `shadow-lg` — perdem definição com luz ambiente forte
- Transparências: `backdrop-blur-sm` — reduz contraste
- Mapa: tiles coloridos padrão OSM — contraste médio

### Propostas

**MODO OUTDOOR (alta legibilidade):**

| Propriedade | Atual | Outdoor |
|---|---|---|
| Fundo widget | `bg-white/90` | `bg-dark-950/95` |
| Texto label | `text-gray-600` | `text-gray-300` |
| Valor | `text-blue-600` | `text-white` com `font-black` |
| Borda | `border-gray-200` | `border-white/20` |
| Transparência | `backdrop-blur-sm` | sem blur (sólido) |
| Opacidade HUD | 0.8-0.9 | 1.0 (fixo) |
| Fonte | weight: bold | weight: black (900) |
| Shadow | `shadow-lg` | `shadow-2xl` + stroke |

**P11.** Pastéis (yellow-50, red-100) no GPS/Recording são quase invisíveis no sol.
**P12.** `backdrop-blur` introduz ruído visual e reduz contraste.
**P13.** Opacidade HUD < 1.0 é a primeira coisa a sacrificar em modo outdoor.

---

## 4. Operação com Luvas

### Estado Atual

| Controle | Tamanho | Toque | Adequado? |
|---|---|---|---|
| Pausar/Retomar | `px-6 py-3` (~48px altura) | `pointer-events-auto` | ✅ mínimo |
| Finalizar | `px-6 py-3` (~48px altura) | `pointer-events-auto` | ✅ mínimo |
| Botões modo (GPS/Câmera/Mapa/Econ) | `flex-1 min-w-20 px-2 py-2` (~32px) | normal | ❌ pequeno |
| Indicadores de capacidade | ~28px | normal | ❌ pequeno demais |
| Minimap toggle | área total 112×80px | `pointer-events-auto` | ✅ |
| Minimap Close | `px-2 py-1` (~24px) | normal | ❌ muito pequeno |
| Camera Retry | `px-3 py-1` (~24px) | normal | ❌ muito pequeno |
| Camera Dismiss | `px-3 py-1` (~24px) | normal | ❌ muito pequeno |

### Problemas

**P14.** Todos os botões secundários (modos, indicadores, retry/dismiss, close) têm altura ≤32px — abaixo do mínimo de 44px (HIG Apple) / 48px (Material Design) para operação com luvas.
**P15.** Nenhum botão tem `touch-action: manipulation` (exceto minimap).
**P16.** Sem feedback háptico ou visual de toque em nenhum controle.
**P17.** Botões modo (GPS_ONLY, CAMERA_RECORD, MAP_FOCUS, LOW_BATTERY) são min-width 80px mas height 32px — difíceis de acertar com luva.

---

## 5. Layout da Gravação

### Layout Atual

```
┌────────────────────────────────┐
│ GPS Status    Recording Status │
│                                │
│         MAPA/CAMERA            │
│                                │
│                     Minimap    │
│                                │
│        [Pausar] [Finalizar]    │
├────────────────────────────────┤
│ Modo: GPS_ONLY ... debug       │
├────────────────────────────────┤
│ Status bar inferior            │
└────────────────────────────────┘
```

### Riscos

**P18.** Botão "Finalizar" (vermelho) fica a 12px (`gap-3`) de "Pausar" — risco alto de toque acidental em trepidação.
**P19.** Vermelho atrai atenção visual, aumentando probabilidade de erro.
**P20.** Sem confirmação de Finalizar — uma vez finalizado, a sessão é perdida se não salvou.
**P21.** Ambos os botões no mesmo container flex — layout lock, não adaptável.
**P22.** Em modo CAMERA_RECORD, os botões sobrepõem o viewfinder da câmera sem tratamento visual.

### Layout Proposto (mais seguro)

```
┌────────────────────────────────┐
│ GPS Rec                        │
│                                │
│         MAPA/CAMERA            │
│                                │
│          38.5 km/h             │ ← grande, central
│       12.3 km · 18:45          │ ← secundário
│                                │
│         [ ⏸ Pausar ]          │ ← grande, central, amarelo
│                                │
│                         [⏹]   │ ← Finalizar pequeno, canto, com confirmação
└────────────────────────────────┘
```

Estratégia:
- Pausar: centro inferior, destaque visual, toque fácil com luva
- Finalizar: deslocado para canto inferior direito, cor cinza (não vermelho), com diálogo de confirmação modal
- Sempre visível, nunca próximo ao Pausar

---

## 6. Modo Câmera (CAMERA_RECORD)

### Estado Atual

- Câmera: fullscreen, z-index 0
- Minimapa: bottom-right, w-28 h-20 (small)
- HUD: minimal (priority ≥ 15), opacity 0.8, scale 0.9
- Widgets visíveis: GPS Status + Recording Status + Speed
- Botões Pausar/Finalizar: sobrepostos ao viewfinder

### Problemas

**P23.** Minimapa em bottom-right COLIDE com posição dos botões de controle.
**P24.** HUD scale 0.9 reduz ainda mais a legibilidade em modo que já é crítico (câmera consome atenção).
**P25.** Apenas Speed visível — distância e duração ausentes.
**P26.** Recording mostra "GPS Only"/"GPS + Camera" — informação supérflua (usuário já escolheu o modo).
**P27.** Botões Pausar/Finalizar sobre o viewfinder da câmera sem semi-transparência ou contorno.

### HUD Proposto para Modo Câmera

```
┌────────────────────────────────┐
│ ● REC · GPS OK                │ ← compacto, topo
│                                │
│         VIEWFINDER             │
│                                │
│  ┌────────┐                    │
│  │Minimap │                    │ ← bottom-left (livre)
│  │  Live  │                    │
│  └────────┘                    │
│                                │
│    38.5 km/h                   │ ← grande, semi-transparente
│    12.3 km · 18:45             │
│                                │
│         [ ⏸ ]  [ ⏹ ]        │ ← semi-transparentes, cantos opostos
└────────────────────────────────┘
```

---

## 7. Emergências

### Lacunas Identificadas

**P28.** NÃO existe botão SOS. O evento `safety:sos` está definido em `events.ts` mas nunca é emitido.
**P29.** NÃO existe compartilhamento de localização em tempo real.
**P30.** NÃO existe warning de bateria fraca na tela de pedalada (runtime store tem `batteryPercent` mas não é exibido).
**P31.** NÃO existe detecção de perda de sinal GPS (o widget GPS mostra "Searching" mas sem alerta visual/auditivo).
**P32.** NÃO existe auto-pausa ao parar (útil para semáforos/descanso).
**P33.** NÃO existe detecção de queda/crash.

### Implementação Mínima Recomendada

| Funcionalidade | Prioridade | Esforço |
|---|---|---|
| Indicador de bateria no HUD | Alta | 1h |
| Aviso de GPS perdido (visual + vibração) | Alta | 2h |
| Botão SOS (compartilha localização via URL) | Alta | 4h |
| Auto-pausa após 60s parado | Média | 3h |
| Confirmação ao Finalizar | Média | 1h |
| Bateria crítica → notificação | Média | 2h |
| Detecção de queda | Futuro | 20h+ |

---

## 8. Consumo de Bateria

### Análise por Componente

| Componente | Consumo | Otimizável? |
|---|---|---|
| Mapa (Leaflet + tiles) | ⚡⚡⚡ Alto | Sim |
| Câmera (getUserMedia) | ⚡⚡⚡⚡ Muito alto | Sim |
| GPS (watchPosition) | ⚡⚡ Médio | Sim |
| HUD (re-renders) | ⚡ Baixo | Parcial |
| Minimapa (Leaflet interno) | ⚡⚡ Médio | Sim |
| UI geral (React) | ⚡ Mínimo | — |

### Estado Atual

- GPS: `enableHighAccuracy: true` no `gps.service.ts`, mas `false` no `gps.store.ts` — inconsistência.
- GPS frequency: sempre 1Hz, sem throttling real (o profile define mas não é aplicado).
- Câmera: sempre full resolution (constraint mínima).
- Mapa: tiles carregam mesmo com bateria baixa.
- `updateBatteryStatus` existe na runtime store mas **nunca é chamado**.
- Transições automáticas para LOW_BATTERY existem mas **nunca disparam** por falta de monitoramento.

### Propostas

#### Modo Econômico (ativado manualmente ou <30% bateria)

| Aspecto | Comportamento |
|---|---|
| GPS | `enableHighAccuracy: false`, ~0.5Hz |
| Mapa | Amostragem 200pts, sem animações, tiles cached |
| Camera | fps reduzido (15), resolução 720p |
| HUD | Minimal, sem minimapa |
| Minimapa | Desligado |
| Backdrop blur | Desligado |
| Animações | Desligadas (transition-all → none) |

#### Modo Ultra Econômico (ativado <10% bateria)

| Aspecto | Comportamento |
|---|---|
| GPS | ~0.2Hz, alta latência |
| Mapa | Snapshot PNG estático (sem tiles live) |
| Camera | Desligada |
| HUD | Apenas Speed + Bateria |
| Minimapa | Desligado |
| Atualizações tela | Apenas quando GPS atualiza |

### Problemas

**P34.** `updateBatteryStatus` nunca chamado — ninguém monitora bateria.
**P35.** `enableHighAccuracy` inconsistente entre gps.service.ts (true) e gps.store.ts (false).
**P36.** Nenhum throttling real de GPS frequency baseado em modo.
**P37.** Mapa e Camera podem rodar simultaneamente com bateria crítica (sem proteção automática).

---

## 9. Benchmark (Competidores)

### Comparação de Funcionalidades

| Funcionalidade | Strava | Komoot | RideWithGPS | Bikemap | **RotasCiclismo** |
|---|---|---|---|---|---|
| Speed grande/central | ✅ | ✅ | ✅ | ✅ | ❌ (médio, canto) |
| Distância | ✅ | ✅ | ✅ | ✅ | ✅ |
| Duração | ✅ | ✅ | ✅ | ✅ | ✅ |
| Elevação | ✅ | ✅ | ✅ | ✅ | ❌ |
| Média/Máx Speed | ✅ | ✅ | ✅ | ✅ | ❌ (calculado, não exibido) |
| Turn-by-turn voice | ❌ | ✅ | ✅ | ✅ | ❌ |
| Offline maps | ✅ (premium) | ✅ | ✅ | ✅ | ❌ |
| Breadcrumb trail | ✅ | ✅ | ✅ | ✅ | ✅ (parcial) |
| SOS/Live tracking | ✅ (Beacon) | ✅ (Live) | ✅ (Live) | ✅ | ❌ |
| Bluetooth sensors | ✅ | ✅ | ✅ | ✅ | ❌ |
| GPX import/export | ✅ | ✅ | ✅ | ✅ | ❌ |
| Post-ride summary | ✅ (detalhado) | ✅ | ✅ | ✅ | ❌ |
| Segment/Strava live | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audio cues | ✅ | ✅ | ✅ | ❌ | ❌ |
| Crash detection | ✅ | ❌ | ❌ | ❌ | ❌ |
| Photo capture | ✅ | ✅ | ✅ | ✅ | ❌ (tipo Snapshot existe, sem UI) |
| Route planning | ✅ | ✅ | ✅ | ✅ | ❌ |
| Dark mode | ✅ | ✅ | ✅ | ✅ | ✅ (parcial) |
| **Leitura rápida (<1s)** | ✅ | ✅ | ✅ | ✅ | ❌ |

### Funcionalidades Relevantes Ausentes

**P38.** Elevação total e perfil de elevação.
**P39.** Velocidade média e máxima visíveis durante a pedalada.
**P40.** Mapa offline (essencial em áreas sem sinal).
**P41.** Navegação turn-by-turn com voz.
**P42.** Suporte a sensores Bluetooth (cadência, frequência cardíaca, potência).
**P43.** Importação/exportação de rotas (GPX).
**P44.** Tela de resumo pós-pedalada.
**P45.** Compartilhamento de localização ao vivo.
**P46.** Alertas por áudio (ex: "5km percorridos").
**P47.** Captura de fotos durante a pedalada.

---

## RESUMO: Melhorias por Impacto

### 🔥 Alto Impacto

| # | Problema | Solução | Arquivo | Esforço |
|---|---|---|---|---|
| P1/P11 | Widgets claro em fundo escuro | Dark theme HUD (bg-dark-900/90, text-white, neon borders) | HudWidgets.tsx | 1h |
| P7 | Speed com prioridade menor | Reordenar prioridades (Speed→20, Distance→12, Duration→10, GPS→15, Rec→15) | HudWidgets.tsx | 15min |
| P7 | Speed mesmo tamanho de Duration | Speed: text-5xl (48px), Distance: text-2xl, Duration: text-lg | HudWidgets.tsx | 30min |
| P18/P19 | Finish vermelho ao lado de Pausar | Finish: cinza, canto inferior direito, com confirmação modal | Ride.tsx | 2h |
| P30/P34 | Sem indicador de bateria | Conectar Battery Status API, exibir % no HUD | Ride.tsx + runtime.store.ts | 2h |
| P31 | Sem alerta de perda de GPS | Efeito visual/vibração quando accuracy > 100m ou sem fix | GPSStatusWidget + Ride.tsx | 1h |
| P14 | Botões secundários < 44px | Aumentar todos para min-height: 48px | Ride.tsx, CameraSurface.tsx, MinimapOverlay.tsx | 1h |

### 📊 Médio Impacto

| # | Problema | Solução | Esforço |
|---|---|---|---|
| P4/P10 | Informação supérflua no HUD | Remover precisão GPS, modo de gravação | 30min |
| P5 | Painel debug ocupa 40% da tela | Remover em produção, tornar toggle acessível por shake | 30min |
| P12 | Backdrop-blur reduz legibilidade | Remover blur em modo outdoor, fundo sólido | 1h |
| P13 | HUD opacity < 1.0 | Remover ou limitar a modo câmera apenas | 15min |
| P23 | Minimap colide com botões | Movê-lo para bottom-left (CAMERA_RECORD) | 1h |
| P25 | Modo câmera sem distância/duração | Incluir DistanceWidget em minimal mode | 30min |
| P28 | Botão SOS | Adicionar ao HUD, compartilha localização por SMS/WhatsApp | 4h |
| P36 | GPS frequency não é respeitado | Implementar throttling real baseado no profile | 2h |

### 🔮 Futuro

| # | Funcionalidade | Justificativa | Esforço |
|---|---|---|---|
| P38 | Elevação + perfil | Esperado em qualquer app de ciclismo | 8h |
| P39 | Média/máx speed | Cálculo já existe no store, só falta exibir | 2h |
| P40 | Mapas offline | Essencial para ciclismo em áreas remotas | 40h+ |
| P41 | Navegação turn-by-turn | Diferencial competitivo | 60h+ |
| P42 | Sensores Bluetooth | Strava tem, Komoot tem — ciclistas sérios esperam | 30h |
| P43 | GPX import/export | Portabilidade de rotas | 8h |
| P44 | Resumo pós-pedalada | Fechamento da experiência | 6h |
| P45 | Live tracking | Segurança + engajamento social | 10h |
| P46 | Áudio cues | Útil sem olhar para tela | 4h |
| P47 | Fotos durante pedalada | Snapshot type já existe, falta UI | 3h |
| P32 | Auto-pausa | Evita perda de dados em paradas | 3h |
| P33 | Crash detection | Segurança | 20h+ |

---

## ROADMAP FASE 3A — Implementações Rápidas

> Prioridade: alta, esforço ≤ 2h cada.
> Total estimado: ~8h de implementação.

### 3A.1 — Hierarquia Visual (⭐⭐ impacto imediato)

1. Reordenar prioridades dos widgets:
   - Speed → priority 20
   - Distance → priority 12
   - Duration → priority 10
   - GPS Status → priority 15 (mantém)
   - Recording → priority 15 (mantém)
2. Speed: aumentar para `text-5xl` (48px) com `font-black`
3. Distance: manter `text-2xl`
4. Duration: reduzir para `text-base` (16px)
5. Remover unidades redundantes (km/h, km, hh:mm:ss) — mover para label

### 3A.2 — Dark Theme HUD (continuação da Fase 2)

6. Converter `bg-white/90` → `bg-dark-900/95`
7. Converter `backdrop-blur-sm` → sem blur (ou `backdrop-blur-md` mais sutil)
8. Converter `text-blue-600` → `text-white` (Speed)
9. Converter `text-green-600` → `text-white` (Distance)
10. Converter `text-purple-600` → `text-white` (Duration)
11. Converter `text-gray-600` → `text-gray-400` (labels)
12. Converter `border-gray-200` → `border-dark-700`
13. GPS/Recording: pastéis → versões dark
    - `bg-yellow-50 text-yellow-600` → `bg-yellow-500/10 text-yellow-400`
    - `bg-red-100 text-red-600` → `bg-red-500/10 text-red-400`
    - `bg-green-100 text-green-600` → `bg-green-500/10 text-green-400`
    - `bg-blue-50 text-blue-600` → `bg-blue-500/10 text-blue-400`
    - `bg-gray-100 text-gray-600` → `bg-gray-500/10 text-gray-400`

### 3A.3 — Botões Glove-Friendly

14. Aumentar `px-2 py-2` para `px-4 py-3` nos botões de modo
15. Garantir `min-h-[48px]` em todos os botões
16. Adicionar `touch-action: manipulation` em todos os controles

### 3A.4 — Layout de Gravação Seguro

17. Mover botão Finalizar para canto inferior direito, menor (só ícone `⏹`)
18. Adicionar `touch-action: manipulation` e `user-select: none` nos botões
19. Gap entre Pausar e Finalizar: aumentar para `gap-16` (64px) ou extremidades opostas

### 3A.5 — Indicador de Bateria

20. Conectar `navigator.getBattery()` na runtime store
21. Adicionar widget de bateria no HUD (priority 12, top-right, abaixo do Recording)
22. Mudar cor conforme nível (>30%: verde, 15-30%: amarelo, <15%: vermelho)

### 3A.6 — Alerta de Perda de GPS

23. Adicionar `role="alert"` e classe `animate-pulse` no GPS Status quando accuracy > 100m
24. Se status for "Searching" por > 10s, exibir aviso visual mais proeminente

---

## ROADMAP FASE 3B — Melhorias Avançadas

> Prioridade: médio-alta, esforço 3h-8h cada.
> Total estimado: ~30h de implementação.

### 3B.1 — Botão SOS

1. Adicionar `SOSWidget` no HUD (overlay layer, priority 25)
2. Ao tocar: abre modal com "Compartilhar localização" + SMS/WhatsApp intent
3. Gera URL com coordenadas atuais (`https://maps.google.com/?q=lat,lng`)
4. Dispara `eventBus.emit('safety:sos', { ... })`

### 3B.2 — Modo Outdoor (High Contrast)

5. Adicionar toggle no menu de modos
6. Aplica CSS override: `bg-opacity-100`, `text-white`, `font-black`, sem blur
7. Persistir preferência no localStorage

### 3B.3 — Velocidade Média e Máxima

8. Store já calcula. Adicionar ao widget de Speed (pequeno abaixo do valor atual):
   - `Média: 24.3 · Máx: 52.1`

### 3B.4 — Confirmação de Finalizar

9. Adicionar `window.confirm("Finalizar pedalada?")` ou modal custom
10. Se confirmado: mostrar loading + "Salvando..." antes de finalizar
11. Se recusado: retorna à pedalada sem ação

### 3B.5 — Auto-pausa por Inatividade

12. Detectar speed < 1km/h por > 60s
13. Automaticamente pausar gravação
14. Retomar automaticamente quando speed > 3km/h
15. Notificar usuário com toast + vibração

### 3B.6 — Áudio Cues

16. Usar Web Audio API ou `<audio>` para dicas:
   - "Gravando iniciada"
   - "5 quilômetros percorridos"
   - "Bateria baixa: 15%"
   - "Sinal GPS perdido"

### 3B.7 — Post-Ride Summary

17. Criar `/ride/summary/:id` com:
   - Mapa do percurso (estático)
   - Gráfico de elevação
   - Métricas: distância, duração, média, máx, elevação total
   - Botão compartilhar
   - Botão salvar/exportar GPX

### 3B.8 — Elevação no HUD

18. Adicionar widget de elevação (se altitude disponível)
19. Exibir: elevação atual + ganho total (já calculado no store)

---

## Checklist de Verificação (Pós-Implementação)

- [ ] `tsc --noEmit` limpo
- [ ] `vite build` limpo
- [ ] Todos os toques com luva ≥ 48px de altura
- [ ] HUD legível sob luz solar simulada
- [ ] Speed é o elemento mais proeminente da tela
- [ ] Finish não está ao lado de Pausar
- [ ] Bateria visível durante pedalada
- [ ] Perda de GPS é notificada visualmente
- [ ] Modo câmera tem métricas suficientes
- [ ] Modo outdoor ativável em 1 toque
- [ ] SOS acessível em até 2 toques
- [ ] Botão Finalizar exige confirmação
- [ ] Modo econômico reduz consumo real de bateria
- [ ] Todas as animações têm `prefers-reduced-motion: reduce`
- [ ] Safe-area insets aplicados para dispositivos com notch
