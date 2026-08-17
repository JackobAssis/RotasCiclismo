import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaClient } from '@prisma/client';
import { JwtStrategy } from '../../common/jwt.strategy';
import * as bcrypt from 'bcrypt';

describe('AuthController', () => {
  let app: INestApplication;
  let controller: AuthController;
  let mockPrisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    passwordHash: '$2b$10$mockhash',
    createdAt: new Date(),
    lastLoginAt: null,
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-0123456789abcdef0123456789abcdef';
    process.env.JWT_EXPIRES_IN = '7d';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789abcdef0123456789abcdef';
    process.env.JWT_REFRESH_EXPIRES_IN = '30d';
  });

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy, { provide: PrismaClient, useValue: mockPrisma }],
    }).compile();

    app = await moduleRef.createNestApplication().init();
    controller = moduleRef.get<AuthController>(AuthController);
  });

  afterEach(async () => {
    await app?.close();
  });

  describe('POST /auth/signup', () => {
    const signupDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      displayName: 'New User',
    };

    it('should create a new user and return tokens', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        email: signupDto.email,
        username: signupDto.username,
        displayName: signupDto.displayName,
      });

      const result = await controller.signUp(signupDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        email: signupDto.email,
        username: signupDto.username,
      });
    });

    it('should throw ConflictException when email exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(controller.signUp(signupDto)).rejects.toThrow(
        'User with email new@example.com already exists',
      );
    });
  });

  describe('POST /auth/signin', () => {
    const signinDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });
      mockPrisma.user.update.mockResolvedValue({ ...mockUser });

      const result = await controller.signIn(signinDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toMatchObject({
        email: signinDto.email,
      });
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('differentpassword', 10);

      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash });

      await expect(controller.signIn(signinDto)).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(controller.signIn(signinDto)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new access token for valid refresh token', async () => {
      const jwtService = app.get<JwtService>(JwtService);
      const refreshToken = jwtService.sign(
        { sub: mockUser.id, type: 'refresh' },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '30d' },
      );

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.refresh(refreshToken);

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      await expect(controller.refresh('invalid-token')).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });
});
