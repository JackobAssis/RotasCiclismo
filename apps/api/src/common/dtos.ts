/**
 * Common DTO Classes and Validators
 *
 * Shared data transfer objects used across modules.
 */

import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
  IsArray,
  IsISO8601,
} from 'class-validator';

// ============================================================================
// Auth DTOs
// ============================================================================

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName?: string;
  };
}

// ============================================================================
// Ride DTOs
// ============================================================================

export class CreateRideDto {
  @IsString()
  id: string;

  @IsString()
  mode: 'GPS_ONLY' | 'GPS_CAMERA';

  @IsISO8601()
  startedAt: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateRideDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  averageSpeed?: number;

  @IsOptional()
  @IsNumber()
  maxSpeed?: number;

  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class FinishRideDto {
  @IsISO8601()
  finishedAt: string;

  @IsNumber()
  distance: number;

  @IsNumber()
  duration: number;

  @IsNumber()
  averageSpeed: number;

  @IsNumber()
  maxSpeed: number;

  @IsOptional()
  @IsNumber()
  elevationGain?: number;

  @IsOptional()
  @IsNumber()
  calories?: number;
}

// ============================================================================
// Route Point DTOs
// ============================================================================

export class CreateRoutePointDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsISO8601()
  timestamp: string;
}

export class BulkCreateRoutePointsDto {
  @IsArray()
  points: CreateRoutePointDto[];
}

// ============================================================================
// Snapshot DTOs
// ============================================================================

export class CreateSnapshotDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsISO8601()
  timestamp: string;
}

// ============================================================================
// Common Response DTOs
// ============================================================================

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
