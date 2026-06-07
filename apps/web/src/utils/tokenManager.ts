/**
 * Token Manager: JWT token lifecycle management
 * 
 * Handles:
 * - Token storage (memory + localStorage)
 * - Token retrieval
 * - Token refresh
 * - Token expiration
 * - Session persistence
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  username: string;
  iat: number; // issued at
  exp: number; // expiration
}

const ACCESS_TOKEN_KEY = 'cycling_access_token';
const REFRESH_TOKEN_KEY = 'cycling_refresh_token';
const USER_ID_KEY = 'cycling_user_id';

/**
 * Token Manager class
 * 
 * Manages all token operations in a single place
 */
export class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load tokens from persistent storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (stored) {
      this.refreshToken = stored;
    }
  }

  /**
   * Save tokens to memory and localStorage
   */
  setTokens(tokens: TokenPair): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    // Store refresh token for session recovery
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  /**
   * Get access token (for API calls)
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get refresh token (for token refresh)
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Get both tokens
   */
  getTokens(): TokenPair | null {
    if (!this.accessToken || !this.refreshToken) {
      return null;
    }

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.accessToken;
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Check if access token is expired
   */
  isAccessTokenExpired(): boolean {
    if (!this.accessToken) return true;

    try {
      const payload = this.decodeToken(this.accessToken);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    } catch {
      return true;
    }
  }

  /**
   * Get time until token expires (in seconds)
   */
  getExpiresIn(): number {
    if (!this.accessToken) return 0;

    try {
      const payload = this.decodeToken(this.accessToken);
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - now);
    } catch {
      return 0;
    }
  }

  /**
   * Decode JWT token (without verification)
   * 
   * WARNING: Do NOT use this for security decisions!
   * Tokens are verified by backend.
   */
  decodeToken(token: string): TokenPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(json);

      return payload;
    } catch (error) {
      throw new Error('Failed to decode token');
    }
  }

  /**
   * Get user ID from token
   */
  getUserId(): string | null {
    if (!this.accessToken) return null;

    try {
      const payload = this.decodeToken(this.accessToken);
      return payload.sub;
    } catch {
      return null;
    }
  }

  /**
   * Get user email from token
   */
  getEmail(): string | null {
    if (!this.accessToken) return null;

    try {
      const payload = this.decodeToken(this.accessToken);
      return payload.email;
    } catch {
      return null;
    }
  }

  /**
   * Get user info from token
   */
  getUser(): TokenPayload | null {
    if (!this.accessToken) return null;

    try {
      return this.decodeToken(this.accessToken);
    } catch {
      return null;
    }
  }

  /**
   * Clear all tokens
   */
  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * Returns new token pair or null if refresh fails
   */
  async refresh(apiBaseUrl: string): Promise<TokenPair | null> {
    if (!this.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        this.clear();
        return null;
      }

      const data = await response.json();
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      this.setTokens(tokens);
      return tokens;
    } catch (error) {
      this.clear();
      return null;
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
