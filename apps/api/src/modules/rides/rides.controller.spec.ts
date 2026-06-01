import { Test, TestingModule } from '@nestjs/testing';
import { RidesController } from './rides.controller';
import { RidesService, RideResponseDto } from './rides.service';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth.guard';

describe('RidesController', () => {
  let controller: RidesController;
  let mockPrisma: any;

  const mockRide: RideResponseDto = {
    id: 'ride-1',
    userId: 'user-1',
    mode: 'GPS_ONLY',
    status: 'ACTIVE',
    distance: 0,
    duration: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    title: null,
    description: null,
    startedAt: new Date('2026-05-31T10:00:00Z'),
    finishedAt: null,
    createdAt: new Date('2026-05-31T10:00:00Z'),
    updatedAt: new Date('2026-05-31T10:00:00Z'),
  };

  const finishedRide: RideResponseDto = {
    ...mockRide,
    status: 'FINISHED',
    distance: 15000,
    duration: 3600,
    averageSpeed: 15,
    maxSpeed: 30,
    finishedAt: new Date('2026-05-31T11:00:00Z'),
  };

  beforeEach(async () => {
    mockPrisma = {
      ride: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RidesController],
      providers: [
        RidesService,
        { provide: PrismaClient, useValue: mockPrisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RidesController>(RidesController);
  });

  describe('POST /rides', () => {
    it('should create a new ride', async () => {
      const createDto = {
        id: 'ride-1',
        mode: 'GPS_ONLY' as const,
        startedAt: '2026-05-31T10:00:00.000Z',
      };

      mockPrisma.ride.create.mockResolvedValue(mockRide);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.createRide(req, createDto);

      expect(result).toMatchObject({
        id: 'ride-1',
        mode: 'GPS_ONLY',
        status: 'ACTIVE',
      });
    });
  });

  describe('GET /rides', () => {
    it('should return paginated rides', async () => {
      mockPrisma.ride.findMany.mockResolvedValue([mockRide]);
      mockPrisma.ride.count.mockResolvedValue(1);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getUserRides(req, '1', '20', undefined);

      expect(result).toMatchObject({
        data: [expect.objectContaining({ id: 'ride-1' })],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });
    });

    it('should filter by status', async () => {
      mockPrisma.ride.findMany.mockResolvedValue([finishedRide]);
      mockPrisma.ride.count.mockResolvedValue(1);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getUserRides(req, '1', '20', 'FINISHED');

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'FINISHED' }),
        }),
      );
    });
  });

  describe('GET /rides/:id', () => {
    it('should return a ride by ID', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(finishedRide);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getRide('ride-1', req);

      expect(result).toMatchObject({
        id: 'ride-1',
        status: 'FINISHED',
      });
    });

    it('should throw NotFoundException for non-existent ride', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(null);

      const req = { user: { userId: 'user-1' } };

      await expect(controller.getRide('non-existent', req)).rejects.toThrow(
        'Ride non-existent not found',
      );
    });

    it('should throw UnauthorizedException for other user ride', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        ...finishedRide,
        userId: 'user-2',
      });

      const req = { user: { userId: 'user-1' } };

      await expect(controller.getRide('ride-1', req)).rejects.toThrow();
    });
  });

  describe('PATCH /rides/:id', () => {
    it('should update ride metadata', async () => {
      const updates = { title: 'Morning Ride', description: 'Nice route' };

      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.ride.update.mockResolvedValue({
        ...finishedRide,
        title: 'Morning Ride',
        description: 'Nice route',
      });

      const req = { user: { userId: 'user-1' } };
      const result = await controller.updateRide('ride-1', req, updates);

      expect(result).toMatchObject({
        title: 'Morning Ride',
        description: 'Nice route',
      });
    });
  });

  describe('POST /rides/:id/finish', () => {
    it('should finish a ride with metrics', async () => {
      const finishDto = {
        finishedAt: '2026-05-31T11:00:00.000Z',
        distance: 15000,
        duration: 3600,
        averageSpeed: 15,
        maxSpeed: 30,
        elevationGain: 200,
        calories: 500,
      };

      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.ride.update.mockResolvedValue(finishedRide);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.finishRide('ride-1', req, finishDto);

      expect(result).toMatchObject({
        status: 'FINISHED',
        distance: 15000,
        duration: 3600,
      });
    });
  });

  describe('DELETE /rides/:id', () => {
    it('should delete a ride', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(finishedRide);
      mockPrisma.ride.delete.mockResolvedValue(finishedRide);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.deleteRide('ride-1', req);

      expect(result).toEqual({ success: true });
    });
  });
});
