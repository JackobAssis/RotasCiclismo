/**
 * Uploads Service
 *
 * Handles file upload preparation and tracking.
 *
 * ARCHITECTURAL NOTE:
 * This is a placeholder for the full media upload system.
 * Currently provides:
 * - Upload URL generation (pre-signed URLs for future S3)
 * - Local storage abstraction
 * - Future: S3, Azure Blob, Cloudinary support
 *
 * Frontend flow:
 * 1. Request upload URL
 * 2. Upload file to URL (local or S3)
 * 3. Notify backend of completion
 * 4. Backend marks snapshot as COMPLETED
 */

import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { AppConfig } from '../../config/config';

export interface UploadUrlResponse {
  uploadId: string;
  uploadUrl: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
  expiresIn: number;
}

@Injectable()
export class UploadsService {
  constructor(@Inject('APP_CONFIG') private config: AppConfig) {}

  /**
   * Get upload URL for a file
   *
   * Currently returns a local endpoint.
   * Future: Return pre-signed S3 URL or Azure SAS token.
   */
  async getUploadUrl(
    userId: string,
    fileType: 'snapshot' | 'video',
    fileSize: number,
  ): Promise<UploadUrlResponse> {
    // In local mode: return endpoint to POST file to
    // In S3 mode: return pre-signed PUT URL

    if (this.config.storage_type === 'local') {
      const uploadId = uuidv4();
      const uploadUrl = `/uploads/local/${uploadId}`;

      return {
        uploadId,
        uploadUrl,
        method: 'PUT',
        expiresIn: 3600, // 1 hour
      };
    }

    if (this.config.storage_type === 's3') {
      // TODO: Implement S3 pre-signed URL generation
      // Return S3 pre-signed PUT URL
      throw new Error('S3 upload not yet implemented');
    }

    throw new Error(`Unknown storage type: ${this.config.storage_type}`);
  }

  /**
   * Validate file before upload
   *
   * Check size limits, format, etc.
   */
  validateFile(fileType: 'snapshot' | 'video', fileSize: number): boolean {
    const maxSizes = {
      snapshot: 50 * 1024 * 1024, // 50MB
      video: 500 * 1024 * 1024, // 500MB (for now)
    };

    if (fileSize > maxSizes[fileType]) {
      throw new Error(`File too large. Max ${maxSizes[fileType]} bytes for ${fileType}`);
    }

    return true;
  }

  /**
   * Save file locally
   *
   * Used for local storage mode.
   * In production, files would go to S3.
   */
  async saveFileLocally(uploadId: string, buffer: Buffer, filename: string): Promise<string> {
    const uploadDir = this.config.upload_dir || './uploads';
    const filepath = path.join(uploadDir, uploadId, filename);

    // Create directory
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Save file
    await fs.writeFile(filepath, buffer);

    // Return public URL (relative)
    return `/uploads/${uploadId}/${filename}`;
  }

  /**
   * Get storage stats
   *
   * Used for monitoring and quotas (future).
   */
  async getStorageStats(userId: string) {
    return {
      userId,
      usedBytes: 0, // TODO: Calculate
      quotaBytes: 1024 * 1024 * 1024, // 1GB for now
    };
  }
}
