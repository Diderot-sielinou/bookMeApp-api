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

import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto, CancelAppointmentDto, QueryAppointmentsDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles } from '../common/decorators';
import { UserRole } from '../common/constants';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ==========================================
  // CLIENT ENDPOINTS
  // ==========================================

  @Post('book')
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Book an appointment' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 409, description: 'Slot no longer available' })
  async bookAppointment(@CurrentUser('id') clientId: string, @Body() dto: BookAppointmentDto) {
    return this.appointmentsService.bookAppointment(dto, clientId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my appointments' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  async getMyAppointments(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: QueryAppointmentsDto
  ) {
    return this.appointmentsService.findByUser(userId, userRole, query);
  }

  @Get('today')
  @Roles(UserRole.PRESTATAIRE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get today's appointments (prestataire)" })
  @ApiResponse({ status: 200, description: "Today's appointments" })
  async getTodayAppointments(@CurrentUser('id') prestataireId: string) {
    return this.appointmentsService.findTodayForPrestataire(prestataireId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  async getAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole
  ) {
    return this.appointmentsService.findById(id, userId, userRole);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  async cancelAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CancelAppointmentDto
  ) {
    return this.appointmentsService.cancelAppointment(id, userId, userRole, dto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.PRESTATAIRE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mark appointment as completed' })
  @ApiResponse({ status: 200, description: 'Appointment marked as completed' })
  async completeAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') prestataireId: string
  ) {
    return this.appointmentsService.completeAppointment(id, prestataireId);
  }
}
