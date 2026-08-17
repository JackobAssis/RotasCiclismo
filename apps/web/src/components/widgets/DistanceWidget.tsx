import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const DistanceWidgetComponent: HudWidget = memo(({ label = 'Distância' }) => {
  const distance = useRideStore((state) => state.active?.distance ?? 0);
  const displayDistance = distance.toFixed(1);

  return (
    <div className="glass-strong rounded-2xl px-4 py-3 shadow-lg">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-xl font-bold text-white mt-0.5 leading-none">{displayDistance}</div>
      <div className="text-[10px] text-gray-500">km</div>
    </div>
  );
});

DistanceWidgetComponent.displayName = 'DistanceWidget';

export const DistanceWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget(
      'distance',
      {
        id: 'distance',
        label: 'Distância',
        position: 'bottom-left',
        layer: 'base',
        visible: true,
        priority: 15,
      },
      DistanceWidgetComponent,
    );
    return () => overlay.unregisterWidget('distance');
  }, [overlay]);

  return null;
});

DistanceWidget.displayName = 'DistanceWidget';
