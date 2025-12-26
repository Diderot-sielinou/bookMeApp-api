import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../../common/constants';

// ==========================================
// QUERY NOTIFICATIONS DTO
// ==========================================
export class QueryNotificationsDto {
  @ApiPropertyOptional({
    description: 'Filter by read status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}

// ==========================================
// MARK NOTIFICATIONS READ DTO
// ==========================================
export class MarkNotificationsReadDto {
  @ApiPropertyOptional({
    description: 'Notification IDs to mark as read (if empty, marks all)',
    type: [String],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  notificationIds?: string[];
}

// ==========================================
// NOTIFICATION RESPONSE DTO
// ==========================================
export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  relatedId: string | null;

  @ApiProperty({ nullable: true })
  data: Record<string, unknown> | null;

  @ApiProperty()
  read: boolean;

  @ApiProperty({ nullable: true })
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

// ==========================================
// NOTIFICATION PREFERENCES DTO
// ==========================================
export class NotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Enable in-app notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @ApiPropertyOptional({
    description: 'Enable email notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({
    description: 'Enable appointment reminders',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  appointmentReminders?: boolean;

  @ApiPropertyOptional({
    description: 'Enable new message notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  newMessages?: boolean;

  @ApiPropertyOptional({
    description: 'Enable review notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  reviews?: boolean;

  @ApiPropertyOptional({
    description: 'Enable badge notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  badges?: boolean;

  @ApiPropertyOptional({
    description: 'Enable marketing emails',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
}

// ==========================================
// NOTIFICATION COUNT RESPONSE DTO
// ==========================================
export class NotificationCountDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  unread: number;
}

// ==========================================
// CREATE NOTIFICATION DTO (Internal use)
// ==========================================
export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: Record<string, unknown>;
}
