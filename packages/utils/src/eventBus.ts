/**
 * Lightweight generic typed Event Bus
 * - Generic over an event map `E` where keys are event names and values are payload types
 * - Small API: `on`, `off`, `once`, `emit`
 * - Designed for frontend realtime events and low-overhead mobile usage
 */
export class TypedEventBus<E extends Record<string, any>> {
  private listeners: Map<string, Set<Function>> = new Map();

  on<K extends keyof E>(event: K, cb: (payload: E[K]) => void) {
    const key = String(event);
    const set = this.listeners.get(key) ?? new Set();
    set.add(cb as Function);
    this.listeners.set(key, set);
    // return unsubscribe
    return () => this.off(event, cb);
  }

  off<K extends keyof E>(event: K, cb?: (payload: E[K]) => void) {
    const key = String(event);
    if (!this.listeners.has(key)) return;
    if (!cb) {
      this.listeners.delete(key);
      return;
    }
    const set = this.listeners.get(key)!;
    set.delete(cb as Function);
    if (set.size === 0) this.listeners.delete(key);
  }

  once<K extends keyof E>(event: K, cb: (payload: E[K]) => void) {
    const unsub = this.on(event, (payload: E[K]) => {
      try {
        cb(payload);
      } finally {
        unsub();
      }
    });
    return unsub;
  }

  emit<K extends keyof E>(event: K, payload: E[K]) {
    const key = String(event);
    const set = this.listeners.get(key);
    if (!set) return;
    // iterate over copy to allow safe unsubscribe during iteration
    for (const cb of Array.from(set)) {
      try {
        (cb as (p: E[K]) => void)(payload);
      } catch (err) {
        // swallow errors to keep bus resilient; consumers should handle errors
        // In future we can add configurable error handlers/logging
        // console.error('Event handler error', err);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
