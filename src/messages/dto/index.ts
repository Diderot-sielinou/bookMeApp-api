import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsBoolean,
  IsInt,
  Min,
  Max,
  // IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// SEND MESSAGE DTO
// ==========================================
export class SendMessageDto {
  @ApiProperty({
    description: 'Appointment ID (conversation context)',
    example: 'uuid',
  })
  @IsUUID()
  appointmentId: string;

  @ApiProperty({
    description: 'Message content',
    example: "Bonjour, j'aurais une question concernant le rendez-vous...",
  })
  @IsString()
  @MaxLength(2000, { message: 'Message cannot exceed 2000 characters' })
  content: string;
}

// ==========================================
// FLAG MESSAGE DTO
// ==========================================
export class FlagMessageDto {
  @ApiProperty({
    description: 'Reason for flagging',
    example: 'Harcèlement',
    enum: ['harassment', 'inappropriate', 'spam'],
  })
  @IsString()
  @MaxLength(500)
  reason: string;
}

// ==========================================
// QUERY MESSAGES DTO
// ==========================================
export class QueryMessagesDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (last message ID)',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;

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
    description: 'Number of messages to fetch',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort order',
    default: 'ASC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

// ==========================================
// MESSAGE RESPONSE DTO
// ==========================================
export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  appointmentId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  read: boolean;

  @ApiProperty({ nullable: true })
  readAt: Date | null;

  @ApiProperty()
  flagged: boolean;

  @ApiProperty()
  createdAt: Date;

  // Sender info
  @ApiPropertyOptional()
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  };
}

// ==========================================
// CONVERSATION RESPONSE DTO
// ==========================================
export class ConversationResponseDto {
  @ApiProperty()
  appointmentId: string;

  @ApiProperty()
  appointment: {
    id: string;
    status: string;
    service: {
      name: string;
    };
    slot: {
      date: Date;
      startTime: string;
    };
  };

  @ApiProperty()
  otherParty: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };

  @ApiProperty()
  lastMessage: {
    content: string;
    createdAt: Date;
    isRead: boolean;
  } | null;

  @ApiProperty()
  unreadCount: number;
}

// ==========================================
// CONVERSATIONS LIST DTO
// ==========================================
export class ConversationsListDto {
  @ApiPropertyOptional({
    description: 'Filter unread only',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

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
