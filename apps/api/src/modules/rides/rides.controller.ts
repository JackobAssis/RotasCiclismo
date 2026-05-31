/**
 * Rides Controller
 *
 * Endpoints:
 * POST   /rides                - Create ride
 * GET    /rides                - List user rides
 * GET    /rides/:id            - Get ride details
 * PATCH  /rides/:id            - Update ride
 * POST   /rides/:id/finish     - Finish ride
 * DELETE /rides/:id            - Delete ride
 * GET    /rides/:id/with-route - Get ride with full route
 */

import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { RidesService, RideResponseDto } from './rides.service';
import { CreateRideDto, UpdateRideDto, FinishRideDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/auth.guard';

@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private ridesService: RidesService) {}

  /**
   * Create a new ride
   *
   * POST /rides
   * Body: { id, mode, startedAt, title?, description?, tags? }
   */
  @Post()
  async createRide(@Request() req: any, @Body() dto: CreateRideDto): Promise<RideResponseDto> {
    return this.ridesService.createRide(req.user.userId, dto);
  }

  /**
   * List user's rides
   *
   * GET /rides?page=1&limit=20&status=FINISHED
   */
  @Get()
  async getUserRides(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ridesService.getUserRides(req.user.userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
    });
  }

  /**
   * Get ride by ID
   *
   * GET /rides/:id
   */
  @Get(':id')
  async getRide(@Param('id') rideId: string, @Request() req: any): Promise<RideResponseDto> {
    return this.ridesService.getRide(rideId, req.user.userId);
  }

  /**
   * Get ride with full route data (for replay)
   *
   * GET /rides/:id/with-route
   */
  @Get(':id/with-route')
  async getRideWithRoute(@Param('id') rideId: string, @Request() req: any) {
    return this.ridesService.getRideWithRoute(rideId, req.user.userId);
  }

  /**
   * Update ride metadata
   *
   * PATCH /rides/:id
   * Body: { title?, description?, distance?, duration?, ... }
   */
  @Patch(':id')
  async updateRide(@Param('id') rideId: string, @Request() req: any, @Body() dto: UpdateRideDto): Promise<RideResponseDto> {
    return this.ridesService.updateRide(rideId, req.user.userId, dto);
  }

  /**
   * Finish a ride
   *
   * POST /rides/:id/finish
   * Body: { finishedAt, distance, duration, averageSpeed, maxSpeed }
   */
  @Post(':id/finish')
  async finishRide(@Param('id') rideId: string, @Request() req: any, @Body() dto: FinishRideDto): Promise<RideResponseDto> {
    return this.ridesService.finishRide(rideId, req.user.userId, dto);
  }

  /**
   * Delete a ride
   *
   * DELETE /rides/:id
   */
  @Delete(':id')
  async deleteRide(@Param('id') rideId: string, @Request() req: any): Promise<{ success: boolean }> {
    await this.ridesService.deleteRide(rideId, req.user.userId);
    return { success: true };
  }
}
