import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth.guard';

describe('SyncController', () => {
  let controller: SyncController;
  let mockPrisma: {
    syncTask: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockTask = {
    id: 'task-1',
    userId: 'user-1',
    type: 'RIDE_CREATE',
    rideId: 'ride-1',
    payload: {},
    status: 'PENDING',
    priority: 0,
    attempts: 0,
    error: null,
    scheduledFor: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastAttemptAt: null,
  };

  beforeEach(async () => {
    mockPrisma = {
      syncTask: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [SyncService, { provide: PrismaClient, useValue: mockPrisma }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SyncController>(SyncController);
  });

  describe('POST /sync/tasks', () => {
    it('should create a sync task', async () => {
      mockPrisma.syncTask.create.mockResolvedValue(mockTask);

      const req = { user: { userId: 'user-1' } };
      const dto = {
        type: 'RIDE_CREATE' as const,
        rideId: 'ride-1',
        payload: { title: 'Test' },
      };

      const result = await controller.createTask(req, dto);

      expect(result).toMatchObject({
        id: 'task-1',
        status: 'PENDING',
      });
    });
  });

  describe('GET /sync/tasks', () => {
    it('should return pending tasks', async () => {
      mockPrisma.syncTask.findMany.mockResolvedValue([mockTask]);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getPendingTasks(req, '50');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ status: 'PENDING' });
    });

    it('should respect limit parameter', async () => {
      mockPrisma.syncTask.findMany.mockResolvedValue([]);

      const req = { user: { userId: 'user-1' } };
      await controller.getPendingTasks(req, '10');

      expect(mockPrisma.syncTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('GET /sync/tasks/:id', () => {
    it('should return a specific task', async () => {
      mockPrisma.syncTask.findUnique.mockResolvedValue(mockTask);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getTask('task-1', req);

      expect(result).toMatchObject({ id: 'task-1' });
    });

    it('should throw for non-existent task', async () => {
      mockPrisma.syncTask.findUnique.mockResolvedValue(null);

      const req = { user: { userId: 'user-1' } };

      await expect(controller.getTask('non-existent', req)).rejects.toThrow(
        'Task non-existent not found',
      );
    });
  });

  describe('GET /sync/tasks/:id/status', () => {
    it('should return task status', async () => {
      mockPrisma.syncTask.findUnique.mockResolvedValue(mockTask);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getTaskStatus('task-1', req);

      expect(result).toMatchObject({
        id: 'task-1',
        status: 'PENDING',
        type: 'RIDE_CREATE',
      });
    });
  });

  describe('POST /sync/tasks/:id/complete', () => {
    it('should mark task as completed', async () => {
      mockPrisma.syncTask.update.mockResolvedValue({ ...mockTask, status: 'COMPLETED' });

      const result = await controller.completeTask('task-1');

      expect(result).toEqual({ success: true });
    });
  });

  describe('GET /sync/stats', () => {
    it('should return sync statistics', async () => {
      mockPrisma.syncTask.count.mockResolvedValueOnce(3); // PENDING
      mockPrisma.syncTask.count.mockResolvedValueOnce(10); // COMPLETED
      mockPrisma.syncTask.count.mockResolvedValueOnce(2); // FAILED

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getSyncStats(req);

      expect(result).toMatchObject({
        pending: 3,
        completed: 10,
        failed: 2,
        total: 15,
      });
    });
  });
});
