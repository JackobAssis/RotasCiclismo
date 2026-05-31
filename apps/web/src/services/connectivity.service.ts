/**
 * Connectivity Service: Online/offline detection and monitoring
 * 
 * Tracks:
 * - Online/offline status
 * - Connection quality
 * - Backend health
 * - Sync state
 * 
 * Usage: Subscribe to connectivity changes for UI feedback
 */

export type ConnectivityStatus = 'online' | 'offline' | 'degraded';

export interface ConnectivityState {
  status: ConnectivityStatus;
  isOnline: boolean;
  isOffline: boolean;
  isDegraded: boolean;
  lastCheckedAt: number;
  latency?: number; // milliseconds
}

export type ConnectivityListener = (state: ConnectivityState) => void;

/**
 * Connectivity Service
 * 
 * Monitors connection status and provides real-time updates
 */
export class ConnectivityService {
  private status: ConnectivityStatus = 'online';
  private listeners: Set<ConnectivityListener> = new Set();
  private healthCheckInterval: number | null = null;
  private lastHealthCheckTime: number = 0;
  private latency: number | undefined;

  constructor(
    private healthCheckUrl: string = '/api/health',
    private healthCheckIntervalMs: number = 30000 // Check every 30 seconds
  ) {
    this.initialize();
  }

  /**
   * Initialize connectivity monitoring
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Listen to browser events
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    // Initial status
    if (!navigator.onLine) {
      this.status = 'offline';
    }

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Check immediately
    this.checkHealth();

    // Then check periodically
    this.healthCheckInterval = window.setInterval(
      () => this.checkHealth(),
      this.healthCheckIntervalMs
    );
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check backend health
   */
  private async checkHealth(): Promise<void> {
    try {
      const startTime = performance.now();
      const response = await fetch(this.healthCheckUrl, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const endTime = performance.now();
      this.latency = endTime - startTime;
      this.lastHealthCheckTime = Date.now();

      if (!response.ok) {
        this.setStatus('degraded');
        return;
      }

      // Check latency for degraded connection
      if (this.latency > 2000) {
        this.setStatus('degraded');
      } else {
        this.setStatus('online');
      }
    } catch (error) {
      // Health check failed
      if (navigator.onLine) {
        this.setStatus('degraded');
      } else {
        this.setStatus('offline');
      }
    }
  }

  /**
   * Handle online event
   */
  private onOnline(): void {
    // Browser says we're online, verify with health check
    this.checkHealth();
  }

  /**
   * Handle offline event
   */
  private onOffline(): void {
    this.setStatus('offline');
  }

  /**
   * Set connectivity status
   */
  private setStatus(status: ConnectivityStatus): void {
    if (this.status === status) return;

    this.status = status;
    this.notifyListeners();
  }

  /**
   * Get current connectivity state
   */
  getState(): ConnectivityState {
    return {
      status: this.status,
      isOnline: this.status === 'online',
      isOffline: this.status === 'offline',
      isDegraded: this.status === 'degraded',
      lastCheckedAt: this.lastHealthCheckTime,
      latency: this.latency,
    };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.status === 'online';
  }

  /**
   * Check if offline
   */
  isOffline(): boolean {
    return this.status === 'offline';
  }

  /**
   * Check if connection is degraded
   */
  isDegraded(): boolean {
    return this.status === 'degraded';
  }

  /**
   * Get latency in milliseconds
   */
  getLatency(): number | undefined {
    return this.latency;
  }

  /**
   * Subscribe to connectivity changes
   */
  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Connectivity listener error:', error);
      }
    });
  }

  /**
   * Force health check
   */
  async forceCheck(): Promise<ConnectivityState> {
    await this.checkHealth();
    return this.getState();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopHealthChecks();
    this.listeners.clear();

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.onOnline());
      window.removeEventListener('offline', () => this.onOffline());
    }
  }
}

// Export singleton instance
export const connectivityService = new ConnectivityService(
  `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/health`,
  30000 // Check every 30 seconds
);
