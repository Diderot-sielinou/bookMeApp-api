import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export const getCloudinaryConfig = (configService: ConfigService): CloudinaryConfig => {
  return {
    cloudName: configService.get<string>('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: configService.get<string>('CLOUDINARY_API_KEY', ''),
    apiSecret: configService.get<string>('CLOUDINARY_API_SECRET', ''),
  };
};

export const configureCloudinary = (configService: ConfigService): void => {
  cloudinary.config({
    cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
    api_key: configService.get<string>('CLOUDINARY_API_KEY'),
    api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    secure: true,
  });
};

export const CLOUDINARY_FOLDERS = {
  AVATARS: 'bookme/avatars',
  PORTFOLIOS: 'bookme/portfolios',
  SERVICES: 'bookme/services',
} as const;

export const CLOUDINARY_TRANSFORMATIONS = {
  AVATAR: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'webp',
  },
  THUMBNAIL: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto',
    format: 'webp',
  },
  PORTFOLIO: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto:good',
    format: 'webp',
  },
} as const;
