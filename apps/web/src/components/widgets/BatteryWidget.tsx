import React, { useEffect, memo } from 'react';
import { useRuntimeStore } from '../../stores/runtime.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const BatteryWidgetComponent: HudWidget = memo(({ label = 'Bateria' }) => {
  const batteryPercent = useRuntimeStore((s) => s.runtimeState.batteryPercent);

  const levelColor =
    batteryPercent > 30
      ? 'text-green-400'
      : batteryPercent > 15
        ? 'text-yellow-400'
        : 'text-red-400';

  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-right shadow-lg">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-sm font-bold mt-0.5 ${levelColor}`}>{batteryPercent.toFixed(0)}%</div>
    </div>
  );
});

BatteryWidgetComponent.displayName = 'BatteryWidget';

export const BatteryWidget = memo(() => {
  const overlay = useOverlay();

  useEffect(() => {
    overlay.registerWidget(
      'battery',
      {
        id: 'battery',
        label: 'Bateria',
        position: 'top-right',
        layer: 'base',
        visible: true,
        priority: 13,
      },
      BatteryWidgetComponent,
    );
    return () => overlay.unregisterWidget('battery');
  }, [overlay]);

  return null;
});

BatteryWidget.displayName = 'BatteryWidget';
