import { PrismaClient, UserRoleType, UserStatus, OrderStatus, OrderAttributionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@aishe.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const demoPasswordHash = await bcrypt.hash('Demo123!', 12);

  // ============ PACKAGES ============
  const packageSeeds = [
    {
      name: 'AISHE Custom Package',
      description: 'Özelleştirilebilir AISHE paketi',
      price: 0.30,
      commissionRate: 0.2,
      isCustom: true,
      customOptions: [
        { id: 'lot', label: 'Lot', price: '0' },
        { id: 'nps', label: 'NPS', price: '0' },
        { id: 'npse', label: 'NPSE', price: '0' },
        { id: 'recording', label: 'Recording', price: '0' },
        { id: 'reca', label: 'RecA', price: '0' },
        { id: 'statea', label: 'StateA', price: '0' },
        { id: 'aisp', label: 'AISP', price: '0' },
        { id: 'badl', label: 'BadL', price: '0' },
        { id: 'wevents', label: 'W-Events', price: '0' },
        { id: 'wave', label: 'Wave', price: '0' },
      ],
    },
  ];

  for (const pkg of packageSeeds) {
    const exists = await prisma.package.findFirst({ where: { name: pkg.name } });
    if (!exists) {
      await prisma.package.create({
        data: {
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          currency: 'EUR',
          commissionRate: pkg.commissionRate,
          isCustom: pkg.isCustom || false,
          customOptions: pkg.customOptions || null,
          isActive: true,
        },
      });
    }
  }

  // ============ PROGRAM ============
  let activeProgram = await prisma.program.findFirst({ where: { status: 'active' } });
  if (!activeProgram) {
    activeProgram = await prisma.program.create({
      data: {
        name: 'AISHE Affiliate Program',
        status: 'active',
        attributionWindowDays: 30,
        cookieTtlDays: 30,
        defaultCurrency: 'EUR',
      },
    });
  }

  // ============ ADMIN USER ============
  const existing = await prisma.user.findUnique({ where: { email: adminEmail }, include: { roles: true } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'aisheadmin',
        name: 'AISHE Admin',
        passwordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.ADMIN }] },
      },
    });
  }

  // ============ DEMO USER ============
  const demoEmail = 'demo@aishe.local';
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        username: 'aishedemo',
        name: 'AISHE Demo',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.USER }] },
      },
    });
  }

  const demoRefCodeExists = await prisma.referralCode.findFirst({ where: { userId: demoUser.id } });
  if (!demoRefCodeExists) {
    await prisma.referralCode.create({ data: { userId: demoUser.id, code: 'AISHE-2026' } });
  }

  const demoAffCount = await prisma.affiliateLink.count({ where: { affiliateId: demoUser.id } });
  if (demoAffCount === 0) {
    await prisma.affiliateLink.createMany({
      data: [
        { affiliateId: demoUser.id, programId: activeProgram.id, code: 'AISHE-DEMO-01', targetUrl: 'https://aishe.app/demo' },
        { affiliateId: demoUser.id, programId: activeProgram.id, code: 'AISHE-DEMO-02', targetUrl: 'https://aishe.app/kampanya' },
      ],
    });
  }

  const demoLinks = await prisma.affiliateLink.findMany({ where: { affiliateId: demoUser.id }, orderBy: { createdAt: 'asc' } });
  const primaryDemoLink = demoLinks[0];
  if (primaryDemoLink) {
    const clickCount = await prisma.click.count({ where: { affiliateLinkId: primaryDemoLink.id } });
    if (clickCount < 2) {
      await prisma.click.createMany({
        data: [
          { affiliateLinkId: primaryDemoLink.id, cookieId: 'demo-cookie-1', utmSource: 'instagram', utmMedium: 'social', utmCampaign: 'aishe-launch', clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 6) },
          { affiliateLinkId: primaryDemoLink.id, cookieId: 'demo-cookie-2', utmSource: 'linkedin', utmMedium: 'social', utmCampaign: 'aishe-partner', clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        ],
      });
    }
  }

  // ============ AYŞE - ANA AFFİLİATE ============
  const ayseEmail = 'ayse.yilmaz@aishe.local';
  let ayseUser = await prisma.user.findUnique({ where: { email: ayseEmail } });

  if (!ayseUser && activeProgram) {
    ayseUser = await prisma.user.create({
      data: {
        email: ayseEmail, username: 'ayse2026', name: 'Ayşe Yılmaz',
        passwordHash: demoPasswordHash, status: UserStatus.ACTIVE,
        roles: { create: [{ role: UserRoleType.AFFILIATE }] },
      },
    });

    await prisma.affiliateProfile.create({
      data: {
        userId: ayseUser.id, status: 'approved',
        approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        payoutMethod: 'wise', payoutDetails: { email: ayseEmail, country: 'TR' },
      },
    });

    const ayseAffLink = await prisma.affiliateLink.create({
      data: { affiliateId: ayseUser.id, programId: activeProgram.id, code: 'AYSE-SPRING-2026', targetUrl: 'https://aishe.app/ayse' },
    });

    await prisma.referralCode.create({ data: { userId: ayseUser.id, code: 'ayse2026' } });

    await prisma.click.createMany({
      data: [
        { affiliateLinkId: ayseAffLink.id, cookieId: 'click-ayse-1', utmSource: 'twitter', utmMedium: 'social', utmCampaign: 'spring-sale', clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
        { affiliateLinkId: ayseAffLink.id, cookieId: 'click-ayse-2', utmSource: 'facebook', utmMedium: 'social', utmCampaign: 'spring-sale', clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 36) },
        { affiliateLinkId: ayseAffLink.id, cookieId: 'click-ayse-3', utmSource: 'instagram', utmMedium: 'social', clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      ],
    });

    // Affiliate ile gelen kullanıcılar
    for (const s of [
      { email: 'mehmet.can@aishe.local', username: 'mehmetcan', name: 'Mehmet Can' },
      { email: 'zeynep.kara@aishe.local', username: 'zeynepk', name: 'Zeynep Kara' },
    ]) {
      const u = await prisma.user.create({
        data: { email: s.email, username: s.username, name: s.name, passwordHash: demoPasswordHash, status: UserStatus.ACTIVE, roles: { create: [{ role: UserRoleType.USER }] } },
      });
      await prisma.referralCode.create({ data: { userId: u.id, code: s.username.toLowerCase() } });
    }

    // Referral ile gelen kullanıcılar
    for (const s of [
      { email: 'ali.ozkan@aishe.local', username: 'aliozkan', name: 'Ali Özkan' },
      { email: 'fatma.yildiz@aishe.local', username: 'fatmay', name: 'Fatma Yıldız' },
      { email: 'cem.aksoy@aishe.local', username: 'cemaksoy', name: 'Cem Aksoy' },
    ]) {
      const u = await prisma.user.create({
        data: { email: s.email, username: s.username, name: s.name, passwordHash: demoPasswordHash, status: UserStatus.ACTIVE, roles: { create: [{ role: UserRoleType.USER }] } },
      });
      await prisma.referralCode.create({ data: { userId: u.id, code: s.username.toLowerCase() } });
    }

    // ============ SİPARİŞLER ============
    const customPackage = await prisma.package.findFirst({ where: { isCustom: true } });
    if (customPackage) {
      const mehmetUser = await prisma.user.findUnique({ where: { email: 'mehmet.can@aishe.local' } });
      const zeynepUser = await prisma.user.findUnique({ where: { email: 'zeynep.kara@aishe.local' } });
      const aliUser = await prisma.user.findUnique({ where: { email: 'ali.ozkan@aishe.local' } });
      const fatmaUser = await prisma.user.findUnique({ where: { email: 'fatma.yildiz@aishe.local' } });
      const cemUser = await prisma.user.findUnique({ where: { email: 'cem.aksoy@aishe.local' } });
      const ayseRefCode = await prisma.referralCode.findFirst({ where: { userId: ayseUser!.id } });

      if (mehmetUser) {
        await prisma.order.create({
          data: { buyerId: mehmetUser.id, packageId: customPackage.id, aisheId: 'AISHE-2026-001', status: OrderStatus.PAID, amount: 150.00, currency: 'EUR', attributionType: OrderAttributionType.AFFILIATE, affiliateId: ayseUser!.id, selectedOptions: ['lot', 'nps', 'recording', 'wave'], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) },
        });
      }
      if (zeynepUser) {
        await prisma.order.create({
          data: { buyerId: zeynepUser.id, packageId: customPackage.id, aisheId: 'AISHE-2026-002', status: OrderStatus.PENDING, amount: 200.00, currency: 'EUR', attributionType: OrderAttributionType.AFFILIATE, affiliateId: ayseUser!.id, selectedOptions: ['lot', 'nps', 'npse', 'recording', 'reca', 'statea'], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) },
        });
      }
      if (aliUser && ayseRefCode) {
        await prisma.order.create({
          data: { buyerId: aliUser.id, packageId: customPackage.id, aisheId: 'AISHE-2026-003', status: OrderStatus.PAID, amount: 120.00, currency: 'EUR', attributionType: OrderAttributionType.REFERRAL, referralCode: ayseRefCode.code, referralUserId: ayseUser!.id, selectedOptions: ['lot', 'recording', 'wave'], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8) },
        });
      }
      if (fatmaUser && ayseRefCode) {
        await prisma.order.create({
          data: { buyerId: fatmaUser.id, packageId: customPackage.id, aisheId: 'AISHE-2026-004', status: OrderStatus.PAID, amount: 180.00, currency: 'EUR', attributionType: OrderAttributionType.REFERRAL, referralCode: ayseRefCode.code, referralUserId: ayseUser!.id, selectedOptions: ['lot', 'nps', 'recording', 'reca', 'wave'], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
        });
      }
      if (cemUser && ayseRefCode) {
        await prisma.order.create({
          data: { buyerId: cemUser.id, packageId: customPackage.id, aisheId: 'AISHE-2026-005', status: OrderStatus.PENDING, amount: 95.00, currency: 'EUR', attributionType: OrderAttributionType.REFERRAL, referralCode: ayseRefCode.code, referralUserId: ayseUser!.id, selectedOptions: ['lot', 'nps', 'recording'], createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) },
        });
      }
    }
  }

  // ============ EK MOCK KULLANICILAR ============
  const mockUsers = [
    { email: 'leyla.oz@aishe.local', username: 'leylaoz', name: 'Leyla Öz', role: UserRoleType.USER, status: UserStatus.ACTIVE },
    { email: 'emre.kaya@aishe.local', username: 'emrek', name: 'Emre Kaya', role: UserRoleType.USER, status: UserStatus.ACTIVE },
    { email: 'burcu.demir@aishe.local', username: 'burcud', name: 'Burcu Demir', role: UserRoleType.USER, status: UserStatus.BLOCKED },
    { email: 'mert.yilmaz@aishe.local', username: 'merty', name: 'Mert Yılmaz', role: UserRoleType.AFFILIATE, status: UserStatus.ACTIVE },
    { email: 'selin.arslan@aishe.local', username: 'selina', name: 'Selin Arslan', role: UserRoleType.AFFILIATE, status: UserStatus.ACTIVE },
  ];

  for (const mock of mockUsers) {
    const exists = await prisma.user.findUnique({ where: { email: mock.email } });
    if (exists) continue;

    const created = await prisma.user.create({
      data: { email: mock.email, username: mock.username, name: mock.name, passwordHash: demoPasswordHash, status: mock.status, roles: { create: [{ role: mock.role }] } },
    });

    if (mock.role === UserRoleType.AFFILIATE && activeProgram) {
      await prisma.affiliateProfile.upsert({
        where: { userId: created.id },
        update: {},
        create: { userId: created.id, status: 'approved', approvedAt: new Date(), payoutMethod: 'wise', payoutDetails: { email: mock.email, country: 'TR' } },
      });
      await prisma.affiliateLink.create({
        data: { affiliateId: created.id, programId: activeProgram.id, code: `AISHE-${mock.username?.toUpperCase()}`, targetUrl: `https://aishe.app/ref/${mock.username}` },
      });
    }

    await prisma.referralCode.create({ data: { userId: created.id, code: `REF-${mock.username?.toUpperCase()}` } });
  }

  // ============ Production admin@aishe.pro -> ADMIN role ============
  const prodAdmin = await prisma.user.findUnique({ where: { email: 'admin@aishe.pro' } });
  if (prodAdmin) {
    const hasAdminRole = await prisma.userRole.findUnique({
      where: { userId_role: { userId: prodAdmin.id, role: UserRoleType.ADMIN } },
    });
    if (!hasAdminRole) {
      await prisma.userRole.create({ data: { userId: prodAdmin.id, role: UserRoleType.ADMIN } });
      console.log('✅ admin@aishe.pro -> ADMIN rolü eklendi');
    }
  }

  await prisma.$disconnect();
  console.log('✅ Seed tamamlandı!');
}

main().catch(async (error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
