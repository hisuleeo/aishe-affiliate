import { PrismaClient, UserRoleType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Admin seed: varsayılan admin kullanıcısı oluşturur
async function main() {
  const prisma = new PrismaClient();
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@aishe.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

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

  const existingProgram = await prisma.program.findFirst({ where: { status: 'active' } });
  if (!existingProgram) {
    await prisma.program.create({
      data: {
        name: 'AISHE Affiliate Program',
        status: 'active',
        attributionWindowDays: 30,
        cookieTtlDays: 30,
        defaultCurrency: 'EUR',
      },
    });
  }

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { roles: true },
  });

  if (existing) {
    await prisma.$disconnect();
  } else {
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

  for (const pkg of packageSeeds) {
    const exists = await prisma.package.findFirst({ where: { name: pkg.name } });
    if (exists) {
      continue;
    }

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

  const demoEmail = 'demo@aishe.local';
  const demoExists = await prisma.user.findUnique({
    where: { email: demoEmail },
    include: { roles: true },
  });

  const demoPasswordHash = await bcrypt.hash('Demo123!', 12);
  if (!demoExists) {
    await prisma.user.create({
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

  const demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  const activeProgram = await prisma.program.findFirst({ where: { status: 'active' } });

  if (demoUser && activeProgram) {
    const referralExists = await prisma.referralCode.findFirst({ where: { userId: demoUser.id } });
    if (!referralExists) {
      await prisma.referralCode.create({
        data: {
          userId: demoUser.id,
          code: 'AISHE-2026',
        },
      });
    }

    const affiliateCount = await prisma.affiliateLink.count({
      where: { affiliateId: demoUser.id },
    });

    if (affiliateCount === 0) {
      await prisma.affiliateLink.createMany({
        data: [
          {
            affiliateId: demoUser.id,
            programId: activeProgram.id,
            code: 'AISHE-DEMO-01',
            targetUrl: 'https://aishe.app/demo',
          },
          {
            affiliateId: demoUser.id,
            programId: activeProgram.id,
            code: 'AISHE-DEMO-02',
            targetUrl: 'https://aishe.app/kampanya',
          },
        ],
      });
    }

    const demoLinks = await prisma.affiliateLink.findMany({
      where: { affiliateId: demoUser.id },
      orderBy: { createdAt: 'asc' },
    });

    const primaryDemoLink = demoLinks[0];
    if (primaryDemoLink) {
      const clickCount = await prisma.click.count({ where: { affiliateLinkId: primaryDemoLink.id } });
      if (clickCount < 2) {
        await prisma.click.createMany({
          data: [
            {
              affiliateLinkId: primaryDemoLink.id,
              cookieId: 'demo-cookie-1',
              utmSource: 'instagram',
              utmMedium: 'social',
              utmCampaign: 'aishe-launch',
              clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
            },
            {
              affiliateLinkId: primaryDemoLink.id,
              cookieId: 'demo-cookie-2',
              utmSource: 'linkedin',
              utmMedium: 'social',
              utmCampaign: 'aishe-partner',
              clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
            },
          ],
        });
      }
    }
  }

  // Ana affiliate kullanıcısı - Ayşe (hem affiliate link hem referral code sahibi)
  const ayseEmail = 'ayse.yilmaz@aishe.local';
  let ayseUser = await prisma.user.findUnique({ where: { email: ayseEmail } });
  
  if (!ayseUser && activeProgram) {
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

    // Ayşe'nin affiliate linki
    const ayseAffLink = await prisma.affiliateLink.create({
      data: {
        affiliateId: ayseUser.id,
        programId: activeProgram.id,
        code: 'AYSE-SPRING-2026',
        targetUrl: 'https://aishe.app/ayse',
      },
    });

    // Ayşe'nin referral kodu
    await prisma.referralCode.create({
      data: {
        userId: ayseUser.id,
        code: 'ayse2026',
      },
    });

    // Ayşe'nin affiliate linki ile gelen clickler
    await prisma.click.createMany({
      data: [
        {
          affiliateLinkId: ayseAffLink.id,
          cookieId: 'click-ayse-1',
          utmSource: 'twitter',
          utmMedium: 'social',
          utmCampaign: 'spring-sale',
          clickedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
        {
          affiliateLinkId: ayseAffLink.id,
          cookieId: 'click-ayse-2',
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

    // Ayşe'nin affiliate linki ile kayıt olan kullanıcılar
    const affiliateSignups = [
      {
        email: 'mehmet.can@aishe.local',
        username: 'mehmetcan',
        name: 'Mehmet Can',
        cookieId: 'click-ayse-1',
      },
      {
        email: 'zeynep.kara@aishe.local',
        username: 'zeynepk',
        name: 'Zeynep Kara',
        cookieId: 'click-ayse-2',
      },
    ];

    for (const signup of affiliateSignups) {
      const signupUser = await prisma.user.create({
        data: {
          email: signup.email,
          username: signup.username,
          name: signup.name,
          passwordHash: demoPasswordHash,
          status: UserStatus.ACTIVE,
          roles: { create: [{ role: UserRoleType.USER }] },
        },
      });

      // Affiliate signup kaydı
      await prisma.affiliateSignup.create({
        data: {
          userId: signupUser.id,
          affiliateLinkId: ayseAffLink.id,
          cookieId: signup.cookieId,
        },
      });

      // Bu kullanıcılar için referral code oluştur
      await prisma.referralCode.create({
        data: {
          userId: signupUser.id,
          code: signup.username.toLowerCase(),
        },
      });
    }

    // Ayşe'nin referral kodu ile kayıt olan kullanıcılar
    const referralSignups = [
      {
        email: 'ali.ozkan@aishe.local',
        username: 'aliozkan',
        name: 'Ali Özkan',
      },
      {
        email: 'fatma.yildiz@aishe.local',
        username: 'fatmay',
        name: 'Fatma Yıldız',
      },
      {
        email: 'cem.aksoy@aishe.local',
        username: 'cemaksoy',
        name: 'Cem Aksoy',
      },
    ];

    const ayseReferralCode = await prisma.referralCode.findFirst({
      where: { userId: ayseUser.id },
    });

    for (const refSignup of referralSignups) {
      const refUser = await prisma.user.create({
        data: {
          email: refSignup.email,
          username: refSignup.username,
          name: refSignup.name,
          passwordHash: demoPasswordHash,
          status: UserStatus.ACTIVE,
          roles: { create: [{ role: UserRoleType.USER }] },
        },
      });

      // Referral signup kaydı
      if (ayseReferralCode) {
        await prisma.referralSignup.create({
          data: {
            userId: refUser.id,
            referralCodeId: ayseReferralCode.id,
          },
        });
      }

      // Bu kullanıcılar için referral code oluştur
      await prisma.referralCode.create({
        data: {
          userId: refUser.id,
          code: refSignup.username.toLowerCase(),
        },
      });
    }
  }

  // Örnek siparişler oluştur
  const customPackage = await prisma.package.findFirst({ where: { isCustom: true } });
  
  if (customPackage && ayseUser) {
    const ayseAffLink = await prisma.affiliateLink.findFirst({
      where: { affiliateId: ayseUser.id },
    });
    const ayseReferralCode = await prisma.referralCode.findFirst({
      where: { userId: ayseUser.id },
    });

    // Mehmet Can'ın siparişi (affiliate link ile geldi)
    const mehmetUser = await prisma.user.findUnique({ where: { email: 'mehmet.can@aishe.local' } });
    if (mehmetUser && ayseAffLink) {
      await prisma.order.create({
        data: {
          userId: mehmetUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-001',
          status: 'completed',
          quantity: 1,
          totalPrice: 150.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'recording', 'wave'],
          affiliateLinkId: ayseAffLink.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        },
      });
    }

    // Zeynep'in siparişi (affiliate link ile geldi)
    const zeynepUser = await prisma.user.findUnique({ where: { email: 'zeynep.kara@aishe.local' } });
    if (zeynepUser && ayseAffLink) {
      await prisma.order.create({
        data: {
          userId: zeynepUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-002',
          status: 'processing',
          quantity: 1,
          totalPrice: 200.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'npse', 'recording', 'reca', 'statea'],
          affiliateLinkId: ayseAffLink.id,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        },
      });
    }

    // Ali'nin siparişi (referral code ile geldi)
    const aliUser = await prisma.user.findUnique({ where: { email: 'ali.ozkan@aishe.local' } });
    if (aliUser && ayseReferralCode) {
      await prisma.order.create({
        data: {
          userId: aliUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-003',
          status: 'completed',
          quantity: 1,
          totalPrice: 120.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'recording', 'wave'],
          referralCode: ayseReferralCode.code,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        },
      });
    }

    // Fatma'nın siparişi (referral code ile geldi)
    const fatmaUser = await prisma.user.findUnique({ where: { email: 'fatma.yildiz@aishe.local' } });
    if (fatmaUser && ayseReferralCode) {
      await prisma.order.create({
        data: {
          userId: fatmaUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-004',
          status: 'completed',
          quantity: 1,
          totalPrice: 180.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'recording', 'reca', 'wave'],
          referralCode: ayseReferralCode.code,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        },
      });
    }

    // Cem'in siparişi (referral code ile geldi)
    const cemUser = await prisma.user.findUnique({ where: { email: 'cem.aksoy@aishe.local' } });
    if (cemUser && ayseReferralCode) {
      await prisma.order.create({
        data: {
          userId: cemUser.id,
          packageId: customPackage.id,
          aisheId: 'AISHE-2026-005',
          status: 'pending',
          quantity: 1,
          totalPrice: 95.00,
          currency: 'EUR',
          selectedOptions: ['lot', 'nps', 'recording'],
          referralCode: ayseReferralCode.code,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        },
      });
    }
  }

  const mockUsers = [
    {
      email: 'leyla.oz@aishe.local',
      username: 'leylaoz',
      name: 'Leyla Öz',
      role: UserRoleType.USER,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'emre.kaya@aishe.local',
      username: 'emrek',
      name: 'Emre Kaya',
      role: UserRoleType.USER,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'burcu.demir@aishe.local',
      username: 'burcud',
      name: 'Burcu Demir',
      role: UserRoleType.USER,
      status: UserStatus.BLOCKED,
    },
    {
      email: 'mert.yilmaz@aishe.local',
      username: 'merty',
      name: 'Mert Yılmaz',
      role: UserRoleType.AFFILIATE,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'selin.arslan@aishe.local',
      username: 'selina',
      name: 'Selin Arslan',
      role: UserRoleType.AFFILIATE,
      status: UserStatus.ACTIVE,
    },
  ];

  for (const mock of mockUsers) {
    const exists = await prisma.user.findUnique({ where: { email: mock.email } });
    if (exists) continue;

    const created = await prisma.user.create({
      data: {
        email: mock.email,
        username: mock.username,
        name: mock.name,
        passwordHash: demoPasswordHash,
        status: mock.status,
        roles: { create: [{ role: mock.role }] },
      },
    });

    if (mock.role === UserRoleType.AFFILIATE && activeProgram) {
      await prisma.affiliateProfile.upsert({
        where: { userId: created.id },
        update: {},
        create: {
          userId: created.id,
          status: 'approved',
          approvedAt: new Date(),
          payoutMethod: 'wise',
          payoutDetails: {
            email: mock.email,
            country: 'TR',
          },
        },
      });

      const code = `AISHE-${mock.username?.toUpperCase()}`;
      await prisma.affiliateLink.create({
        data: {
          affiliateId: created.id,
          programId: activeProgram.id,
          code,
          targetUrl: `https://aishe.app/ref/${mock.username}`,
        },
      });
    }

    await prisma.referralCode.create({
      data: {
        userId: created.id,
        code: `REF-${mock.username?.toUpperCase()}`,
      },
    });
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
