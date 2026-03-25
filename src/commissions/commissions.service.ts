import { Injectable, Logger } from '@nestjs/common';
import { CommissionStatus, CommissionType, LedgerEntryType, Prisma, ReferralRewardStatus, WinnerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Komisyon hesaplama servisi (Rule bazlı yapı)
@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);
  private readonly defaultCommissionRate = new Prisma.Decimal(0.1);
  private readonly defaultReferralRewardRate = new Prisma.Decimal(0.05);

  constructor(private readonly prisma: PrismaService) {}

  // OrderPaidEvent sonrası komisyon hesaplaması için temel iskelet
  async calculateCommission(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { package: true, conversion: true },
    });

    if (!order) {
      this.logger.warn(`Order bulunamadı: ${orderId}`);
      return;
    }

    // Conversion zaten varsa tekrar oluşturma
    if (order.conversion) {
      this.logger.log(`Conversion zaten var: order=${orderId}`);
      return;
    }

    // 1. Program bul veya oluştur
    const program = await this.getOrCreateProgram();

    // 2. Winner logic: Affiliate veya Referral olmalı
    if (!order.affiliateId && !order.referralUserId) {
      this.logger.log(`Order ${orderId} - No affiliate or referral, skipping conversion`);
      return;
    }

    const winnerType: WinnerType = order.affiliateId ? WinnerType.AFFILIATE : WinnerType.REFERRAL;
    const winnerId = order.affiliateId || order.referralUserId!;

    // 3. Conversion oluştur
    const conversion = await this.prisma.conversion.create({
      data: {
        programId: program.id,
        orderId: order.id,
        externalOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        affiliateId: order.affiliateId,
        referralId: order.referralUserId,
        winnerType,
        winnerId,
      },
    });

    this.logger.log(`Conversion oluşturuldu: ${conversion.id} for order=${orderId}`);

    // 4. Affiliate komisyonu oluştur
    if (order.affiliateId) {
      await this.createAffiliateCommission(conversion, order);
    }

    // 5. Referral reward oluştur
    if (order.referralUserId) {
      await this.createReferralReward(conversion, order);
    }
  }

  private async getOrCreateProgram() {
    let program = await this.prisma.program.findFirst({ where: { status: 'active' } });
    if (!program) {
      program = await this.prisma.program.create({
        data: {
          name: 'AISHE Affiliate Program',
          status: 'active',
          attributionWindowDays: 30,
          cookieTtlDays: 30,
          defaultCurrency: 'EUR',
        },
      });
    }
    return program;
  }

  private async createAffiliateCommission(conversion: any, order: any) {
    // Commission rate: package'dan al veya default
    const commissionRate = order.package?.commissionRate ?? this.defaultCommissionRate;
    const commissionAmount = new Prisma.Decimal(order.amount).mul(commissionRate);

    // Commission oluştur
    await this.prisma.commission.create({
      data: {
        conversionId: conversion.id,
        affiliateId: order.affiliateId,
        type: CommissionType.PERCENTAGE,
        amount: commissionAmount,
        currency: order.currency,
        status: CommissionStatus.PENDING,
      },
    });

    // AffiliateLedger'a da yaz (backward compatibility)
    await this.writeLedgerEntry({
      affiliateId: order.affiliateId,
      amount: commissionAmount,
      currency: order.currency,
      refId: order.id,
    });

    this.logger.log(
      `Affiliate commission oluşturuldu: order=${order.id}, affiliate=${order.affiliateId}, rate=${commissionRate.toString()}, amount=${commissionAmount.toString()}`,
    );
  }

  private async createReferralReward(conversion: any, order: any) {
    // Kullanıcının referral signup kaydını bul
    const signup = await this.prisma.referralSignup.findFirst({
      where: { newUserId: order.buyerId },
      include: {
        invite: {
          include: {
            code: true,
          },
        },
      },
    });

    if (!signup) {
      this.logger.log(`Referral signup yok: buyer=${order.buyerId}`);
      return;
    }

    // Referral user ID
    const referralUserId = signup.invite.code.userId;

    // Ödül oranı: %5 (varsayılan)
    const rewardAmount = new Prisma.Decimal(order.amount).mul(this.defaultReferralRewardRate);

    // Reward oluştur (her sipariş için yeni reward)
    await this.prisma.referralReward.create({
      data: {
        referralUserId,
        signupId: signup.id,
        orderId: order.id,
        amount: rewardAmount,
        currency: order.currency,
        status: ReferralRewardStatus.PENDING,
      },
    });

    this.logger.log(
      `Referral reward oluşturuldu: signup=${signup.id}, referrer=${referralUserId}, amount=${rewardAmount.toString()}, order=${order.id}`,
    );
  }

  private async findApplicableRule(packageId: string) {
    // 1) Paket bazlı özel kural (varsa)
    const specificRule = await this.prisma.commissionRule.findFirst({
      where: {
        isActive: true,
        packageId,
      },
      orderBy: [{ priority: 'desc' }, { minSalesThreshold: 'desc' }],
    });

    if (specificRule) {
      return specificRule;
    }

    // 2) Genel kurallar (packageId null) içinde en yüksek eşik + öncelik
    return this.prisma.commissionRule.findFirst({
      where: {
        isActive: true,
        packageId: null,
      },
      orderBy: [{ minSalesThreshold: 'desc' }, { priority: 'desc' }],
    });
  }

  private writeLedgerEntry(input: {
    affiliateId: string;
    amount: Prisma.Decimal;
    currency: string;
    refId: string;
  }) {
    // Idempotency: aynı order için ledger kaydı varsa tekrar yazma
    return this.prisma.affiliateLedger.findFirst({
      where: {
        refType: 'order',
        refId: input.refId,
        affiliateId: input.affiliateId,
      },
    }).then((existing) => {
      if (existing) {
        this.logger.warn(
          `Ledger kaydı zaten var: order=${input.refId}, affiliate=${input.affiliateId}`,
        );
        return existing;
      }

      return this.prisma.affiliateLedger.create({
      data: {
        affiliateId: input.affiliateId,
        type: LedgerEntryType.CREDIT,
        amount: input.amount,
        currency: input.currency,
        refType: 'order',
        refId: input.refId,
      },
      });
    });
  }
}
