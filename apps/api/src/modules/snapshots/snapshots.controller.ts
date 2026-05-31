/**
 * Snapshots Controller
 *
 * Endpoints:
 * POST   /rides/:id/snapshots           - Create snapshot
 * GET    /rides/:id/snapshots           - Get ride snapshots
 * PATCH  /snapshots/:id/status          - Update upload status
 * DELETE /snapshots/:id                 - Delete snapshot
 */

import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { CreateSnapshotDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/auth.guard';

@Controller('rides/:rideId/snapshots')
@UseGuards(JwtAuthGuard)
export class SnapshotsController {
  constructor(private snapshotsService: SnapshotsService) {}

  /**
   * Create snapshot
   *
   * POST /rides/:id/snapshots
   * Body: { imageUrl, latitude?, longitude?, altitude?, timestamp }
   */
  @Post()
  async createSnapshot(
    @Param('rideId') rideId: string,
    @Request() req: any,
    @Body() dto: CreateSnapshotDto,
  ) {
    return this.snapshotsService.createSnapshot(rideId, req.user.userId, dto);
  }

  /**
   * Get ride snapshots
   *
   * GET /rides/:id/snapshots?skip=0&take=100
   */
  @Get()
  async getRideSnapshots(
    @Param('rideId') rideId: string,
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.snapshotsService.getRideSnapshots(rideId, req.user.userId, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 100,
    });
  }
}

@Controller('snapshots')
@UseGuards(JwtAuthGuard)
export class SnapshotsManagementController {
  constructor(private snapshotsService: SnapshotsService) {}

  /**
   * Update snapshot upload status
   *
   * PATCH /snapshots/:id/status
   * Body: { status: 'COMPLETED' | 'FAILED' | 'UPLOADING', storageUrl? }
   */
  @Patch(':id/status')
  async updateUploadStatus(
    @Param('id') snapshotId: string,
    @Request() req: any,
    @Body() body: { status: string; storageUrl?: string },
  ) {
    return this.snapshotsService.updateUploadStatus(snapshotId, req.user.userId, body.status as any, body.storageUrl);
  }

  /**
   * Delete snapshot
   *
   * DELETE /snapshots/:id
   */
  @Delete(':id')
  async deleteSnapshot(@Param('id') snapshotId: string, @Request() req: any): Promise<{ success: boolean }> {
    await this.snapshotsService.deleteSnapshot(snapshotId, req.user.userId);
    return { success: true };
  }
}
