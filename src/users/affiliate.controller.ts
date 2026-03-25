import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UsersService } from './users.service';

@Controller('api/v1/affiliate')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffiliateController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  getAffiliateStats(@Req() request: { user: { userId: string } }) {
    return this.usersService.getAffiliateStats(request.user.userId);
  }

  @Get('commissions')
  getAffiliateCommissions(@Req() request: { user: { userId: string } }) {
    return this.usersService.getAffiliateCommissions(request.user.userId);
  }
}

@Controller('api/v1/referral')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferralController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  getReferralStats(@Req() request: { user: { userId: string } }) {
    return this.usersService.getReferralStats(request.user.userId);
  }

  @Get('rewards')
  getReferralRewards(@Req() request: { user: { userId: string } }) {
    return this.usersService.getReferralRewards(request.user.userId);
  }
}
