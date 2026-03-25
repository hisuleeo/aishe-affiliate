import { PrismaClient, CommissionStatus, ReferralRewardStatus, WinnerType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Backfilling conversions for existing orders...');

  // 1. Program bul veya oluştur
  let program = await prisma.program.findFirst({ where: { status: 'active' } });
  if (!program) {
    program = await prisma.program.create({
      data: {
        name: 'AISHE Affiliate Program',
        status: 'active',
        attributionWindowDays: 30,
        cookieTtlDays: 30,
        defaultCurrency: 'EUR',
      },
    });
    console.log('✅ Program oluşturuldu');
  }

  // 2. PAID orderlar'ı conversion'suz olanları bul
  const orders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      conversion: null,
    },
    include: {
      package: true,
    },
  });

  console.log(`📦 ${orders.length} adet PAID order bulundu`);

  let conversionsCreated = 0;
  let commissionsCreated = 0;
  let rewardsCreated = 0;

  for (const order of orders) {
    try {
      // Winner logic: Affiliate varsa AFFILIATE, referralUserId varsa REFERRAL, yoksa skip
      if (!order.affiliateId && !order.referralUserId) {
        console.log(`⏭️  Order ${order.id} - No affiliate or referral, skipping`);
        continue;
      }

      const winnerType: WinnerType = order.affiliateId ? WinnerType.AFFILIATE : WinnerType.REFERRAL;
      const winnerId = order.affiliateId || order.referralUserId!;

      // Conversion oluştur
      const conversion = await prisma.conversion.create({
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
          conversionAt: order.createdAt, // Order tarihini kullan
        },
      });
      conversionsCreated++;

      // Affiliate commission oluştur
      if (order.affiliateId) {
        const commissionRate = order.package?.commissionRate ?? new Prisma.Decimal(0.1);
        const commissionAmount = new Prisma.Decimal(order.amount).mul(commissionRate);

        await prisma.commission.create({
          data: {
            conversionId: conversion.id,
            affiliateId: order.affiliateId,
            type: 'PERCENTAGE',
            amount: commissionAmount,
            currency: order.currency,
            status: CommissionStatus.PENDING,
          },
        });
        commissionsCreated++;

        // AffiliateLedger'a da yaz (varsa skip et)
        const existingLedger = await prisma.affiliateLedger.findFirst({
          where: {
            refType: 'order',
            refId: order.id,
            affiliateId: order.affiliateId,
          },
        });

        if (!existingLedger) {
          await prisma.affiliateLedger.create({
            data: {
              affiliateId: order.affiliateId,
              type: 'CREDIT',
              amount: commissionAmount,
              currency: order.currency,
              refType: 'order',
              refId: order.id,
            },
          });
        }
      }

      // Referral reward oluştur
      if (order.referralUserId) {
        const signup = await prisma.referralSignup.findFirst({
          where: { newUserId: order.buyerId },
        });

        if (signup) {
          // Aynı order için reward varsa skip et
          const existingReward = await prisma.referralReward.findFirst({
            where: {
              orderId: order.id,
              referralUserId: order.referralUserId,
            },
          });

          if (!existingReward) {
            const rewardRate = new Prisma.Decimal(0.05);
            const rewardAmount = new Prisma.Decimal(order.amount).mul(rewardRate);

            await prisma.referralReward.create({
              data: {
                referralUserId: order.referralUserId,
                signupId: signup.id,
                orderId: order.id,
                amount: rewardAmount,
                currency: order.currency,
                status: ReferralRewardStatus.PENDING,
                createdAt: order.createdAt,
              },
            });
            rewardsCreated++;
          }
        }
      }

      console.log(`✅ Order ${order.id} processed`);
    } catch (error) {
      console.error(`❌ Error processing order ${order.id}:`, error);
    }
  }

  console.log('\n📊 Backfill Summary:');
  console.log(`  - Conversions created: ${conversionsCreated}`);
  console.log(`  - Commissions created: ${commissionsCreated}`);
  console.log(`  - Rewards created: ${rewardsCreated}`);
  console.log('\n✅ Backfill completed!');
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
