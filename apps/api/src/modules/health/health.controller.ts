/**
 * Health Controller
 *
 * Endpoints:
 * GET /health      - Detailed health status
 * GET /ready       - Readiness probe
 * GET /alive       - Liveness probe
 *
 * Note: No rate limiting on health endpoints (critical for monitoring)
 */

import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@Controller()
@SkipThrottle()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('health')
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('alive')
  async getLiveness() {
    return { alive: true };
  }
}
