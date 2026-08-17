import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaClient } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    ride: {
      findMany: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    avatar: null,
    bio: 'Cyclist',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      ride: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService, { provide: PrismaClient, useValue: mockPrisma }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('GET /users/:id', () => {
    it('should return user profile with stats', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.ride.findMany.mockResolvedValue([
        { distance: 1000, duration: 3600 },
        { distance: 2000, duration: 7200 },
      ]);

      const result = await controller.getProfile('user-1');

      expect(result).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      });
      expect(result.stats).toMatchObject({
        totalRides: 2,
        totalDistance: 3000,
        totalDuration: 10800,
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(controller.getProfile('non-existent')).rejects.toThrow(
        'User non-existent not found',
      );
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user profile', async () => {
      const updates = { displayName: 'Updated Name', bio: 'New bio' };

      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        displayName: 'Updated Name',
        bio: 'New bio',
      });

      const req = { user: { userId: 'user-1' } };
      const result = await controller.updateProfile('user-1', req, updates);

      expect(result).toMatchObject({
        displayName: 'Updated Name',
        bio: 'New bio',
      });
    });

    it('should throw when user tries to update another profile', async () => {
      const req = { user: { userId: 'user-2' } };

      await expect(
        controller.updateProfile('user-1', req, { displayName: 'Hacker' }),
      ).rejects.toThrow('Unauthorized');
    });
  });
});
