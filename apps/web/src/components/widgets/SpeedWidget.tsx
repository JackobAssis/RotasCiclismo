import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const SpeedWidgetComponent: HudWidget = memo(({ label = 'Speed' }) => {
  const speed = useRideStore((state) => {
    const route = state.active?.route;
    return route && route.length > 0 ? (route[route.length - 1].speed ?? 0) : 0;
  });

  const displaySpeed = (speed || 0).toFixed(1);

  return (
    <div className="bg-dark-900/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-2xl border border-dark-700/50">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-5xl font-black neon-text mt-1 leading-none">{displaySpeed}</div>
      <div className="text-xs text-gray-500">km/h</div>
    </div>
  );
});

SpeedWidgetComponent.displayName = 'SpeedWidget';

export const SpeedWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget(
      'speed',
      {
        id: 'speed',
        label: 'Speed',
        position: 'bottom-center',
        layer: 'base',
        visible: true,
        priority: 20,
      },
      SpeedWidgetComponent,
    );
    return () => overlay.unregisterWidget('speed');
  }, [overlay]);

  return <SpeedWidgetComponent label="Speed" />;
});

SpeedWidget.displayName = 'SpeedWidget';
