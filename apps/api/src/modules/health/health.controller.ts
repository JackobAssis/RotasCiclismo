import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('alive')
  async getLiveness() {
    return { alive: true };
  }
}
