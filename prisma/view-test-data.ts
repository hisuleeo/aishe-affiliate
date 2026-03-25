import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERİTABANINDAKİ TEST VERİLERİ\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Users
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['affiliate@test.com', 'referrer@test.com', 'customer1@test.com', 'customer2@test.com'],
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      status: true,
      createdAt: true,
    },
  });

  console.log('👥 KULLANICILAR:');
  console.log('─────────────────────────────────────────────────────────');
  users.forEach((user) => {
    console.log(`📧 ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Created: ${user.createdAt.toISOString()}\n`);
  });

  // Affiliate Profile & Link
  const affiliateUser = users.find((u) => u.email === 'affiliate@test.com');
  if (affiliateUser) {
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: affiliateUser.id },
    });

    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: { affiliateId: affiliateUser.id },
      include: {
        program: true,
        campaign: true,
      },
    });

    console.log('💼 AFFILIATE PROFILE:');
    console.log('─────────────────────────────────────────────────────────');
    if (affiliateProfile) {
      console.log(`User: ${affiliateUser.email}`);
      console.log(`Status: ${affiliateProfile.status}`);
      console.log(`Payout Method: ${affiliateProfile.payoutMethod}`);
      console.log(`Approved: ${affiliateProfile.approvedAt?.toISOString()}\n`);
    }

    console.log('🔗 AFFILIATE LINKS:');
    console.log('─────────────────────────────────────────────────────────');
    affiliateLinks.forEach((link) => {
      console.log(`Code: ${link.code}`);
      console.log(`URL: https://app.aishe.pro/?ref=${link.code}`);
      console.log(`Program: ${link.program.name}`);
      console.log(`Campaign: ${link.campaign?.name || 'N/A'}`);
      console.log(`Created: ${link.createdAt.toISOString()}\n`);
    });
  }

  // Referral Code
  const referrerUser = users.find((u) => u.email === 'referrer@test.com');
  if (referrerUser) {
    const referralCodes = await prisma.referralCode.findMany({
      where: { userId: referrerUser.id },
    });

    console.log('🎫 REFERRAL CODES:');
    console.log('─────────────────────────────────────────────────────────');
    referralCodes.forEach((code) => {
      console.log(`Code: ${code.code}`);
      console.log(`User: ${referrerUser.email}`);
      console.log(`URL: https://app.aishe.pro/?ref=${code.code}\n`);
    });

    // Referral Signups
    const referralInvites = await prisma.referralInvite.findMany({
      where: {
        code: {
          userId: referrerUser.id,
        },
      },
      include: {
        signups: {
          include: {
            newUser: {
              select: {
                email: true,
                username: true,
              },
            },
          },
        },
      },
    });

    console.log('📨 REFERRAL INVITES & SIGNUPS:');
    console.log('─────────────────────────────────────────────────────────');
    referralInvites.forEach((invite) => {
      console.log(`Target: ${invite.target}`);
      console.log(`Channel: ${invite.channel}`);
      console.log(`Sent: ${invite.sentAt.toISOString()}`);
      if (invite.signups.length > 0) {
        invite.signups.forEach((signup) => {
          console.log(`  ✅ Signup: ${signup.newUser.email} (@${signup.newUser.username})`);
          console.log(`     Signed up: ${signup.signedUpAt.toISOString()}`);
        });
      }
      console.log();
    });
  }

  // Orders
  const orders = await prisma.order.findMany({
    where: {
      buyerId: {
        in: users.map((u) => u.id),
      },
    },
    include: {
      buyer: {
        select: {
          email: true,
        },
      },
      package: {
        select: {
          name: true,
          price: true,
          currency: true,
        },
      },
    },
  });

  console.log('🛒 ORDERS:');
  console.log('─────────────────────────────────────────────────────────');
  orders.forEach((order) => {
    console.log(`Order ID: ${order.id.substring(0, 8)}...`);
    console.log(`Buyer: ${order.buyer.email}`);
    console.log(`Package: ${order.package.name}`);
    console.log(`Amount: $${order.amount} ${order.currency}`);
    console.log(`Status: ${order.status}`);
    console.log(`Attribution: ${order.attributionType}`);
    if (order.affiliateId) console.log(`Affiliate ID: ${order.affiliateId.substring(0, 8)}...`);
    if (order.referralUserId) console.log(`Referral User ID: ${order.referralUserId.substring(0, 8)}...`);
    console.log(`Created: ${order.createdAt.toISOString()}\n`);
  });

  // Conversions
  const conversions = await prisma.conversion.findMany({
    where: {
      orderId: {
        in: orders.map((o) => o.id),
      },
    },
    include: {
      affiliate: {
        select: {
          email: true,
        },
      },
      referral: {
        select: {
          email: true,
        },
      },
    },
  });

  console.log('💰 CONVERSIONS:');
  console.log('─────────────────────────────────────────────────────────');
  conversions.forEach((conv) => {
    console.log(`Conversion ID: ${conv.id.substring(0, 8)}...`);
    console.log(`Order ID: ${conv.orderId?.substring(0, 8) || 'N/A'}...`);
    console.log(`External Order ID: ${conv.externalOrderId}`);
    console.log(`Amount: $${conv.amount} ${conv.currency}`);
    console.log(`Winner Type: ${conv.winnerType}`);
    if (conv.affiliate) console.log(`Affiliate: ${conv.affiliate.email}`);
    if (conv.referral) console.log(`Referral: ${conv.referral.email}`);
    console.log(`Converted: ${conv.conversionAt.toISOString()}\n`);
  });

  // Commissions
  const commissions = await prisma.commission.findMany({
    where: {
      conversionId: {
        in: conversions.map((c) => c.id),
      },
    },
    include: {
      affiliate: {
        select: {
          email: true,
        },
      },
    },
  });

  console.log('💸 COMMISSIONS (AFFILIATE):');
  console.log('─────────────────────────────────────────────────────────');
  commissions.forEach((comm) => {
    console.log(`Commission ID: ${comm.id.substring(0, 8)}...`);
    console.log(`Affiliate: ${comm.affiliate.email}`);
    console.log(`Amount: $${comm.amount} ${comm.currency}`);
    console.log(`Type: ${comm.type}`);
    console.log(`Status: ${comm.status}\n`);
  });

  // Referral Rewards
  const referralRewards = await prisma.referralReward.findMany({
    where: {
      referralUserId: referrerUser?.id,
    },
    include: {
      referralUser: {
        select: {
          email: true,
        },
      },
      order: {
        select: {
          amount: true,
          currency: true,
        },
      },
    },
  });

  console.log('🎁 REFERRAL REWARDS:');
  console.log('─────────────────────────────────────────────────────────');
  referralRewards.forEach((reward) => {
    console.log(`Reward ID: ${reward.id.substring(0, 8)}...`);
    console.log(`Referrer: ${reward.referralUser.email}`);
    console.log(`Amount: $${reward.amount} ${reward.currency}`);
    console.log(`Order Amount: $${reward.order?.amount || 'N/A'} ${reward.order?.currency || ''}`);
    console.log(`Status: ${reward.status}\n`);
  });

  // Stats Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 ÖZET İSTATİSTİKLER:');
  console.log('═══════════════════════════════════════════════════════════');
  
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amount), 0);
  const totalCommissions = commissions.reduce((sum, comm) => sum + Number(comm.amount), 0);
  const totalRewards = referralRewards.reduce((sum, reward) => sum + Number(reward.amount), 0);
  
  console.log(`👥 Total Users: ${users.length}`);
  console.log(`🛒 Total Orders: ${orders.length}`);
  console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`💸 Total Affiliate Commissions: $${totalCommissions.toFixed(2)}`);
  console.log(`🎁 Total Referral Rewards: $${totalRewards.toFixed(2)}`);
  console.log(`💳 Total Payouts: $${(totalCommissions + totalRewards).toFixed(2)}`);
  console.log(`📈 Net Profit: $${(totalRevenue - totalCommissions - totalRewards).toFixed(2)}\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
