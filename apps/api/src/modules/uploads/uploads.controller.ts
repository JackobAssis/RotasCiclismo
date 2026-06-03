/**
 * Uploads Controller
 *
 * Endpoints:
 * POST /uploads/url           - Get upload URL
 * POST /uploads/local/:id     - Upload file to local storage (future: remove)
 */

import { Controller, Post, Body, UseGuards, Request, Param, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UploadedFile } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/auth.guard';

export interface GetUploadUrlRequest {
  fileType: 'snapshot' | 'video';
  fileSize: number;
  filename?: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  /**
   * Get upload URL
   *
   * POST /uploads/url
   * Body: { fileType: 'snapshot' | 'video', fileSize, filename? }
   *
   * Returns URL where client should PUT/POST the file.
   */
  @Post('url')
  async getUploadUrl(@Request() req: any, @Body() body: GetUploadUrlRequest) {
    this.uploadsService.validateFile(body.fileType, body.fileSize);

    return this.uploadsService.getUploadUrl(req.user.userId, body.fileType, body.fileSize);
  }

  /**
   * Storage stats
   *
   * GET /uploads/stats
   *
   * Shows user their storage usage and quota.
   */
  @Post('stats')
  async getStorageStats(@Request() req: any) {
    return this.uploadsService.getStorageStats(req.user.userId);
  }
}
