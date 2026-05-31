/**
 * Auth Guard
 *
 * Protects endpoints that require authentication.
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends NestAuthGuard('jwt') {}

/**
 * Optional JWT Guard
 * Validates JWT if present, but doesn't require it.
 */
@Injectable()
export class OptionalJwtAuthGuard extends NestAuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    return user || null;
  }
}
