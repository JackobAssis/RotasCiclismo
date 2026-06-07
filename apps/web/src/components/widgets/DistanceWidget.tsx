import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const DistanceWidgetComponent: HudWidget = memo(({ label = 'Distance' }) => {
  const distance = useRideStore((state) => state.active?.distance ?? 0);
  const displayDistance = distance.toFixed(1);

  return (
    <div className="bg-dark-900/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-2xl border border-dark-700/50">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{displayDistance}</div>
      <div className="text-xs text-gray-500">km</div>
    </div>
  );
});

DistanceWidgetComponent.displayName = 'DistanceWidget';

export const DistanceWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('distance', {
      id: 'distance', label: 'Distance', position: 'bottom-left', layer: 'base', visible: true, priority: 15
    }, DistanceWidgetComponent);
    return () => overlay.unregisterWidget('distance');
  }, [overlay]);

  return <DistanceWidgetComponent label="Distance" />;
});

DistanceWidget.displayName = 'DistanceWidget';
