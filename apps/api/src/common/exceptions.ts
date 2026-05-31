/**
 * Common Exceptions and Error Handling
 *
 * Standardized exception types for the application.
 */

import { BadRequestException, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';

export class UserAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid email or password');
  }
}

export class RideNotFoundException extends NotFoundException {
  constructor(rideId: string) {
    super(`Ride with ID ${rideId} not found`);
  }
}

export class UnauthorizedRideAccessException extends UnauthorizedException {
  constructor(rideId: string) {
    super(`You do not have access to ride ${rideId}`);
  }
}

export class InvalidSyncTaskException extends BadRequestException {
  constructor(message: string) {
    super(`Invalid sync task: ${message}`);
  }
}
