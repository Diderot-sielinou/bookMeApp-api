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
import { Appointment } from '../../appointments/entities/appointment.entity';
import { User } from '../../users/entities/user.entity';
// import { Client } from '../../users/entities/client.entity';

@Entity('messages')
export class Message {
  @ApiProperty({ description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Appointment ID' })
  @Index()
  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @ApiProperty({ description: 'Sender user ID' })
  @Index()
  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ApiProperty({ description: 'Message content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'Whether message has been read' })
  @Index()
  @Column({ type: 'boolean', default: false })
  read: boolean;

  @ApiProperty({ description: 'Read timestamp' })
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: 'Whether message is flagged' })
  @Column({ type: 'boolean', default: false })
  flagged: boolean;

  @ApiProperty({ description: 'Flag reason' })
  @Column({ name: 'flag_reason', type: 'text', nullable: true })
  flagReason: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Appointment, (appointment) => appointment.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  senderUser: User;

  // @ManyToOne(() => Client, (client) => client.sentMessages, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'sender_id' })
  // sender: Client;
}
