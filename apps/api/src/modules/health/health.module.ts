/**
 * Health Module
 */

import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
})
export class HealthModule {}
