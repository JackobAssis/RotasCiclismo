/**
 * @cycling/accessibility/focusManagement - Focus Management for Overlays
 *
 * This module provides comprehensive focus management for accessible modal dialogs,
 * overlays, and dropdown menus. It implements focus trapping patterns to ensure
 * keyboard navigation remains within the active overlay while maintaining the ability
 * to restore focus when the overlay closes.
 *
 * Focus Trap Pattern:
 * ==================
 * A focus trap restricts keyboard Tab/Shift+Tab navigation to elements within a
 * specific container (typically a modal or overlay). This prevents users from
 * tabbing to background content while an overlay is open. The trap:
 * 1. Captures focus position before overlay opens
 * 2. Identifies all focusable elements within the container
 * 3. Cycles focus when reaching first/last focusable elements
 * 4. Restores focus to the captured element when overlay closes
 *
 * Nested Overlay Coordination:
 * ============================
 * When multiple overlays are open (e.g., modal dialog containing a dropdown),
 * the FocusManager maintains a stack of focus contexts. Each overlay:
 * - Has its own focus trap and saved focus position
 * - Only the top overlay's focus trap is active
 * - When the top overlay closes, focus is restored to the previous overlay's state
 * - This creates a proper nesting hierarchy (LIFO - Last In, First Out)
 *
 * Mobile Keyboard Handling:
 * =========================
 * - On mobile devices, virtual keyboards appear/disappear, affecting focus
 * - Restore focus after keyboard dismissal to ensure focus visibility
 * - Consider that mobile browsers may not support programmatic focus for security
 * - Use scrollIntoView() after restoring focus to ensure element is visible
 * - Screen reader users on mobile may have different focus expectations
 *
 * Edge Cases & Robustness:
 * ========================
 * - Focused element removed: Check if saved element still exists before restoring
 * - Disabled/hidden elements: Filter out disabled/hidden elements from focusable set
 * - Shadow DOM: querySelectAll doesn't pierce shadow boundaries (browsers limitation)
 * - Initial focus: If no initial element specified, focus first focusable element
 * - No focusable elements: Trap on container itself (becomes focusable with tabindex=0)
 * - Focus loss: If focus escapes (e.g., click outside), return focus to container
 *
 * TODOs for Future Enhancement:
 * ============================
 * - TODO: Virtual focus for non-DOM renderers (e.g., Canvas-based UIs)
 * - TODO: Focus visible indicators (visual ring showing where focus is)
 * - TODO: Roving tabindex pattern (only one element in tab order, arrow keys move focus)
 * - TODO: Custom focus animations (smooth transitions when moving focus)
 * - TODO: Focus on scroll (auto-scroll to keep focused element in viewport)
 */

/**
 * Focusable element selector that matches interactive HTML elements
 * Includes: interactive elements, elements with tabindex, and form controls
 */
const FOCUSABLE_SELECTOR = [
  'button',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
].join(', ');

/**
 * Focus context represents the focus state for a single overlay/container
 */
interface FocusContext {
  /** The container element whose focus is being trapped */
  containerId: string;
  /** Previously focused element before trap was activated */
  previousElement: HTMLElement | null;
  /** Array of focusable elements within the container */
  focusableElements: HTMLElement[];
}

/**
 * FocusManager handles focus trapping and restoration for overlays and modals.
 * Maintains a stack of focus contexts for nested overlays.
 *
 * @example
 * ```typescript
 * const focusManager = new FocusManager();
 *
 * // When opening a modal
 * focusManager.captureFocus();
 * focusManager.trapFocus('modal-id');
 *
 * // When closing the modal
 * focusManager.releaseFocus();
 * focusManager.restoreFocus();
 * ```
 */
export class FocusManager {
  /** Stack of focus contexts for nested overlays */
  private focusStack: FocusContext[] = [];

  /** Currently active focus trap container ID */
  private activeTrapId: string | null = null;

  /** Event listener for Tab key within trapped focus */
  private trapKeyListener: ((event: KeyboardEvent) => void) | null = null;

  /**
   * Capture the currently focused element to restore later
   * Should be called before opening an overlay
   *
   * @returns The element that had focus before capture, or null if none
   */
  public captureFocus(): HTMLElement | null {
    const currentlyFocused = document.activeElement as HTMLElement;
    if (currentlyFocused && currentlyFocused !== document.body) {
      return currentlyFocused;
    }
    return null;
  }

  /**
   * Trap focus within a specific container element.
   * Creates a focus context, identifies focusable elements, and activates Tab cycling.
   * Should be called after opening an overlay.
   *
   * @param containerId - ID of the element to trap focus within
   * @param initialFocusSelector - Optional CSS selector for initial focus element
   * @throws Error if container element not found
   */
  public trapFocus(containerId: string, initialFocusSelector?: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found in DOM`);
    }

    // Save the currently focused element before setting up the trap
    const previousElement = document.activeElement as HTMLElement || null;

    // Get all focusable elements within the container
    const focusableElements = getFocusableElements(container);

    // Create focus context
    const context: FocusContext = {
      containerId,
      previousElement,
      focusableElements,
    };

    // Push to stack (enables nested overlay support)
    this.focusStack.push(context);
    this.activeTrapId = containerId;

    // Set initial focus
    if (focusableElements.length > 0) {
      let initialElement = focusableElements[0];

      if (initialFocusSelector) {
        const specified = container.querySelector(initialFocusSelector) as HTMLElement;
        if (specified && isElementFocusable(specified)) {
          initialElement = specified;
        }
      }

      initialElement.focus();
    } else {
      // If no focusable elements, make the container focusable
      container.setAttribute('tabindex', '0');
      container.focus();
    }

    // Attach Tab key trap listener
    this.attachTrapListener(containerId);
  }

  /**
   * Release focus trap for the current container.
   * Removes the trap listener but does not restore focus yet.
   * Should be called when closing an overlay before restoreFocus().
   */
  public releaseFocus(): void {
    if (this.trapKeyListener) {
      document.removeEventListener('keydown', this.trapKeyListener);
      this.trapKeyListener = null;
    }

    // Pop the current context if stack not empty
    if (this.focusStack.length > 0) {
      this.focusStack.pop();
    }

    // Update active trap ID to previous context
    this.activeTrapId = this.focusStack.length > 0 
      ? this.focusStack[this.focusStack.length - 1].containerId 
      : null;

    // If there's still an active trap, re-attach listener for the previous overlay
    if (this.activeTrapId && this.focusStack.length > 0) {
      this.attachTrapListener(this.activeTrapId);
    }
  }

  /**
   * Restore focus to the element that was focused before the overlay opened.
   * Should be called after releaseFocus() when closing an overlay.
   *
   * @returns The element that focus was restored to, or null if unable to restore
   */
  public restoreFocus(): HTMLElement | null {
    if (this.focusStack.length === 0) {
      return null;
    }

    const context = this.focusStack[this.focusStack.length - 1];
    
    if (context.previousElement && this.isElementStillInDOM(context.previousElement)) {
      // Element still exists and is in the DOM
      if (isElementFocusable(context.previousElement)) {
        context.previousElement.focus();
        context.previousElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return context.previousElement;
      }
    }

    return null;
  }

  /**
   * Clear all focus state and reset to default.
   * Use this when cleaning up after all overlays are closed.
   */
  public clearFocusState(): void {
    this.focusStack = [];
    this.activeTrapId = null;

    if (this.trapKeyListener) {
      document.removeEventListener('keydown', this.trapKeyListener);
      this.trapKeyListener = null;
    }
  }

  /**
   * Attach the Tab key trap listener to the document for the active container
   * @internal
   */
  private attachTrapListener(containerId: string): void {
    if (this.trapKeyListener) {
      document.removeEventListener('keydown', this.trapKeyListener);
    }

    this.trapKeyListener = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const context = this.focusStack.find(ctx => ctx.containerId === containerId);
      if (!context || context.focusableElements.length === 0) {
        return;
      }

      const { focusableElements } = context;
      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = focusableElements.indexOf(activeElement);

      if (event.shiftKey) {
        // Shift+Tab: move to previous element
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[prevIndex].focus();
      } else {
        // Tab: move to next element
        event.preventDefault();
        const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        focusableElements[nextIndex].focus();
      }
    };

    document.addEventListener('keydown', this.trapKeyListener);
  }

  /**
   * Check if an element still exists in the DOM
   * @internal
   */
  private isElementStillInDOM(element: HTMLElement): boolean {
    return document.body.contains(element);
  }
}

/**
 * Get all focusable elements within a container.
 * Filters out disabled and hidden elements.
 *
 * @param container - The container element to search within
 * @returns Array of focusable elements in tab order
 *
 * @example
 * ```typescript
 * const modal = document.getElementById('my-modal');
 * const focusable = getFocusableElements(modal);
 * console.log(`Found ${focusable.length} focusable elements`);
 * ```
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );

  // Filter to only visible and enabled elements
  return elements.filter(element => {
    return (
      isElementFocusable(element) &&
      !isElementHidden(element) &&
      !isElementDisabled(element)
    );
  });
}

/**
 * Check if an element is capable of receiving focus.
 * An element can receive focus if it's not disabled, not hidden,
 * and is a native interactive element or has a valid tabindex.
 *
 * @param element - The element to check
 * @returns True if element can receive focus
 *
 * @example
 * ```typescript
 * if (isElementFocusable(myButton)) {
 *   myButton.focus();
 * }
 * ```
 */
export function isElementFocusable(element: HTMLElement): boolean {
  // Check if element is disabled
  if (isElementDisabled(element)) {
    return false;
  }

  // Check if element is hidden
  if (isElementHidden(element)) {
    return false;
  }

  // Check if element is in the FOCUSABLE_SELECTOR list
  if (element.matches(FOCUSABLE_SELECTOR)) {
    return true;
  }

  return false;
}

/**
 * Move focus within a trapped container in a specified direction.
 * Supports forward (Tab), backward (Shift+Tab), first, and last directions.
 *
 * @param direction - Direction to move: 'next', 'previous', 'first', 'last'
 * @param containerId - ID of the container with trapped focus
 * @returns The element that received focus, or null if unable to move focus
 *
 * @example
 * ```typescript
 * // Move focus to next element
 * moveFocus('next', 'modal-id');
 *
 * // Jump to first focusable element
 * moveFocus('first', 'modal-id');
 * ```
 */
export function moveFocus(
  direction: 'next' | 'previous' | 'first' | 'last',
  containerId: string
): HTMLElement | null {
  const container = document.getElementById(containerId);
  if (!container) {
    return null;
  }

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) {
    return null;
  }

  let targetElement: HTMLElement | null = null;
  const activeElement = document.activeElement as HTMLElement;
  const currentIndex = focusableElements.indexOf(activeElement);

  switch (direction) {
    case 'next':
      targetElement = focusableElements[
        currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1
      ];
      break;
    case 'previous':
      targetElement = focusableElements[
        currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1
      ];
      break;
    case 'first':
      targetElement = focusableElements[0];
      break;
    case 'last':
      targetElement = focusableElements[focusableElements.length - 1];
      break;
  }

  if (targetElement) {
    targetElement.focus();
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return targetElement;
  }

  return null;
}

/**
 * Check if an element is disabled.
 * Accounts for the disabled attribute and aria-disabled attribute.
 * @internal
 */
function isElementDisabled(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();

  // Native disabled attribute
  if (element.hasAttribute('disabled')) {
    return true;
  }

  // ARIA disabled
  if (element.getAttribute('aria-disabled') === 'true') {
    return true;
  }

  // Check parent fieldset disabled (for form controls)
  if (['input', 'button', 'select', 'textarea'].includes(tagName)) {
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName.toLowerCase() === 'fieldset' && parent.hasAttribute('disabled')) {
        return true;
      }
      parent = parent.parentElement;
    }
  }

  return false;
}

/**
 * Check if an element is visually hidden.
 * Accounts for display: none, visibility: hidden, opacity: 0, and aria-hidden.
 * @internal
 */
function isElementHidden(element: HTMLElement): boolean {
  // ARIA hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return true;
  }

  // Check computed styles
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return true;
  }

  // Check if any parent is hidden
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

/**
 * Create and return a singleton FocusManager instance for application-wide use
 * @internal
 */
let singletonInstance: FocusManager | null = null;

/**
 * Get the singleton FocusManager instance
 * @returns The global FocusManager instance
 *
 * @example
 * ```typescript
 * const focusManager = getFocusManager();
 * focusManager.captureFocus();
 * ```
 */
export function getFocusManager(): FocusManager {
  if (!singletonInstance) {
    singletonInstance = new FocusManager();
  }
  return singletonInstance;
}
