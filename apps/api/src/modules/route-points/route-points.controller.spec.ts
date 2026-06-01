import { Test, TestingModule } from '@nestjs/testing';
import { RoutePointsController } from './route-points.controller';
import { RoutePointsService } from './route-points.service';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth.guard';

describe('RoutePointsController', () => {
  let controller: RoutePointsController;
  let mockPrisma: any;

  const mockRide = {
    id: 'ride-1',
    userId: 'user-1',
    mode: 'GPS_ONLY',
    status: 'ACTIVE',
  };

  const mockPoint = {
    id: 'point-1',
    rideId: 'ride-1',
    latitude: -23.5505,
    longitude: -46.6333,
    altitude: 760,
    speed: 15.5,
    heading: 90,
    accuracy: 5,
    timestamp: new Date('2026-05-31T10:00:00Z'),
  };

  beforeEach(async () => {
    mockPrisma = {
      ride: {
        findUnique: jest.fn(),
      },
      routePoint: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoutePointsController],
      providers: [
        RoutePointsService,
        { provide: PrismaClient, useValue: mockPrisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RoutePointsController>(RoutePointsController);
  });

  describe('POST /rides/:rideId/points', () => {
    it('should create a single route point', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.routePoint.create.mockResolvedValue(mockPoint);

      const req = { user: { userId: 'user-1' } };
      const dto = {
        latitude: -23.5505,
        longitude: -46.6333,
        altitude: 760,
        speed: 15.5,
        heading: 90,
        accuracy: 5,
        timestamp: '2026-05-31T10:00:00.000Z',
      };

      const result = await controller.createRoutePoint('ride-1', req, dto);

      expect(result).toMatchObject({
        latitude: -23.5505,
        longitude: -46.6333,
      });
    });
  });

  describe('POST /rides/:rideId/points/bulk', () => {
    it('should bulk create route points', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.routePoint.createMany.mockResolvedValue({ count: 3 });

      const req = { user: { userId: 'user-1' } };
      const dto = {
        points: [
          {
            latitude: -23.5505,
            longitude: -46.6333,
            timestamp: '2026-05-31T10:00:00.000Z',
          },
          {
            latitude: -23.5506,
            longitude: -46.6334,
            timestamp: '2026-05-31T10:00:01.000Z',
          },
          {
            latitude: -23.5507,
            longitude: -46.6335,
            timestamp: '2026-05-31T10:00:02.000Z',
          },
        ],
      };

      const result = await controller.bulkCreateRoutePoints('ride-1', req, dto);

      expect(result).toEqual({ created: 3 });
    });

    it('should throw BadRequestException for empty points array', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);

      const req = { user: { userId: 'user-1' } };
      const dto = { points: [] };

      await expect(
        controller.bulkCreateRoutePoints('ride-1', req, dto),
      ).rejects.toThrow('Points array cannot be empty');
    });
  });

  describe('GET /rides/:rideId/points', () => {
    it('should return paginated route points', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.routePoint.findMany.mockResolvedValue([mockPoint]);
      mockPrisma.routePoint.count.mockResolvedValue(1);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getRoutePoints('ride-1', req, '0', '500');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('DELETE /rides/:rideId/points', () => {
    it('should delete all route points for a ride', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.routePoint.deleteMany.mockResolvedValue({ count: 100 });

      const req = { user: { userId: 'user-1' } };
      const result = await controller.deleteRoutePoints('ride-1', req);

      expect(result).toEqual({ deleted: 100 });
    });
  });
});
