import React, { useEffect, memo } from 'react';
import { useRideStore } from '../../stores/ride.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const RecordingStatusWidgetComponent: HudWidget = memo(({ label = 'REC' }) => {
  const status = useRideStore((state) => state.status);
  const mode = useRideStore((state) => state.active?.mode ?? 'GPS_ONLY');

  const statusConfig: Record<string, { dot: string; text: string; pulse: boolean }> = {
    idle: { dot: 'bg-gray-400', text: 'Pronto', pulse: false },
    active: { dot: 'bg-red-500', text: 'Gravando', pulse: true },
    paused: { dot: 'bg-yellow-400', text: 'Pausado', pulse: false },
    finished: { dot: 'bg-green-500', text: 'Concluída', pulse: false },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-lg">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
        />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-xs font-bold text-white mt-0.5">{config.text}</div>
      <div className="text-[9px] text-gray-500">
        {mode === 'GPS_CAMERA' ? 'GPS + Câmera' : 'GPS Only'}
      </div>
    </div>
  );
});

RecordingStatusWidgetComponent.displayName = 'RecordingStatusWidget';

export const RecordingStatusWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget(
      'recording-status',
      {
        id: 'recording-status',
        label: 'REC',
        position: 'top-center',
        layer: 'base',
        visible: true,
        priority: 15,
      },
      RecordingStatusWidgetComponent,
    );
    return () => overlay.unregisterWidget('recording-status');
  }, [overlay]);

  return null;
});

RecordingStatusWidget.displayName = 'RecordingStatusWidget';
