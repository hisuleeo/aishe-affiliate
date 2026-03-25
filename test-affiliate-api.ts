import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Affiliate Kullanıcı Test Ediliyor...\n');

  // Find affiliate user
  const affiliateUser = await prisma.user.findUnique({
    where: { email: 'affiliate@test.com' },
    include: {
      affiliateProfile: true,
      affiliateLinks: true,
    },
  });

  if (!affiliateUser) {
    console.log('❌ Affiliate kullanıcı bulunamadı!');
    return;
  }

  console.log('👤 Affiliate User:');
  console.log(`   ID: ${affiliateUser.id}`);
  console.log(`   Email: ${affiliateUser.email}`);
  console.log(`   Profile: ${affiliateUser.affiliateProfile ? 'Var ✅' : 'Yok ❌'}`);
  console.log(`   Links: ${affiliateUser.affiliateLinks.length}\n`);

  // Check commissions
  const commissions = await prisma.commission.findMany({
    where: { affiliateId: affiliateUser.id },
    include: {
      conversion: {
        include: {
          order: true,
        },
      },
    },
  });

  console.log(`💰 Komisyonlar: ${commissions.length}`);
  let totalEarnings = 0;
  let pendingEarnings = 0;
  let paidEarnings = 0;

  commissions.forEach((c) => {
    console.log(`   - ${c.currency} ${c.amount} [${c.status}]`);
    totalEarnings += Number(c.amount);
    if (c.status === 'APPROVED') pendingEarnings += Number(c.amount);
    if (c.status === 'PAID') paidEarnings += Number(c.amount);
  });

  console.log(`\n   Total: $${totalEarnings.toFixed(2)}`);
  console.log(`   Pending: $${pendingEarnings.toFixed(2)}`);
  console.log(`   Paid: $${paidEarnings.toFixed(2)}\n`);

  // Check conversions
  const conversions = await prisma.conversion.findMany({
    where: { affiliateId: affiliateUser.id },
  });

  console.log(`🔄 Conversions: ${conversions.length}\n`);

  // Check clicks
  const clicks = await prisma.click.count({
    where: {
      affiliateLink: {
        affiliateId: affiliateUser.id,
      },
    },
  });

  console.log(`👆 Clicks: ${clicks}\n`);

  // Simulate API response
  const affiliateStats = {
    totalClicks: clicks,
    totalConversions: conversions.length,
    totalEarnings: totalEarnings.toFixed(2),
    pendingEarnings: pendingEarnings.toFixed(2),
    paidEarnings: paidEarnings.toFixed(2),
    conversionRate: clicks > 0 ? ((conversions.length / clicks) * 100).toFixed(2) : '0.00',
  };

  console.log('📊 API Response (AffiliateStats):');
  console.log(JSON.stringify(affiliateStats, null, 2));

  // Test backend endpoint simulation
  console.log('\n🌐 Backend Endpoint Test:');
  console.log('GET /users/me/affiliate-stats');
  console.log('Response:', affiliateStats);
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
