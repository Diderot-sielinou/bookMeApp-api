import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Prestataire } from '../../users/entities/prestataire.entity';
import { Slot } from '../../slots/entities/slot.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('services')
export class Service {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Prestataire ID' })
  @Index()
  @Column({ name: 'prestataire_id', type: 'uuid' })
  prestataireId: string;

  @ApiProperty({ description: 'Service name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({ description: 'Service description' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Duration in minutes' })
  @Column({ type: 'int' })
  duration: number;

  @ApiProperty({ description: 'Price in currency' })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @ApiProperty({ description: 'Whether service is active' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Display order' })
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Service image URL' })
  @Column({ type: 'text', nullable: true })
  image: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Prestataire, (prestataire) => prestataire.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: Prestataire;

  @OneToMany(() => Slot, (slot) => slot.service)
  slots: Slot[];

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];
}
