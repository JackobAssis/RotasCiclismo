/**
 * Health Check Service
 *
 * Provides application and database health status.
 * Used by load balancers and monitoring.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaClient) {}

  async getHealth() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (err) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: (err as any).message,
      };
    }
  }

  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch (err) {
      return { ready: false };
    }
  }
}
