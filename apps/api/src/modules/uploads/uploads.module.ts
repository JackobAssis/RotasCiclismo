/**
 * Uploads Module
 */

import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { loadConfig } from '../../config/config';

@Module({
  controllers: [UploadsController],
  providers: [
    UploadsService,
    {
      provide: 'APP_CONFIG',
      useValue: loadConfig(),
    },
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
