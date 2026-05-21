import React, { useEffect, memo } from 'react';
import { useRideStore } from '../stores/ride.store';
import { useOverlay } from './OverlayManager';
import type { HudWidget } from '../modules/hud/types';

/**
 * Speed Widget
 *
 * Displays current speed from latest GPS position
 *
 * Selector Strategy:
 * - Only subscribes to latest position speed
 * - Prevents re-renders from other route/snapshot changes
 * - Performance: O(1) selector evaluation
 */
const SpeedWidgetComponent: HudWidget = memo(({ label = 'Speed' }) => {
  const speed = useRideStore((state) => {
    const route = state.active?.route;
    return route && route.length > 0 ? route[route.length - 1].speed ?? 0 : 0;
  });

  const displaySpeed = (speed || 0).toFixed(1);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-blue-600 mt-1">{displaySpeed}</div>
      <div className="text-xs text-gray-500">km/h</div>
    </div>
  );
});

SpeedWidgetComponent.displayName = 'SpeedWidget';

/**
 * Distance Widget
 *
 * Displays total distance traveled
 *
 * Selector Strategy:
 * - Subscribes to route array length (computed from points)
 * - For now: simple point count * average spacing
 * - Future: proper GPS distance calculation via worker
 */
const DistanceWidgetComponent: HudWidget = memo(({ label = 'Distance' }) => {
  const distance = useRideStore((state) => {
    return state.active?.distance ?? 0;
  });

  const displayDistance = distance.toFixed(1);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-green-600 mt-1">{displayDistance}</div>
      <div className="text-xs text-gray-500">km</div>
    </div>
  );
});

DistanceWidgetComponent.displayName = 'DistanceWidget';

/**
 * Duration Widget
 *
 * Displays elapsed time since ride started
 *
 * Selector Strategy:
 * - Subscribes to startedAt and current time
 * - Updates every second via useEffect
 * - Prevents re-renders from route/position changes
 */
const DurationWidgetComponent: HudWidget = memo(({ label = 'Duration' }) => {
  const startedAt = useRideStore((state) => state.active?.startedAt);
  const [displayDuration, setDisplayDuration] = React.useState('00:00:00');

  useEffect(() => {
    if (!startedAt) {
      setDisplayDuration('00:00:00');
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startedAt);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);

      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;

      setDisplayDuration(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">{displayDuration}</div>
      <div className="text-xs text-gray-500">hh:mm:ss</div>
    </div>
  );
});

DurationWidgetComponent.displayName = 'DurationWidget';

/**
 * GPS Status Widget
 *
 * Displays GPS connection status and accuracy
 *
 * Selector Strategy:
 * - Subscribes to latest position accuracy
 * - Shows connection status based on position updates
 * - Future: integrate with dedicated GPS status service
 */
const GPSStatusWidgetComponent: HudWidget = memo(({ label = 'GPS' }) => {
  const [status, accuracy] = useRideStore((state) => {
    const route = state.active?.route;
    if (!route || route.length === 0) {
      return ['Searching', null];
    }

    const latest = route[route.length - 1];
    const accuracy = latest.accuracy ?? null;

    // Determine status based on accuracy
    let status = 'Connected';
    if (accuracy && accuracy > 50) {
      status = 'Fair';
    } else if (accuracy && accuracy > 20) {
      status = 'Good';
    } else if (accuracy && accuracy <= 20) {
      status = 'Excellent';
    }

    return [status, accuracy];
  });

  const statusColors: Record<string, string> = {
    'Searching': 'text-yellow-600 bg-yellow-50',
    'Fair': 'text-orange-600 bg-orange-50',
    'Good': 'text-blue-600 bg-blue-50',
    'Excellent': 'text-green-600 bg-green-50',
    'Connected': 'text-blue-600 bg-blue-50'
  };

  const colorClass = statusColors[status] || 'text-gray-600 bg-gray-50';

  return (
    <div className={`rounded-lg px-3 py-2 shadow-lg border border-gray-200 ${colorClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold mt-1">{status}</div>
      {accuracy && <div className="text-xs opacity-75">±{accuracy.toFixed(0)}m</div>}
    </div>
  );
});

GPSStatusWidgetComponent.displayName = 'GPSStatusWidget';

/**
 * Recording Status Widget
 *
 * Displays current recording status and mode
 *
 * Selector Strategy:
 * - Subscribes to ride status and mode
 * - Minimal updates (only on status change)
 * - Shows visual indicator for recording state
 */
const RecordingStatusWidgetComponent: HudWidget = memo(({ label = 'Recording' }) => {
  const [status, mode] = useRideStore((state) => [state.status, state.active?.mode ?? 'GPS_ONLY']);

  const statusConfig = {
    idle: { color: 'bg-gray-100 text-gray-600', icon: '⊘', label: 'Ready' },
    active: { color: 'bg-red-100 text-red-600', icon: '●', label: 'Recording' },
    paused: { color: 'bg-yellow-100 text-yellow-600', icon: '⏸', label: 'Paused' },
    finished: { color: 'bg-green-100 text-green-600', icon: '✓', label: 'Finished' }
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg px-3 py-2 shadow-lg border border-gray-200 ${config.color}`}>
      <div className="text-xs font-semibold uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-lg font-bold">{config.icon}</span>
        <div className="text-sm font-bold">{config.label}</div>
      </div>
      <div className="text-xs opacity-75 mt-1">{mode === 'GPS_CAMERA' ? 'GPS + Camera' : 'GPS Only'}</div>
    </div>
  );
});

RecordingStatusWidgetComponent.displayName = 'RecordingStatusWidget';

/**
 * Widget Registration Hook
 *
 * Call this hook in components to automatically register/unregister widgets
 * with the overlay manager on mount/unmount
 */
export function useHudWidget(
  id: string,
  config: {
    label: string;
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-right';
    layer: 'base' | 'interactive' | 'overlay' | 'modal';
    visible?: boolean;
    priority?: number;
  }
) {
  const overlay = useOverlay();

  useEffect(() => {
    // Register this widget
    // Note: component is registered via the container
    return () => {
      // Unregister on unmount
      overlay.unregisterWidget(id);
    };
  }, [id, overlay]);
}

/**
 * Container Components for Widget Auto-Registration
 *
 * These wrappers handle the overlay manager registration
 * so individual widgets don't need to know about it
 */

export const SpeedWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('speed', {
      id: 'speed',
      label: 'Speed',
      position: 'bottom-left',
      layer: 'base',
      visible: true,
      priority: 10
    }, SpeedWidgetComponent);

    return () => overlay.unregisterWidget('speed');
  }, [overlay]);

  return <SpeedWidgetComponent label="Speed" />;
});

SpeedWidget.displayName = 'SpeedWidget';

export const DistanceWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('distance', {
      id: 'distance',
      label: 'Distance',
      position: 'bottom-center',
      layer: 'base',
      visible: true,
      priority: 9
    }, DistanceWidgetComponent);

    return () => overlay.unregisterWidget('distance');
  }, [overlay]);

  return <DistanceWidgetComponent label="Distance" />;
});

DistanceWidget.displayName = 'DistanceWidget';

export const DurationWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('duration', {
      id: 'duration',
      label: 'Duration',
      position: 'bottom-right',
      layer: 'base',
      visible: true,
      priority: 8
    }, DurationWidgetComponent);

    return () => overlay.unregisterWidget('duration');
  }, [overlay]);

  return <DurationWidgetComponent label="Duration" />;
});

DurationWidget.displayName = 'DurationWidget';

export const GPSStatusWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('gps-status', {
      id: 'gps-status',
      label: 'GPS',
      position: 'top-left',
      layer: 'base',
      visible: true,
      priority: 15
    }, GPSStatusWidgetComponent);

    return () => overlay.unregisterWidget('gps-status');
  }, [overlay]);

  return <GPSStatusWidgetComponent label="GPS" />;
});

GPSStatusWidget.displayName = 'GPSStatusWidget';

export const RecordingStatusWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('recording-status', {
      id: 'recording-status',
      label: 'Recording',
      position: 'top-right',
      layer: 'base',
      visible: true,
      priority: 15
    }, RecordingStatusWidgetComponent);

    return () => overlay.unregisterWidget('recording-status');
  }, [overlay]);

  return <RecordingStatusWidgetComponent label="Recording" />;
});

RecordingStatusWidget.displayName = 'RecordingStatusWidget';
