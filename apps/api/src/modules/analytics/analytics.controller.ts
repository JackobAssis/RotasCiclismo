import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService, AnalyticsResponseDto } from './analytics.service';
import { JwtAuthGuard } from '../../common/auth.guard';
import { AuthenticatedRequest } from '../../common/jwt.types';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Request() req: AuthenticatedRequest): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getAnalytics(req.user.userId);
  }
}
