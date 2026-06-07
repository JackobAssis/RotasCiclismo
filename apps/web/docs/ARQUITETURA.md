# ARQUITETURA — RotasCiclismo

## Estrutura de Diretórios

```
apps/web/src/
├── components/          # Componentes React
│   ├── camera/          # CameraSurface + sub-componentes
│   │   ├── CameraActive.tsx
│   │   ├── CameraError.tsx
│   │   ├── CameraIdle.tsx
│   │   ├── CameraLoading.tsx
│   │   └── index.ts
│   ├── layout/          # Layout da aplicação
│   │   ├── AppLayout.tsx
│   │   ├── BottomNav.tsx
│   │   └── Sidebar.tsx
│   ├── overlay/         # HUD overlay layer extraído
│   │   ├── HudOverlayLayer.tsx
│   │   └── index.ts
│   ├── ui/              # Componentes atômicos (Badge, Button, Card, Modal, etc.)
│   ├── widgets/         # Widgets HUD (1 componente + container cada)
│   │   ├── SpeedWidget.tsx
│   │   ├── DistanceWidget.tsx
│   │   ├── DurationWidget.tsx
│   │   ├── GPSStatusWidget.tsx
│   │   ├── RecordingStatusWidget.tsx
│   │   ├── BatteryWidget.tsx
│   │   └── index.ts
│   ├── CameraSurface.tsx    # Orquestrador (importa de components/camera/)
│   ├── HudWidgets.tsx       # Barrel re-export (importa de components/widgets/)
│   ├── Map.tsx
│   ├── MinimapOverlay.tsx
│   ├── OverlayManager.tsx   # Orquestrador (importa HudOverlayLayer)
│   └── ... (AuthBootstrap, OfflineIndicator, ProtectedRoute)
│
├── hooks/               # Custom hooks React
│   ├── useMediaStream.ts    # Hook de stream de vídeo (extraído de CameraSurface)
│   ├── useWatchPosition.ts  # Hook de GPS watch
│   └── ... (ex- useAuth.ts, useConnectivity.ts — removidos por dead code)
│
├── modules/             # Módulos de domínio (tipos + lógica pura)
│   ├── auth/            # Tipos de autenticação
│   ├── camera/          # Tipos de câmera (permission, status, stream)
│   ├── gps/             # Tipos de GPS (placeholder)
│   ├── hud/             # Tipos de HUD + componente Speed reutilizável
│   ├── rides/           # Tipos de ride (placeholder)
│   └── runtime/         # RuntimeMode, RenderingProfile, ModeCapabilities
│
├── pages/               # Páginas da aplicação (10 páginas)
│
├── services/            # Serviços (singletons, camada de infraestrutura)
│   ├── api.service.ts       # Abstração HTTP (delega para apiClient)
│   ├── auth.service.ts      # Autenticação (signup, signin, refresh)
│   ├── connectivity.service.ts  # Monitoramento online/offline
│   ├── storage.service.ts   # Persistência IndexedDB
│   ├── sync.service.ts      # Sincronização via Web Worker
│   ├── recovery.service.ts  # Recuperação de sessões
│   └── api.init.ts          # Inicialização da camada de API
│                   
├── stores/              # Stores Zustand
│   ├── ride.store.ts        # RideSession + pontos
│   ├── runtime.store.ts     # Modo de renderização + perfil
│   ├── gps.store.ts         # Watch position + buffer
│   ├── camera.store.ts      # Stream de câmera
│   ├── auth.store.ts        # Autenticação
│   ├── minimap.store.ts     # Estado do minimapa
│   ├── profile.store.ts     # Perfil do usuário
│   ├── history.store.ts     # Histórico de rides
│   ├── analytics.store.ts   # Analytics
│   └── settings.store.ts    # Configurações
│
├── utils/               # Utilitários puros (extraídos de componentes)
│   ├── geo.ts               # sampleRoutePoints, calculateDistance
│   └── map.ts               # createPositionMarker, POLYLINE_OPTIONS
│
├── lib/
│   └── eventBus.ts          # Singleton TypedEventBus<AppEvents>
│
├── workers/             # Web Workers
│   ├── gps.worker.ts
│   ├── sync.worker.ts
│   └── sync-api.ts
│
└── api/                 # Cliente HTTP + interceptors + tipos
    ├── client.ts
    ├── endpoints.ts
    ├── interceptors.ts
    └── types.ts
```

---

## Fluxos Principais

### Fluxo GPS

```
Browser Geolocation API
  → gps.store.watchPosition()
    → buffer.push(point) [immutable]
    → flushBuffer() [a cada 1s ou 10pts]
      → eventBus.emit('points:received', batch)  [batch]
      → eventBus.emit('point:received', pt)       [legacy]
      → eventBus.emit('gps:flushed', { count, at })
        → ride.store (subscription)
          → addPoint() (single)
          → batch handler (bulk)
            → Haversine → active.distance
            → useRideStore.setState({ active: { ...s } })
              → UI re-render via selectores granulares
```

### Fluxo Câmera

```
Ride.tsx useEffect [currentMode === CAMERA_RECORD]
  → camera.store.requestPermissionAndStart(options)
    → INITIALIZING guard
    → stopStream() [cleanup anterior]
    → getUserMediaWithTimeout(fps, resolution) [15s timeout]
      → fallback: environment → any → user
      → success: track.getSettings() → STREAMING
      → failure: classifyCameraError() → ERROR
        → CameraSurface
          → useMediaStream hook → video.srcObject = stream
          → sub-componentes:
              INITIALIZING → <CameraLoading />
              IDLE        → <CameraIdle />
              ERROR       → <CameraError onRetry={...} />
              STREAMING   → <CameraActive facingMode={...} />
```

### Fluxo Ride

```
RidePage mount
  → useRideStore.getState().active check
  → startRide({ id, mode: 'GPS_ONLY' })
    → set({ active: session, status: 'active' })
    → eventBus.emit('ride:started', session)

  → useWatchPosition(!enableMockGPS, gpsOptions)
    → gps.store.startTracking(options)
      → watchPosition + interval flush

  → a cada ponto:
    → ride.store batch handler (via eventBus)
      → Haversine distance
      → setState → UI via selectores individuais
      
  → pauseRide / resumeRide / finishRide
    → eventBus.emit('ride:paused/resumed/finished')
    → storage.service persiste (via eventBus subscription)
```

### Fluxo Runtime

```
RuntimeStore
  ├── currentMode: GPS_ONLY | CAMERA_RECORD | MAP_FOCUS | LOW_BATTERY
  ├── setMode(mode)
  │   → valida transição
  │   → invalida cache de profile
  │   → notifica componentes
  ├── getRenderingProfile()
  │   → retorna RENDERING_PROFILES[currentMode]
  │   → cache via _cachedProfile
  ├── Conveniência hooks:
  │   → useRenderingProfile()        [seleciona currentMode + cache]
  │   → useModeCapabilities()        [seleciona currentMode + cache]
  │   → useShouldShowMap() / HUD()
  │   → useHudDensity()
  │
  └── Adaptação automática:
      → updateBatteryStatus(percent)
        → attemptAutomaticModeTransition()
          → MODE_TRANSITION_RULES
          → LOW_BATTERY se < 15%
```

---

## Stores

| Store | State | Atualiza | Frequência |
|---|---|---|---|
| `ride.store` | active (RideSession), status | addPoint, pause/resume/finish | ~1Hz (GPS) |
| `gps.store` | buffer, lastPosition, status | watchPosition callback | ~1Hz |
| `runtime.store` | currentMode, battery, profiles | setMode, battery events | Raro |
| `camera.store` | permission, status, stream, error | requestPermissionAndStart | Raro |
| `minimap.store` | expanded | user toggle | Raro |
| `auth.store` | user, tokens, isAuthenticated | signin/signup/logout | Raro |

---

## EventBus (TypedEventBus<AppEvents>)

| Evento | Emissor | Consumidor |
|---|---|---|
| `ride:started` | ride.store | storage.service |
| `ride:paused` | ride.store | storage.service |
| `ride:resumed` | ride.store | storage.service |
| `ride:finished` | ride.store | storage.service |
| `point:received` | gps.store (legacy) | ride.store |
| `points:received` | gps.store (batch) | ride.store (batch handler) |
| `ride:point:added` | ride.store | storage.service |
| `gps:flushed` | gps.store | Debug UI |
| `snapshot:taken` | future | ride.store |
| `ride:snapshot:added` | ride.store | storage.service |
| `sync:manual:*` | Settings UI | sync.service |

---

## Refatorações Realizadas (Fase 6)

| Arquivo | ANTES | DEPOIS | Redução |
|---|---|---|---|
| `HudWidgets.tsx` | 384 linhas, 13 unidades | barrel re-export (3 linhas) | -381 linhas |
| `CameraSurface.tsx` | 205 linhas, 4 sub-componentes | 63 linhas (orquestrador) | -142 linhas |
| `OverlayManager.tsx` | 386 linhas | 214 linhas | -172 linhas |
| `Map.tsx` | 237 linhas | 126 linhas | -111 linhas |
| **Total** | **1212 linhas** | **406 linhas** | **-806 linhas** |

| Arquivo | Status |
|---|---|
| `services/gps.service.ts` | Removido (100% dead code) |
| `hooks/useAuth.ts` | Removido (100% dead code) |
| `hooks/useConnectivity.ts` | Removido (100% dead code) |
| `hooks/useGPS.ts` | Removido (100% dead code) |

### Novos arquivos criados

| Arquivo | Linhas | Propósito |
|---|---|---|
| `utils/geo.ts` | 29 | sampleRoutePoints, calculateDistance (Haversine) |
| `utils/map.ts` | 20 | createPositionMarker, defaults, polylineOptions |
| `hooks/useMediaStream.ts` | 30 | Hook de anexação de stream de vídeo |
| `components/camera/` (4+1) | ~80 | Sub-componentes da câmera |
| `components/widgets/` (6+1) | ~350 | Widgets HUD individuais |
| `components/overlay/` (1+1) | ~120 | HudOverlayLayer extraído |

### Bugs corrigidos

1. `connectivity.service.ts`: `removeEventListener` com funções anônimas nunca funcionava — listeners vazavam. Corrigido com `boundOnline`/`boundOffline` (named handlers).
