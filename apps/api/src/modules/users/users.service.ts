/**
 * Users Service
 *
 * Handles user profile management and queries.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

export class UserProfileDto {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  createdAt: Date;
  stats?: {
    totalRides: number;
    totalDistance: number;
    totalDuration: number;
  };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get user profile by ID
   *
   * Includes ride statistics if requested.
   */
  async getProfile(userId: string, includeStats = false): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (includeStats) {
      const rides = await this.prisma.ride.findMany({
        where: { userId },
        select: {
          distance: true,
          duration: true,
        },
      });

      const stats = {
        totalRides: rides.length,
        totalDistance: rides.reduce((sum, r) => sum + r.distance, 0),
        totalDuration: rides.reduce((sum, r) => sum + r.duration, 0),
      };

      return { ...user, stats };
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: {
      displayName?: string;
      bio?: string;
      avatar?: string;
      theme?: string;
      language?: string;
    },
  ): Promise<UserProfileDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Check if user exists
   */
  async exists(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }
}
