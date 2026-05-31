/**
 * JWT Payload Interface
 *
 * Defines the structure of JWT token payloads.
 */

export interface JwtPayload {
  sub: string;      // User ID (subject)
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
}
