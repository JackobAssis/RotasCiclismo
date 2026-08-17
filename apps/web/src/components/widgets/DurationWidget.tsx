import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const DurationWidgetComponent: HudWidget = memo(({ label = 'Duration' }) => {
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
    <div className="bg-dark-900/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-2xl border border-dark-700/50">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-base font-bold text-white mt-1 font-mono">{displayDuration}</div>
      <div className="text-xs text-gray-500">hh:mm:ss</div>
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
        label: 'Duration',
        position: 'bottom-right',
        layer: 'base',
        visible: true,
        priority: 10,
      },
      DurationWidgetComponent,
    );
    return () => overlay.unregisterWidget('duration');
  }, [overlay]);

  return <DurationWidgetComponent label="Duration" />;
});

DurationWidget.displayName = 'DurationWidget';
