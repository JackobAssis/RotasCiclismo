/**
 * Rides Module
 */

import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [RidesController],
  providers: [
    RidesService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [RidesService],
})
export class RidesModule {}
