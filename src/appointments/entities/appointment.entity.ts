import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../common/constants';
import { Client } from '../../users/entities/client.entity';
import { Prestataire } from '../../users/entities/prestataire.entity';
import { Slot } from '../../slots/entities/slot.entity';
import { Service } from '../../services/entities/service.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Message } from '../../messages/entities/message.entity';
import { User } from '../../users/entities/user.entity';

@Entity('appointments')
export class Appointment {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Client ID' })
  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ApiProperty({ description: 'Prestataire ID' })
  @Index()
  @Column({ name: 'prestataire_id', type: 'uuid' })
  prestataireId: string;

  @ApiProperty({ description: 'Slot ID' })
  @Index({ unique: true })
  @Column({ name: 'slot_id', type: 'uuid' })
  slotId: string;

  @ApiProperty({ description: 'Service ID' })
  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ApiProperty({ enum: AppointmentStatus, description: 'Appointment status' })
  @Index()
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.CONFIRMED,
  })
  status: AppointmentStatus;

  @ApiProperty({ description: 'Client note' })
  @Column({ name: 'client_note', type: 'text', nullable: true })
  clientNote: string | null;

  @ApiProperty({ description: 'User ID who cancelled' })
  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy: string | null;

  @ApiProperty({ description: 'Cancellation timestamp' })
  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ description: 'Cancellation reason' })
  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ description: 'Completion timestamp' })
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ description: 'Price at time of booking' })
  @Column({
    name: 'price_at_booking',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  priceAtBooking: number;

  @ApiProperty({ description: 'Whether reminder was sent for 24h' })
  @Column({ name: 'reminder_24h_sent', type: 'boolean', default: false })
  reminder24hSent: boolean;

  @ApiProperty({ description: 'Whether reminder was sent for 1h' })
  @Column({ name: 'reminder_1h_sent', type: 'boolean', default: false })
  reminder1hSent: boolean;

  @ApiProperty({ description: 'Whether review request was sent' })
  @Column({ name: 'review_request_sent', type: 'boolean', default: false })
  reviewRequestSent: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Client, (client) => client.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Prestataire, (prestataire) => prestataire.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: Prestataire;

  @OneToOne(() => Slot, (slot) => slot.appointment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slot_id' })
  slot: Slot;

  @ManyToOne(() => Service, (service) => service.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelledByUser: User | null;

  @OneToOne(() => Review, (review) => review.appointment)
  review: Review;

  @OneToMany(() => Message, (message) => message.appointment)
  messages: Message[];
}
