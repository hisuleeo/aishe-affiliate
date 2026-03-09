import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users/me')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersMeController {
  constructor(private readonly usersService: UsersService) {}

  @Get('referral-code')
  getReferralCode(@Req() request: { user: { userId: string } }) {
    return this.usersService.getOrCreateReferralCode(request.user.userId);
  }

  @Get('referral-stats')
  getReferralStats(@Req() request: { user: { userId: string } }) {
    return this.usersService.getReferralStats(request.user.userId);
  }

  @Get('profile')
  getProfile(@Req() request: { user: { userId: string } }) {
    return this.usersService.getProfile(request.user.userId);
  }

  @Patch('profile')
  updateProfile(
    @Req() request: { user: { userId: string } },
    @Body() payload: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(request.user.userId, payload);
  }

  @Get('affiliate-links')
  listAffiliateLinks(@Req() request: { user: { userId: string } }) {
    return this.usersService.listAffiliateLinks(request.user.userId);
  }

  @Post('affiliate-links')
  createAffiliateLink(
    @Req() request: { user: { userId: string } },
    @Body() payload: CreateAffiliateLinkDto,
  ) {
    return this.usersService.createAffiliateLink(request.user.userId, payload);
  }

  @Get('affiliate-links/:id/metrics')
  getAffiliateLinkMetrics(
    @Req() request: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.usersService.getAffiliateLinkMetrics(request.user.userId, id);
  }
}
