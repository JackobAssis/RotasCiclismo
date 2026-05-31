/**
 * Snapshots Module
 */

import { Module } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsController, SnapshotsManagementController } from './snapshots.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [SnapshotsController, SnapshotsManagementController],
  providers: [
    SnapshotsService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
