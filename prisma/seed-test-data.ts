import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Test verilerini oluşturuyorum...\n');

  // Hash password
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  // 1. Program oluştur
  const program = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'AISHE Main Program',
      status: 'active',
      attributionWindowDays: 30,
      cookieTtlDays: 30,
      defaultCurrency: 'USD',
    },
  });
  console.log('✅ Program oluşturuldu:', program.name);

  // 2. Campaign oluştur
  const campaign = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      programId: program.id,
      name: 'Spring 2026 Campaign',
      status: 'active',
    },
  });
  console.log('✅ Campaign oluşturuldu:', campaign.name);

  // 3. Affiliate User
  const affiliateUser = await prisma.user.upsert({
    where: { email: 'affiliate@test.com' },
    update: {},
    create: {
      email: 'affiliate@test.com',
      passwordHash: hashedPassword,
      username: 'testaffiliate',
      name: 'Test Affiliate User',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Affiliate User:', {
    email: affiliateUser.email,
    username: affiliateUser.username,
  });

  // 4. Affiliate Profile
  await prisma.affiliateProfile.upsert({
    where: { userId: affiliateUser.id },
    update: {},
    create: {
      userId: affiliateUser.id,
      status: 'approved',
      approvedAt: new Date(),
      payoutMethod: 'bank_transfer',
    },
  });
  console.log('✅ Affiliate Profile oluşturuldu');

  // 5. Affiliate Link
  const affiliateLink = await prisma.affiliateLink.upsert({
    where: { code: 'SPRING2026' },
    update: {},
    create: {
      affiliateId: affiliateUser.id,
      programId: program.id,
      campaignId: campaign.id,
      code: 'SPRING2026',
      targetUrl: 'https://app.aishe.pro',
    },
  });
  console.log('✅ Affiliate Link:', {
    code: affiliateLink.code,
    url: `https://app.aishe.pro/?ref=${affiliateLink.code}`,
  });

  // 6. Referrer User (Referral yapan kullanıcı)
  const referrerUser = await prisma.user.upsert({
    where: { email: 'referrer@test.com' },
    update: {},
    create: {
      email: 'referrer@test.com',
      passwordHash: hashedPassword,
      username: 'testreferrer',
      name: 'Test Referrer User',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Referrer User:', {
    email: referrerUser.email,
    username: referrerUser.username,
  });

  // 7. Referral Code
  const referralCode = await prisma.referralCode.upsert({
    where: { code: 'TESTREF123' },
    update: {},
    create: {
      userId: referrerUser.id,
      code: 'TESTREF123',
    },
  });
  console.log('✅ Referral Code:', {
    code: referralCode.code,
    url: `https://app.aishe.pro/?ref=${referralCode.code}`,
  });

  // 8. Customer Users (Affiliate link ile kaydolan)
  const customer1 = await prisma.user.upsert({
    where: { email: 'customer1@test.com' },
    update: {},
    create: {
      email: 'customer1@test.com',
      passwordHash: hashedPassword,
      username: 'customer1',
      name: 'Customer One (via Affiliate)',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Customer 1 (Affiliate):', customer1.email);

  // 9. Customer 2 (Referral code ile kaydolan)
  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@test.com' },
    update: {},
    create: {
      email: 'customer2@test.com',
      passwordHash: hashedPassword,
      username: 'customer2',
      name: 'Customer Two (via Referral)',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Customer 2 (Referral):', customer2.email);

  // 10. Package oluştur (sipariş için gerekli)
  const package1 = await prisma.package.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Basic Package',
      description: 'Basic AI features - 30 days access',
      price: 99.00,
      currency: 'USD',
      commissionRate: 10.0,
      isActive: true,
      isCustom: false,
    },
  });
  console.log('✅ Package oluşturuldu:', package1.name, '-', package1.price, package1.currency);

  // 11. Order 1 (Affiliate üzerinden)
  const order1 = await prisma.order.create({
    data: {
      buyerId: customer1.id,
      affiliateId: affiliateUser.id,
      packageId: package1.id,
      amount: package1.price,
      currency: package1.currency,
      status: 'PAID',
      attributionType: 'AFFILIATE',
    },
  });
  console.log('✅ Order 1 (Affiliate):', {
    orderId: order1.id.substring(0, 8),
    amount: order1.amount,
    status: order1.status,
  });

  // 12. Conversion 1 (Affiliate)
  const conversion1 = await prisma.conversion.create({
    data: {
      orderId: order1.id,
      externalOrderId: `EXT-${order1.id}`,
      programId: program.id,
      affiliateId: affiliateUser.id,
      winnerId: affiliateUser.id,
      winnerType: 'AFFILIATE',
      amount: order1.amount,
      currency: order1.currency,
    },
  });
  console.log('✅ Conversion 1 (Affiliate):', {
    conversionId: conversion1.id.substring(0, 8),
    amount: conversion1.amount,
  });

  // 13. Commission (Affiliate)
  const commission1 = await prisma.commission.create({
    data: {
      conversionId: conversion1.id,
      affiliateId: affiliateUser.id,
      amount: Number(order1.amount) * 0.1, // 10% commission
      currency: order1.currency,
      status: 'APPROVED',
      type: 'PERCENTAGE',
    },
  });
  console.log('✅ Commission (Affiliate):', {
    commissionId: commission1.id.substring(0, 8),
    amount: commission1.amount,
    rate: '10%',
  });

  // 14. Order 2 (Referral üzerinden)
  const order2 = await prisma.order.create({
    data: {
      buyerId: customer2.id,
      referralUserId: referrerUser.id,
      packageId: package1.id,
      amount: package1.price,
      currency: package1.currency,
      status: 'PAID',
      attributionType: 'REFERRAL',
    },
  });
  console.log('✅ Order 2 (Referral):', {
    orderId: order2.id.substring(0, 8),
    amount: order2.amount,
    status: order2.status,
  });

  // 15. Conversion 2 (Referral)
  const conversion2 = await prisma.conversion.create({
    data: {
      orderId: order2.id,
      externalOrderId: `EXT-${order2.id}`,
      programId: program.id,
      referralId: referrerUser.id,
      winnerId: referrerUser.id,
      winnerType: 'REFERRAL',
      amount: order2.amount,
      currency: order2.currency,
    },
  });
  console.log('✅ Conversion 2 (Referral):', {
    conversionId: conversion2.id.substring(0, 8),
    amount: conversion2.amount,
  });

  // 16. Referral Invite
  const referralInvite = await prisma.referralInvite.create({
    data: {
      codeId: referralCode.id,
      target: customer2.email,
      channel: 'email',
    },
  });
  console.log('✅ Referral Invite oluşturuldu');

  // 17. Referral Signup
  const referralSignup = await prisma.referralSignup.create({
    data: {
      inviteId: referralInvite.id,
      newUserId: customer2.id,
    },
  });
  console.log('✅ Referral Signup oluşturuldu');

  // 18. Referral Reward
  const referralReward = await prisma.referralReward.create({
    data: {
      referralUserId: referrerUser.id,
      signupId: referralSignup.id,
      orderId: order2.id,
      amount: Number(order2.amount) * 0.05, // 5% reward
      currency: order2.currency,
      status: 'APPROVED',
    },
  });
  console.log('✅ Referral Reward:', {
    rewardId: referralReward.id.substring(0, 8),
    amount: referralReward.amount,
    rate: '5%',
  });

  // 17. Click tracking (opsiyonel)
  await prisma.click.create({
    data: {
      affiliateLinkId: affiliateLink.id,
      cookieId: 'test-cookie-1',
      ipHash: 'test-ip-hash-1',
      userAgent: 'Mozilla/5.0 Test Browser',
      utmSource: 'test',
      utmMedium: 'affiliate',
      utmCampaign: 'spring2026',
    },
  });
  console.log('✅ Click tracking kaydedildi');

  console.log('\n📊 ÖZET RAPOR:\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 GİRİŞ BİLGİLERİ:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Tüm kullanıcılar için şifre: Test123!\n');
  
  console.log('👤 Affiliate User:');
  console.log(`   Email: ${affiliateUser.email}`);
  console.log(`   Link: https://app.aishe.pro/?ref=${affiliateLink.code}`);
  console.log(`   Commission: $${commission1.amount} (10% of $${order1.amount})\n`);
  
  console.log('👤 Referrer User:');
  console.log(`   Email: ${referrerUser.email}`);
  console.log(`   Code: ${referralCode.code}`);
  console.log(`   Link: https://app.aishe.pro/?ref=${referralCode.code}`);
  console.log(`   Reward: $${referralReward.amount} (5% of $${order2.totalAmount})\n`);
  
  console.log('👤 Customer 1 (Affiliate\'den geldi):');
  console.log(`   Email: ${customer1.email}`);
  console.log(`   Order: $${order1.amount} ${order1.currency}\n`);
  
  console.log('👤 Customer 2 (Referral\'dan geldi):');
  console.log(`   Email: ${customer2.email}`);
  console.log(`   Order: $${order2.amount} ${order2.currency}\n`);
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 İSTATİSTİKLER:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Orders: 2`);
  console.log(`Total Revenue: $${Number(order1.amount) + Number(order2.amount)}`);
  console.log(`Total Affiliate Commission: $${commission1.amount}`);
  console.log(`Total Referral Rewards: $${referralReward.amount}`);
  console.log(`Total Payouts: $${Number(commission1.amount) + Number(referralReward.amount)}\n`);
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TEST SENARYOLARI:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('1️⃣  Affiliate Stats Test:');
  console.log('   → affiliate@test.com ile giriş yap');
  console.log('   → Dashboard > Affiliate Stats kontrolü');
  console.log('   → $9.90 commission görünmeli\n');
  
  console.log('2️⃣  Referral Stats Test:');
  console.log('   → referrer@test.com ile giriş yap');
  console.log('   → Profile > Referral Rewards kontrolü');
  console.log('   → $4.95 reward görünmeli\n');
  
  console.log('3️⃣  Admin Reports Test:');
  console.log('   → Admin panelden Reports sayfası');
  console.log('   → Total revenue: $198.00');
  console.log('   → Total payouts: $14.85\n');
  
  console.log('✅ Test verileri başarıyla oluşturuldu!');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
