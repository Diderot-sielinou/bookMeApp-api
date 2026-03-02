import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { MessagesService } from './messages.service';
import { SendMessageDto, QueryMessagesDto, FlagMessageDto, ConversationsListDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(@CurrentUser('id') senderId: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(senderId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get my conversations' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async getConversations(@CurrentUser('id') userId: string, @Query() query: ConversationsListDto) {
    return this.messagesService.getConversations(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    const count = await this.messagesService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get messages for an appointment' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser('id') userId: string,
    @Query() query: QueryMessagesDto
  ) {
    return this.messagesService.getMessages(appointmentId, userId, query);
  }

  @Patch('appointment/:appointmentId/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.messagesService.markAsRead(appointmentId, userId);
  }

  @Post(':id/flag')
  @ApiOperation({ summary: 'Flag a message' })
  @ApiResponse({ status: 200, description: 'Message flagged' })
  async flagMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: FlagMessageDto
  ) {
    return this.messagesService.flagMessage(id, userId, dto);
  }
}
