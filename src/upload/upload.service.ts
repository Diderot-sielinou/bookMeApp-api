/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';

export interface UploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
  };
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(file: Express.Multer.File, options: UploadOptions = {}): Promise<UploadResult> {
    // Validate file
    this.validateFile(file);

    const folder = options.folder || 'bookme';
    const transformation = options.transformation || {
      width: 800,
      height: 800,
      crop: 'limit',
      quality: 'auto',
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation,
          resource_type: options.resourceType || 'image',
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Upload failed: ${error.message}`);
            reject(new BadRequestException('Failed to upload file'));
          } else if (result) {
            this.logger.log(`File uploaded: ${result.public_id}`);
            resolve(this.mapUploadResult(result));
          }
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: 'bookme/avatars',
      transformation: {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto',
      },
    });
  }

  /**
   * Upload portfolio image
   */
  async uploadPortfolioImage(
    file: Express.Multer.File,
    prestataireId: string
  ): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: `bookme/portfolio/${prestataireId}`,
      transformation: {
        width: 1200,
        height: 1200,
        crop: 'limit',
        quality: 'auto',
      },
    });
  }

  /**
   * Upload service image
   */
  async uploadServiceImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, {
      folder: 'bookme/services',
      transformation: {
        width: 600,
        height: 400,
        crop: 'fill',
        quality: 'auto',
      },
    });
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted: ${publicId}`);
    } catch (error) {
      this.logger.error(`Delete failed for ${publicId}: ${error.message}`);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) return;

    try {
      await cloudinary.api.delete_resources(publicIds);
      this.logger.log(`Deleted ${publicIds.length} files`);
    } catch (error) {
      this.logger.error(`Bulk delete failed: ${error.message}`);
      throw new BadRequestException('Failed to delete files');
    }
  }

  /**
   * Get optimized URL for an image
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      width: options.width,
      height: options.height,
      crop: 'fill',
      quality: options.quality || 'auto',
      format: options.format || 'auto',
      secure: true,
    });
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${this.maxFileSize / 1024 / 1024}MB)`
      );
    }

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`
      );
    }
  }

  /**
   * Map Cloudinary response to UploadResult
   */
  private mapUploadResult(result: UploadApiResponse): UploadResult {
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  }
}
