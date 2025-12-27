import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Message } from './entities/message.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { SendMessageDto, QueryMessagesDto, FlagMessageDto } from './dto';
import { AppointmentStatus } from '../common/constants';
import { normalizePagination, createPaginatedResult } from '../common/utils/pagination.util';
import { PaginatedResult } from '../common/interfaces';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Send a message in an appointment thread
   */
  async sendMessage(senderId: string, dto: SendMessageDto): Promise<Message> {
    // Find appointment and verify access
    const appointment = await this.appointmentRepository.findOne({
      where: { id: dto.appointmentId },
      relations: ['client', 'prestataire'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify sender is a participant
    if (appointment.clientId !== senderId && appointment.prestataireId !== senderId) {
      throw new ForbiddenException('You are not a participant in this appointment');
    }

    // Only allow messages for confirmed or completed appointments
    if (![AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED].includes(appointment.status)) {
      throw new ForbiddenException(
        'Messages can only be sent for confirmed or completed appointments'
      );
    }

    // Create message
    const message = this.messageRepository.create({
      appointmentId: dto.appointmentId,
      senderId,
      content: dto.content,
    });

    await this.messageRepository.save(message);

    this.logger.log(`Message sent: ${message.id} in appointment ${dto.appointmentId}`);

    // Emit message event for real-time notification
    const recipientId =
      appointment.clientId === senderId ? appointment.prestataireId : appointment.clientId;

    this.eventEmitter.emit('message.sent', {
      message,
      appointment,
      recipientId,
    });

    return message;
  }

  /**
   * Get messages for an appointment
   */
  async getMessages(
    appointmentId: string,
    userId: string,
    dto: QueryMessagesDto
  ): Promise<PaginatedResult<Message>> {
    // Verify access
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.clientId !== userId && appointment.prestataireId !== userId) {
      throw new ForbiddenException('You are not a participant in this appointment');
    }

    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { appointmentId },
      order: { createdAt: dto.sortOrder || 'ASC' },
      skip,
      take: limit,
    });

    return createPaginatedResult(messages, total, page, limit);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(appointmentId: string, userId: string): Promise<{ marked: number }> {
    // Verify access
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.clientId !== userId && appointment.prestataireId !== userId) {
      throw new ForbiddenException('You are not a participant in this appointment');
    }

    // Mark all unread messages from the other participant as read
    const result = await this.messageRepository.update(
      {
        appointmentId,
        senderId:
          appointment.clientId === userId ? appointment.prestataireId : appointment.clientId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    return { marked: result.affected || 0 };
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Get appointments where user is a participant
    const appointments = await this.appointmentRepository.find({
      where: [{ clientId: userId }, { prestataireId: userId }],
      select: ['id', 'clientId', 'prestataireId'],
    });

    if (appointments.length === 0) {
      return 0;
    }

    // Count unread messages not sent by the user
    let totalUnread = 0;

    for (const appointment of appointments) {
      const count = await this.messageRepository.count({
        where: {
          appointmentId: appointment.id,
          senderId:
            appointment.clientId === userId ? appointment.prestataireId : appointment.clientId,
          read: false,
        },
      });
      totalUnread += count;
    }

    return totalUnread;
  }

  /**
   * Get conversations list (grouped by appointment)
   */
  async getConversations(
    userId: string,
    dto: QueryMessagesDto
  ): Promise<
    PaginatedResult<{
      appointment: Appointment;
      lastMessage: Message | null;
      unreadCount: number;
    }>
  > {
    const { page, limit, skip } = normalizePagination(dto.page, dto.limit);

    // Get appointments for user
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.prestataire', 'prestataire')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.slot', 'slot')
      .where('(appointment.clientId = :userId OR appointment.prestataireId = :userId)', { userId })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
      })
      .orderBy('appointment.updatedAt', 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(skip).take(limit);

    const appointments = await queryBuilder.getMany();

    // Build conversations with last message and unread count
    const conversations = await Promise.all(
      appointments.map(async (appointment) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { appointmentId: appointment.id },
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.messageRepository.count({
          where: {
            appointmentId: appointment.id,
            senderId:
              appointment.clientId === userId ? appointment.prestataireId : appointment.clientId,
            read: false,
          },
        });

        return {
          appointment,
          lastMessage,
          unreadCount,
        };
      })
    );

    return createPaginatedResult(conversations, total, page, limit);
  }

  /**
   * Flag a message (for moderation)
   */
  async flagMessage(messageId: string, userId: string, dto: FlagMessageDto): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['appointment'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is a participant
    const appointment = message.appointment;
    if (appointment.clientId !== userId && appointment.prestataireId !== userId) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    message.flagged = true;
    message.flagReason = dto.reason;

    await this.messageRepository.save(message);

    this.logger.log(`Message flagged: ${messageId} by ${userId}`);

    // Emit flag event
    this.eventEmitter.emit('message.flagged', { message, flaggedBy: userId });

    return message;
  }
}
