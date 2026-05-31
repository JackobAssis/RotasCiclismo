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
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RidesModule } from './modules/rides/rides.module';
import { RoutePointsModule } from './modules/route-points/route-points.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { SyncModule } from './modules/sync/sync.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RidesModule,
    RoutePointsModule,
    SnapshotsModule,
    SyncModule,
    UploadsModule,
    HealthModule,
  ],
})
export class AppModule {}
