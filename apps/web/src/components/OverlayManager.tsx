import React, { ReactNode, useMemo, useState, useCallback, createContext, useContext } from 'react';
import { useRuntimeStore, useShouldShowHud, useHudDensity } from '../stores/runtime.store';
import type { HudOverlayContext, HudWidgetConfig, HudWidget, HudWidgetRegistry, WidgetPosition, WidgetLayer } from '../modules/hud/types';
import { HUD_Z_INDEX } from '../modules/hud/types';

/**
 * Overlay Manager Architecture
 *
 * Purpose:
 * - Central registry for all HUD widgets
 * - Coordinates rendering and visibility
 * - Manages z-index layering
 * - Handles widget lifecycle (register/unregister)
 * - Provides selector-based subscription system
 * - Mobile-first overlay layout strategy
 * - **Runtime Mode Aware**: Respects HUD visibility and density from runtime profile
 *
 * Design Principles:
 * - Widgets register themselves with config
 * - Manager doesn't own widget state (only visibility/position)
 * - Each widget independently subscribes to store selectors
 * - Manager batch-coordinates rendering (prevents excessive re-renders)
 * - Z-index strategy prevents conflicts
 * - **Runtime modes control HUD composition**: Full, normal, or minimal HUD
 *
 * Runtime Mode Integration:
 * - GPS_ONLY: Full HUD, all widgets visible
 * - CAMERA_RECORD: Minimal HUD, only critical widgets
 * - MAP_FOCUS: Minimal HUD, navigation-focused
 * - LOW_BATTERY: Minimal HUD, reduced update frequency
 * - FUTURE_AR_MODE: Minimal HUD, AR-focused
 *
 * Mobile Layout Strategy:
 * - Top: status widgets (GPS, recording)
 * - Bottom: action/info widgets (speed, distance, duration)
 * - Sides: reserved for future camera/AR overlays
 * - Responsive: hide/reposition on small screens
 *
 * Future Enhancements:
 * - Widget drag/reposition for power users
 * - Persistent widget layout preferences
 * - Dynamic widget enable/disable based on performance
 * - Swipeable widget panels
 */

const OverlayContext = createContext<HudOverlayContext | null>(null);

export function useOverlay(): HudOverlayContext {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within OverlayManager');
  }
  return context;
}

interface OverlayManagerProps {
  children: ReactNode;
}

/**
 * OverlayManager Component
 *
 * Manages:
 * - Widget registry (register/unregister)
 * - Widget visibility state
 * - Widget layout positions
 * - Z-index layering
 * - Rendering coordination
 *
 * Performance:
 * - Only renders registered widgets
 * - Memoizes widget positions
 * - Coordinates batch updates
 * - Prevents layout thrashing
 */
export const OverlayManager: React.FC<OverlayManagerProps> = ({ children }) => {
  // Get HUD visibility and density from runtime mode
  const shouldShowHud = useShouldShowHud();
  const hudDensity = useHudDensity();

  // Widget registry: maps widget key -> config + component
  const [registry, setRegistry] = useState<HudWidgetRegistry>({});

  // Widget visibility state (independent of config)
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  // Widget position overrides (for future user customization)
  const [positionOverrides, setPositionOverrides] = useState<Record<string, WidgetPosition>>({});

  /**
   * Register a widget with the overlay system
   * Called by widgets during mount
   *
   * Respects HUD density from runtime mode:
   * - 'full': all widgets visible
   * - 'normal': standard widgets visible
   * - 'minimal': only critical widgets visible (priority >= 15)
   */
  const registerWidget = useCallback(
    (key: string, config: HudWidgetConfig, widget: HudWidget, selector?: (state: any) => any) => {
      setRegistry((prev) => ({
        ...prev,
        [key]: { config, component: widget, selector }
      }));

      // Determine visibility based on HUD density and widget priority
      let isVisible = config.visible ?? true;

      if (shouldShowHud && hudDensity === 'minimal') {
        // In minimal mode, only show high-priority widgets (status indicators)
        isVisible = (config.priority ?? 0) >= 15;
      } else if (!shouldShowHud) {
        // If HUD is disabled by runtime mode, hide all widgets
        isVisible = false;
      }

      if (!(key in visibility)) {
        setVisibility((prev) => ({ ...prev, [key]: isVisible }));
      }
    },
    [visibility, shouldShowHud, hudDensity]
  );

  /**
   * Unregister a widget
   * Called by widgets during unmount
   */
  const unregisterWidget = useCallback((key: string) => {
    setRegistry((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setVisibility((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /**
   * Update widget visibility
   */
  const updateWidgetVisibility = useCallback((key: string, visible: boolean) => {
    setVisibility((prev) => ({ ...prev, [key]: visible }));
  }, []);

  /**
   * Update widget position
   */
  const updateWidgetPosition = useCallback((key: string, position: WidgetPosition) => {
    setPositionOverrides((prev) => ({ ...prev, [key]: position }));
  }, []);

  /**
   * Get widget config (with position overrides applied)
   */
  const getWidgetConfig = useCallback(
    (key: string) => {
      const entry = registry[key];
      if (!entry) return undefined;
      return {
        ...entry.config,
        position: positionOverrides[key] ?? entry.config.position
      };
    },
    [registry, positionOverrides]
  );

  /**
   * Get all active (visible) widgets
   */
  const getActiveWidgets = useCallback(() => {
    return Object.entries(registry)
      .filter(([key]) => visibility[key] !== false)
      .map(([, entry]) => entry.config)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [registry, visibility]);

  // Overlay context value (memoized to prevent unnecessary re-renders)
  const contextValue = useMemo<HudOverlayContext>(
    () => ({
      registerWidget,
      unregisterWidget,
      updateWidgetVisibility,
      updateWidgetPosition,
      getWidgetConfig,
      getActiveWidgets
    }),
    [registerWidget, unregisterWidget, updateWidgetVisibility, updateWidgetPosition, getWidgetConfig, getActiveWidgets]
  );

  // If HUD is disabled by runtime mode, don't render overlay layer
  if (!shouldShowHud) {
    return (
      <OverlayContext.Provider value={contextValue}>
        {children}
      </OverlayContext.Provider>
    );
  }

  return (
    <OverlayContext.Provider value={contextValue}>
      {children}
      {/* Render overlay layer with registered widgets */}
      <HudOverlayLayer
        registry={registry}
        visibility={visibility}
        positionOverrides={positionOverrides}
        hudDensity={hudDensity}
      />
    </OverlayContext.Provider>
  );
};

interface HudOverlayLayerProps {
  registry: HudWidgetRegistry;
  visibility: Record<string, boolean>;
  positionOverrides: Record<string, WidgetPosition>;
  hudDensity: 'full' | 'normal' | 'minimal';
}

/**
 * HudOverlayLayer Component
 *
 * Renders all registered widgets in proper layers and positions
 *
 * Runtime Mode Aware:
 * - Filters widgets based on HUD density setting
 * - Minimal mode: only shows critical widgets (high priority)
 * - Normal mode: shows standard widget set
 * - Full mode: shows all registered widgets
 *
 * Layout System:
 * - Uses CSS Grid for positioning
 * - Position classes map to grid areas
 * - Z-index groups organize layers
 * - Mobile-responsive layout
 *
 * Widget Boundaries:
 * - Each widget is isolated (pointer-events managed per widget)
 * - Interactive widgets get pointer-events: auto
 * - Non-interactive widgets get pointer-events: none
 * - Map interaction not blocked by overlay
 */
const HudOverlayLayer: React.FC<HudOverlayLayerProps> = ({
  registry,
  visibility,
  positionOverrides,
  hudDensity
}) => {
  // Group widgets by layer for proper z-index ordering
  const widgetsByLayer = useMemo(() => {
    const grouped: Record<WidgetLayer, Array<[string, HudWidgetConfig, HudWidget]>> = {
      base: [],
      interactive: [],
      overlay: [],
      modal: []
    };

    Object.entries(registry).forEach(([key, entry]) => {
      if (visibility[key] !== false) {
        // Apply HUD density filtering
        let shouldInclude = true;

        if (hudDensity === 'minimal') {
          // Only include high-priority widgets (status indicators)
          shouldInclude = (entry.config.priority ?? 0) >= 15;
        } else if (hudDensity === 'normal') {
          // Standard widgets (priority >= 8)
          shouldInclude = (entry.config.priority ?? 0) >= 8;
        }
        // 'full' includes all widgets

        if (shouldInclude) {
          const position = positionOverrides[key] ?? entry.config.position;
          grouped[entry.config.layer].push([key, { ...entry.config, position }, entry.component]);
        }
      }
    });

    return grouped;
  }, [registry, visibility, positionOverrides, hudDensity]);

  /**
   * Get CSS classes for widget positioning
   * Maps WidgetPosition to Tailwind grid/absolute positioning
   */
  const getPositionClasses = (position: WidgetPosition): string => {
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
  };

  /**
   * Get z-index for layer
   */
  const getLayerZIndex = (layer: WidgetLayer): number => {
    return HUD_Z_INDEX[`hud${layer.charAt(0).toUpperCase() + layer.slice(1)}` as keyof typeof HUD_Z_INDEX];
  };

  return (
    <>
      {/* Base layer - non-interactive status widgets */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        {widgetsByLayer.base.map(([key, config, Component]) => (
          <div
            key={key}
            className={`absolute ${getPositionClasses(config.position)} pointer-events-none`}
            style={{ zIndex: getLayerZIndex(config.layer) }}
            data-widget-id={key}
            data-widget-layer="base"
          >
            <Component label={config.label} />
          </div>
        ))}
      </div>

      {/* Interactive layer - widgets that may need clicks/touches */}
      <div className="fixed inset-0 pointer-events-none z-[200]">
        {widgetsByLayer.interactive.map(([key, config, Component]) => (
          <div
            key={key}
            className={`absolute ${getPositionClasses(config.position)} pointer-events-auto`}
            style={{ zIndex: getLayerZIndex(config.layer) }}
            data-widget-id={key}
            data-widget-layer="interactive"
          >
            <Component label={config.label} />
          </div>
        ))}
      </div>

      {/* Overlay layer - important UI that should always be visible */}
      <div className="fixed inset-0 pointer-events-none z-[300]">
        {widgetsByLayer.overlay.map(([key, config, Component]) => (
          <div
            key={key}
            className={`absolute ${getPositionClasses(config.position)} pointer-events-auto`}
            style={{ zIndex: getLayerZIndex(config.layer) }}
            data-widget-id={key}
            data-widget-layer="overlay"
          >
            <Component label={config.label} />
          </div>
        ))}
      </div>

      {/* Modal layer - dialogs, modals, etc. */}
      <div className="fixed inset-0 pointer-events-none z-[400]">
        {widgetsByLayer.modal.map(([key, config, Component]) => (
          <div
            key={key}
            className={`absolute ${getPositionClasses(config.position)} pointer-events-auto`}
            style={{ zIndex: getLayerZIndex(config.layer) }}
            data-widget-id={key}
            data-widget-layer="modal"
          >
            <Component label={config.label} />
          </div>
        ))}
      </div>

      {/* Future AR/navigation overlay placeholder */}
      <div
        className="fixed inset-0 pointer-events-none z-[500]"
        data-component="ar-overlay-future"
        title="Placeholder for future AR/navigation rendering"
      />
    </>
  );
};

export default OverlayManager;
