import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    // 1. Affiliate User (Affiliate link sahibi)
    const affiliateUser = await prisma.user.upsert({
      where: { email: 'affiliate@test.local' },
      update: {},
      create: {
        email: 'affiliate@test.local',
        passwordHash: hashedPassword,
        username: 'affiliate_test',
        name: 'Affiliate Tester',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Affiliate User:', {
      email: 'affiliate@test.local',
      password: 'Test123!',
      username: 'affiliate_test',
    });

    // 2. Affiliate link oluştur
    const affiliateLink = await prisma.affiliateLink.upsert({
      where: { code: 'testaffiliate' },
      update: {},
      create: {
        code: 'testaffiliate',
        isActive: true,
        user: {
          connect: { id: affiliateUser.id }
        }
      },
    });

    console.log('✅ Affiliate Link:', {
      code: 'testaffiliate',
      url: 'https://app.aishe.pro/?ref=testaffiliate',
    });

    // 3. Referrer User (Referral yapacak kullanıcı - sistemde kayıtlı)
    const referrerUser = await prisma.user.upsert({
      where: { email: 'referrer@test.local' },
      update: {},
      create: {
        email: 'referrer@test.local',
        passwordHash: hashedPassword,
        username: 'referrer_test',
        name: 'Referrer Tester',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Referrer User:', {
      email: 'referrer@test.local',
      password: 'Test123!',
      username: 'referrer_test',
    });

    // 4. Referral code oluştur
    const referralCode = await prisma.referralCode.upsert({
      where: { code: 'TESTREF2026' },
      update: {},
      create: {
        userId: referrerUser.id,
        code: 'TESTREF2026',
      },
    });

    console.log('✅ Referral Code:', {
      code: 'TESTREF2026',
      url: 'https://app.aishe.pro/?ref=TESTREF2026',
    });

    // 5. Test için normal kullanıcı (sipariş verecek)
    const normalUser = await prisma.user.upsert({
      where: { email: 'customer@test.local' },
      update: {},
      create: {
        email: 'customer@test.local',
        passwordHash: hashedPassword,
        username: 'customer_test',
        name: 'Customer Tester',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Normal Customer:', {
      email: 'customer@test.local',
      password: 'Test123!',
      username: 'customer_test',
    });

    console.log('\n📋 TEST SENARYOLARI:\n');
    
    console.log('🔵 SENARYO 1: Affiliate Link ile Kayıt');
    console.log('1. https://app.aishe.pro/?ref=testaffiliate linkine git');
    console.log('2. Yeni bir kullanıcı kaydı oluştur (örn: newuser1@test.local)');
    console.log('3. Sipariş oluştur');
    console.log('4. affiliate@test.local kullanıcısı commission almalı (10%)\n');

    console.log('🟢 SENARYO 2: Referral Code ile Kayıt');
    console.log('1. https://app.aishe.pro/?ref=TESTREF2026 linkine git');
    console.log('2. Yeni bir kullanıcı kaydı oluştur (örn: newuser2@test.local)');
    console.log('3. Sipariş oluştur');
    console.log('4. referrer@test.local kullanıcısı reward almalı (5%)\n');

    console.log('🟣 SENARYO 3: Mevcut Kullanıcı Sipariş');
    console.log('1. customer@test.local ile giriş yap');
    console.log('2. Sipariş oluştur');
    console.log('3. Hiç kimse commission/reward almamalı\n');

    console.log('📊 Kontrol Panelleri:');
    console.log('- Affiliate: https://app.aishe.pro/dashboard → Affiliate Stats');
    console.log('- Referrer: https://app.aishe.pro/profile → Referral Rewards');
    console.log('- Admin: https://app.aishe.pro/dashboard → Reports\n');

    console.log('🔑 Tüm Test Kullanıcıları için Şifre: Test123!\n');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
