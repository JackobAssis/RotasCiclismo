import React, { ReactNode, useMemo, useState, useCallback, createContext, useContext } from 'react';
import { useShouldShowHud, useHudDensity } from '../stores/runtime.store';
import type {
  HudOverlayContext,
  HudWidgetConfig,
  HudWidget,
  HudWidgetRegistry,
  WidgetPosition,
} from '../modules/hud/types';
import { HudOverlayLayer } from './overlay/HudOverlayLayer';

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
    (
      key: string,
      config: HudWidgetConfig,
      widget: HudWidget,
      selector?: (state: unknown) => unknown,
    ) => {
      setRegistry((prev) => ({
        ...prev,
        [key]: { config, component: widget, selector },
      }));

      // Determine visibility based on HUD density and widget priority
      setVisibility((prev) => {
        if (key in prev) return prev;
        let isVisible = config.visible ?? true;
        if (shouldShowHud && hudDensity === 'minimal') {
          isVisible = (config.priority ?? 0) >= 15;
        } else if (!shouldShowHud) {
          isVisible = false;
        }
        return { ...prev, [key]: isVisible };
      });
    },
    [shouldShowHud, hudDensity],
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
        position: positionOverrides[key] ?? entry.config.position,
      };
    },
    [registry, positionOverrides],
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
      getActiveWidgets,
    }),
    [
      registerWidget,
      unregisterWidget,
      updateWidgetVisibility,
      updateWidgetPosition,
      getWidgetConfig,
      getActiveWidgets,
    ],
  );

  // If HUD is disabled by runtime mode, don't render overlay layer
  if (!shouldShowHud) {
    return <OverlayContext.Provider value={contextValue}>{children}</OverlayContext.Provider>;
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

export default OverlayManager;
