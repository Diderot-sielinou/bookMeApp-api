import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { PrestataireStatus } from '../../common/constants';
import { Service } from '../../services/entities/service.entity';
import { Slot } from '../../slots/entities/slot.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Badge } from '../../badges/entities/badge.entity';
import { OpeningHours } from '../../common/interfaces';

@Entity('prestataires')
export class Prestataire {
  @ApiProperty({ description: 'Prestataire ID (same as User ID)' })
  @PrimaryColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Business name' })
  @Index()
  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  @ApiProperty({ description: 'First name' })
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @ApiProperty({ description: 'Bio description' })
  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @ApiProperty({ description: 'Professional categories', type: [String] })
  @Index('idx_prestataires_categories', { synchronize: false })
  // Change 'simple-array' par 'varchar' ou 'text' avec array: true
  @Column({ type: 'varchar', array: true, default: '{}' })
  categories: string[];

  @ApiProperty({ description: 'Phone number' })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @ApiProperty({ description: 'Avatar URL' })
  @Column({ type: 'text', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'Portfolio images', type: [String] })
  @Column({ name: 'portfolio_images', type: 'text', array: true, nullable: true })
  portfolioImages: string[] | null;

  @ApiProperty({ description: 'Opening hours configuration' })
  @Column({ name: 'opening_hours', type: 'jsonb', nullable: true })
  openingHours: OpeningHours | null;

  @ApiProperty({ description: 'Pause duration between appointments (minutes)' })
  @Column({ name: 'pause_duration', type: 'int', default: 0 })
  pauseDuration: number;

  @ApiProperty({ description: 'Minimum booking notice (hours)' })
  @Column({ name: 'min_booking_notice', type: 'int', default: 2 })
  minBookingNotice: number;

  @ApiProperty({ description: 'Minimum cancellation hours before appointment' })
  @Column({ name: 'min_cancellation_hours', type: 'int', default: 24 })
  minCancellationHours: number;

  @ApiProperty({ description: 'Cancellation policy description' })
  @Column({ name: 'cancellation_policy', type: 'text', nullable: true })
  cancellationPolicy: string | null;

  @ApiProperty({ enum: PrestataireStatus, description: 'Account status' })
  @Index()
  @Column({
    type: 'enum',
    enum: PrestataireStatus,
    default: PrestataireStatus.PENDING,
  })
  status: PrestataireStatus;

  @ApiProperty({ description: 'Average rating (1-5)' })
  @Index('idx_prestataires_rating')
  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  averageRating: number;

  @ApiProperty({ description: 'Total number of reviews' })
  @Column({ name: 'total_reviews', type: 'int', default: 0 })
  totalReviews: number;

  @ApiProperty({ description: 'Total number of appointments' })
  @Column({ name: 'total_appointments', type: 'int', default: 0 })
  totalAppointments: number;

  @ApiProperty({ description: 'Address' })
  @Column({ type: 'text', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'City' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @ApiProperty({ description: 'Postal code' })
  @Column({ name: 'postal_code', type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  @ApiProperty({ description: 'Whether profile is complete' })
  @Column({ name: 'profile_completed', type: 'boolean', default: false })
  profileCompleted: boolean;

  // Relations
  @OneToOne(() => User, (user) => user.prestataire, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;

  @OneToMany(() => Service, (service) => service.prestataire)
  services: Service[];

  @OneToMany(() => Slot, (slot) => slot.prestataire)
  slots: Slot[];

  @OneToMany(() => Appointment, (appointment) => appointment.prestataire)
  appointments: Appointment[];

  @OneToMany(() => Review, (review) => review.prestataire)
  reviews: Review[];

  @OneToMany(() => Badge, (badge) => badge.prestataire)
  badges: Badge[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName(): string {
    return this.businessName || this.fullName;
  }
}
