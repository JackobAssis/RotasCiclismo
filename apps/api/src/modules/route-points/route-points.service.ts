/**
 * Route Points Service
 *
 * Handles GPS point storage and batch uploads.
 *
 * ARCHITECTURAL NOTE:
 * Frontend collects GPS points locally and periodically batches them for upload.
 * Backend accepts batches and stores them in route_points table.
 * This is designed for the offline-first sync queue pattern.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateRoutePointDto, BulkCreateRoutePointsDto } from '../../common/dtos';

@Injectable()
export class RoutePointsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a single route point
   *
   * Rarely used directly; bulk create is preferred.
   */
  async createRoutePoint(rideId: string, userId: string, dto: CreateRoutePointDto) {
    // Verify ride ownership
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    const point = await this.prisma.routePoint.create({
      data: {
        rideId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        altitude: dto.altitude,
        speed: dto.speed,
        heading: dto.heading,
        accuracy: dto.accuracy,
        timestamp: new Date(dto.timestamp),
      },
    });

    return point;
  }

  /**
   * Bulk create route points
   *
   * Optimized for batch uploads from frontend sync queue.
   * Returns count of created points.
   */
  async bulkCreateRoutePoints(
    rideId: string,
    userId: string,
    dto: BulkCreateRoutePointsDto,
  ): Promise<{ created: number }> {
    // Verify ride ownership
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    if (!dto.points || dto.points.length === 0) {
      throw new BadRequestException('Points array cannot be empty');
    }

    if (dto.points.length > 10000) {
      throw new BadRequestException('Maximum 10000 points per request');
    }

    // Batch insert
    const created = await this.prisma.routePoint.createMany({
      data: dto.points.map((p) => ({
        rideId,
        latitude: p.latitude,
        longitude: p.longitude,
        altitude: p.altitude,
        speed: p.speed,
        heading: p.heading,
        accuracy: p.accuracy,
        timestamp: new Date(p.timestamp),
      })),
      skipDuplicates: false,
    });

    return { created: created.count };
  }

  /**
   * Get all route points for a ride
   *
   * Used for ride replay or analysis.
   */
  async getRoutePoints(
    rideId: string,
    userId: string,
    { skip = 0, take = 500 }: { skip?: number; take?: number } = {},
  ) {
    // Verify ride ownership
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    const [points, total] = await Promise.all([
      this.prisma.routePoint.findMany({
        where: { rideId },
        orderBy: { timestamp: 'asc' },
        skip,
        take,
      }),
      this.prisma.routePoint.count({ where: { rideId } }),
    ]);

    return {
      data: points,
      total,
      hasMore: skip + points.length < total,
    };
  }

  /**
   * Delete all route points for a ride
   *
   * Cascading delete is handled by Prisma.
   */
  async deleteRoutePoints(rideId: string, userId: string): Promise<{ deleted: number }> {
    // Verify ride ownership
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    const result = await this.prisma.routePoint.deleteMany({
      where: { rideId },
    });

    return { deleted: result.count };
  }
}
