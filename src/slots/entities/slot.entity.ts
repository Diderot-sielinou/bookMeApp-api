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
import { SlotStatus } from '../../common/constants';
import { Prestataire } from '../../users/entities/prestataire.entity';
import { Service } from '../../services/entities/service.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('slots')
@Check(`"end_time" > "start_time"`)
@Index(['prestataireId', 'date'])
export class Slot {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Prestataire ID' })
  @Column({ name: 'prestataire_id', type: 'uuid' })
  prestataireId: string;

  @ApiProperty({ description: 'Service ID (optional)' })
  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @ApiProperty({ description: 'Date of the slot' })
  @Index()
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ description: 'Start time (HH:mm format)' })
  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:mm format)' })
  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @ApiProperty({ enum: SlotStatus, description: 'Slot status' })
  @Index()
  @Column({
    type: 'enum',
    enum: SlotStatus,
    default: SlotStatus.AVAILABLE,
  })
  status: SlotStatus;

  @ApiProperty({ description: 'Additional notes' })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Whether slot is recurring' })
  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring: boolean;

  @ApiProperty({ description: 'Recurring pattern ID' })
  @Column({ name: 'recurring_pattern_id', type: 'uuid', nullable: true })
  recurringPatternId: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Soft delete
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Prestataire, (prestataire) => prestataire.slots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: Prestataire;

  @ManyToOne(() => Service, (service) => service.slots, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'service_id' })
  service: Service | null;

  @OneToOne(() => Appointment, (appointment) => appointment.slot)
  appointment: Appointment;

  // Virtual property to get duration in minutes
  get durationMinutes(): number {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  }
}
