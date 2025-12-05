// Accessibility utilities for keyboard navigation, focus management, and ARIA

export const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function trapFocus(element: HTMLElement) {
  const focusableContent = element.querySelectorAll(focusableElements);
  const firstFocusableElement = focusableContent[0] as HTMLElement;
  const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement;

  element.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  });

  firstFocusableElement.focus();
}

export function isFocusable(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  
  // Element is not visible
  if (element.offsetParent === null) return false;
  
  // Element is disabled
  if ((element as HTMLButtonElement).disabled) return false;
  
  // Element is a link without href
  if (element.tagName === 'A' && !(element as HTMLAnchorElement).href) return false;
  
  // Check tabindex
  const tabIndex = element.getAttribute('tabindex');
  if (tabIndex === '-1') return false;
  
  return true;
}

export function getFocusableElements(container: HTMLElement | Document = document): HTMLElement[] {
  return Array.from(container.querySelectorAll(focusableElements)).filter(
    (el): el is HTMLElement => isFocusable(el)
  );
}

export function getFirstFocusable(container: HTMLElement | Document = document): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable.length > 0 ? focusable[0] : null;
}

export function getLastFocusable(container: HTMLElement | Document = document): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable.length > 0 ? focusable[focusable.length - 1] : null;
}

export function getNextFocusable(current: Element, container: HTMLElement | Document = document): HTMLElement | null {
  const focusable = getFocusableElements(container);
  const currentIndex = focusable.indexOf(current as HTMLElement);
  
  if (currentIndex === -1 || currentIndex === focusable.length - 1) {
    return focusable[0] || null;
  }
  
  return focusable[currentIndex + 1] || null;
}

export function getPreviousFocusable(current: Element, container: HTMLElement | Document = document): HTMLElement | null {
  const focusable = getFocusableElements(container);
  const currentIndex = focusable.indexOf(current as HTMLElement);
  
  if (currentIndex <= 0) {
    return focusable[focusable.length - 1] || null;
  }
  
  return focusable[currentIndex - 1] || null;
}

// ARIA Live Regions
export const AriaLiveRegion = {
  polite: 'polite',
  assertive: 'assertive',
  off: 'off'
} as const;

export function createLiveRegion(priority: keyof typeof AriaLiveRegion = 'polite'): HTMLDivElement {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  Object.assign(liveRegion.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  });
  document.body.appendChild(liveRegion);
  return liveRegion;
}

export function announce(message: string, priority: keyof typeof AriaLiveRegion = 'polite'): void {
  const liveRegion = createLiveRegion(priority);
  liveRegion.textContent = message;
  
  // Remove the live region after a short delay
  setTimeout(() => {
    if (liveRegion.parentNode) {
      liveRegion.parentNode.removeChild(liveRegion);
    }
  }, 1000);
}

// Keyboard navigation
export const Keys = {
  TAB: 'Tab',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
} as const;

export function isKeyboardEvent(event: KeyboardEvent, key: keyof typeof Keys): boolean {
  return event.key === Keys[key];
}

// Focus management
export function focusElement(selector: string): void {
  const element = document.querySelector(selector);
  if (element && element instanceof HTMLElement) {
    element.focus();
  }
}

export function focusFirstFocusable(container: HTMLElement | Document = document): void {
  const firstFocusable = getFirstFocusable(container);
  if (firstFocusable) {
    firstFocusable.focus();
  }
}

export function focusLastFocusable(container: HTMLElement | Document = document): void {
  const lastFocusable = getLastFocusable(container);
  if (lastFocusable) {
    lastFocusable.focus();
  }
}

// Skip links
export function setupSkipLinks(): void {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  skipLink.setAttribute('tabindex', '0');
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: white;
      padding: 8px;
      z-index: 100;
      transition: top 0.3s;
    }
    .skip-link:focus {
      top: 0;
    }
  `;
  
  document.head.appendChild(style);
  document.body.insertBefore(skipLink, document.body.firstChild);
}

// Initialize accessibility features
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setupSkipLinks();
  });
}

// Accessibility error handling
export class AccessibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessibilityError';
  }
}

// ARIA attributes helper
export function setAriaAttributes(element: HTMLElement, attributes: Record<string, string | boolean | null>): void {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === false) {
      element.removeAttribute(`aria-${key}`);
    } else if (value === true) {
      element.setAttribute(`aria-${key}`, 'true');
    } else {
      element.setAttribute(`aria-${key}`, value);
    }
  });
}

// Focus trap for modals
export class FocusTrap {
  private element: HTMLElement;
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private boundKeydown: (e: KeyboardEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.boundKeydown = this.handleKeydown.bind(this);
    this.init();
  }

  private init(): void {
    const focusable = getFocusableElements(this.element);
    if (focusable.length === 0) {
      throw new AccessibilityError('No focusable elements found in the focus trap');
    }

    this.firstFocusable = focusable[0];
    this.lastFocusable = focusable[focusable.length - 1];
    
    this.firstFocusable.focus();
    document.addEventListener('keydown', this.boundKeydown);
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.boundKeydown);
  }
}

// Initialize accessibility features when the module is imported
if (typeof document !== 'undefined') {
  setupSkipLinks();
}
