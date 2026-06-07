import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

function deriveGPSStatus(accuracy: number | null): string {
  if (accuracy === null) return 'Searching';
  if (accuracy > 50) return 'Fair';
  if (accuracy > 20) return 'Good';
  return 'Excellent';
}

const GPSStatusWidgetComponent: HudWidget = memo(({ label = 'GPS' }) => {
  const accuracy = useRideStore((state) => {
    const route = state.active?.route;
    if (!route || route.length === 0) return null;
    return route[route.length - 1].accuracy ?? null;
  });

  const status = deriveGPSStatus(accuracy);

  const statusColors: Record<string, string> = {
    'Searching': 'text-yellow-400 bg-yellow-500/10',
    'Fair': 'text-orange-400 bg-orange-500/10',
    'Good': 'text-blue-400 bg-blue-500/10',
    'Excellent': 'text-green-400 bg-green-500/10',
    'Connected': 'text-blue-400 bg-blue-500/10'
  };

  const colorClass = statusColors[status] || 'text-gray-400 bg-gray-500/10';

  return (
    <div className={`rounded-xl px-4 py-3 shadow-2xl border border-dark-700/50 ${colorClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold mt-1">{status}</div>
      {accuracy !== null && <div className="text-xs opacity-75">±{accuracy.toFixed(0)}m</div>}
    </div>
  );
});

GPSStatusWidgetComponent.displayName = 'GPSStatusWidget';

export const GPSStatusWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('gps-status', {
      id: 'gps-status', label: 'GPS', position: 'top-left', layer: 'base', visible: true, priority: 15
    }, GPSStatusWidgetComponent);
    return () => overlay.unregisterWidget('gps-status');
  }, [overlay]);

  return <GPSStatusWidgetComponent label="GPS" />;
});

GPSStatusWidget.displayName = 'GPSStatusWidget';
