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
import { NotificationType } from '../../common/constants';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  @Column({ type: 'varchar', length: 50 })
  type: string;

  @ApiProperty({ description: 'Notification title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Related entity ID' })
  @Column({ name: 'related_id', type: 'uuid', nullable: true })
  relatedId: string | null;

  @ApiProperty({ description: 'Additional data (JSON)' })
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @ApiProperty({ description: 'Whether notification has been read' })
  @Index()
  @Column({ type: 'boolean', default: false })
  read: boolean;

  @ApiProperty({ description: 'Read timestamp' })
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: 'Whether email notification was sent' })
  @Column({ name: 'email_sent', type: 'boolean', default: false })
  emailSent: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
