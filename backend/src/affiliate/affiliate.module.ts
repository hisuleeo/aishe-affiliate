import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateController, ReferralController } from './affiliate.controller';
import { AffiliateService } from './affiliate.service';
import { AffiliateCommission } from './entities/affiliate-commission.entity';
import { ReferralReward } from '../referral/entities/referral-reward.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateCommission, ReferralReward, Order]),
  ],
  controllers: [AffiliateController, ReferralController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
