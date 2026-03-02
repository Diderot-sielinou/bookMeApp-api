/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRole } from '../common/constants';

import { JwtPayload } from '../common/interfaces';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate socket connection
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.userRole = payload.role;

      // Join user's room
      void client.join(`user:${payload.sub}`);

      // Track connected socket
      if (!this.connectedUsers.has(payload.sub)) {
        this.connectedUsers.set(payload.sub, new Set());
      }
      this.connectedUsers.get(payload.sub)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ==========================================
  // CLIENT MESSAGES
  // ==========================================

  @SubscribeMessage('ping')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  @SubscribeMessage('join-appointment')
  handleJoinAppointment(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { appointmentId: string }
  ) {
    if (!client.userId) return;

    void client.join(`appointment:${data.appointmentId}`);
    this.logger.log(`User ${client.userId} joined appointment room: ${data.appointmentId}`);

    return { event: 'joined', data: { appointmentId: data.appointmentId } };
  }

  @SubscribeMessage('leave-appointment')
  handleLeaveAppointment(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { appointmentId: string }
  ) {
    void client.leave(`appointment:${data.appointmentId}`);
    return { event: 'left', data: { appointmentId: data.appointmentId } };
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  @OnEvent('notification.created')
  handleNotificationCreated(payload: {
    notification: {
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      relatedId?: string | null;
      data?: Record<string, unknown> | null;
    };
  }) {
    this.sendToUser(payload.notification.userId, 'notification', {
      id: payload.notification.id,
      type: payload.notification.type,
      title: payload.notification.title,
      message: payload.notification.message,
      relatedId: payload.notification.relatedId || null,
      data: payload.notification.data || null,
      createdAt: new Date().toISOString(),
    });
  }

  @OnEvent('appointment.created')
  handleAppointmentCreated(payload: { appointment: { id: string; prestataireId: string } }) {
    this.sendToUser(payload.appointment.prestataireId, 'new-booking', {
      appointmentId: payload.appointment.id,
    });
  }

  @OnEvent('appointment.cancelled')
  handleAppointmentCancelled(payload: {
    appointment: { id: string; clientId: string; prestataireId: string };
    cancelledBy: string;
    cancelledByRole: UserRole;
  }) {
    // Notify the other party
    const recipientId =
      payload.cancelledByRole === UserRole.CLIENT
        ? payload.appointment.prestataireId
        : payload.appointment.clientId;

    this.sendToUser(recipientId, 'booking-cancelled', {
      appointmentId: payload.appointment.id,
      cancelledBy: payload.cancelledByRole,
    });
  }

  @OnEvent('message.sent')
  handleMessageSent(payload: {
    message: { id: string; content: string; senderId: string; createdAt: Date };
    appointment: { id: string };
    recipientId: string;
  }) {
    // Send to appointment room
    this.server.to(`appointment:${payload.appointment.id}`).emit('new-message', {
      id: payload.message.id,
      content: payload.message.content,
      senderId: payload.message.senderId,
      appointmentId: payload.appointment.id,
      createdAt: payload.message.createdAt,
    });

    // Also notify recipient directly if not in room
    this.sendToUser(payload.recipientId, 'message-notification', {
      appointmentId: payload.appointment.id,
      preview: payload.message.content.substring(0, 50),
    });
  }

  @OnEvent('message.read')
  handleMessageRead(payload: { appointmentId: string; userId: string }) {
    this.server.to(`appointment:${payload.appointmentId}`).emit('messages-read', {
      appointmentId: payload.appointmentId,
      readBy: payload.userId,
    });
  }

  @OnEvent('review.created')
  handleReviewCreated(payload: { review: { id: string; prestataireId: string; rating: number } }) {
    this.sendToUser(payload.review.prestataireId, 'new-review', {
      reviewId: payload.review.id,
      rating: payload.review.rating,
    });
  }

  @OnEvent('badge.awarded')
  handleBadgeAwarded(payload: { badge: { prestataireId: string; type: string } }) {
    this.sendToUser(payload.badge.prestataireId, 'badge-earned', {
      badgeType: payload.badge.type,
    });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private extractToken(client: Socket): string | null {
    // Try to get token from handshake auth
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    // Try to get from query params
    const queryToken = client.handshake.query?.token;
    if (queryToken) return queryToken as string;

    // Try to get from headers
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }

    return null;
  }

  private sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }
}
