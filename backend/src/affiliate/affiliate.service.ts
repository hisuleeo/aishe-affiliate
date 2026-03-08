import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateCommission } from './entities/affiliate-commission.entity';
import { ReferralReward } from '../referral/entities/referral-reward.entity';
import { Order } from '../order/entities/order.entity';
import type { AffiliateStats, ReferralStats, AffiliateCommission as AffiliateCommissionType, ReferralReward as ReferralRewardType } from '@shared/types';

@Injectable()
export class AffiliateService {
  constructor(
    @InjectRepository(AffiliateCommission)
    private affiliateCommissionRepository: Repository<AffiliateCommission>,
    @InjectRepository(ReferralReward)
    private referralRewardRepository: Repository<ReferralReward>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async getAffiliateStats(userId: string): Promise<AffiliateStats> {
    // Get all commissions for this affiliate
    const commissions = await this.affiliateCommissionRepository.find({
      where: { affiliateId: userId },
      relations: ['order'],
    });

    const totalClicks = await this.orderRepository.count({
      where: { affiliateId: userId },
    });

    const totalConversions = commissions.length;

    const totalEarnings = commissions.reduce(
      (sum, c) => sum + parseFloat(c.amount),
      0
    ).toFixed(2);

    const pendingEarnings = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0)
      .toFixed(2);

    const paidEarnings = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0)
      .toFixed(2);

    const conversionRate = totalClicks > 0 
      ? (totalConversions / totalClicks) * 100 
      : 0;

    return {
      totalClicks,
      totalConversions,
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  }

  async getReferralStats(userId: string): Promise<ReferralStats> {
    const rewards = await this.referralRewardRepository.find({
      where: { referrerId: userId },
      relations: ['order'],
    });

    const totalReferrals = rewards.length;

    const successfulReferrals = rewards.filter(
      r => r.status === 'paid'
    ).length;

    const totalEarnings = rewards.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    ).toFixed(2);

    const pendingEarnings = rewards
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0)
      .toFixed(2);

    const paidEarnings = rewards
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0)
      .toFixed(2);

    return {
      totalReferrals,
      successfulReferrals,
      totalEarnings,
      pendingEarnings,
      paidEarnings,
    };
  }

  async getAffiliateCommissions(userId: string): Promise<AffiliateCommissionType[]> {
    const commissions = await this.affiliateCommissionRepository.find({
      where: { affiliateId: userId },
      relations: ['order', 'order.package'],
      order: { createdAt: 'DESC' },
    });

    return commissions.map(c => ({
      id: c.id,
      orderId: c.orderId,
      affiliateId: c.affiliateId,
      amount: c.amount,
      currency: c.currency,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      paidAt: c.paidAt?.toISOString() || null,
      order: c.order ? {
        id: c.order.id,
        buyerId: c.order.buyerId,
        packageId: c.order.packageId,
        status: c.order.status,
        amount: c.order.amount,
        currency: c.order.currency,
        attributionType: c.order.attributionType,
        affiliateId: c.order.affiliateId || null,
        referralCode: c.order.referralCode || null,
        referralUserId: c.order.referralUserId || null,
        aisheId: c.order.aisheId || null,
        selectedOptions: c.order.selectedOptions as string[] | null,
        validUntil: c.order.validUntil?.toISOString() || null,
        createdAt: c.order.createdAt.toISOString(),
        package: c.order.package,
      } : undefined,
    }));
  }

  async getReferralRewards(userId: string): Promise<ReferralRewardType[]> {
    const rewards = await this.referralRewardRepository.find({
      where: { referrerId: userId },
      relations: ['order', 'order.package', 'referredUser'],
      order: { createdAt: 'DESC' },
    });

    return rewards.map(r => ({
      id: r.id,
      orderId: r.orderId,
      referrerId: r.referrerId,
      referredUserId: r.referredUserId,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      paidAt: r.paidAt?.toISOString() || null,
      order: r.order ? {
        id: r.order.id,
        buyerId: r.order.buyerId,
        packageId: r.order.packageId,
        status: r.order.status,
        amount: r.order.amount,
        currency: r.order.currency,
        attributionType: r.order.attributionType,
        affiliateId: r.order.affiliateId || null,
        referralCode: r.order.referralCode || null,
        referralUserId: r.order.referralUserId || null,
        aisheId: r.order.aisheId || null,
        selectedOptions: r.order.selectedOptions as string[] | null,
        validUntil: r.order.validUntil?.toISOString() || null,
        createdAt: r.order.createdAt.toISOString(),
        package: r.order.package,
      } : undefined,
    }));
  }
}
