import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity('clients')
export class Client {
  @ApiProperty({ description: 'Client ID (same as User ID)' })
  @PrimaryColumn('uuid')
  id: string;

  @ApiProperty({ description: 'First name' })
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @ApiProperty({ description: 'Phone number' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Avatar URL' })
  @Column({ type: 'text', nullable: true })
  avatar: string | null;

  // Relations
  @OneToOne(() => User, (user) => user.client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  appointments: Appointment[];

  @OneToMany(() => Review, (review) => review.client)
  reviews: Review[];

  @OneToMany(() => Message, (message) => message.senderUser)
  sentMessages: Message[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
