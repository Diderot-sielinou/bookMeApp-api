import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../common/decorators';
import { UserRole } from '../common/constants';

@ApiTags('badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('prestataire/:prestataireId')
  @Public()
  @ApiOperation({ summary: 'Get badges for a prestataire' })
  @ApiResponse({ status: 200, description: 'List of badges' })
  async getBadges(@Param('prestataireId', ParseUUIDPipe) prestataireId: string) {
    return this.badgesService.getBadges(prestataireId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRESTATAIRE)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my badges' })
  @ApiResponse({ status: 200, description: 'My badges' })
  async getMyBadges(@CurrentUser('id') prestataireId: string) {
    return this.badgesService.getBadges(prestataireId);
  }
}
