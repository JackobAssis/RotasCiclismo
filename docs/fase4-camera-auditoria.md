# FASE 4 — Auditoria e Correções do Sistema de Câmera

## ETAPA 1 — Fluxo Completo

```
User ativa CAMERA_RECORD
         │
         ▼
Ride.tsx: ensureCameraForMode()
         │
         ├─ profile.camera.visible = true → CameraSurface monta
         │
         ▼
camera.store.requestPermissionAndStart()
         │
         ├─ Verifica se já está INITIALIZING (race guard)
         ├─ Para stream anterior se existir (stop all tracks)
         │
         ▼
camera.store.startStream()
         │
         ├─ Verifica navigator.mediaDevices.getUserMedia
         ├─ Define constraints: facingMode=environment, 720p, 30fps
         │
         ▼
navigator.mediaDevices.getUserMedia(constraints)
         │
         ├─ Sucesso → stream armazenado no store
         │            status → STREAMING
         │
         ├─ Erro → status → ERROR
         │         error → mensagem
         │
         ▼
CameraSurface detecta stream via store
         │
         ├─ videoRef.current.srcObject = stream
         ├─ videoRef.current.play()
         │
         ▼
Usuário vê vídeo ao vivo com HUD sobreposto

─── Troca de Modo ───

Usuário desativa CAMERA_RECORD
         │
         ▼
Ride.tsx: ensureCameraForMode() → stopCameraStream()
         │
         ├─ profile.camera.visible = false → CameraSurface desmonta
         ├─ camera.store.stopStream()
         │    ├─ s.getTracks().forEach(t => t.stop())
         │    └─ stream = null, status = STOPPED
         │
         ▼
profile.map.visible = true → Map monta novamente

─── Erro ───

getUserMedia() falha
         │
         ▼
camera.store ERROR
         │
         ▼
CameraSurface renderiza estado de erro:
         ├─ Mensagem: "Camera error: {error}"
         └─ Botões: [Retry] [Dismiss]
```

## ETAPA 2 — Falhas Identificadas

| ID | Severidade | Falha | Arquivo |
|---|---|---|---|
| F1 | CRÍTICO | Stream não é limpo antes de iniciar novo — pode acumular tracks | camera.store.ts:55 |
| F2 | CRÍTICO | `enumerateDevices()` nunca chamado — sem fallback de câmera | camera.store.ts |
| F3 | CRÍTICO | Sem timeout — `getUserMedia` pode travar eternamente | camera.store.ts:73 |
| F4 | CRÍTICO | Race condition em troca rápida de modo — múltiplas streams simultâneas | Ride.tsx:282-296 |
| F5 | ALTO | `play()` chamado sem delay — falha em alguns mobile browsers | CameraSurface.tsx:38 |
| F6 | ALTO | Sem verificação HTTPS — câmera não funciona em HTTP | camera.store.ts |
| F7 | ALTO | Sem constraints de resolução — pode escolher 4K, alto consumo | camera.store.ts:68-70 |
| F8 | ALTO | Erro de permissão não distingue denied vs unavailable | camera.store.ts:80 |
| F9 | ALTO | `mounted` flag declarada mas nunca verificada no async | Ride.tsx:283 |
| F10 | MÉDIO | `facingMode: { ideal }` falha em dispositivos sem traseira | camera.store.ts:70 |
| F11 | MÉDIO | Sem indicação de qual câmera está ativa | CameraSurface.tsx |
| F12 | MÉDIO | Botões Retry/Dismiss com padding pequeno (24px) | CameraSurface.tsx:86 |
| F13 | BAIXO | `CameraEvent` enum declarado mas nunca usado | types.ts:33-38 |
| F14 | BAIXO | Sem transição visual entre modos | Ride.tsx |
