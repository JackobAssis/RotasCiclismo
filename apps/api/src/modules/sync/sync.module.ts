/**
 * Sync Module
 */

import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [SyncController],
  providers: [
    SyncService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [SyncService],
})
export class SyncModule {}
