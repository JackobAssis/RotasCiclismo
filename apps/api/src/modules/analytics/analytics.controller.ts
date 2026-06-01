import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService, AnalyticsResponseDto } from './analytics.service';
import { JwtAuthGuard } from '../../common/auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Request() req: any): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getAnalytics(req.user.userId);
  }
}
