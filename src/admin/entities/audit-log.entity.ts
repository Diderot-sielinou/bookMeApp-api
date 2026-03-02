import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ description: 'Action performed' })
  @Index()
  @Column({ type: 'varchar', length: 100 })
  action: string;

  @ApiProperty({ description: 'Entity type affected' })
  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType: string | null;

  @ApiProperty({ description: 'Entity ID affected' })
  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @ApiProperty({ description: 'Additional details (JSON)' })
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @ApiProperty({ description: 'IP address' })
  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'User agent' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}

// Audit action constants
export const AuditActions = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE: 'PASSWORD_RESET_COMPLETE',
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',

  // User management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_DELETED: 'USER_DELETED',

  // Prestataire management
  PRESTATAIRE_APPROVED: 'PRESTATAIRE_APPROVED',
  PRESTATAIRE_REJECTED: 'PRESTATAIRE_REJECTED',
  BADGE_AWARDED: 'BADGE_AWARDED',
  BADGE_REVOKED: 'BADGE_REVOKED',

  // Content moderation
  REVIEW_DELETED: 'REVIEW_DELETED',
  REVIEW_FLAGGED: 'REVIEW_FLAGGED',
  MESSAGE_DELETED: 'MESSAGE_DELETED',
  MESSAGE_FLAGGED: 'MESSAGE_FLAGGED',

  // Configuration
  CONFIG_UPDATED: 'CONFIG_UPDATED',
  CATEGORY_CREATED: 'CATEGORY_CREATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];
