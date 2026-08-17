/**
 * Route Points Controller
 *
 * Endpoints:
 * POST   /rides/:id/points          - Create single point
 * POST   /rides/:id/points/bulk     - Bulk create points (preferred)
 * GET    /rides/:id/points          - Get all points for ride
 * DELETE /rides/:id/points          - Delete all points
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { RoutePointsService } from './route-points.service';
import { CreateRoutePointDto, BulkCreateRoutePointsDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/auth.guard';
import { AuthenticatedRequest } from '../../common/jwt.types';

@Controller('rides/:rideId/points')
@UseGuards(JwtAuthGuard)
export class RoutePointsController {
  constructor(private routePointsService: RoutePointsService) {}

  /**
   * Create a single route point
   *
   * POST /rides/:id/points
   * Body: { latitude, longitude, altitude?, speed?, heading?, accuracy?, timestamp }
   */
  @Post()
  async createRoutePoint(
    @Param('rideId') rideId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateRoutePointDto,
  ) {
    return this.routePointsService.createRoutePoint(rideId, req.user.userId, dto);
  }

  /**
   * Bulk create route points (PREFERRED for sync queue)
   *
   * POST /rides/:id/points/bulk
   * Body: { points: [...] }
   */
  @Post('bulk')
  async bulkCreateRoutePoints(
    @Param('rideId') rideId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: BulkCreateRoutePointsDto,
  ) {
    return this.routePointsService.bulkCreateRoutePoints(rideId, req.user.userId, dto);
  }

  /**
   * Get all route points for a ride
   *
   * GET /rides/:id/points?skip=0&take=500
   */
  @Get()
  async getRoutePoints(
    @Param('rideId') rideId: string,
    @Request() req: AuthenticatedRequest,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.routePointsService.getRoutePoints(rideId, req.user.userId, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 500,
    });
  }

  /**
   * Delete all route points for a ride
   *
   * DELETE /rides/:id/points
   */
  @Delete()
  async deleteRoutePoints(@Param('rideId') rideId: string, @Request() req: AuthenticatedRequest) {
    return this.routePointsService.deleteRoutePoints(rideId, req.user.userId);
  }
}
