import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../common/decorators';
import { UserRole } from '../common/constants';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ==========================================
  // ROUTES STATIQUES D'ABORD
  // ==========================================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my services (connected prestataire)' })
  @ApiResponse({ status: 200, description: 'List of my services' })
  async getMyServices(@CurrentUser('id') prestataireId: string) {
    return this.servicesService.findByPrestataire(prestataireId, false);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created' })
  async createService(@CurrentUser('id') prestataireId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(prestataireId, dto);
  }

  // ⚠️ IMPORTANT: Cette route DOIT être AVANT @Patch(':id')
  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reorder services' })
  @ApiResponse({ status: 200, description: 'Services reordered' })
  async reorderServices(
    @CurrentUser('id') prestataireId: string,
    @Body() body: { serviceIds: string[] }
  ) {
    return this.servicesService.reorder(prestataireId, body.serviceIds);
  }

  // ==========================================
  // ROUTES AVEC PRÉFIXE + PARAMÈTRE
  // ==========================================

  @Get('prestataire/:prestataireId')
  @Public()
  @ApiOperation({ summary: 'Get all services for a prestataire' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async getServicesForPrestataire(@Param('prestataireId', ParseUUIDPipe) prestataireId: string) {
    return this.servicesService.findByPrestataire(prestataireId, true);
  }

  // ==========================================
  // ROUTES AVEC PARAMÈTRE :id EN DERNIER
  // ==========================================

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, description: 'Service details' })
  async getService(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  async updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') prestataireId: string,
    @Body() dto: UpdateServiceDto
  ) {
    return this.servicesService.update(id, prestataireId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  async deleteService(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') prestataireId: string
  ) {
    await this.servicesService.delete(id, prestataireId);
    return { message: 'Service deleted successfully' };
  }
}
