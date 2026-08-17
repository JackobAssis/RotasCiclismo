/**
 * Rides Service
 *
 * Handles ride creation, updates, and queries.
 * Enforces user ownership and data validation.
 *
 * ARCHITECTURAL NOTE:
 * The rides service is the backend counterpart to the frontend ride.store.
 * Frontend creates local rides first (offline-first), then syncs to backend.
 * Backend persists rides and exposes them for sync operations.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma, Ride, RideStatus } from '@prisma/client';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateRideDto, UpdateRideDto, FinishRideDto } from '../../common/dtos';

export class RideResponseDto {
  id: string;
  userId: string;
  mode: string;
  status: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  maxSpeed: number;
  title: string | null;
  description: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new ride
   *
   * Receives ride data from frontend (which already has local ID from Zustand).
   * Backend persists it and associates with userId from JWT.
   */
  async createRide(userId: string, dto: CreateRideDto): Promise<RideResponseDto> {
    const ride = await this.prisma.ride.create({
      data: {
        id: dto.id, // Use frontend-generated ID for consistency
        userId,
        mode: dto.mode,
        startedAt: new Date(dto.startedAt),
        title: dto.title,
        description: dto.description,
        tags: dto.tags || [],
        status: 'ACTIVE',
        localOnly: true, // Mark as local initially
      },
    });

    return this.mapRideToDto(ride);
  }

  /**
   * Get ride by ID
   *
   * Enforces ownership check.
   */
  async getRide(rideId: string, userId: string): Promise<RideResponseDto> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    // Ownership check
    if (ride.userId !== userId) {
      throw new UnauthorizedException(`You do not have access to ride ${rideId}`);
    }

    return this.mapRideToDto(ride);
  }

  /**
   * Get all rides for a user
   *
   * Supports pagination and filtering.
   */
  async getUserRides(
    userId: string,
    {
      page = 1,
      limit = 20,
      status,
      onlyPublic = false,
    }: { page?: number; limit?: number; status?: string; onlyPublic?: boolean },
  ) {
    const where: Prisma.RideWhereInput = { userId };

    if (status) {
      where.status = status as RideStatus;
    }

    if (onlyPublic) {
      where.isPublic = true;
    }

    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ride.count({ where }),
    ]);

    return {
      data: rides.map((r) => this.mapRideToDto(r)),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  /**
   * Update ride metadata
   *
   * Called during or after recording with metric updates.
   */
  async updateRide(rideId: string, userId: string, dto: UpdateRideDto): Promise<RideResponseDto> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        title: dto.title,
        description: dto.description,
        distance: dto.distance,
        duration: dto.duration,
        averageSpeed: dto.averageSpeed,
        maxSpeed: dto.maxSpeed,
        calories: dto.calories,
        tags: dto.tags,
      },
    });

    return this.mapRideToDto(updated);
  }

  /**
   * Finish a ride
   *
   * Called when frontend completes recording.
   * Marks ride as FINISHED and sets final metrics.
   */
  async finishRide(rideId: string, userId: string, dto: FinishRideDto): Promise<RideResponseDto> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        finishedAt: new Date(dto.finishedAt),
        status: 'FINISHED',
        distance: dto.distance,
        duration: dto.duration,
        averageSpeed: dto.averageSpeed,
        maxSpeed: dto.maxSpeed,
        elevationGain: dto.elevationGain,
        calories: dto.calories,
      },
    });

    return this.mapRideToDto(updated);
  }

  /**
   * Get ride with full route data
   *
   * Used by frontend for replaying or analyzing rides.
   */
  async getRideWithRoute(rideId: string, userId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        route: true,
        snapshots: true,
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    return {
      ...this.mapRideToDto(ride),
      route: ride.route,
      snapshots: ride.snapshots,
    };
  }

  /**
   * Delete a ride
   *
   * Soft delete is recommended for safety audit trail.
   * But Prisma cascade can hard-delete related data.
   */
  async deleteRide(rideId: string, userId: string): Promise<void> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideId} not found`);
    }

    if (ride.userId !== userId) {
      throw new UnauthorizedException();
    }

    // Delete cascade will remove route points, snapshots, sync tasks
    await this.prisma.ride.delete({
      where: { id: rideId },
    });
  }

  /**
   * Helper: Map Ride model to DTO
   */
  private mapRideToDto(ride: Ride): RideResponseDto {
    return {
      id: ride.id,
      userId: ride.userId,
      mode: ride.mode,
      status: ride.status,
      distance: ride.distance,
      duration: ride.duration,
      averageSpeed: ride.averageSpeed,
      maxSpeed: ride.maxSpeed,
      title: ride.title,
      description: ride.description,
      startedAt: ride.startedAt,
      finishedAt: ride.finishedAt,
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt,
    };
  }
}
