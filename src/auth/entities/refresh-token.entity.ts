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
import { Exclude } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Exclude()
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 500, unique: true })
  token: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({ description: 'Whether token is revoked' })
  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked: boolean;

  @ApiProperty({ description: 'User agent of the device' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'IP address' })
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Helper to check if token is expired
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Helper to check if token is valid
  get isValid(): boolean {
    return !this.isRevoked && !this.isExpired;
  }
}
