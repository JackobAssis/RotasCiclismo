import React, { useEffect, memo } from 'react';
import { useRuntimeStore } from '../../stores/runtime.store';
import { useOverlay } from '../OverlayManager';
import type { HudWidget } from '../../modules/hud/types';

const BatteryWidgetComponent: HudWidget = memo(({ label = 'Battery' }) => {
  const batteryPercent = useRuntimeStore((s) => s.runtimeState.batteryPercent);

  const levelColor =
    batteryPercent > 30
      ? 'text-green-400 bg-green-500/10'
      : batteryPercent > 15
        ? 'text-yellow-400 bg-yellow-500/10'
        : 'text-red-400 bg-red-500/10';

  return (
    <div className={`rounded-xl px-4 py-3 shadow-2xl border border-dark-700/50 ${levelColor}`}>
      <div className="text-xs font-semibold uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold mt-1">{batteryPercent.toFixed(0)}%</div>
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
        label: 'Battery',
        position: 'top-center',
        layer: 'base',
        visible: true,
        priority: 13,
      },
      BatteryWidgetComponent,
    );
    return () => overlay.unregisterWidget('battery');
  }, [overlay]);

  return <BatteryWidgetComponent label="Battery" />;
});

BatteryWidget.displayName = 'BatteryWidget';
