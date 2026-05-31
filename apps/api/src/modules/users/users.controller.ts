/**
 * Users Controller
 *
 * Endpoints: GET /users/:id, PATCH /users/:id
 */

import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService, UserProfileDto } from './users.service';
import { JwtAuthGuard } from '../../common/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Get user profile by ID
   */
  @Get(':id')
  async getProfile(@Param('id') userId: string): Promise<UserProfileDto> {
    return this.usersService.getProfile(userId, true);
  }

  /**
   * Get current user profile
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: any): Promise<UserProfileDto> {
    return this.usersService.getProfile(req.user.userId, true);
  }

  /**
   * Update user profile (auth required)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('id') userId: string,
    @Request() req: any,
    @Body() updates: any,
  ): Promise<UserProfileDto> {
    // Only users can update their own profile
    if (req.user.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.usersService.updateProfile(userId, updates);
  }
}
