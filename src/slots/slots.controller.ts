import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { SlotsService } from './slots.service';
import {
  CreateSlotDto,
  CreateRecurringSlotsDto,
  UpdateSlotDto,
  BlockSlotsDto,
  QuerySlotsDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../common/decorators';
import { UserRole } from '../common/constants';

@ApiTags('slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  @Get('available/:prestataireId')
  @Public()
  @ApiOperation({ summary: 'Get available slots for a prestataire' })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'serviceId', required: false })
  async getAvailableSlots(
    @Param('prestataireId', ParseUUIDPipe) prestataireId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('serviceId') serviceId?: string
  ) {
    return this.slotsService.findAvailableSlots(prestataireId, startDate, endDate, serviceId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get slot by ID' })
  @ApiResponse({ status: 200, description: 'Slot details' })
  async getSlotById(@Param('id', ParseUUIDPipe) id: string) {
    return this.slotsService.findById(id);
  }

  // ==========================================
  // PRESTATAIRE ENDPOINTS
  // ==========================================

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my slots with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of slots' })
  async getMySlots(@CurrentUser('id') prestataireId: string, @Query() query: QuerySlotsDto) {
    return this.slotsService.findSlots({
      ...query,
      prestataireId,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a single slot' })
  @ApiResponse({ status: 201, description: 'Slot created' })
  async createSlot(@CurrentUser('id') prestataireId: string, @Body() dto: CreateSlotDto) {
    return this.slotsService.createSlot(prestataireId, dto);
  }

  @Post('recurring')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create recurring slots' })
  @ApiResponse({ status: 201, description: 'Recurring slots created' })
  async createRecurringSlots(
    @CurrentUser('id') prestataireId: string,
    @Body() dto: CreateRecurringSlotsDto
  ) {
    return this.slotsService.createRecurringSlots(prestataireId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a slot' })
  @ApiResponse({ status: 200, description: 'Slot updated' })
  async updateSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') prestataireId: string,
    @Body() dto: UpdateSlotDto
  ) {
    return this.slotsService.updateSlot(id, prestataireId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a slot' })
  @ApiResponse({ status: 200, description: 'Slot deleted' })
  async deleteSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') prestataireId: string
  ) {
    await this.slotsService.deleteSlot(id, prestataireId);
    return { message: 'Slot deleted successfully' };
  }

  @Post('block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Block slots for vacation/unavailability' })
  @ApiResponse({ status: 200, description: 'Slots blocked' })
  async blockSlots(@CurrentUser('id') prestataireId: string, @Body() dto: BlockSlotsDto) {
    return this.slotsService.blockSlots(prestataireId, dto);
  }
}
