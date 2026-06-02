import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  async getHealth() {
    const result = await this.healthService.getHealth();
    return { status: result.database === 'connected' ? 'ok' : 'error' };
  }

  @Get('ready')
  async getReadiness() {
    const result = await this.healthService.getReadiness();
    return { status: result.ready ? 'ready' : 'not ready' };
  }
}
