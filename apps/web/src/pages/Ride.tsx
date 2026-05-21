import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRideStore } from '../stores/ride.store';
import { useRuntimeStore, useRenderingProfile, useHudDensity, useShouldShowMap, useModeCapabilities } from '../stores/runtime.store';
import { RuntimeMode } from '../modules/runtime/types';
import Map from './Map';
import OverlayManager from './OverlayManager';
import CameraSurface from '../components/CameraSurface';
import MinimapOverlay from '../components/MinimapOverlay';
import useCameraStore from '../stores/camera.store';
import useMinimapStore from '../stores/minimap.store';
import {
  SpeedWidget,
  DistanceWidget,
  DurationWidget,
  GPSStatusWidget,
  RecordingStatusWidget
} from './HudWidgets';

/**
 * Ride Session Page
 *
 * Integrates all realtime systems:
 * - Map layer (Leaflet/OpenStreetMap)
 * - GPS position tracking
 * - Route visualization
 * - HUD overlay with widgets
 * - Ride lifecycle management
 * - Runtime Mode orchestration for adaptive rendering
 *
 * Runtime Composition Architecture:
 * ================================
 * This component orchestrates runtime mode composition - determining what UI
 * elements are visible and how they're sized based on the selected mode.
 *
 * Mode Selection Flow:
 * 1. User selects runtime mode via controls
 * 2. Mode selector calls useRuntimeStore.setMode()
 * 3. Store updates currentMode and invalidates caches
 * 4. All useHook* selectors re-evaluate based on new mode
 * 5. Components receive new rendering profiles
 * 6. UI re-renders with new layout (declarative)
 *
 * Key Architectural Constraints:
 * - Ride lifecycle (active, paused, finished) is independent of runtime mode
 * - Runtime mode affects only visual composition, not GPS/ride data flow
 * - All rendering adaptation is declarative (no DOM manipulation)
 * - Mode transitions are validated (isValidModeTransition)
 * - Mobile-first layout adapts to current mode
 *
 * Future Adaptation Points:
 * - Automatic mode switching based on battery (when battery < 15%)
 * - Thermal throttling detection → simplified rendering
 * - Camera permission state → CAMERA_RECORD mode availability
 * - AR feature availability → FUTURE_AR_MODE activation
 *
 * Performance Optimizations:
 * - Map uses refs for efficient polyline/marker updates
 * - Widgets use memoization + selector subscriptions
 * - Route points sampled based on rendering profile
 * - Runtime store caches profiles to avoid recalculation
 *
 * Mobile Considerations:
 * - Touch-friendly mode selector buttons
 * - HUD density respects rendering profile (full/normal/minimal)
 * - Map scale adapts to mode (fullscreen/large/medium/small)
 * - Responsive overlay layout maintained across modes
 */

interface RidePageProps {
  enableCameraFollow?: boolean;
  enableMockGPS?: boolean;
  mockGPSInterval?: number;
  showDebugPanel?: boolean;
}

/**
 * Runtime Mode Controls Component
 *
 * Provides UI for:
 * - Mode selection (GPS_ONLY, MAP_FOCUS, CAMERA_RECORD, LOW_BATTERY)
 * - Current mode indicator
 * - Rendering profile visualization
 * - Mode capabilities display
 * - Developer debug information
 *
 * Architectural Notes:
 * - Mode changes are immediate (declarative UI update)
 * - All supported modes are always available (validation in store)
 * - Debug panel shows active rendering decisions
 * - No side effects from mode selection (independent of ride lifecycle)
 */
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
    {
      id: RuntimeMode.GPS_ONLY,
      label: '🗺️ GPS',
      description: 'Full map, standard HUD'
    },
    {
      id: RuntimeMode.MAP_FOCUS,
      label: '📍 Map Focus',
      description: 'Large map, minimal HUD'
    },
    {
      id: RuntimeMode.CAMERA_RECORD,
      label: '📷 Camera',
      description: 'Camera primary (placeholder)'
    },
    {
      id: RuntimeMode.LOW_BATTERY,
      label: '🔋 Low Battery',
      description: 'Minimal rendering'
    }
  ];

  /**
   * Handle mode selection
   * Updates store, which triggers declarative re-render
   */
  const handleModeSelect = useCallback((mode: RuntimeMode) => {
    setMode(mode);
  }, [setMode]);

  /**
   * Render mode indicator badge
   * Shows visual state of current mode
   */
  const modeIndicator = useMemo(() => {
    const modeConfig = modes.find((m) => m.id === currentMode);
    return modeConfig;
  }, [currentMode]);

  /**
   * Render capability indicators
   * Shows what features are active in current mode
   */
  const capabilityIndicators = useMemo(
    () => [
      { label: 'Map', value: capabilities.hasMap, icon: '🗺️' },
      { label: 'Camera', value: capabilities.hasCamera, icon: '📷' },
      { label: 'Minimap', value: capabilities.hasMinimap, icon: '🧭' },
      { label: 'Navigation', value: capabilities.supportsNavigation, icon: '🚴' }
    ],
    [capabilities]
  );

  /**
   * Render profile visualization
   * Shows actual rendering decisions for current mode
   */
  const profileViz = useMemo(
    () => ({
      mapScale: profile.map.scale,
      mapVisibility: profile.map.visible ? 'visible' : 'hidden',
      hudDensity: profile.hud.density,
      hudOpacity: profile.hud.opacity,
      recordingProminence: profile.recording.prominence,
      gpsFrequency: `${profile.performance.gpsFrequency} Hz`,
      routeSampling: `${profile.performance.routeSampling} pts`,
      batteryDrain: capabilities.estimatedBatteryDrain
    }),
    [profile, capabilities]
  );

  return (
    <div className="space-y-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
      {/* Mode Indicator */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-400 uppercase">Runtime Mode</span>
        <div className="flex-1" />
        <span className="text-sm font-bold text-cyan-400">{modeIndicator?.label}</span>
      </div>

      {/* Mode Selector Buttons */}
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeSelect(mode.id)}
            title={mode.description}
            className={`flex-1 min-w-20 px-2 py-2 rounded text-xs font-semibold transition-all ${
              currentMode === mode.id
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div>{mode.label}</div>
            <div className="text-[10px] opacity-75">{mode.description}</div>
          </button>
        ))}
      </div>

      {/* Rendering Capability Indicators */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-700">
        {capabilityIndicators.map((cap) => (
          <div
            key={cap.label}
            className={`text-center py-1 px-1 rounded text-xs font-semibold transition-all ${
              cap.value
                ? 'bg-green-900/30 text-green-300 border border-green-700'
                : 'bg-gray-800/30 text-gray-500 border border-gray-700'
            }`}
            title={`${cap.label}: ${cap.value ? 'enabled' : 'disabled'}`}
          >
            <div>{cap.icon}</div>
            <div className="text-[10px]">{cap.label}</div>
            <div className="text-[9px] opacity-60">{cap.value ? '✓' : '✗'}</div>
          </div>
        ))}
      </div>

      {/* Developer Debug Panel */}
      {showDebugPanel && (
        <div className="space-y-2 pt-2 border-t border-gray-700 bg-black/30 rounded p-2">
          <div className="text-xs font-mono text-gray-400 space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Active Mode:</span>
              <span className="text-cyan-300 font-bold">{currentMode}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Map Scale:</span>
              <span className="text-amber-300">{profileViz.mapScale}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">HUD Density:</span>
              <span className="text-amber-300">{profileViz.hudDensity}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">HUD Opacity:</span>
              <span className="text-amber-300">{(profileViz.hudOpacity * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">GPS Frequency:</span>
              <span className="text-blue-300">{profileViz.gpsFrequency}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Route Sampling:</span>
              <span className="text-blue-300">{profileViz.routeSampling}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Battery Drain:</span>
              <span className={
                profileViz.batteryDrain === 'low'
                  ? 'text-green-300'
                  : profileViz.batteryDrain === 'high'
                    ? 'text-red-300'
                    : 'text-yellow-300'
              }>
                {profileViz.batteryDrain.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Battery:</span>
              <span className={
                debugInfo.battery > 50
                  ? 'text-green-300'
                  : debugInfo.battery > 20
                    ? 'text-yellow-300'
                    : 'text-red-300'
              }>
                {debugInfo.battery.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Map Visible:</span>
              <span className="text-purple-300">{shouldShowMap ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Minimap Visible:</span>
              <span className="text-purple-300">{profile.minimap.visible ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Minimap Expanded:</span>
              <span className={minimapExpanded ? 'text-cyan-300 font-bold' : 'text-gray-400'}>{String(minimapExpanded)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Simulated GPS provider for testing/demo purposes
 * In production, this would be replaced with real GPS data from native
 */
function createMockGPSUpdates(callback: (position: any) => void, interval: number = 1000) {
  let pointCount = 0;
  const startLat = -23.5505;
  const startLon = -46.6333;

  const timer = setInterval(() => {
    // Simulate movement along a fictional route
    const drift = Math.sin(pointCount / 20) * 0.001 + Math.random() * 0.0001;
    const speedVariation = Math.sin(pointCount / 50) * 5 + Math.random() * 2;

    const position = {
      latitude: startLat + drift,
      longitude: startLon + drift,
      speed: Math.max(0, 15 + speedVariation), // 15 km/h base + variation
      altitude: 750 + Math.sin(pointCount / 100) * 50,
      heading: (pointCount * 2) % 360,
      accuracy: Math.max(5, 15 - pointCount * 0.01), // Improves over time
      timestamp: new Date().toISOString()
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
  showDebugPanel = true
}) => {
  const { active, status, startRide, addPoint, pauseRide, resumeRide, finishRide } = useRideStore();
  const [isMounted, setIsMounted] = useState(false);

  // ==================================================================
  // RIDE LIFECYCLE MANAGEMENT
  // (Independent of runtime mode)
  // ==================================================================

  // Initialize ride session on mount
  useEffect(() => {
    setIsMounted(true);

    // Auto-start ride if not already active
    if (!active) {
      const rideId = `ride-${Date.now()}`;
      startRide({
        id: rideId,
        userId: null,
        mode: 'GPS_ONLY'
      });
    }

    return () => setIsMounted(false);
  }, [active, startRide]);

  // Setup mock GPS updates (for demo/testing)
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
        timestamp: position.timestamp
      });
    }, mockGPSInterval);

    return cleanup;
  }, [enableMockGPS, active, addPoint, mockGPSInterval]);

  // Handle ride controls
  const handlePauseResume = useCallback(() => {
    if (status === 'active') {
      pauseRide();
    } else if (status === 'paused') {
      resumeRide();
    }
  }, [status, pauseRide, resumeRide]);

  const handleFinish = useCallback(() => {
    finishRide({
      distance: active?.distance ?? 0,
      duration: active?.duration ?? 0
    });
  }, [active, finishRide]);

  // ==================================================================
  // RUNTIME MODE ORCHESTRATION
  // (Determines rendering composition independently of ride lifecycle)
  // ==================================================================

  // Hook into runtime system for rendering decisions
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

  /**
   * Adaptive HUD widget rendering based on density profile
   *
   * The rendering profile defines HUD density (full/normal/minimal).
   * This controls which widgets are rendered and how.
   *
   * Density Mapping:
   * - full: All widgets visible (GPS status, recording, speed, distance, duration)
   * - normal: Essential widgets (speed, distance, duration, GPS status)
   * - minimal: Only critical widget (speed) + recording status if active
   */
  const shouldRenderGPSWidget = useMemo(() => hudDensity !== 'minimal', [hudDensity]);
  const shouldRenderSpeedWidget = useMemo(() => true, []); // Always show speed
  const shouldRenderDistanceWidget = useMemo(() => hudDensity !== 'minimal', [hudDensity]);
  const shouldRenderDurationWidget = useMemo(() => hudDensity === 'full', [hudDensity]);
  const shouldRenderRecordingWidget = useMemo(() => true, []); // Always show if recording

  /**
   * Adaptive map visibility based on rendering profile
   *
   * Different modes have different map visibility:
   * - GPS_ONLY: fullscreen map
   * - MAP_FOCUS: larger map with minimal HUD
   * - CAMERA_RECORD: no visible map (minimap in corner)
   * - LOW_BATTERY: map visible but with reduced sampling
   *
   * Map is rendered in the background; visibility controlled
   * through CSS (absolute positioning with visibility class)
   */
  const mapContainerClasses = useMemo(
    () =>
      shouldShowMap
        ? 'flex-1 relative overflow-hidden'
        : 'w-0 h-0 overflow-hidden absolute',
    [shouldShowMap]
  );

  /**
   * Adaptive HUD styling based on rendering profile
   *
   * Profile controls:
   * - opacity: How transparent the HUD is
   * - scale: Size multiplier for widgets
   * - compact: Tight spacing for cramped modes
   */
  const hudContainerClasses = useMemo(
    () => `absolute inset-0 pointer-events-none`,
    []
  );

  const hudOpacityStyle = useMemo(
    () => ({
      opacity: profile.hud.opacity
    }),
    [profile.hud.opacity]
  );

  const hudScaleStyle = useMemo(
    () => ({
      transform: `scale(${profile.hud.scale})`
    }),
    [profile.hud.scale]
  );

  /**
   * Runtime composition summary for debugging
   *
   * Shows what's being rendered based on the current mode's
   * rendering profile
   */
  const runtimeCompositionInfo = useMemo(
    () => ({
      mode: currentMode,
      mapVisible: shouldShowMap,
      hudDensity,
      hudOpacity: profile.hud.opacity,
      mapScale: profile.map.scale,
      gpsFrequency: profile.performance.gpsFrequency,
      routeSampling: profile.performance.routeSampling,
      batteryDrain: modeCapabilities.estimatedBatteryDrain
    }),
    [currentMode, shouldShowMap, hudDensity, profile, modeCapabilities]
  );

  // ==================================================================
  // Runtime-driven Camera Orchestration
  // - When entering CAMERA_RECORD, request permission and start stream
  // - When leaving CAMERA_RECORD, ensure stream is stopped and cleaned up
  // - Cleanup on unmount to avoid orphan tracks
  // ==================================================================
  useEffect(() => {
    let mounted = true;

    const ensureCameraForMode = async () => {
      if (currentMode === RuntimeMode.CAMERA_RECORD) {
        // Request permission and start stream (store is authoritative)
        await requestPermissionAndStart();
      } else {
        // On leaving, stop stream
        stopCameraStream();
      }
    };

    ensureCameraForMode();

    return () => {
      mounted = false;
      // Safety: stop stream when Ride unmounts to avoid orphan tracks
      stopCameraStream();
    };
  }, [currentMode, requestPermissionAndStart, stopCameraStream]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full h-screen flex flex-col bg-black">
      {/* ==================================================================
          MAP LAYER
          Rendering controlled by profile.map.visible
          Scale controlled by profile.map.scale
      ================================================================== */}
      <div className={mapContainerClasses}>
            {/* Camera layer (renders when profile.camera.visible) */}
            {profile.camera.visible && (
              <div className="absolute inset-0 z-0">
                <CameraSurface />
              </div>
            )}

            {/* Minimap overlay: visible when profile.minimap.visible is true */}
            {profile.minimap.visible && (
              <MinimapOverlay />
            )}

            {/* Map sits above or below depending on z-index; Map component respects visibility */}
            {profile.map.visible && <Map enableCameraFollow={enableCameraFollow} />}
        {/* ==================================================================
            HUD OVERLAY SYSTEM
            Rendering orchestrated by runtime mode composition
            
            Adaptive Behavior:
            - Visibility: Controlled by profile.hud.visible
            - Density: Determines which widgets render
            - Opacity: Controlled by profile.hud.opacity
            - Scale: Controlled by profile.hud.scale
            - Layout: Compact mode affects spacing
        ================================================================== */}
        <OverlayManager>
          <div className={hudContainerClasses} style={hudOpacityStyle}>
            {/* Adaptive HUD Widgets */}
            <div style={hudScaleStyle}>
              {/* Status indicators - top */}
              {shouldRenderGPSWidget && <GPSStatusWidget />}
              {shouldRenderRecordingWidget && <RecordingStatusWidget />}

              {/* Info widgets - bottom */}
              {shouldRenderSpeedWidget && <SpeedWidget />}
              {shouldRenderDistanceWidget && <DistanceWidget />}
              {shouldRenderDurationWidget && <DurationWidget />}
            </div>

            {/* Control buttons overlay - center bottom */}
            {/* Note: Always visible regardless of runtime mode */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto z-300">
              <button
                onClick={handlePauseResume}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  status === 'active'
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : status === 'paused'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-500 text-gray-300'
                }`}
                disabled={status === 'idle' || status === 'finished'}
              >
                {status === 'active' ? '⏸ Pause' : status === 'paused' ? '▶ Resume' : 'Pause'}
              </button>

              <button
                onClick={handleFinish}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  status === 'finished'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : status === 'idle'
                      ? 'bg-gray-500 text-gray-300'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                disabled={status === 'idle'}
              >
                {status === 'finished' ? '✓ Done' : '✕ Finish'}
              </button>
            </div>
          </div>
        </OverlayManager>
      </div>

      {/* ==================================================================
          RUNTIME MODE CONTROLS
          Allows user to select runtime mode and view active profile
      ================================================================== */}
      <div className="border-t border-gray-700 bg-black/70 p-3 max-h-80 overflow-y-auto">
        <RuntimeModeControls showDebugPanel={showDebugPanel} />
      </div>

      {/* ==================================================================
          DEBUG INFO BAR
          Shows ride status and runtime composition
      ================================================================== */}
      <div className="bg-black/50 text-white text-xs p-2 border-t border-gray-700 font-mono">
        <div className="flex justify-between gap-2 flex-wrap">
          <span>Status: {status}</span>
          <span>Points: {active?.route?.length ?? 0}</span>
          <span>Distance: {(active?.distance ?? 0).toFixed(1)} km</span>
          <span>Mode: {currentMode}</span>
          <span>HUD Density: {hudDensity}</span>
          <span>Sampling: {runtimeCompositionInfo.routeSampling}pts</span>
          <span>Drain: {runtimeCompositionInfo.batteryDrain}</span>
          <span>Camera: {String(cameraStatus)}</span>
          <span>Minimap: {profile.minimap.visible ? (minimapExpandedRide ? 'Visible (Expanded)' : 'Visible') : 'Hidden'}</span>
          <span>Camera Follow: {enableCameraFollow ? 'ON' : 'OFF'}</span>
        </div>
      </div>
    </div>
  );
};

export default RidePage;
