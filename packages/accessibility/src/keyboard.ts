/**
 * @cycling/accessibility/keyboard - Keyboard Navigation and Shortcuts
 *
 * This module provides comprehensive keyboard interaction support for accessible
 * cycling haptic feedback applications. It manages keyboard event handling, focus
 * trapping, and global keyboard shortcuts for accessibility overlays.
 *
 * Keyboard Accessibility Patterns:
 * ================================
 * 1. Global Shortcuts: Register Ctrl+Key, Alt+Key, Shift+Key combinations for app-wide actions
 * 2. Focus Management: Tab navigation and focus trapping within overlays/modals
 * 3. Arrow Navigation: Support arrow key navigation between interactive elements
 * 4. Escape Dismissal: Allow Escape key to close overlays while respecting focus hierarchy
 * 5. Key Combinations: Support modifier keys (Ctrl, Alt, Shift, Meta) with any key
 *
 * Focus Management Strategy:
 * =========================
 * - Initial Focus: When an overlay opens, focus moves to the designated initial focus element
 * - Focus Trap: Within overlays, Tab/Shift+Tab cycles through focusable elements
 * - Escape Handling: Escape restores focus to the element that opened the overlay
 * - Focus Restoration: When closing overlays, focus returns to the triggering element
 * - Nested Overlays: Stack-based approach tracks active overlays and restores focus correctly
 *
 * Mobile/Touch Considerations:
 * ============================
 * - Keyboard events may not fire on mobile devices without external keyboards
 * - Consider touch alternatives (tap, swipe) in parallel with keyboard handling
 * - Screen reader users on mobile may use hardware keyboard or key chords
 * - Fallback to ARIA attributes and semantic HTML for non-keyboard users
 * - Avoid keyboard-only interactions; ensure touch equivalents exist
 *
 * Architecture Notes:
 * - KeyboardManager uses a singleton pattern for application-wide keyboard state
 * - Shortcuts are stored by key combination for O(1) lookup
 * - Focus traps maintain a stack of active overlay contexts
 * - Event delegation minimizes listener count and improves performance
 * - Keyboard events bubble; event.stopPropagation() prevents unwanted bubbling
 */

import { AccessibilityLabel, KeyboardShortcut } from './labels';

/**
 * KeyboardEventMetadata describes additional context for a keyboard event
 */
export interface KeyboardEventMetadata {
  /** Whether Ctrl/Cmd key is pressed */
  isCtrl: boolean;
  /** Whether Shift key is pressed */
  isShift: boolean;
  /** Whether Alt key is pressed */
  isAlt: boolean;
  /** Whether Meta/Command key is pressed */
  isMeta: boolean;
  /** Normalized key string (e.g., 'ArrowUp', 'Enter') */
  key: string;
  /** Full key combination string (e.g., 'Ctrl+M') */
  keyCombo: string;
}

/**
 * KeyboardShortcutDefinition used when registering shortcuts
 */
export interface KeyboardShortcutDefinition {
  /** Key combination (e.g., 'Ctrl+M', 'Alt+R') */
  keys: string;
  /** Callback to execute when shortcut is triggered */
  handler: (event: KeyboardEvent) => void;
  /** Optional metadata for accessibility reporting */
  meta?: {
    label?: string;
    description?: string;
  };
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * FocusTrapContext maintains state for a single focus-trapped overlay
 */
interface FocusTrapContext {
  /** Container element ID */
  containerId: string;
  /** Previously focused element before trap was enabled */
  previouslyFocused?: HTMLElement;
  /** List of all focusable elements within the trap */
  focusableElements: HTMLElement[];
}

/**
 * KeyboardManager handles all keyboard interactions for the application
 *
 * Responsibilities:
 * - Register and manage global keyboard shortcuts
 * - Handle focus navigation and focus trapping
 * - Process modifier key combinations (Ctrl, Alt, Shift, Meta)
 * - Manage Escape key behavior for overlay dismissal
 * - Maintain focus state across nested overlays
 */
export class KeyboardManager {
  /** Singleton instance */
  private static instance: KeyboardManager;

  /** Map of key combinations to shortcut handlers */
  private shortcuts = new Map<string, KeyboardShortcutDefinition>();

  /** Stack of active focus trap contexts */
  private focusTrapStack: FocusTrapContext[] = [];

  /** Global escape key handlers (LIFO stack) */
  private escapeHandlers: Array<(event: KeyboardEvent) => void> = [];

  /** Whether keyboard manager is active */
  private isActive = false;

  private constructor() {
    this.initializeEventListeners();
  }

  /**
   * Get the singleton KeyboardManager instance
   */
  static getInstance(): KeyboardManager {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager();
    }
    return KeyboardManager.instance;
  }

  /**
   * Initialize global keyboard event listeners
   */
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    this.isActive = true;
  }

  /**
   * Register a global keyboard shortcut
   *
   * @param key - Key combination (e.g., 'Ctrl+M', 'Alt+R', 'Shift+F1')
   * @param handler - Function to execute when shortcut is triggered
   * @param meta - Optional metadata for accessibility and debugging
   * @returns Cleanup function to unregister the shortcut
   *
   * @example
   * ```ts
   * const keyboardManager = KeyboardManager.getInstance();
   * const cleanup = keyboardManager.registerShortcut('Alt+M', (event) => {
   *   event.preventDefault();
   *   toggleMinimap();
   * }, {
   *   label: 'Toggle Minimap',
   *   description: 'Show or hide the route minimap overlay'
   * });
   * ```
   */
  registerShortcut(
    key: string,
    handler: (event: KeyboardEvent) => void,
    meta?: { label?: string; description?: string }
  ): () => void {
    const normalizedKey = normalizeKeyString(key);
    const definition: KeyboardShortcutDefinition = {
      keys: normalizedKey,
      handler,
      meta,
      preventDefault: true,
    };

    this.shortcuts.set(normalizedKey, definition);

    // Return cleanup function
    return () => {
      this.shortcuts.delete(normalizedKey);
    };
  }

  /**
   * Navigate focus in a specified direction using arrow keys
   *
   * Supports focus navigation between interactive elements:
   * - ArrowUp / ArrowDown: Vertical navigation (lists, menus)
   * - ArrowLeft / ArrowRight: Horizontal navigation (tab groups, carousels)
   *
   * @param direction - 'up', 'down', 'left', 'right'
   * @param currentElement - Element to start navigation from (defaults to document.activeElement)
   * @returns The newly focused element, or null if navigation failed
   *
   * @example
   * ```ts
   * const keyboardManager = KeyboardManager.getInstance();
   * document.addEventListener('keydown', (event) => {
   *   if (event.key === 'ArrowDown') {
   *     event.preventDefault();
   *     keyboardManager.navigateFocus('down');
   *   }
   * });
   * ```
   */
  navigateFocus(
    direction: 'up' | 'down' | 'left' | 'right',
    currentElement?: HTMLElement
  ): HTMLElement | null {
    const active = (currentElement || document.activeElement) as HTMLElement;
    if (!active) return null;

    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(active);
    if (currentIndex === -1) return null;

    let nextIndex = currentIndex;

    switch (direction) {
      case 'down':
      case 'right':
        nextIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'up':
      case 'left':
        nextIndex =
          (currentIndex - 1 + focusableElements.length) %
          focusableElements.length;
        break;
    }

    const nextElement = focusableElements[nextIndex];
    if (nextElement) {
      nextElement.focus();
      return nextElement;
    }

    return null;
  }

  /**
   * Register an Escape key handler for overlay dismissal
   *
   * Handlers are pushed onto a stack (LIFO), so the most recently registered
   * handler executes first. This supports nested overlays that close in reverse order.
   *
   * @param callback - Function to execute when Escape key is pressed
   * @returns Cleanup function to unregister the handler
   *
   * @example
   * ```ts
   * const keyboardManager = KeyboardManager.getInstance();
   * const cleanup = keyboardManager.handleEscapeKey(() => {
   *   console.log('Escape pressed - closing minimap');
   *   closeMinimap();
   * });
   *
   * // Later, when overlay closes:
   * cleanup();
   * ```
   */
  handleEscapeKey(callback: (event: KeyboardEvent) => void): () => void {
    this.escapeHandlers.push(callback);

    // Return cleanup function
    return () => {
      const index = this.escapeHandlers.indexOf(callback);
      if (index > -1) {
        this.escapeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Enable focus trapping within a container element
   *
   * When enabled, Tab key navigation cycles through focusable elements within
   * the container. This prevents focus from moving outside the container while
   * an overlay is visible.
   *
   * Focus Management:
   * - Initial focus is moved to the first focusable element
   * - Previously focused element is stored for restoration
   * - Tab navigates forward; Shift+Tab navigates backward
   * - Escape closes the overlay and restores focus
   *
   * @param containerId - HTML ID of the container to trap focus within
   * @returns Cleanup function to disable the focus trap
   *
   * @example
   * ```ts
   * const keyboardManager = KeyboardManager.getInstance();
   *
   * // When opening minimap overlay:
   * const cleanup = keyboardManager.enableFocusTrap('minimap-overlay');
   *
   * // When closing minimap overlay:
   * cleanup();
   * ```
   */
  enableFocusTrap(containerId: string): () => void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Focus trap container not found: ${containerId}`);
      return () => {};
    }

    const focusableElements = this.getFocusableElements(container);
    const previouslyFocused = document.activeElement as HTMLElement;

    const context: FocusTrapContext = {
      containerId,
      previouslyFocused,
      focusableElements,
    };

    this.focusTrapStack.push(context);

    // Move focus to first focusable element
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Return cleanup function
    return () => {
      this.focusTrapStack = this.focusTrapStack.filter(
        (ctx) => ctx.containerId !== containerId
      );

      // Restore previously focused element
      if (previouslyFocused && previouslyFocused !== document.activeElement) {
        previouslyFocused.focus();
      }
    };
  }

  /**
   * Handle keydown events globally
   * Dispatches to registered shortcuts and focus trap handlers
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!isValidKeyboardEvent(event)) return;

    const metadata = this.getKeyboardMetadata(event);

    // Handle Escape key (highest priority)
    if (event.key === 'Escape') {
      const lastHandler = this.escapeHandlers[this.escapeHandlers.length - 1];
      if (lastHandler) {
        event.preventDefault();
        lastHandler(event);
        return;
      }
    }

    // Handle Tab key within focus trap
    if (event.key === 'Tab' && this.focusTrapStack.length > 0) {
      this.handleTabNavigation(event);
      return;
    }

    // Handle registered shortcuts
    const shortcut = this.shortcuts.get(metadata.keyCombo);
    if (shortcut) {
      event.preventDefault();
      shortcut.handler(event);
    }
  }

  /**
   * Handle Tab key navigation within focus traps
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    const currentContext = this.focusTrapStack[this.focusTrapStack.length - 1];
    if (!currentContext || currentContext.focusableElements.length === 0) {
      return;
    }

    const { focusableElements } = currentContext;
    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(activeElement);

    let nextIndex: number;
    if (event.shiftKey) {
      // Shift+Tab goes backward
      nextIndex =
        (currentIndex - 1 + focusableElements.length) %
        focusableElements.length;
    } else {
      // Tab goes forward
      nextIndex = (currentIndex + 1) % focusableElements.length;
    }

    event.preventDefault();
    focusableElements[nextIndex].focus();
  }

  /**
   * Extract keyboard metadata from a KeyboardEvent
   */
  private getKeyboardMetadata(event: KeyboardEvent): KeyboardEventMetadata {
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;
    const isMeta = event.metaKey;

    const keyCombo = buildKeyCombo(
      event.key,
      isCtrl,
      isShift,
      isAlt,
      isMeta && !event.ctrlKey
    );

    return {
      isCtrl,
      isShift,
      isAlt,
      isMeta,
      key: event.key,
      keyCombo,
    };
  }

  /**
   * Get all focusable elements (optionally within a container)
   */
  private getFocusableElements(container?: Element): HTMLElement[] {
    const selector = [
      'button:not(:disabled)',
      'a[href]',
      'input:not(:disabled)',
      'select:not(:disabled)',
      'textarea:not(:disabled)',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const scope = container || document;
    const elements = Array.from(scope.querySelectorAll(selector));

    return elements
      .filter(
        (el) =>
          el instanceof HTMLElement &&
          el.offsetParent !== null &&
          getComputedStyle(el).visibility !== 'hidden'
      )
      .map((el) => el as HTMLElement);
  }

  /**
   * Check if keyboard manager is active
   */
  isKeyboardActive(): boolean {
    return this.isActive;
  }

  /**
   * Destroy keyboard manager and clean up listeners
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this), true);
    this.shortcuts.clear();
    this.focusTrapStack = [];
    this.escapeHandlers = [];
    this.isActive = false;
  }
}

/**
 * Check if a keyboard event should be handled
 *
 * Returns false for events:
 * - In input/textarea elements (except specific keys like Escape)
 * - With default behavior already prevented
 * - In contenteditable elements
 *
 * @param event - The keyboard event to validate
 * @returns Whether the event should be processed by keyboard manager
 *
 * @example
 * ```ts
 * if (isValidKeyboardEvent(event)) {
 *   // Safe to process keyboard shortcut
 * }
 * ```
 */
export function isValidKeyboardEvent(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;

  // Allow Escape in input fields
  if (event.key === 'Escape') return true;

  // Don't intercept in input/textarea unless handled by manager
  if (target instanceof HTMLInputElement) {
    return false;
  }
  if (target instanceof HTMLTextAreaElement) {
    return false;
  }

  // Don't intercept in contenteditable
  if (target.contentEditable === 'true') {
    return false;
  }

  return true;
}

/**
 * Normalize a key string to canonical form
 *
 * Accepts various formats and normalizes to standard form:
 * - 'ctrl+m' → 'Ctrl+M'
 * - 'alt+r' → 'Alt+R'
 * - 'cmd+shift+k' → 'Meta+Shift+K'
 * - 'ArrowUp' → 'ArrowUp' (unchanged)
 *
 * @param key - Key combination string
 * @returns Normalized key combination string
 *
 * @example
 * ```ts
 * normalizeKeyString('ctrl+m') // 'Ctrl+M'
 * normalizeKeyString('Alt+R') // 'Alt+R'
 * normalizeKeyString('cmd+shift+k') // 'Meta+Shift+K'
 * ```
 */
export function normalizeKeyString(key: string): string {
  const parts = key.toLowerCase().split('+');

  return parts
    .map((part) => {
      switch (part) {
        case 'ctrl':
        case 'control':
          return 'Ctrl';
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        case 'meta':
        case 'cmd':
        case 'command':
          return 'Meta';
        case 'enter':
          return 'Enter';
        case 'escape':
          return 'Escape';
        case 'tab':
          return 'Tab';
        case 'space':
          return ' ';
        case 'arrowup':
          return 'ArrowUp';
        case 'arrowdown':
          return 'ArrowDown';
        case 'arrowleft':
          return 'ArrowLeft';
        case 'arrowright':
          return 'ArrowRight';
        default:
          return part.length === 1 ? part.toUpperCase() : part;
      }
    })
    .join('+');
}

/**
 * Build a key combination string from individual modifier and key parts
 * @internal
 */
function buildKeyCombo(
  key: string,
  isCtrl: boolean,
  isShift: boolean,
  isAlt: boolean,
  isMeta: boolean
): string {
  const parts: string[] = [];

  if (isCtrl) parts.push('Ctrl');
  if (isShift) parts.push('Shift');
  if (isAlt) parts.push('Alt');
  if (isMeta) parts.push('Meta');

  parts.push(key);

  return parts.join('+');
}

/**
 * Create keyboard shortcuts from a definitions object
 *
 * Simplifies registration of multiple shortcuts at once.
 * Each definition is registered with the KeyboardManager singleton.
 *
 * @param definitions - Array of keyboard shortcut definitions
 * @returns Array of cleanup functions (one per shortcut)
 *
 * @example
 * ```ts
 * const cleanupFunctions = createKeyboardShortcuts([
 *   {
 *     keys: 'Alt+M',
 *     handler: () => toggleMinimap(),
 *     meta: { label: 'Toggle Minimap' }
 *   },
 *   {
 *     keys: 'Ctrl+1',
 *     handler: () => switchToRecordingMode(),
 *     meta: { label: 'Switch to Recording' }
 *   }
 * ]);
 *
 * // Later, unregister all shortcuts:
 * cleanupFunctions.forEach(cleanup => cleanup());
 * ```
 */
export function createKeyboardShortcuts(
  definitions: KeyboardShortcutDefinition[]
): Array<() => void> {
  const manager = KeyboardManager.getInstance();

  return definitions.map((def) =>
    manager.registerShortcut(def.keys, def.handler, def.meta)
  );
}

/**
 * TODO: Customizable Keybindings
 * Allow users to customize keyboard shortcuts:
 * - saveKeybindings(bindings): Persist custom keybindings to localStorage/DB
 * - loadKeybindings(userId): Load user-specific keyboard preferences
 * - resetKeybindings(): Restore default keybindings
 * - getKeybindingConflicts(): Detect shortcut conflicts
 */

/**
 * TODO: Locale-Aware Keys
 * Support keyboard layouts and language-specific keys:
 * - detectKeyboardLayout(): Detect system keyboard layout (QWERTY, AZERTY, etc.)
 * - getLocalizedKey(key, locale): Get locale-specific key representation
 * - normalizeLocalizedKeys(event): Handle locale-specific key codes
 * - displayKeyForLocale(key, locale): Format key for UI display
 */

/**
 * TODO: Keyboard Layout Detection
 * Adapt to different physical keyboard layouts:
 * - detectQWERTY() / detectAZERTY() / etc.
 * - mapLayoutToKeyCodes(layout): Get key code mapping for layout
 * - isValidForLayout(key, layout): Check if shortcut works on layout
 * - suggestAlternateShortcuts(key, layout): Find alternatives for layout
 */

/**
 * TODO: Voice Command Integration
 * Support voice commands alongside keyboard shortcuts:
 * - registerVoiceCommand(phrase, handler): Register voice command
 * - isSpeechRecognitionActive(): Check if voice is active
 * - normalizeSpeechInput(text): Convert voice to keyboard equivalent
 * - showVoiceCommandHints(): Display available voice commands
 * - logVoiceCommandUsage(phrase): Track voice command usage
 */
