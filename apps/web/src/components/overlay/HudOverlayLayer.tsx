import React, { useMemo } from 'react';
import type {
  HudWidgetConfig,
  HudWidget,
  HudWidgetRegistry,
  WidgetPosition,
  WidgetLayer,
} from '../../modules/hud/types';
import { HUD_Z_INDEX } from '../../modules/hud/types';

interface HudOverlayLayerProps {
  registry: HudWidgetRegistry;
  visibility: Record<string, boolean>;
  positionOverrides: Record<string, WidgetPosition>;
  hudDensity: 'full' | 'normal' | 'minimal';
}

const safeAreaStyle: React.CSSProperties = {
  paddingTop: 'env(safe-area-inset-top, 0px)',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  paddingLeft: 'env(safe-area-inset-left, 0px)',
  paddingRight: 'env(safe-area-inset-right, 0px)',
};

const HUD_LAYERS: WidgetLayer[] = ['base', 'interactive', 'overlay', 'modal'];
const LAYER_Z: Record<WidgetLayer, string> = {
  base: 'z-[100]',
  interactive: 'z-[200]',
  overlay: 'z-[300]',
  modal: 'z-[400]',
};

// Non-docked (side/center) widgets keep absolute positioning
function getPositionClasses(position: WidgetPosition): string {
  const positionMap: Record<WidgetPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'center-left': 'top-1/2 left-4 -translate-y-1/2',
    'center-right': 'top-1/2 right-4 -translate-y-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };
  return positionMap[position];
}

function getLayerZIndex(layer: WidgetLayer): number {
  return HUD_Z_INDEX[
    `hud${layer.charAt(0).toUpperCase() + layer.slice(1)}` as keyof typeof HUD_Z_INDEX
  ];
}

type DockedWidget = [string, HudWidgetConfig, HudWidget];

function getTopSlot(position: WidgetPosition): number {
  if (position === 'top-left') return 0;
  if (position === 'top-right') return 2;
  return 1;
}

function getBottomSlot(position: WidgetPosition): number {
  if (position === 'bottom-left') return 0;
  if (position === 'bottom-right') return 2;
  return 1;
}

function renderSlot(slot: DockedWidget | null, justify: string, index: number) {
  if (!slot) return <div key={`empty-${index}`} />;
  const [key, config, Component] = slot;
  return (
    <div key={key} className={`flex ${justify}`}>
      <Component label={config.label} />
    </div>
  );
}

export const HudOverlayLayer: React.FC<HudOverlayLayerProps> = ({
  registry,
  visibility,
  positionOverrides,
  hudDensity,
}) => {
  const baseWidgets = useMemo(() => {
    const list: DockedWidget[] = [];
    Object.entries(registry).forEach(([key, entry]) => {
      if (visibility[key] === false) return;

      let shouldInclude = true;
      if (hudDensity === 'minimal') shouldInclude = (entry.config.priority ?? 0) >= 15;
      else if (hudDensity === 'normal') shouldInclude = (entry.config.priority ?? 0) >= 8;

      if (shouldInclude && entry.config.layer === 'base') {
        const position = positionOverrides[key] ?? entry.config.position;
        list.push([key, { ...entry.config, position }, entry.component]);
      }
    });
    return list;
  }, [registry, visibility, positionOverrides, hudDensity]);

  const topSlots = useMemo<DockedWidget[]>(() => {
    const slots: DockedWidget[] = [null, null, null] as unknown as DockedWidget[];
    baseWidgets.forEach((w) => {
      const slot = getTopSlot(w[1].position);
      slots[slot] = w;
    });
    return slots;
  }, [baseWidgets]);

  const bottomSlots = useMemo<DockedWidget[]>(() => {
    const slots: DockedWidget[] = [null, null, null] as unknown as DockedWidget[];
    baseWidgets.forEach((w) => {
      if (w[1].position.startsWith('top')) return;
      const slot = getBottomSlot(w[1].position);
      slots[slot] = w;
    });
    return slots;
  }, [baseWidgets]);

  return (
    <>
      {/* Base HUD layer — mobile dock layout:
          top status row (GPS | Recording | Battery) + bottom stats dock
          raised above the action buttons */}
      <div className="fixed inset-0 pointer-events-none z-[100]" style={safeAreaStyle}>
        <div className="absolute top-0 inset-x-0 p-3 grid grid-cols-3 items-start gap-2">
          {topSlots.map((slot, i) =>
            renderSlot(
              slot,
              i === 0 ? 'justify-start' : i === 2 ? 'justify-end' : 'justify-center',
              i,
            ),
          )}
        </div>
        <div className="absolute inset-x-3 bottom-28 grid grid-cols-3 items-end gap-2">
          {bottomSlots.map((slot, i) =>
            renderSlot(
              slot,
              i === 0 ? 'justify-start' : i === 2 ? 'justify-end' : 'justify-center',
              i,
            ),
          )}
        </div>
      </div>

      {/* Interactive / overlay / modal layers — absolutely positioned */}
      {HUD_LAYERS.filter((layer) => layer !== 'base').map((layer) => {
        const widgets = Object.entries(registry)
          .filter(
            ([key, entry]) =>
              visibility[key] !== false &&
              entry.config.layer === layer &&
              (hudDensity !== 'minimal' || (entry.config.priority ?? 0) >= 15),
          )
          .map(([key, entry]) => [key, entry.config, entry.component] as DockedWidget);

        if (widgets.length === 0) return null;
        return (
          <div
            key={layer}
            className={`fixed inset-0 pointer-events-none ${LAYER_Z[layer]}`}
            style={safeAreaStyle}
          >
            {widgets.map(([key, config, Component]) => (
              <div
                key={key}
                className={`absolute ${getPositionClasses(config.position)} pointer-events-auto`}
                style={{ zIndex: getLayerZIndex(config.layer) }}
                data-widget-id={key}
                data-widget-layer={layer}
              >
                <Component label={config.label} />
              </div>
            ))}
          </div>
        );
      })}
      <div
        className="fixed inset-0 pointer-events-none z-[500]"
        data-component="ar-overlay-future"
        title="Placeholder for future AR/navigation rendering"
      />
    </>
  );
};
