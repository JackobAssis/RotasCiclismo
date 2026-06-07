import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRideStore } from '../stores/ride.store';
import { useRuntimeStore, useRenderingProfile, useHudDensity, useShouldShowMap, useModeCapabilities } from '../stores/runtime.store';
import { RuntimeMode } from '../modules/runtime/types';
import Map from '../components/Map';
import OverlayManager from '../components/OverlayManager';
import CameraSurface from '../components/CameraSurface';
import MinimapOverlay from '../components/MinimapOverlay';
import useCameraStore from '../stores/camera.store';
import useMinimapStore from '../stores/minimap.store';
import { useWatchPosition } from '../hooks/useWatchPosition';
import {
  SpeedWidget,
  DistanceWidget,
  DurationWidget,
  GPSStatusWidget,
  RecordingStatusWidget
} from '../components/HudWidgets';
import { Badge } from '../components/ui/Badge';

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
  const hudDensity = useHudDensity();
  const shouldShowMap = useShouldShowMap();
  const debugInfo = useRuntimeStore((s) => s.getDebugInfo());
  const minimapExpanded = useMinimapStore((s) => s.expanded);

  const modes = [
    { id: RuntimeMode.GPS_ONLY, label: 'GPS', description: 'Mapa completo, HUD padrão' },
    { id: RuntimeMode.MAP_FOCUS, label: 'Mapa', description: 'Mapa ampliado, HUD mínimo' },
    { id: RuntimeMode.CAMERA_RECORD, label: 'Câmera', description: 'Câmera como primário' },
    { id: RuntimeMode.LOW_BATTERY, label: 'Econômico', description: 'Renderização mínima' },
  ];

  const handleModeSelect = useCallback((mode: RuntimeMode) => {
    setMode(mode);
  }, [setMode]);

  const capabilityIndicators = useMemo(
    () => [
      { label: 'Mapa', value: capabilities.hasMap, icon: '◉' },
      { label: 'Câmera', value: capabilities.hasCamera, icon: '◎' },
      { label: 'MiniMapa', value: capabilities.hasMinimap, icon: '◈' },
      { label: 'Navegação', value: capabilities.supportsNavigation, icon: '▶' },
    ],
    [capabilities]
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
    [profile, capabilities]
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
            className={`flex-1 min-w-20 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
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
          <DebugInfoRow label="Opacidade HUD" value={`${(profileViz.hudOpacity * 100).toFixed(0)}%`} color="amber" />
          <DebugInfoRow label="Freq. GPS" value={profileViz.gpsFrequency} color="blue" />
          <DebugInfoRow label="Amostragem" value={profileViz.routeSampling} color="blue" />
          <DebugInfoRow label="Dreno Bateria" value={profileViz.batteryDrain.toUpperCase()} color={
            profileViz.batteryDrain === 'low' ? 'green' : profileViz.batteryDrain === 'high' ? 'red' : 'yellow'
          } />
          <DebugInfoRow label="Bateria" value={`${debugInfo.battery.toFixed(0)}%`} color={
            debugInfo.battery > 50 ? 'green' : debugInfo.battery > 20 ? 'yellow' : 'red'
          } />
          <DebugInfoRow label="Mapa Visível" value={shouldShowMap ? 'SIM' : 'NÃO'} color="purple" />
          <DebugInfoRow label="MiniMapa" value={profile.minimap.visible ? (minimapExpanded ? 'Visível (Expandido)' : 'Visível') : 'Oculto'} color="purple" />
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

function createMockGPSUpdates(callback: (position: any) => void, interval: number = 1000) {
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
  showDebugPanel = true,
}) => {
  const { active, status, startRide, addPoint, pauseRide, resumeRide, finishRide } = useRideStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!active) {
      const rideId = `ride-${Date.now()}`;
      startRide({ id: rideId, userId: null, mode: 'GPS_ONLY' });
    }
    return () => setIsMounted(false);
  }, [active, startRide]);

  useEffect(() => {
    if (!enableMockGPS || !active) return;
    const cleanup = createMockGPSUpdates((position) => {
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
  }, [enableMockGPS, active, addPoint, mockGPSInterval]);

  useWatchPosition(!enableMockGPS);

  const handlePauseResume = useCallback(() => {
    if (status === 'active') pauseRide();
    else if (status === 'paused') resumeRide();
  }, [status, pauseRide, resumeRide]);

  const handleFinish = useCallback(() => {
    finishRide({ distance: active?.distance ?? 0, duration: active?.duration ?? 0 });
  }, [active, finishRide]);

  const profile = useRenderingProfile();
  const hudDensity = useHudDensity();
  const shouldShowMap = useShouldShowMap();
  const modeCapabilities = useModeCapabilities();
  const currentMode = useRuntimeStore((s) => s.currentMode);
  const cameraStream = useCameraStore((s) => s.stream);
  const cameraStatus = useCameraStore((s) => s.status);
  const requestPermissionAndStart = useCameraStore((s) => s.requestPermissionAndStart);
  const stopCameraStream = useCameraStore((s) => s.stopStream);
  const minimapExpandedRide = useMinimapStore((s) => s.expanded);

  const shouldRenderGPSWidget = useMemo(() => hudDensity !== 'minimal', [hudDensity]);
  const shouldRenderSpeedWidget = useMemo(() => true, []);
  const shouldRenderDistanceWidget = useMemo(() => hudDensity !== 'minimal', [hudDensity]);
  const shouldRenderDurationWidget = useMemo(() => hudDensity === 'full', [hudDensity]);
  const shouldRenderRecordingWidget = useMemo(() => true, []);

  const mapContainerClasses = useMemo(
    () =>
      shouldShowMap
        ? 'flex-1 relative overflow-hidden'
        : 'w-0 h-0 overflow-hidden absolute',
    [shouldShowMap]
  );

  const hudContainerClasses = useMemo(() => `absolute inset-0 pointer-events-none`, []);

  const hudOpacityStyle = useMemo(
    () => ({ opacity: profile.hud.opacity }),
    [profile.hud.opacity]
  );

  const hudScaleStyle = useMemo(
    () => ({ transform: `scale(${profile.hud.scale})` }),
    [profile.hud.scale]
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
    [currentMode, shouldShowMap, hudDensity, profile, modeCapabilities]
  );

  useEffect(() => {
    let mounted = true;
    const ensureCameraForMode = async () => {
      if (currentMode === RuntimeMode.CAMERA_RECORD) {
        await requestPermissionAndStart();
      } else {
        stopCameraStream();
      }
    };
    ensureCameraForMode();
    return () => {
      mounted = false;
      stopCameraStream();
    };
  }, [currentMode, requestPermissionAndStart, stopCameraStream]);

  if (!isMounted) return null;

  const statusVariant = status === 'active' ? 'success' : status === 'paused' ? 'warning' : status === 'finished' ? 'info' : 'default';

  return (
    <div className="w-full h-screen flex flex-col bg-dark-950">
      <div className={mapContainerClasses}>
        {profile.camera.visible && (
          <div className="absolute inset-0 z-0">
            <CameraSurface />
          </div>
        )}
        {profile.minimap.visible && <MinimapOverlay />}
        {profile.map.visible && <Map enableCameraFollow={enableCameraFollow} />}

        <OverlayManager>
          <div className={hudContainerClasses} style={hudOpacityStyle}>
            <div style={hudScaleStyle}>
              {shouldRenderGPSWidget && <GPSStatusWidget />}
              {shouldRenderRecordingWidget && <RecordingStatusWidget />}
              {shouldRenderSpeedWidget && <SpeedWidget />}
              {shouldRenderDistanceWidget && <DistanceWidget />}
              {shouldRenderDurationWidget && <DurationWidget />}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto z-300">
              <button
                onClick={handlePauseResume}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  status === 'active'
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                    : status === 'paused'
                      ? 'bg-neon-600 hover:bg-neon-500 text-black'
                      : 'bg-dark-700 text-gray-500'
                }`}
                disabled={status === 'idle' || status === 'finished'}
              >
                {status === 'active' ? 'Pausar' : status === 'paused' ? 'Retomar' : 'Pausar'}
              </button>

              <button
                onClick={handleFinish}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  status === 'finished'
                    ? 'bg-neon-600 hover:bg-neon-500 text-black'
                    : status === 'idle'
                      ? 'bg-dark-700 text-gray-500'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                disabled={status === 'idle'}
              >
                {status === 'finished' ? 'Finalizado' : 'Finalizar'}
              </button>
            </div>
          </div>
        </OverlayManager>
      </div>

      <div className="border-t border-dark-700 bg-dark-900/90 p-3 max-h-80 overflow-y-auto">
        <RuntimeModeControls showDebugPanel={showDebugPanel} />
      </div>

      <div className="bg-dark-950/80 text-white text-xs p-2 border-t border-dark-700 font-mono">
        <div className="flex justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            Status: <Badge variant={statusVariant}>{status}</Badge>
          </span>
          <span>Pontos: {active?.route?.length ?? 0}</span>
          <span>Distância: {(active?.distance ?? 0).toFixed(1)} km</span>
          <span>Modo: {currentMode}</span>
          <span>HUD: {hudDensity}</span>
          <span>Amostragem: {runtimeCompositionInfo.routeSampling}</span>
          <span>Dreno: {runtimeCompositionInfo.batteryDrain}</span>
          <span>Câmera: {String(cameraStatus)}</span>
          <span>MiniMapa: {profile.minimap.visible ? (minimapExpandedRide ? 'Visível (Expandido)' : 'Visível') : 'Oculto'}</span>
          <span>CameraFollow: {enableCameraFollow ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default RidePage;
