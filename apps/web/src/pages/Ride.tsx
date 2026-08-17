import React, { useEffect, useState, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useRideStore } from '../stores/ride.store';
import {
  useRuntimeStore,
  useRenderingProfile,
  useHudDensity,
  useShouldShowMap,
  useModeCapabilities,
} from '../stores/runtime.store';
import { RuntimeMode } from '../modules/runtime/types';
import OverlayManager from '../components/OverlayManager';
import MinimapOverlay from '../components/MinimapOverlay';
import useCameraStore from '../stores/camera.store';
import useMinimapStore from '../stores/minimap.store';
import { useWatchPosition } from '../hooks/useWatchPosition';
import type { RoutePoint } from '../../../../packages/types/src/index';

const Map = lazy(() => import('../components/Map'));
const CameraSurface = lazy(() => import('../components/CameraSurface'));
import {
  SpeedWidget,
  DistanceWidget,
  DurationWidget,
  GPSStatusWidget,
  RecordingStatusWidget,
  BatteryWidget,
} from '../components/HudWidgets';
import { Badge } from '../components/ui/Badge';

interface BatteryManagerLike {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManagerLike>;
  }
}

interface RidePageProps {
  enableCameraFollow?: boolean;
  enableMockGPS?: boolean;
  mockGPSInterval?: number;
  showDebugPanel?: boolean;
}

const RuntimeModeControls: React.FC<{ showDebugPanel: boolean }> = ({ showDebugPanel }) => {
  const currentMode = useRuntimeStore((s) => s.currentMode);
  const setMode = useRuntimeStore((s) => s.setMode);
  const profile = useRenderingProfile();
  const capabilities = useModeCapabilities();
  const shouldShowMap = useShouldShowMap();
  const debugInfo = useRuntimeStore((s) => s.getDebugInfo());
  const minimapExpanded = useMinimapStore((s) => s.expanded);

  const modes = [
    { id: RuntimeMode.GPS_ONLY, label: 'GPS', description: 'Mapa completo, HUD padrão' },
    { id: RuntimeMode.MAP_FOCUS, label: 'Mapa', description: 'Mapa ampliado, HUD mínimo' },
    { id: RuntimeMode.CAMERA_RECORD, label: 'Câmera', description: 'Câmera como primário' },
    { id: RuntimeMode.LOW_BATTERY, label: 'Econômico', description: 'Renderização mínima' },
  ];

  const handleModeSelect = useCallback(
    (mode: RuntimeMode) => {
      setMode(mode);
    },
    [setMode],
  );

  const capabilityIndicators = useMemo(
    () => [
      { label: 'Mapa', value: capabilities.hasMap, icon: '◉' },
      { label: 'Câmera', value: capabilities.hasCamera, icon: '◎' },
      { label: 'MiniMapa', value: capabilities.hasMinimap, icon: '◈' },
      { label: 'Navegação', value: capabilities.supportsNavigation, icon: '▶' },
    ],
    [capabilities],
  );

  const profileViz = useMemo(
    () => ({
      mapScale: profile.map.scale,
      hudDensity: profile.hud.density,
      hudOpacity: profile.hud.opacity,
      gpsFrequency: `${profile.performance.gpsFrequency} Hz`,
      routeSampling: `${profile.performance.routeSampling} pts`,
      batteryDrain: capabilities.estimatedBatteryDrain,
    }),
    [profile, capabilities],
  );

  return (
    <div className="space-y-3 p-3 bg-dark-800/80 rounded-xl border border-dark-700">
      <div className="flex items-center gap-2 pb-2 border-b border-dark-700">
        <span className="text-xs font-semibold text-gray-500 uppercase">Modo</span>
        <div className="flex-1" />
        <span className="text-sm font-bold text-neon-400">
          {modes.find((m) => m.id === currentMode)?.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeSelect(mode.id)}
            title={mode.description}
            style={{ touchAction: 'manipulation', userSelect: 'none' }}
            className={`flex-1 min-w-20 px-3 py-3 rounded-xl text-xs font-semibold transition-all min-h-[48px] ${
              currentMode === mode.id
                ? 'bg-neon-500/20 text-neon-400 border border-neon-500/40 shadow-neon-sm'
                : 'bg-dark-850 text-gray-500 border border-dark-700 hover:border-dark-600'
            }`}
          >
            <div>{mode.label}</div>
            <div className="text-[10px] opacity-75">{mode.description}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-dark-700">
        {capabilityIndicators.map((cap) => (
          <div
            key={cap.label}
            className={`text-center py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
              cap.value
                ? 'bg-neon-900/20 text-neon-400 border border-neon-800/30'
                : 'bg-dark-850 text-gray-600 border border-dark-700'
            }`}
          >
            <div className="text-sm">{cap.icon}</div>
            <div className="text-[10px]">{cap.label}</div>
            <div className="text-[9px] opacity-60">{cap.value ? 'S' : 'N'}</div>
          </div>
        ))}
      </div>

      {showDebugPanel && (
        <div className="space-y-1.5 pt-2 border-t border-dark-700 bg-dark-950/50 rounded-lg p-2">
          <DebugInfoRow label="Modo Ativo" value={currentMode} color="cyan" />
          <DebugInfoRow label="Escala Mapa" value={profileViz.mapScale} color="amber" />
          <DebugInfoRow label="Densidade HUD" value={profileViz.hudDensity} color="amber" />
          <DebugInfoRow
            label="Opacidade HUD"
            value={`${(profileViz.hudOpacity * 100).toFixed(0)}%`}
            color="amber"
          />
          <DebugInfoRow label="Freq. GPS" value={profileViz.gpsFrequency} color="blue" />
          <DebugInfoRow label="Amostragem" value={profileViz.routeSampling} color="blue" />
          <DebugInfoRow
            label="Dreno Bateria"
            value={profileViz.batteryDrain.toUpperCase()}
            color={
              profileViz.batteryDrain === 'low'
                ? 'green'
                : profileViz.batteryDrain === 'high'
                  ? 'red'
                  : 'yellow'
            }
          />
          <DebugInfoRow
            label="Bateria"
            value={`${debugInfo.battery.toFixed(0)}%`}
            color={debugInfo.battery > 50 ? 'green' : debugInfo.battery > 20 ? 'yellow' : 'red'}
          />
          <DebugInfoRow label="Mapa Visível" value={shouldShowMap ? 'SIM' : 'NÃO'} color="purple" />
          <DebugInfoRow
            label="MiniMapa"
            value={
              profile.minimap.visible
                ? minimapExpanded
                  ? 'Visível (Expandido)'
                  : 'Visível'
                : 'Oculto'
            }
            color="purple"
          />
        </div>
      )}
    </div>
  );
};

function DebugInfoRow({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    green: 'text-neon-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  };
  return (
    <div className="flex justify-between gap-4 font-mono text-xs">
      <span className="text-gray-600">{label}</span>
      <span className={colorMap[color] || 'text-gray-300'}>{value}</span>
    </div>
  );
}

function createMockGPSUpdates(callback: (position: RoutePoint) => void, interval: number = 1000) {
  let pointCount = 0;
  const startLat = -23.5505;
  const startLon = -46.6333;

  const timer = setInterval(() => {
    const drift = Math.sin(pointCount / 20) * 0.001 + Math.random() * 0.0001;
    const speedVariation = Math.sin(pointCount / 50) * 5 + Math.random() * 2;

    const position = {
      latitude: startLat + drift,
      longitude: startLon + drift,
      speed: Math.max(0, 15 + speedVariation),
      altitude: 750 + Math.sin(pointCount / 100) * 50,
      heading: (pointCount * 2) % 360,
      accuracy: Math.max(5, 15 - pointCount * 0.01),
      timestamp: new Date().toISOString(),
    };

    callback(position);
    pointCount++;
  }, interval);

  return () => clearInterval(timer);
}

export const RidePage: React.FC<RidePageProps> = ({
  enableCameraFollow = true,
  enableMockGPS = true,
  mockGPSInterval = 1000,
  showDebugPanel = import.meta.env.DEV,
}) => {
  // Individual selectors — prevents full re-render on every GPS point
  const status = useRideStore((s) => s.status);
  const startRide = useRideStore((s) => s.startRide);
  const addPoint = useRideStore((s) => s.addPoint);
  const pauseRide = useRideStore((s) => s.pauseRide);
  const resumeRide = useRideStore((s) => s.resumeRide);
  const finishRide = useRideStore((s) => s.finishRide);

  const [isMounted, setIsMounted] = useState(false);
  const mountedRef = useRef(false);

  // Mount effect — uses getState() to avoid dependency on active object
  useEffect(() => {
    setIsMounted(true);
    if (!mountedRef.current) {
      mountedRef.current = true;
      const active = useRideStore.getState().active;
      if (!active) {
        const rideId = `ride-${Date.now()}`;
        startRide({ id: rideId, userId: null, mode: 'GPS_ONLY' });
      }
    }
    return () => setIsMounted(false);
  }, [startRide]);

  // Mock GPS — uses getState() inside callback to avoid depending on active
  useEffect(() => {
    if (!enableMockGPS) return;
    const cleanup = createMockGPSUpdates((position) => {
      if (!useRideStore.getState().active) return;
      addPoint({
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        altitude: position.altitude,
        heading: position.heading,
        accuracy: position.accuracy,
        timestamp: position.timestamp,
      });
    }, mockGPSInterval);
    return cleanup;
  }, [enableMockGPS, addPoint, mockGPSInterval]);

  // GPS throttling derived from rendering mode
  const profile = useRenderingProfile();
  const gpsOptions = useMemo<PositionOptions>(() => {
    if (profile.mode === 'LOW_BATTERY') {
      return { enableHighAccuracy: false, maximumAge: 3000, timeout: 15000 };
    }
    if (profile.performance.gpsFrequency >= 2) {
      return { enableHighAccuracy: true, maximumAge: 500, timeout: 8000 };
    }
    return { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 };
  }, [profile.mode, profile.performance.gpsFrequency]);

  useWatchPosition(!enableMockGPS, gpsOptions);

  // Callbacks use getState() to avoid dependencies on mutable objects
  const handlePauseResume = useCallback(() => {
    const s = useRideStore.getState().status;
    if (s === 'active') pauseRide();
    else if (s === 'paused') resumeRide();
  }, [pauseRide, resumeRide]);

  const handleFinish = useCallback(() => {
    if (!window.confirm('Finalizar pedalada?')) return;
    const state = useRideStore.getState();
    finishRide({ distance: state.active?.distance ?? 0, duration: state.active?.duration ?? 0 });
  }, [finishRide]);

  const hudDensity = useHudDensity();
  const shouldShowMap = useShouldShowMap();
  const modeCapabilities = useModeCapabilities();
  const currentMode = useRuntimeStore((s) => s.currentMode);
  const cameraStatus = useCameraStore((s) => s.status);
  const requestPermissionAndStart = useCameraStore((s) => s.requestPermissionAndStart);
  const stopCameraStream = useCameraStore((s) => s.stopStream);
  const minimapExpandedRide = useMinimapStore((s) => s.expanded);
  const routeLength = useRideStore((s) => s.active?.route?.length ?? 0);
  const rideDistance = useRideStore((s) => s.active?.distance ?? 0);

  // Simple booleans — no useMemo needed (primitives, cheap)
  const shouldRenderGPSWidget = hudDensity !== 'minimal';
  const shouldRenderDurationWidget = hudDensity !== 'minimal';
  const shouldRenderBatteryWidget = hudDensity !== 'minimal';

  const mapContainerClasses = useMemo(
    () => (shouldShowMap ? 'flex-1 relative overflow-hidden' : 'w-0 h-0 overflow-hidden absolute'),
    [shouldShowMap],
  );

  const hudOpacityStyle = useMemo(() => ({ opacity: profile.hud.opacity }), [profile.hud.opacity]);

  const hudScaleStyle = useMemo(
    () => ({ transform: `scale(${profile.hud.scale})` }),
    [profile.hud.scale],
  );

  const runtimeCompositionInfo = useMemo(
    () => ({
      mode: currentMode,
      mapVisible: shouldShowMap,
      hudDensity,
      hudOpacity: profile.hud.opacity,
      mapScale: profile.map.scale,
      gpsFrequency: profile.performance.gpsFrequency,
      routeSampling: profile.performance.routeSampling,
      batteryDrain: modeCapabilities.estimatedBatteryDrain,
    }),
    [currentMode, shouldShowMap, hudDensity, profile, modeCapabilities],
  );

  // Camera lifecycle
  useEffect(() => {
    let mounted = true;
    const ensureCameraForMode = async () => {
      if (!mounted) return;
      if (currentMode === RuntimeMode.CAMERA_RECORD) {
        const cameraFps = profile.performance.cameraFps ?? 30;
        const resolution = profile.mode === 'LOW_BATTERY' ? '720p' : '720p';
        const fps = profile.mode === 'LOW_BATTERY' ? 15 : cameraFps;
        await requestPermissionAndStart({ fps, resolution });
      } else if (mounted) {
        stopCameraStream();
      }
    };
    ensureCameraForMode();
    return () => {
      mounted = false;
      stopCameraStream();
    };
  }, [
    currentMode,
    requestPermissionAndStart,
    stopCameraStream,
    profile.performance.cameraFps,
    profile.mode,
  ]);

  // Battery API — proper listener cleanup
  useEffect(() => {
    let batteryManager: BatteryManagerLike | null = null;
    let mounted = true;

    const updateBattery = (battery: BatteryManagerLike) => {
      if (!mounted) return;
      const level = Math.round(battery.level * 100);
      useRuntimeStore.getState().updateBatteryStatus(level, battery.charging);
    };

    const onLevelChange = () => {
      if (batteryManager) updateBattery(batteryManager);
    };
    const onChargingChange = () => {
      if (batteryManager) updateBattery(batteryManager);
    };

    const setupBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await navigator.getBattery?.();
          if (battery) {
            batteryManager = battery;
            updateBattery(battery);
            battery.addEventListener('levelchange', onLevelChange);
            battery.addEventListener('chargingchange', onChargingChange);
          }
        }
      } catch (e) {
        // Battery Status API not available
      }
    };

    setupBattery();

    return () => {
      mounted = false;
      if (batteryManager) {
        try {
          batteryManager.removeEventListener('levelchange', onLevelChange);
          batteryManager.removeEventListener('chargingchange', onChargingChange);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  if (!isMounted) return null;

  const statusVariant =
    status === 'active'
      ? 'success'
      : status === 'paused'
        ? 'warning'
        : status === 'finished'
          ? 'info'
          : 'default';

  return (
    <div
      className="w-full h-screen flex flex-col bg-dark-950"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className={mapContainerClasses}>
        {profile.camera.visible && (
          <div className="absolute inset-0 z-0">
            <Suspense fallback={null}>
              <CameraSurface />
            </Suspense>
          </div>
        )}
        {profile.minimap.visible && <MinimapOverlay />}
        {profile.map.visible && (
          <Suspense fallback={null}>
            <Map enableCameraFollow={enableCameraFollow} />
          </Suspense>
        )}

        <OverlayManager>
          <div className="absolute inset-0 pointer-events-none" style={hudOpacityStyle}>
            <div style={hudScaleStyle}>
              {shouldRenderGPSWidget && <GPSStatusWidget />}
              <RecordingStatusWidget />
              {shouldRenderBatteryWidget && <BatteryWidget />}
              <SpeedWidget />
              <DistanceWidget />
              {shouldRenderDurationWidget && <DurationWidget />}
            </div>
          </div>

          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-[500]"
            style={{ touchAction: 'manipulation' }}
          >
            <button
              onClick={handlePauseResume}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all min-h-[52px] ${
                status === 'active'
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg'
                  : status === 'paused'
                    ? 'bg-neon-600 hover:bg-neon-500 text-black shadow-lg'
                    : 'bg-dark-700 text-gray-500'
              }`}
              disabled={status === 'idle' || status === 'finished'}
              style={{ touchAction: 'manipulation', userSelect: 'none' }}
            >
              {status === 'active' ? 'Pausar' : status === 'paused' ? 'Retomar' : 'Pausar'}
            </button>
          </div>

          <div
            className="absolute bottom-8 right-6 pointer-events-auto z-[500]"
            style={{ touchAction: 'manipulation' }}
          >
            <button
              onClick={handleFinish}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all min-h-[48px] min-w-[48px] ${
                status === 'finished'
                  ? 'bg-neon-600/20 text-neon-400 border border-neon-500/30'
                  : status === 'idle'
                    ? 'bg-dark-800 text-gray-600 border border-dark-700'
                    : 'bg-dark-800 text-gray-400 border border-dark-700 hover:border-red-800 hover:text-red-400'
              }`}
              disabled={status === 'idle'}
              style={{ touchAction: 'manipulation', userSelect: 'none' }}
            >
              {status === 'finished' ? '✓' : '⏹'}
            </button>
          </div>
        </OverlayManager>
      </div>

      {import.meta.env.DEV && (
        <div className="border-t border-dark-700 bg-dark-900/90 p-3 max-h-80 overflow-y-auto">
          <RuntimeModeControls showDebugPanel={showDebugPanel} />
        </div>
      )}

      {import.meta.env.DEV && (
        <div className="bg-dark-950/80 text-white text-xs p-2 border-t border-dark-700 font-mono">
          <div className="flex justify-between gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              Status: <Badge variant={statusVariant}>{status}</Badge>
            </span>
            <span>Pontos: {routeLength}</span>
            <span>Distância: {rideDistance.toFixed(1)} km</span>
            <span>Modo: {currentMode}</span>
            <span>HUD: {hudDensity}</span>
            <span>Amostragem: {runtimeCompositionInfo.routeSampling}</span>
            <span>Dreno: {runtimeCompositionInfo.batteryDrain}</span>
            <span>Câmera: {String(cameraStatus)}</span>
            <span>
              MiniMapa:{' '}
              {profile.minimap.visible
                ? minimapExpandedRide
                  ? 'Visível (Expandido)'
                  : 'Visível'
                : 'Oculto'}
            </span>
            <span>CameraFollow: {enableCameraFollow ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidePage;
