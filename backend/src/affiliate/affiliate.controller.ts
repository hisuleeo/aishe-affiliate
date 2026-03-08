import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AffiliateService } from './affiliate.service';

@Controller('api/v1/affiliate')
@UseGuards(JwtAuthGuard)
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('stats')
  async getAffiliateStats(@Request() req: any) {
    return this.affiliateService.getAffiliateStats(req.user.id);
  }

  @Get('commissions')
  async getCommissions(@Request() req: any) {
    return this.affiliateService.getAffiliateCommissions(req.user.id);
  }
}

@Controller('api/v1/referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get('stats')
  async getReferralStats(@Request() req: any) {
    return this.affiliateService.getReferralStats(req.user.id);
  }

  @Get('rewards')
  async getRewards(@Request() req: any) {
    return this.affiliateService.getReferralRewards(req.user.id);
  }
}
