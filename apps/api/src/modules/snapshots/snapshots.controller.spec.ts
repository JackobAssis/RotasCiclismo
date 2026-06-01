import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotsController, SnapshotsManagementController } from './snapshots.controller';
import { SnapshotsService } from './snapshots.service';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth.guard';

describe('SnapshotsController', () => {
  let controller: SnapshotsController;
  let managementController: SnapshotsManagementController;
  let mockPrisma: any;

  const mockRide = {
    id: 'ride-1',
    userId: 'user-1',
    mode: 'GPS_CAMERA',
    status: 'ACTIVE',
  };

  const mockSnapshot = {
    id: 'snap-1',
    rideId: 'ride-1',
    userId: 'user-1',
    imageUrl: 'https://example.com/photo.jpg',
    latitude: -23.5505,
    longitude: -46.6333,
    altitude: 760,
    timestamp: new Date('2026-05-31T10:00:00Z'),
    uploadStatus: 'PENDING',
    mimeType: 'image/jpeg',
    uploadedAt: null,
    storageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = {
      ride: {
        findUnique: jest.fn(),
      },
      snapshot: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnapshotsController, SnapshotsManagementController],
      providers: [
        SnapshotsService,
        { provide: PrismaClient, useValue: mockPrisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SnapshotsController>(SnapshotsController);
    managementController = module.get<SnapshotsManagementController>(SnapshotsManagementController);
  });

  describe('POST /rides/:rideId/snapshots', () => {
    it('should create a snapshot', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.snapshot.create.mockResolvedValue(mockSnapshot);

      const req = { user: { userId: 'user-1' } };
      const dto = {
        imageUrl: 'https://example.com/photo.jpg',
        latitude: -23.5505,
        longitude: -46.6333,
        timestamp: '2026-05-31T10:00:00.000Z',
      };

      const result = await controller.createSnapshot('ride-1', req, dto);

      expect(result).toMatchObject({
        imageUrl: 'https://example.com/photo.jpg',
        uploadStatus: 'PENDING',
      });
    });
  });

  describe('GET /rides/:rideId/snapshots', () => {
    it('should return paginated snapshots', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.snapshot.findMany.mockResolvedValue([mockSnapshot]);
      mockPrisma.snapshot.count.mockResolvedValue(1);

      const req = { user: { userId: 'user-1' } };
      const result = await controller.getRideSnapshots('ride-1', req, '0', '100');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('PATCH /snapshots/:id/status', () => {
    it('should update snapshot upload status', async () => {
      mockPrisma.snapshot.findUnique.mockResolvedValue(mockSnapshot);
      mockPrisma.snapshot.update.mockResolvedValue({
        ...mockSnapshot,
        uploadStatus: 'COMPLETED',
        storageUrl: 'https://storage.example.com/photo.jpg',
      });

      const req = { user: { userId: 'user-1' } };
      const result = await managementController.updateUploadStatus(
        'snap-1',
        req,
        { status: 'COMPLETED', storageUrl: 'https://storage.example.com/photo.jpg' },
      );

      expect(result.uploadStatus).toBe('COMPLETED');
    });
  });

  describe('DELETE /snapshots/:id', () => {
    it('should delete a snapshot', async () => {
      mockPrisma.snapshot.findUnique.mockResolvedValue(mockSnapshot);
      mockPrisma.snapshot.delete.mockResolvedValue(mockSnapshot);

      const req = { user: { userId: 'user-1' } };
      const result = await managementController.deleteSnapshot('snap-1', req);

      expect(result).toEqual({ success: true });
    });
  });
});
