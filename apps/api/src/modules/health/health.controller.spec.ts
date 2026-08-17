import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaClient } from '@prisma/client';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService, { provide: PrismaClient, useValue: mockPrisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('GET /health', () => {
    it('should return ok status when database is connected', async () => {
      const result = await controller.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('timestamp');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return error status when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));

      const result = await controller.getHealth();

      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('database', 'disconnected');
      expect(result).toHaveProperty('error', 'DB down');
    });
  });

  describe('GET /ready', () => {
    it('should return ready true when database is connected', async () => {
      const result = await controller.getReadiness();

      expect(result).toEqual({ ready: true });
    });

    it('should return ready false when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB down'));

      const result = await controller.getReadiness();

      expect(result).toEqual({ ready: false });
    });
  });

  describe('GET /alive', () => {
    it('should always return alive true', async () => {
      const result = await controller.getLiveness();

      expect(result).toEqual({ alive: true });
    });
  });
});
