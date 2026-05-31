/**
 * Route Points Module
 */

import { Module } from '@nestjs/common';
import { RoutePointsService } from './route-points.service';
import { RoutePointsController } from './route-points.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [RoutePointsController],
  providers: [
    RoutePointsService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [RoutePointsService],
})
export class RoutePointsModule {}
