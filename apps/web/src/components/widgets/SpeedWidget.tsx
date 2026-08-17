import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const SpeedWidgetComponent: HudWidget = memo(({ label = 'Velocidade' }) => {
  const speed = useRideStore((state) => {
    const route = state.active?.route;
    return route && route.length > 0 ? (route[route.length - 1].speed ?? 0) : 0;
  });

  const displaySpeed = (speed || 0).toFixed(1);

  return (
    <div className="glass-strong rounded-2xl px-5 py-3 text-center shadow-lg">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-5xl font-black neon-text leading-none mt-0.5">{displaySpeed}</div>
      <div className="text-[10px] text-gray-500">km/h</div>
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
        label: 'Velocidade',
        position: 'bottom-center',
        layer: 'base',
        visible: true,
        priority: 20,
      },
      SpeedWidgetComponent,
    );
    return () => overlay.unregisterWidget('speed');
  }, [overlay]);

  return null;
});

SpeedWidget.displayName = 'SpeedWidget';
