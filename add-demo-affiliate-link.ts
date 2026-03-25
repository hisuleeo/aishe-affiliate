import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Demo kullanıcısını bul
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@aishe.pro' }
  });

  if (!demoUser) {
    console.error('Demo user not found!');
    process.exit(1);
  }

  console.log('Demo user found:', demoUser.email);

  // Program var mı kontrol et veya oluştur
  let program = await prisma.program.findFirst({
    where: { name: 'AISHE Affiliate Program' }
  });

  if (!program) {
    program = await prisma.program.create({
      data: {
        name: 'AISHE Affiliate Program',
        status: 'active',
        attributionWindowDays: 30,
        cookieTtlDays: 30,
        defaultCurrency: 'USD'
      }
    });
    console.log('Program created:', program.name);
  } else {
    console.log('Program found:', program.name);
  }

  // Mevcut affiliate link var mı kontrol et
  const existingLink = await prisma.affiliateLink.findFirst({
    where: {
      affiliateId: demoUser.id,
      programId: program.id
    }
  });

  if (existingLink) {
    console.log('Affiliate link already exists:', existingLink.code);
    console.log('Full URL: https://home.aishe.pro?ref=' + existingLink.code);
    return;
  }

  // Yeni affiliate link oluştur
  const affiliateLink = await prisma.affiliateLink.create({
    data: {
      affiliateId: demoUser.id,
      programId: program.id,
      code: demoUser.username || 'demo',
      targetUrl: 'https://home.aishe.pro'
    }
  });

  console.log('✅ Affiliate link created successfully!');
  console.log('Code:', affiliateLink.code);
  console.log('Full URL: https://home.aishe.pro?ref=' + affiliateLink.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
