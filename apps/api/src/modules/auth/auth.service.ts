/**
 * Auth Service
 *
 * Handles user authentication: signup, signin, token generation.
 * Does NOT handle user profile - that's in users module.
 */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SignUpDto, SignInDto, AuthResponseDto } from '../../common/dtos';
import { UserAlreadyExistsException, InvalidCredentialsException } from '../../common/exceptions';
import { JwtPayload } from '../../common/jwt.types';
import { loadConfig } from '../../config/config';

@Injectable()
export class AuthService {
  private config = loadConfig();

  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
  ) {}

  /**
   * Sign up a new user
   *
   * Validates email uniqueness, hashes password, creates user.
   * Returns auth tokens and user data.
   */
  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      throw new UserAlreadyExistsException(dto.email);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName || dto.username,
        passwordHash,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.username);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName || undefined,
      },
    };
  }

  /**
   * Sign in existing user
   *
   * Validates email and password.
   * Returns auth tokens and user data.
   */
  async signIn(dto: SignInDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.username);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName || undefined,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * Validates refresh token and issues new access token.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.jwt_refresh_secret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new InvalidCredentialsException();
      }

      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
        } as any,
        {
          secret: this.config.jwt_secret,
          expiresIn: this.config.jwt_expires_in,
        } as any,
      );

      return { accessToken };
    } catch (err) {
      throw new InvalidCredentialsException();
    }
  }

  /**
   * Generate access and refresh tokens
   *
   * Private method used by signup and signin.
   */
  private generateTokens(userId: string, email: string, username: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      username,
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.config.jwt_secret,
      expiresIn: this.config.jwt_expires_in,
    } as any);

    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' } as any,
      {
        secret: this.config.jwt_refresh_secret,
        expiresIn: this.config.jwt_refresh_expires_in,
      } as any,
    );

    return { accessToken, refreshToken };
  }
}
