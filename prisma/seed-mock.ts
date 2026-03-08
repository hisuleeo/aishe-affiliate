import { PrismaClient, UserRoleType, UserStatus, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock data seed: Ayşe ve onun affiliate link / referral code ile gelen kullanıcılar
async function main() {
  const prisma = new PrismaClient();
  const demoPasswordHash = await bcrypt.hash('Demo123!', 12);

  const activeProgram = await prisma.program.findFirst({ where: { status: 'active' } });
  if (!activeProgram) {
    console.log('⚠️ Active program bulunamadı. Önce normal seed çalıştırın: npm run prisma:seed');
    await prisma.$disconnect();
    return;
  }

  // Ana affiliate kullanıcısı - Ayşe (hem affiliate link hem referral code sahibi)
  const ayseEmail = 'ayse.yilmaz@aishe.local';
  let ayseUser = await prisma.user.findUnique({ where: { email: ayseEmail } });
  
  if (!ayseUser) {
    ayseUser = await prisma.user.create({
      data: {
        email: ayseEmail,
        username: 'ayse2026',
        name: 'Ayşe Yılmaz',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.AFFILIATE }] },
      },
    });
    console.log('✅ Ayşe kullanıcısı oluşturuldu');

    // Ayşe'nin affiliate profile'ı
    await prisma.affiliateProfile.create({
      data: {
        userId: ayseUser.id,
        status: 'approved',
        approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 gün önce
        payoutMethod: 'wise',
        payoutDetails: {
          email: ayseEmail,
          country: 'TR',
        },
      },
    });
    console.log('✅ Ayşe affiliate profile oluşturuldu');

    // Ayşe'nin affiliate linki
    const ayseAffLink = await prisma.affiliateLink.create({
      data: {
        affiliateId: ayseUser.id,
        programId: activeProgram.id,
        code: 'AYSE-SPRING-2026',
        targetUrl: 'https://aishe.app/ayse',
      },
    });
    console.log('✅ Ayşe affiliate linki oluşturuldu: AYSE-SPRING-2026');

    // Ayşe'nin referral kodu
    const ayseReferralCode = await prisma.referralCode.create({
      data: {
        userId: ayseUser.id,
        code: 'ayse2026',
      },
    });
    console.log('✅ Ayşe referral kodu oluşturuldu: ayse2026');

    // Ayşe'nin referral kodu için invite oluştur (ReferralSignup için gerekli)
    const ayseInvite = await prisma.referralInvite.create({
      data: {
        codeId: ayseReferralCode.id,
        target: 'email',
        channel: 'direct',
      },
    });
    console.log('✅ Ayşe referral invite oluşturuldu');

    // Ayşe'nin affiliate linki ile gelen clickler
    await prisma.click.createMany({
      data: [
        {
          affiliateLinkId: ayseAffLink.id,
          cookieId: 'click-ayse-mehmet',
          utmSource: 'twitter',
          utmMedium: 'social',
          utmCampaign: 'spring-sale',
          clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
        {
          affiliateLinkId: ayseAffLink.id,
          cookieId: 'click-ayse-zeynep',
          utmSource: 'facebook',
          utmMedium: 'social',
          utmCampaign: 'spring-sale',
          clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
        },
        {
          affiliateLinkId: ayseAffLink.id,
          cookieId: 'click-ayse-3',
          utmSource: 'instagram',
          utmMedium: 'social',
          clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      ],
    });
    console.log('✅ 3 adet click kaydı oluşturuldu');

    // Affiliate link ile kayıt olan kullanıcılar (click üzerinden signup)
    // NOT: Schema'da AffiliateSignup yok, doğrudan Click tablosu kullanılıyor
    
    // 1. Mehmet Can (affiliate link ile geldi)
    const mehmetUser = await prisma.user.create({
      data: {
        email: 'mehmet.can@aishe.local',
        username: 'mehmetcan',
        name: 'Mehmet Can',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.USER }] },
      },
    });
    await prisma.referralCode.create({
      data: { userId: mehmetUser.id, code: 'mehmetcan' },
    });
    console.log('✅ Mehmet Can kullanıcısı oluşturuldu (Ayşe affiliate link ile)');

    // 2. Zeynep Kara (affiliate link ile geldi)
    const zeynepUser = await prisma.user.create({
      data: {
        email: 'zeynep.kara@aishe.local',
        username: 'zeynepk',
        name: 'Zeynep Kara',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.USER }] },
      },
    });
    await prisma.referralCode.create({
      data: { userId: zeynepUser.id, code: 'zeynepk' },
    });
    console.log('✅ Zeynep Kara kullanıcısı oluşturuldu (Ayşe affiliate link ile)');

    // Referral code ile kayıt olan kullanıcılar
    
    // 3. Ali Özkan (referral code: ayse2026)
    const aliUser = await prisma.user.create({
      data: {
        email: 'ali.ozkan@aishe.local',
        username: 'aliozkan',
        name: 'Ali Özkan',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.USER }] },
      },
    });
    await prisma.referralCode.create({
      data: { userId: aliUser.id, code: 'aliozkan' },
    });
    // ReferralSignup kaydı
    await prisma.referralSignup.create({
      data: {
        inviteId: ayseInvite.id,
        newUserId: aliUser.id,
      },
    });
    console.log('✅ Ali Özkan kullanıcısı oluşturuldu (Ayşe referral code ile)');

    // 4. Fatma Yıldız (referral code: ayse2026)
    const fatmaUser = await prisma.user.create({
      data: {
        email: 'fatma.yildiz@aishe.local',
        username: 'fatmay',
        name: 'Fatma Yıldız',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.USER }] },
      },
    });
    await prisma.referralCode.create({
      data: { userId: fatmaUser.id, code: 'fatmay' },
    });
    await prisma.referralSignup.create({
      data: {
        inviteId: ayseInvite.id,
        newUserId: fatmaUser.id,
      },
    });
    console.log('✅ Fatma Yıldız kullanıcısı oluşturuldu (Ayşe referral code ile)');

    // 5. Cem Aksoy (referral code: ayse2026)
    const cemUser = await prisma.user.create({
      data: {
        email: 'cem.aksoy@aishe.local',
        username: 'cemaksoy',
        name: 'Cem Aksoy',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.USER }] },
      },
    });
    await prisma.referralCode.create({
      data: { userId: cemUser.id, code: 'cemaksoy' },
    });
    await prisma.referralSignup.create({
      data: {
        inviteId: ayseInvite.id,
        newUserId: cemUser.id,
      },
    });
    console.log('✅ Cem Aksoy kullanıcısı oluşturuldu (Ayşe referral code ile)');

    // Örnek siparişler oluştur
    const customPackage = await prisma.package.findFirst({ where: { isCustom: true } });
    
    if (customPackage) {
      // Mehmet Can'ın siparişi (affiliate link ile geldi)
      await prisma.order.create({
        data: {
          buyerId: mehmetUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-001',
          status: OrderStatus.PAID,
          amount: 150.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'recording', 'wave'],
          attributionType: 'AFFILIATE',
          affiliateId: ayseUser.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        },
      });
      console.log('✅ Mehmet Can siparişi oluşturuldu: €150');

      // Zeynep'in siparişi (affiliate link ile geldi)
      await prisma.order.create({
        data: {
          buyerId: zeynepUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-002',
          status: OrderStatus.PAID,
          amount: 200.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'npse', 'recording', 'reca', 'statea'],
          attributionType: 'AFFILIATE',
          affiliateId: ayseUser.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        },
      });
      console.log('✅ Zeynep Kara siparişi oluşturuldu: €200');

      // Ali'nin siparişi (referral code ile geldi)
      await prisma.order.create({
        data: {
          buyerId: aliUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-003',
          status: OrderStatus.PAID,
          amount: 120.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'recording', 'wave'],
          attributionType: 'REFERRAL',
          referralCode: 'ayse2026',
          referralUserId: ayseUser.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        },
      });
      console.log('✅ Ali Özkan siparişi oluşturuldu: €120');

      // Fatma'nın siparişi (referral code ile geldi)
      await prisma.order.create({
        data: {
          buyerId: fatmaUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-004',
          status: OrderStatus.PAID,
          amount: 180.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'recording', 'reca', 'wave'],
          attributionType: 'REFERRAL',
          referralCode: 'ayse2026',
          referralUserId: ayseUser.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        },
      });
      console.log('✅ Fatma Yıldız siparişi oluşturuldu: €180');

      // Cem'in siparişi (referral code ile geldi - PENDING)
      await prisma.order.create({
        data: {
          buyerId: cemUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-005',
          status: OrderStatus.PENDING,
          amount: 95.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'recording'],
          attributionType: 'REFERRAL',
          referralCode: 'ayse2026',
          referralUserId: ayseUser.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        },
      });
      console.log('✅ Cem Aksoy siparişi oluşturuldu: €95 (PENDING)');
    }

    console.log('\n🎉 Mock data başarıyla oluşturuldu!');
    console.log('\n📊 Özet:');
    console.log('- Ana kullanıcı: Ayşe Yılmaz (ayse2026)');
    console.log('  - Affiliate link: AYSE-SPRING-2026');
    console.log('  - Referral code: ayse2026');
    console.log('- Affiliate link ile kayıt: Mehmet Can, Zeynep Kara (2 kişi)');
    console.log('- Referral code ile kayıt: Ali, Fatma, Cem (3 kişi)');
    console.log('- Toplam sipariş: 5 adet (€745)');
    console.log('\n🔐 Tüm kullanıcılar için şifre: Demo123!');
  } else {
    console.log('ℹ️  Ayşe kullanıcısı zaten mevcut');
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
