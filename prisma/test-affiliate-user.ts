import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Test affiliate user
  const affiliateUser = await prisma.user.findUnique({
    where: { email: 'affiliate@test.com' },
    include: {
      affiliateProfile: true
    }
  });
  
  if (!affiliateUser) {
    console.log('❌ Affiliate user bulunamadı');
    return;
  }
  
  console.log('👤 Affiliate User:');
  console.log(`   ID: ${affiliateUser.id}`);
  console.log(`   Email: ${affiliateUser.email}`);
  console.log(`   Profile: ${affiliateUser.affiliateProfile ? 'Var ✅' : 'Yok ❌'}`);
  
  // Check commissions
  const commissions = await prisma.commission.findMany({
    where: { affiliateId: affiliateUser.id },
    include: {
      conversion: {
        include: {
          order: {
            include: {
              package: true
            }
          }
        }
      }
    }
  });
  
  console.log(`\nKomisyonlar: ${commissions.length}`);
  commissions.forEach(c => {
    console.log(`  - ${c.currency} ${c.amount} (${c.status})`);
  });
  
  // Check clicks
  const clicks = await prisma.click.count({
    where: {
      affiliateLink: {
        affiliateId: affiliateUser.id
      }
    }
  });
  
  console.log(`\nTıklamalar: ${clicks}`);
  
  // Calculate stats
  const totalEarnings = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  console.log(`\nToplam Kazanç: ${commissions[0]?.currency || 'USD'} ${totalEarnings.toFixed(2)}`);
}

main().finally(() => prisma.$disconnect());
