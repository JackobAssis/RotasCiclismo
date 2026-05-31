/**
 * Snapshots Service
 *
 * Handles snapshot metadata and upload status tracking.
 *
 * ARCHITECTURAL NOTE:
 * Snapshots are photos taken during a ride.
 * Frontend tracks snapshot metadata locally and syncs to backend.
 * Backend stores metadata and tracks upload status.
 * Actual file upload is handled by uploads module (future).
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateSnapshotDto } from '../../common/dtos';

@Injectable()
export class SnapshotsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create snapshot metadata
   *
   * Frontend sends snapshot data (ID, imageUrl, timestamp, location)
   * Backend stores it and tracks upload status.
   */
  async createSnapshot(rideId: string, userId: string, dto: CreateSnapshotDto) {
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

    const snapshot = await this.prisma.snapshot.create({
      data: {
        rideId,
        userId,
        imageUrl: dto.imageUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        altitude: dto.altitude,
        timestamp: new Date(dto.timestamp),
        uploadStatus: 'PENDING',
        mimeType: 'image/jpeg',
      },
    });

    return snapshot;
  }

  /**
   * Get snapshots for a ride
   */
  async getRideSnapshots(
    rideId: string,
    userId: string,
    { skip = 0, take = 100 }: { skip?: number; take?: number } = {},
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

    const [snapshots, total] = await Promise.all([
      this.prisma.snapshot.findMany({
        where: { rideId },
        orderBy: { timestamp: 'asc' },
        skip,
        take,
      }),
      this.prisma.snapshot.count({ where: { rideId } }),
    ]);

    return {
      data: snapshots,
      total,
      hasMore: skip + snapshots.length < total,
    };
  }

  /**
   * Update snapshot upload status
   *
   * Called by uploads module after file upload completes.
   */
  async updateUploadStatus(
    snapshotId: string,
    userId: string,
    status: 'COMPLETED' | 'FAILED' | 'UPLOADING',
    storageUrl?: string,
  ) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new NotFoundException(`Snapshot ${snapshotId} not found`);
    }

    if (snapshot.userId !== userId) {
      throw new UnauthorizedException();
    }

    const updated = await this.prisma.snapshot.update({
      where: { id: snapshotId },
      data: {
        uploadStatus: status,
        uploadedAt: status === 'COMPLETED' ? new Date() : undefined,
        storageUrl: storageUrl || undefined,
      },
    });

    return updated;
  }

  /**
   * Get pending snapshots (need upload)
   *
   * Used by uploads module to find next batch.
   */
  async getPendingSnapshots(limit = 50) {
    return this.prisma.snapshot.findMany({
      where: {
        uploadStatus: 'PENDING',
      },
      take: limit,
    });
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(snapshotId: string, userId: string): Promise<void> {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new NotFoundException(`Snapshot ${snapshotId} not found`);
    }

    if (snapshot.userId !== userId) {
      throw new UnauthorizedException();
    }

    await this.prisma.snapshot.delete({
      where: { id: snapshotId },
    });
  }
}
