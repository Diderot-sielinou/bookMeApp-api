import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/constants';
import { Client } from './client.entity';
import { Prestataire } from './prestataire.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Email address' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Whether email is verified' })
  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Exclude()
  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  emailVerificationToken: string | null;

  @Exclude()
  @Column({
    name: 'email_verification_expires',
    type: 'timestamp',
    nullable: true,
  })
  emailVerificationExpires: Date | null;

  @Exclude()
  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordResetToken: string | null;

  @Exclude()
  @Column({
    name: 'password_reset_expires',
    type: 'timestamp',
    nullable: true,
  })
  passwordResetExpires: Date | null;

  @ApiProperty({ description: 'Whether 2FA is enabled' })
  @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Exclude()
  @Column({
    name: 'two_factor_secret',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  twoFactorSecret: string | null;

  @ApiProperty({ description: 'Whether account is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Client, (client) => client.user)
  client: Client;

  @OneToOne(() => Prestataire, (prestataire) => prestataire.user)
  prestataire: Prestataire;
}
