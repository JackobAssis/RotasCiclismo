import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const RecordingStatusWidgetComponent: HudWidget = memo(({ label = 'Recording' }) => {
  const status = useRideStore((state) => state.status);
  const mode = useRideStore((state) => state.active?.mode ?? 'GPS_ONLY');

  const statusConfig = {
    idle: { color: 'bg-gray-500/10 text-gray-400', icon: '⊘', label: 'Ready' },
    active: { color: 'bg-red-500/10 text-red-400', icon: '●', label: 'Recording' },
    paused: { color: 'bg-yellow-500/10 text-yellow-400', icon: '⏸', label: 'Paused' },
    finished: { color: 'bg-green-500/10 text-green-400', icon: '✓', label: 'Finished' }
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-xl px-4 py-3 shadow-2xl border border-dark-700/50 ${config.color}`}>
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

export const RecordingStatusWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget('recording-status', {
      id: 'recording-status', label: 'Recording', position: 'top-right', layer: 'base', visible: true, priority: 15
    }, RecordingStatusWidgetComponent);
    return () => overlay.unregisterWidget('recording-status');
  }, [overlay]);

  return <RecordingStatusWidgetComponent label="Recording" />;
});

RecordingStatusWidget.displayName = 'RecordingStatusWidget';
