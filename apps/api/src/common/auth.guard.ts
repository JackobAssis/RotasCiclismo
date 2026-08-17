/**
 * Auth Guard
 *
 * Protects endpoints that require authentication.
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends NestAuthGuard('jwt') {}

/**
 * Optional JWT Guard
 * Validates JWT if present, but doesn't require it.
 */
@Injectable()
export class OptionalJwtAuthGuard extends NestAuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    void _info;
    void _context;
    return user || null;
  }
}
