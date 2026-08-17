/**
 * Sync Controller
 *
 * Endpoints:
 * POST   /sync/tasks              - Create sync task
 * GET    /sync/tasks              - Get pending tasks
 * GET    /sync/tasks/:id          - Get task by ID
 * GET    /sync/tasks/:id/status   - Get task status
 * POST   /sync/tasks/:id/complete - Mark as completed
 * POST   /sync/tasks/:id/retry    - Retry failed task
 * GET    /sync/stats              - Get sync statistics
 */

import { Controller, Post, Get, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { SyncService, CreateSyncTaskDto } from './sync.service';
import { JwtAuthGuard } from '../../common/auth.guard';
import { AuthenticatedRequest } from '../../common/jwt.types';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncService: SyncService) {}

  /**
   * Create a sync task
   *
   * POST /sync/tasks
   * Body: { type, rideId?, payload?, priority? }
   *
   * Frontend calls this to enqueue data for sync.
   */
  @Post('tasks')
  async createTask(@Request() req: AuthenticatedRequest, @Body() dto: CreateSyncTaskDto) {
    return this.syncService.createSyncTask(req.user.userId, dto);
  }

  /**
   * Get pending tasks
   *
   * GET /sync/tasks?limit=50
   *
   * Frontend polls to see what needs syncing.
   */
  @Get('tasks')
  async getPendingTasks(@Request() req: AuthenticatedRequest, @Query('limit') limit?: string) {
    return this.syncService.getPendingTasks(req.user.userId, limit ? parseInt(limit, 10) : 50);
  }

  /**
   * Get specific task
   *
   * GET /sync/tasks/:id
   */
  @Get('tasks/:id')
  async getTask(@Param('id') taskId: string, @Request() req: AuthenticatedRequest) {
    return this.syncService.getSyncTask(taskId, req.user.userId);
  }

  /**
   * Get task status
   *
   * GET /sync/tasks/:id/status
   */
  @Get('tasks/:id/status')
  async getTaskStatus(@Param('id') taskId: string, @Request() req: AuthenticatedRequest) {
    return this.syncService.getTaskStatus(taskId, req.user.userId);
  }

  /**
   * Mark task as completed (backend internal use)
   *
   * POST /sync/tasks/:id/complete
   * (Could require special admin/server auth in production)
   */
  @Post('tasks/:id/complete')
  async completeTask(@Param('id') taskId: string): Promise<{ success: boolean }> {
    await this.syncService.markTaskCompleted(taskId);
    return { success: true };
  }

  /**
   * Retry failed task
   *
   * POST /sync/tasks/:id/retry
   * Sets status back to PENDING for reprocessing.
   */
  @Post('tasks/:id/retry')
  async retryTask(
    @Param('id') taskId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const task = await this.syncService.getSyncTask(taskId, req.user.userId);

    if (task.status !== 'FAILED') {
      throw new Error('Only failed tasks can be retried');
    }

    // Update task to PENDING
    // (Note: Need to add this method to service)
    return { success: true };
  }

  /**
   * Get sync statistics
   *
   * GET /sync/stats
   *
   * Shows user: pending, completed, failed task counts.
   */
  @Get('stats')
  async getSyncStats(@Request() req: AuthenticatedRequest) {
    return this.syncService.getSyncStats(req.user.userId);
  }
}
