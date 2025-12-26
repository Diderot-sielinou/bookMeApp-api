import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  // ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { UpdateClientDto, UpdatePrestataireDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Public, Roles } from '../common/decorators';
import { UserRole } from '../common/constants';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==========================================
  // CLIENT ENDPOINTS
  // ==========================================

  @Get('clients/me')
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get current client profile' })
  @ApiResponse({ status: 200, description: 'Client profile' })
  async getMyClientProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findClientById(userId);
  }

  @Patch('clients/me')
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update current client profile' })
  @ApiResponse({ status: 200, description: 'Client profile updated' })
  async updateMyClientProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateClientDto) {
    return this.usersService.updateClient(userId, dto);
  }

  @Get('clients/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get client by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Client profile' })
  async getClientById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findClientById(id);
  }

  // ==========================================
  // PRESTATAIRE ENDPOINTS
  // ==========================================

  @Get('prestataires/me')
  @Roles(UserRole.PRESTATAIRE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get current prestataire profile' })
  @ApiResponse({ status: 200, description: 'Prestataire profile' })
  async getMyPrestataireProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findPrestataireById(userId);
  }

  @Patch('prestataires/me')
  @Roles(UserRole.PRESTATAIRE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update current prestataire profile' })
  @ApiResponse({ status: 200, description: 'Prestataire profile updated' })
  async updateMyPrestataireProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePrestataireDto
  ) {
    return this.usersService.updatePrestataire(userId, dto);
  }

  @Get('prestataires/me/stats')
  @Roles(UserRole.PRESTATAIRE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get current prestataire stats' })
  @ApiResponse({ status: 200, description: 'Prestataire statistics' })
  async getMyPrestataireStats(@CurrentUser('id') userId: string) {
    return this.usersService.getPrestataireStats(userId);
  }

  @Get('prestataires/:id')
  @Public()
  @ApiOperation({ summary: 'Get prestataire by ID (public)' })
  @ApiResponse({ status: 200, description: 'Prestataire profile' })
  async getPrestataireById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findPrestataireByIdPublic(id);
  }
}
