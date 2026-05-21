/**
 * @cycling/accessibility/labels - Declarative Accessibility Metadata
 *
 * This module provides a declarative pattern for accessibility labels and metadata.
 * It is decoupled from business logic and runtime behavior, serving as a centralized
 * registry of accessibility information.
 *
 * Architecture Notes:
 * - All metadata is purely declarative and configuration-driven
 * - No runtime coupling to business logic or UI components
 * - Labels integrate with screen readers via ARIA attributes
 * - Keyboard shortcuts are defined at the label level for discoverability
 * - Focus management strategies are specified per overlay/interactive element
 *
 * Future Extensions:
 * - TODO: Localization support (i18n keys and locale-specific metadata)
 * - TODO: Custom label registries for domain-specific accessibility patterns
 * - TODO: Dynamic role assignment based on context
 * - TODO: Accessibility tree optimization for complex overlays
 */

/**
 * AccessibilityLabel represents declarative accessibility metadata for a UI element
 */
export interface AccessibilityLabel {
  /** Unique identifier for this label */
  id: string;
  /** ARIA label text presented to screen reader users */
  ariaLabel: string;
  /** ARIA role (button, region, dialog, etc.) */
  role: string;
  /** Human-readable description for development reference */
  description: string;
}

/**
 * KeyboardShortcut defines a keyboard interaction for accessibility
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., "Ctrl+M", "Alt+R") */
  keys: string;
  /** Action description */
  action: string;
  /** Whether this shortcut should be announced to screen readers */
  announce?: boolean;
}

/**
 * FocusManagement strategy for interactive overlays
 */
export interface FocusManagement {
  /** Element ID to receive initial focus when overlay opens */
  initialFocus?: string;
  /** Element ID to restore focus when overlay closes */
  restoreFocus?: boolean;
  /** Whether to trap focus within the overlay */
  trapFocus?: boolean;
}

/**
 * OverlayA11y groups accessibility metadata for interactive overlays
 */
export interface OverlayA11y {
  /** Unique overlay identifier */
  overlayId: string;
  /** Main accessibility label */
  label: AccessibilityLabel;
  /** Keyboard shortcuts associated with this overlay */
  keyboardShortcuts: KeyboardShortcut[];
  /** Focus management strategy */
  focusManagement: FocusManagement;
}

/**
 * ScreenReaderText is a utility type for text only exposed to screen readers
 */
export interface ScreenReaderText {
  /** Text content for screen readers */
  srText: string;
  /** Whether text should be visually hidden but available to AT */
  visuallyHidden: boolean;
}

/**
 * Creates an AccessibilityLabel with declarative metadata
 * @param id - Unique identifier
 * @param text - ARIA label text
 * @param role - ARIA role
 * @param description - Development description
 * @returns AccessibilityLabel metadata object
 */
export function createLabel(
  id: string,
  text: string,
  role: string,
  description?: string
): AccessibilityLabel {
  return {
    id,
    ariaLabel: text,
    role,
    description: description || `${id} label`,
  };
}

/**
 * Creates OverlayA11y metadata for interactive overlays
 * @param overlayId - Unique overlay identifier
 * @param options - Configuration object
 * @returns OverlayA11y metadata object
 */
export function createOverlayA11y(
  overlayId: string,
  options: {
    label: AccessibilityLabel;
    keyboardShortcuts?: KeyboardShortcut[];
    focusManagement?: Partial<FocusManagement>;
  }
): OverlayA11y {
  return {
    overlayId,
    label: options.label,
    keyboardShortcuts: options.keyboardShortcuts || [],
    focusManagement: {
      initialFocus: options.focusManagement?.initialFocus,
      restoreFocus: options.focusManagement?.restoreFocus ?? true,
      trapFocus: options.focusManagement?.trapFocus ?? true,
    },
  };
}

/**
 * Generates ARIA attributes object from an AccessibilityLabel
 * @param label - The accessibility label
 * @returns Object with aria-label and role attributes
 */
export function getAriaAttributes(label: AccessibilityLabel): {
  'aria-label': string;
  role: string;
} {
  return {
    'aria-label': label.ariaLabel,
    role: label.role,
  };
}

/**
 * Creates screen reader only text
 * @param text - Text for screen readers
 * @returns ScreenReaderText object
 */
export function createScreenReaderText(text: string): ScreenReaderText {
  return {
    srText: text,
    visuallyHidden: true,
  };
}

/**
 * PREDEFINED LABELS FOR COMMON UI PATTERNS
 * These provide standard accessibility metadata for recurring UI elements
 */

/**
 * Minimap overlay label - used for route visualization overlay
 */
export const MINIMAP_OVERLAY_LABEL = createLabel(
  'minimap-overlay',
  'Route minimap overlay',
  'region',
  'Compact route visualization showing current position and path'
);

/**
 * Minimap overlay accessibility metadata
 */
export const MINIMAP_OVERLAY_A11Y = createOverlayA11y(
  'minimap-overlay',
  {
    label: MINIMAP_OVERLAY_LABEL,
    keyboardShortcuts: [
      {
        keys: 'Alt+M',
        action: 'Toggle minimap visibility',
        announce: true,
      },
    ],
    focusManagement: {
      initialFocus: 'minimap-close-button',
      restoreFocus: true,
      trapFocus: false,
    },
  }
);

/**
 * Runtime mode switcher label - for toggling between recording/playback/navigation
 */
export const MODE_SWITCHER_LABEL = createLabel(
  'mode-switcher',
  'Runtime mode selector',
  'listbox',
  'Control for switching between recording, playback, and navigation modes'
);

/**
 * Mode switcher keyboard shortcuts
 */
export const MODE_SWITCHER_SHORTCUTS: KeyboardShortcut[] = [
  {
    keys: 'Ctrl+1',
    action: 'Switch to recording mode',
    announce: true,
  },
  {
    keys: 'Ctrl+2',
    action: 'Switch to playback mode',
    announce: true,
  },
  {
    keys: 'Ctrl+3',
    action: 'Switch to navigation mode',
    announce: true,
  },
];

/**
 * Recording controls group label
 */
export const RECORDING_CONTROLS_LABEL = createLabel(
  'recording-controls',
  'Recording controls',
  'group',
  'Button group for recording start, pause, stop, and save operations'
);

/**
 * Recording start button label
 */
export const RECORDING_START_LABEL = createLabel(
  'recording-start-button',
  'Start recording',
  'button',
  'Begin recording a new cycling route'
);

/**
 * Recording pause button label
 */
export const RECORDING_PAUSE_LABEL = createLabel(
  'recording-pause-button',
  'Pause recording',
  'button',
  'Temporarily pause route recording'
);

/**
 * Recording stop button label
 */
export const RECORDING_STOP_LABEL = createLabel(
  'recording-stop-button',
  'Stop recording',
  'button',
  'Stop and finalize route recording'
);

/**
 * Recording save button label
 */
export const RECORDING_SAVE_LABEL = createLabel(
  'recording-save-button',
  'Save route',
  'button',
  'Save the recorded cycling route'
);

/**
 * Status indicator label - for displaying current recording/playback state
 */
export const STATUS_INDICATOR_LABEL = createLabel(
  'status-indicator',
  'Recording status',
  'status',
  'Live indicator of current recording state and elapsed time'
);

/**
 * Playback status indicator label
 */
export const PLAYBACK_STATUS_LABEL = createLabel(
  'playback-status',
  'Playback status',
  'status',
  'Live indicator of playback progress and position'
);

/**
 * GPS status indicator label
 */
export const GPS_STATUS_LABEL = createLabel(
  'gps-status',
  'GPS signal status',
  'status',
  'Indicator of GPS connection quality and fix status'
);

/**
 * TODO: Localization Support
 * Future enhancement to support multiple languages:
 * - Define i18n key patterns (e.g., 'accessibility.minimap.label')
 * - Create locale-specific registries
 * - Implement translation lookup at runtime
 */

/**
 * TODO: Custom Label Registries
 * Allow applications to register domain-specific labels:
 * - createCustomRegistry() function
 * - Registry.register(label) method
 * - Registry.get(id) lookup with fallback chain
 */

/**
 * TODO: Dynamic Role Assignment
 * Support context-dependent role changes:
 * - createDynamicLabel(id, text, roleSelector)
 * - roleSelector function receives context object
 * - Update ARIA attributes dynamically based on application state
 */
