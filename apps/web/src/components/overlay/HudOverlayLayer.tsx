import React, { useMemo } from 'react';
import type { HudWidgetConfig, HudWidget, HudWidgetRegistry, WidgetPosition, WidgetLayer } from '../../modules/hud/types';
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

function getPositionClasses(position: WidgetPosition): string {
  const positionMap: Record<WidgetPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'center-left': 'top-1/2 left-4 -translate-y-1/2',
    'center-right': 'top-1/2 right-4 -translate-y-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  };
  return positionMap[position];
}

function getLayerZIndex(layer: WidgetLayer): number {
  return HUD_Z_INDEX[`hud${layer.charAt(0).toUpperCase() + layer.slice(1)}` as keyof typeof HUD_Z_INDEX];
}

const HUD_LAYERS: WidgetLayer[] = ['base', 'interactive', 'overlay', 'modal'];
const LAYER_Z: Record<WidgetLayer, string> = {
  base: 'z-[100]',
  interactive: 'z-[200]',
  overlay: 'z-[300]',
  modal: 'z-[400]',
};

export const HudOverlayLayer: React.FC<HudOverlayLayerProps> = ({
  registry, visibility, positionOverrides, hudDensity
}) => {
  const widgetsByLayer = useMemo(() => {
    const grouped: Record<WidgetLayer, Array<[string, HudWidgetConfig, HudWidget]>> = {
      base: [], interactive: [], overlay: [], modal: []
    };

    Object.entries(registry).forEach(([key, entry]) => {
      if (visibility[key] === false) return;

      let shouldInclude = true;
      if (hudDensity === 'minimal') shouldInclude = (entry.config.priority ?? 0) >= 15;
      else if (hudDensity === 'normal') shouldInclude = (entry.config.priority ?? 0) >= 8;

      if (shouldInclude) {
        const position = positionOverrides[key] ?? entry.config.position;
        grouped[entry.config.layer].push([key, { ...entry.config, position }, entry.component]);
      }
    });

    return grouped;
  }, [registry, visibility, positionOverrides, hudDensity]);

  return (
    <>
      {HUD_LAYERS.map((layer) => {
        const widgets = widgetsByLayer[layer];
        if (widgets.length === 0) return null;
        const ptrClass = layer === 'base' ? 'pointer-events-none' : 'pointer-events-auto';
        return (
          <div key={layer} className={`fixed inset-0 pointer-events-none ${LAYER_Z[layer]}`} style={safeAreaStyle}>
            {widgets.map(([key, config, Component]) => (
              <div
                key={key}
                className={`absolute ${getPositionClasses(config.position)} ${ptrClass}`}
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
      <div className="fixed inset-0 pointer-events-none z-[500]" data-component="ar-overlay-future"
           title="Placeholder for future AR/navigation rendering" />
    </>
  );
};
