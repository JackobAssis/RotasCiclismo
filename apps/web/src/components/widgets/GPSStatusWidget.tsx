import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

function deriveGPSStatus(accuracy: number | null): string {
  if (accuracy === null) return 'Buscando';
  if (accuracy > 50) return 'Regular';
  if (accuracy > 20) return 'Bom';
  return 'Excelente';
}

const GPSStatusWidgetComponent: HudWidget = memo(({ label = 'GPS' }) => {
  const accuracy = useRideStore((state) => {
    const route = state.active?.route;
    if (!route || route.length === 0) return null;
    return route[route.length - 1].accuracy ?? null;
  });

  const status = deriveGPSStatus(accuracy);

  const statusColors: Record<string, string> = {
    Buscando: 'bg-yellow-400',
    Regular: 'bg-orange-400',
    Bom: 'bg-blue-400',
    Excelente: 'bg-green-400',
  };

  const dotColor = statusColors[status] || 'bg-gray-400';

  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-lg">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-xs font-bold text-white mt-0.5">
        {status}
        {accuracy !== null && (
          <span className="text-gray-500 font-medium"> ±{accuracy.toFixed(0)}m</span>
        )}
      </div>
    </div>
  );
});

GPSStatusWidgetComponent.displayName = 'GPSStatusWidget';

export const GPSStatusWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget(
      'gps-status',
      {
        id: 'gps-status',
        label: 'GPS',
        position: 'top-left',
        layer: 'base',
        visible: true,
        priority: 15,
      },
      GPSStatusWidgetComponent,
    );
    return () => overlay.unregisterWidget('gps-status');
  }, [overlay]);

  return null;
});

GPSStatusWidget.displayName = 'GPSStatusWidget';
