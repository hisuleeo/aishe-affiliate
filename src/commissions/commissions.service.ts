import { Injectable, Logger } from '@nestjs/common';
import { LedgerEntryType, Prisma, ReferralRewardStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Komisyon hesaplama servisi (Rule bazlı yapı)
@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);
  private readonly defaultCommissionRate = new Prisma.Decimal(0.1);

  constructor(private readonly prisma: PrismaService) {}

  // OrderPaidEvent sonrası komisyon hesaplaması için temel iskelet
  async calculateCommission(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { package: true },
    });

    if (!order) {
      this.logger.warn(`Order bulunamadı: ${orderId}`);
      return;
    }

    // 1. Affiliate komisyonu (eğer varsa)
    if (order.affiliateId) {
      await this.calculateAffiliateCommission(order);
    }

    // 2. Referral ödülü (eğer kullanıcı referral ile kayıt olduysa)
    await this.calculateReferralReward(order);
  }

  private async calculateAffiliateCommission(order: any) {
    const rule = await this.findApplicableRule(order.packageId);
    const commissionRate = rule?.commissionRate ?? this.defaultCommissionRate;
    const commissionAmount = order.amount.mul(commissionRate);

    await this.writeLedgerEntry({
      affiliateId: order.affiliateId,
      amount: commissionAmount,
      currency: order.currency,
      refId: order.id,
    });

    this.logger.log(
      `Komisyon ledger kaydı oluşturuldu: order=${order.id}, rate=${commissionRate.toString()}, amount=${commissionAmount.toString()}`,
    );
  }

  private async calculateReferralReward(order: any) {
    // Kullanıcının referral signup kaydını bul
    const signup = await this.prisma.referralSignup.findFirst({
      where: { newUserId: order.userId },
      include: {
        invite: {
          include: {
            code: true,
          },
        },
      },
    });

    if (!signup) {
      this.logger.log(`Referral signup yok: user=${order.userId}`);
      return;
    }

    // Referral user ID
    const referralUserId = signup.invite.code.userId;

    // Ödül oranı: %5 (varsayılan)
    const rewardRate = new Prisma.Decimal(0.05);
    const rewardAmount = order.amount.mul(rewardRate);

    // Her sipariş için yeni reward oluştur (signup birden fazla sipariş verebilir)
    await this.prisma.referralReward.create({
      data: {
        referralUserId,
        signupId: signup.id,
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
