import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const DurationWidgetComponent: HudWidget = memo(({ label = 'Tempo' }) => {
  const startedAt = useRideStore((state) => state.active?.startedAt);
  const [displayDuration, setDisplayDuration] = React.useState('00:00:00');

  useEffect(() => {
    if (!startedAt) {
      setDisplayDuration('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startedAt);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      setDisplayDuration(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className="glass-strong rounded-2xl px-4 py-3 text-right shadow-lg">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-lg font-bold text-white mt-0.5 leading-none font-mono">
        {displayDuration}
      </div>
      <div className="text-[10px] text-gray-500">hh:mm:ss</div>
    </div>
  );
});

DurationWidgetComponent.displayName = 'DurationWidget';

export const DurationWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget(
      'duration',
      {
        id: 'duration',
        label: 'Tempo',
        position: 'bottom-right',
        layer: 'base',
        visible: true,
        priority: 10,
      },
      DurationWidgetComponent,
    );
    return () => overlay.unregisterWidget('duration');
  }, [overlay]);

  return null;
});

DurationWidget.displayName = 'DurationWidget';
