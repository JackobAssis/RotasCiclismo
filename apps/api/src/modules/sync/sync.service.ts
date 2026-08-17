/**
 * Sync Service
 *
 * Manages the sync task queue and backend sync processing.
 *
 * ARCHITECTURAL INTENT:
 * Frontend's sync queue (in storage.service) uploads batches to backend.
 * Backend persists sync tasks for audit trail and potential retries.
 * This is not a realtime sync system - it's a reliable job queue for offline first.
 *
 * Frontend flow:
 * 1. Create local ride → generate sync task with 'ride_create' type
 * 2. Add GPS points → batch them into 'route_points_upload'
 * 3. Take snapshots → create 'snapshot_upload' tasks
 * 4. When online → sync.service.ts polls and processes batches
 *
 * Backend flow:
 * 1. POST /sync/tasks to enqueue a task (from frontend)
 * 2. Sync processor periodically reads PENDING tasks
 * 3. Processes and marks as COMPLETED or FAILED
 * 4. Frontend polls or uses webhooks to get status
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

export interface CreateSyncTaskDto {
  type: 'RIDE_CREATE' | 'RIDE_UPDATE' | 'RIDE_FINISH' | 'ROUTE_POINTS_UPLOAD' | 'SNAPSHOT_UPLOAD';
  rideId?: string;
  payload?: Prisma.InputJsonValue;
  priority?: number;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a sync task
   *
   * Called by frontend when it has data to sync.
   * Backend just stores the task and returns immediately (async).
   */
  async createSyncTask(userId: string, dto: CreateSyncTaskDto) {
    const task = await this.prisma.syncTask.create({
      data: {
        userId,
        type: dto.type,
        rideId: dto.rideId,
        payload: dto.payload || {},
        attempts: 0,
        status: 'PENDING',
        priority: dto.priority || 0,
        scheduledFor: new Date(),
      },
    });

    return {
      id: task.id,
      status: task.status,
      createdAt: task.createdAt,
    };
  }

  /**
   * Get sync task by ID
   *
   * Frontend polls to check if task is done.
   */
  async getSyncTask(taskId: string, userId: string) {
    const task = await this.prisma.syncTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (task.userId !== userId) {
      throw new UnauthorizedException();
    }

    return task;
  }

  /**
   * Get pending sync tasks for a user
   *
   * Frontend can poll this to see what's left to sync.
   */
  async getPendingTasks(userId: string, limit = 50) {
    return this.prisma.syncTask.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: { priority: 'desc' },
      take: limit,
    });
  }

  /**
   * Get sync task status
   *
   * Simple endpoint just returns status of a task.
   */
  async getTaskStatus(taskId: string, userId: string) {
    const task = await this.prisma.syncTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (task.userId !== userId) {
      throw new UnauthorizedException();
    }

    return {
      id: task.id,
      status: task.status,
      type: task.type,
      rideId: task.rideId,
      attempts: task.attempts,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Mark sync task as completed
   *
   * Called after successful backend processing.
   */
  async markTaskCompleted(taskId: string): Promise<void> {
    await this.prisma.syncTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark sync task as failed
   *
   * Increments retry count.
   */
  async markTaskFailed(taskId: string, error: string, incrementRetry = true): Promise<void> {
    await this.prisma.syncTask.update({
      where: { id: taskId },
      data: {
        status: 'FAILED',
        error,
        attempts: incrementRetry ? { increment: 1 } : undefined,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete completed tasks (cleanup)
   *
   * Called periodically to clean up old tasks.
   */
  async deleteCompletedTasks(beforeDate: Date): Promise<{ deleted: number }> {
    const result = await this.prisma.syncTask.deleteMany({
      where: {
        status: 'COMPLETED',
        updatedAt: { lt: beforeDate },
      },
    });

    return { deleted: result.count };
  }

  /**
   * Get sync stats for user
   *
   * Used for UI to show sync progress.
   */
  async getSyncStats(userId: string) {
    const [pending, completed, failed] = await Promise.all([
      this.prisma.syncTask.count({ where: { userId, status: 'PENDING' } }),
      this.prisma.syncTask.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.syncTask.count({ where: { userId, status: 'FAILED' } }),
    ]);

    return {
      pending,
      completed,
      failed,
      total: pending + completed + failed,
    };
  }
}
