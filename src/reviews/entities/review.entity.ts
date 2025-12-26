import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Client } from '../../users/entities/client.entity';
import { Prestataire } from '../../users/entities/prestataire.entity';

@Entity('reviews')
@Check(`"rating" >= 1 AND "rating" <= 5`)
@Check(`"quality_rating" IS NULL OR ("quality_rating" >= 1 AND "quality_rating" <= 5)`)
@Check(`"punctuality_rating" IS NULL OR ("punctuality_rating" >= 1 AND "punctuality_rating" <= 5)`)
@Check(`"cleanliness_rating" IS NULL OR ("cleanliness_rating" >= 1 AND "cleanliness_rating" <= 5)`)
export class Review {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Appointment ID' })
  @Index({ unique: true })
  @Column({ name: 'appointment_id', type: 'uuid', unique: true })
  appointmentId: string;

  @ApiProperty({ description: 'Client ID' })
  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ApiProperty({ description: 'Prestataire ID' })
  @Index()
  @Column({ name: 'prestataire_id', type: 'uuid' })
  prestataireId: string;

  @ApiProperty({ description: 'Overall rating (1-5)' })
  @Column({ type: 'int' })
  rating: number;

  @ApiProperty({ description: 'Quality rating (1-5, optional)' })
  @Column({ name: 'quality_rating', type: 'int', nullable: true })
  qualityRating: number | null;

  @ApiProperty({ description: 'Punctuality rating (1-5, optional)' })
  @Column({ name: 'punctuality_rating', type: 'int', nullable: true })
  punctualityRating: number | null;

  @ApiProperty({ description: 'Cleanliness rating (1-5, optional)' })
  @Column({ name: 'cleanliness_rating', type: 'int', nullable: true })
  cleanlinessRating: number | null;

  @ApiProperty({ description: 'Review comment' })
  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @ApiProperty({ description: 'Prestataire response to the review' })
  @Column({ name: 'prestataire_response', type: 'text', nullable: true })
  prestataireResponse: string | null;

  @ApiProperty({ description: 'Response timestamp' })
  @Column({ name: 'response_at', type: 'timestamp', nullable: true })
  responseAt: Date | null;

  @ApiProperty({ description: 'Whether review is flagged for moderation' })
  @Column({ type: 'boolean', default: false })
  flagged: boolean;

  @ApiProperty({ description: 'Flag reason' })
  @Column({ name: 'flag_reason', type: 'text', nullable: true })
  flagReason: string | null;

  @ApiProperty({ description: 'User who flagged' })
  @Column({ name: 'flagged_by', type: 'uuid', nullable: true })
  flaggedBy: string | null;

  @ApiProperty({ description: 'Edit count (max 1 allowed)' })
  @Column({ name: 'edit_count', type: 'int', default: 0 })
  editCount: number;

  @ApiProperty({ description: 'Last edit timestamp' })
  @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
  editedAt: Date | null;

  @ApiProperty({ description: 'Original comment before edit' })
  @Column({ name: 'original_comment', type: 'text', nullable: true })
  originalComment: string | null;

  @ApiProperty({ description: 'Whether review is visible' })
  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Appointment, (appointment) => appointment.review, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => Client, (client) => client.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Prestataire, (prestataire) => prestataire.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: Prestataire;
}
