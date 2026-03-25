import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Demo affiliate link oluşturuluyor...');

  // Demo user
  const demoUser = await prisma.user.findUnique({
    where: { username: 'aishedemo' },
  });

  if (!demoUser) {
    console.log('❌ Demo user bulunamadı!');
    return;
  }

  // Active program
  let program = await prisma.program.findFirst({
    where: { status: 'active' },
  });

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

  // Affiliate link oluştur
  const existingLink = await prisma.affiliateLink.findUnique({
    where: { code: 'aishedemo' },
  });

  if (existingLink) {
    console.log('✅ Affiliate link zaten var: aishedemo');
  } else {
    await prisma.affiliateLink.create({
      data: {
        affiliateId: demoUser.id,
        programId: program.id,
        code: 'aishedemo',
        targetUrl: 'https://app.aishe.pro/?ref=aishedemo',
      },
    });
    console.log('✅ Affiliate link oluşturuldu: aishedemo');
  }

  console.log('\n📊 Demo kullanıcı bilgileri:');
  console.log(`  Email: demo@aishe.local`);
  console.log(`  Password: Demo123!`);
  console.log(`  Affiliate link: https://app.aishe.pro/?ref=aishedemo`);
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
