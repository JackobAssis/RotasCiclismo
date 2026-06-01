/**
 * App Module
 *
 * Root module that imports all feature modules.
 *
 * ARCHITECTURE:
 * - Auth module handles JWT strategy globally
 * - Each feature module is responsible for its domain
 * - Modules are loosely coupled via exports
 * - Cross-module communication happens via services
 */

import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RidesModule } from './modules/rides/rides.module';
import { RoutePointsModule } from './modules/route-points/route-points.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { SyncModule } from './modules/sync/sync.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { loadConfig } from './config/config';

const config = loadConfig();

@Module({
  imports: [
    // Rate limiting: 100 requests/min global
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 100,
      },
    ]),
    // Structured logging with pino
    LoggerModule.forRoot({
      pinoHttp: {
        level: config.log_level || 'info',
        transport:
          config.node_env === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            headers: { 'user-agent': req.headers?.['user-agent'] },
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
    AuthModule,
    UsersModule,
    RidesModule,
    RoutePointsModule,
    SnapshotsModule,
    SyncModule,
    UploadsModule,
    HealthModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
