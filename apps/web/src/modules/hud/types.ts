/**
 * HUD Widget Architecture Types
 *
 * Widget Lifecycle:
 * 1. Widget registers with OverlayManager via key
 * 2. Manager stores reference and position config
 * 3. Widget uses selectors to subscribe to store
 * 4. Widget re-renders only on selector changes
 * 5. Overlay manager coordinates render cycles
 *
 * Performance Principles:
 * - Widgets are memoized React components
 * - Each widget has isolated selector subscriptions
 * - Manager batch-coordinates rendering
 * - Selectors prevent unnecessary re-renders
 */

export type WidgetPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center-left'
  | 'center-right';

export type WidgetLayer = 'base' | 'interactive' | 'overlay' | 'modal';

export type HudWidgetProps = {
  className?: string;
  label?: string;
};

/**
 * Widget metadata registered with overlay manager
 */
export type HudWidgetConfig = {
  id: string;
  label: string;
  position: WidgetPosition;
  layer: WidgetLayer;
  visible?: boolean;
  priority?: number; // Higher = renders first (performance optimization)
};

/**
 * Widget component type with memo and selector optimization
 */
export type HudWidget = React.FC<HudWidgetProps>;

/**
 * Widget registration for overlay manager
 */
export type HudWidgetRegistry = {
  [key: string]: {
    config: HudWidgetConfig;
    component: HudWidget;
    selector?: (state: any) => any; // Optional: for granular updates
  };
};

/**
 * Overlay manager context for widgets
 */
export type HudOverlayContext = {
  registerWidget: (key: string, config: HudWidgetConfig, widget: HudWidget, selector?: (state: any) => any) => void;
  unregisterWidget: (key: string) => void;
  updateWidgetVisibility: (key: string, visible: boolean) => void;
  updateWidgetPosition: (key: string, position: WidgetPosition) => void;
  getWidgetConfig: (key: string) => HudWidgetConfig | undefined;
  getActiveWidgets: () => HudWidgetConfig[];
};

/**
 * Z-index strategy for overlay layers
 * Ensures proper layering without conflicts
 */
export const HUD_Z_INDEX = {
  // Map layer
  map: 0,
  mapMarkers: 1,
  mapControls: 2,

  // HUD overlay layers
  hudBase: 100,
  hudInteractive: 200,
  hudOverlay: 300,
  hudModal: 400,

  // Future AR/navigation layers
  arBase: 500,
  arOverlay: 600,
  cameraOverlay: 700,
} as const;
