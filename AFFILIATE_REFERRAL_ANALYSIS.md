# 🔍 AFFILIATE & REFERRAL SİSTEMİ ANALİZİ

## 📊 MEVCUT YAPI ANALİZİ

### 1. DATABASE SCHEMA (Prisma)

#### ✅ İYİ OLAN NOKTALAR:
- **Program-based Attribution**: Program, AffiliateLink, Click, Conversion modeli profesyonel
- **Dual System**: Affiliate ve Referral ayrı ayrı çalışıyor
- **Winner Logic**: Conversion'da `winnerType` (AFFILIATE vs REFERRAL) doğru yapı
- **Commission System**: Commission, CommissionRule, CommissionTier karmaşık senaryolar için hazır
- **Ledger System**: AffiliateLedger ve ReferralCredit ile detaylı muhasebe

#### ❌ SORUNLAR:
1. **Order ↔ Conversion Bağlantısı YOK**: 
   - `Order` modeli var ama `Conversion` ile ilişkisi yok
   - `Conversion.externalOrderId` unique ama Order.id ile link yok
   - Commission → Conversion → Order zinciri kopuk

2. **Order Attribution Karmaşık**:
   - `Order.affiliateId` ve `Order.referralUserId` ayrı alanlar
   - Ama Conversion'da `winnerId` var, Order'da yok
   - Attribution logic hem Order'da hem Conversion'da var

3. **ReferralSignup → Order İlişkisi YOK**:
   - ReferralReward → signup bağlantısı var
   - Ama reward'ı tetikleyen order hangisi belirsiz
   - Her signup için sadece 1 reward var ama kullanıcı birden fazla order verebilir

4. **Commission Hesaplama Double Work**:
   - Hem Commission table var (Conversion based)
   - Hem AffiliateLedger var (Order based)
   - İkisi arasında sync problemi olabilir

### 2. BACKEND SERVICE ANALİZİ

#### ✅ İYİ OLAN:
- **Event-Driven**: `order.paid` eventi ile commission tetikleniyor
- **Auth Service**: Register sırasında ReferralCode + AffiliateLink otomatik oluşturuluyor
- **CommissionListener**: Event dinliyor, hesaplama yapıyor

#### ❌ SORUNLAR:

**A. auth.service.ts**:
```typescript
// ✅ Referral signup oluşturuyor
await this.prisma.referralSignup.create({
  data: {
    inviteId: invite.id,
    newUserId: user.id,
  },
});

// ❌ PROBLEM: AffiliateLink code rastgele hex - username yerine
const code = `${username.toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
// Demo kullanıcı için: AISHEDEMO-A3F5B2 gibi karmaşık
// Beklenen: aishedemo
```

**B. orders.service.ts**:
```typescript
// ✅ affiliateCode'u affiliateId'ye çeviriyor
if (!resolvedAffiliateId && payload.affiliateCode) {
  const affiliateLink = await this.prisma.affiliateLink.findUnique({
    where: { code: payload.affiliateCode },
  });
  if (affiliateLink) {
    resolvedAffiliateId = affiliateLink.affiliateId;
  }
}

// ✅ Referral signup'tan code buluyor
if (!referralCode) {
  const signup = await this.prisma.referralSignup.findFirst({
    where: { newUserId: buyerId },
    include: {
      invite: {
        include: {
          code: true,
        },
      },
    },
  });
  
  if (signup) {
    referralCode = signup.invite.code.code;
  }
}

// ❌ PROBLEM: Order direkt PAID olarak oluşturuluyor
status: OrderStatus.PAID,

// ❌ PROBLEM: Hem order.created hem order.paid eventi aynı anda
this.eventEmitter.emit('order.created', ...);
this.eventEmitter.emit('order.paid', ...);
```

**C. commissions.service.ts**:
```typescript
// ✅ calculateAffiliateCommission çalışıyor
// ✅ calculateReferralReward çalışıyor

// ❌ PROBLEM: AffiliateLedger'a yazıyor ama Commission table'a yazmıyor
// Commission table boş kalıyor!

// ❌ PROBLEM: ReferralReward oluşturuyor ama order ilişkisi yok
await this.prisma.referralReward.create({
  data: {
    referralUserId,
    signupId: signup.id,
    amount: rewardAmount,
    currency: order.currency,
    status: ReferralRewardStatus.PENDING,
  },
});
// Order ID yok! Hangi sipariş için bu reward belirsiz
```

**D. users.service.ts** (yeni eklenen):
```typescript
// ❌ PROBLEM: Commission'ları Conversion üzerinden çekiyor
const commissions = await this.prisma.commission.findMany({
  where: { affiliateId: userId },
  include: { 
    conversion: {
      include: {
        program: true,
      },
    },
  },
});

// AMA Commission table'a hiç veri yazılmıyor!
// Order → Conversion bağlantısı yok
// Sonuç: commissions = []
```

### 3. FRONTEND ANALİZİ

#### ✅ İYİ OLAN:
- `aishe_ref` cookie ile tracking
- Register sayfasında auto-fill çalışıyor
- Order sayfasında cookie'den code okunuyor

#### ❌ SORUNLAR:
- Backend'den data gelmediği için affiliate stats boş
- Profile page'de API çağrıları yapılıyor ama response empty

## 🎯 SORUN ÖZETİ

### CRITICAL ISSUES:

1. **Order → Conversion İlişkisi YOK**
   - Commission hesaplanıyor ama Conversion table'a yazılmıyor
   - Commission table boş kalıyor
   - Frontend'de affiliate stats görünmüyor

2. **ReferralReward → Order İlişkisi YOK**
   - Reward oluşturuluyor ama hangi order için belirsiz
   - Aynı signup için birden fazla order olursa duplicate reward

3. **Double Attribution System**
   - Hem Order.affiliateId/referralUserId var
   - Hem Conversion.affiliateId/referralId var
   - Sync problemi

4. **AffiliateLink Code Karmaşık**
   - `AISHEDEMO-A3F5B2` yerine `aishedemo` olmalı
   - Demo kullanıcı için basit kod gerekli

5. **Commission Table Hiç Kullanılmıyor**
   - AffiliateLedger'a yazılıyor
   - Commission table empty

## ✅ ÇÖZÜM PLANI

### PLAN A: MİNİMAL FIX (HIZLI)
Order-based basit yapı, mevcut kodu minimum değiştir

### PLAN B: FULL FIX (KUSURSUZ)
Conversion-based profesyonel yapı, doğru mimari

**Öneri: PLAN B** - Kusursuz çalışma için gerekli

---

## 📋 PLAN B: KUSURSUZ YAPI

### PHASE 1: DATABASE İYİLEŞTİRMELERİ

#### 1.1. Order → Conversion İlişkisi
```prisma
model Order {
  // ... existing fields
  conversion Conversion? @relation("OrderConversion")
}

model Conversion {
  // ... existing fields
  orderId String? @unique @db.Uuid @map("order_id")
  order   Order?  @relation("OrderConversion", fields: [orderId], references: [id])
}
```

#### 1.2. ReferralReward → Order İlişkisi
```prisma
model ReferralReward {
  // ... existing fields
  orderId String? @db.Uuid @map("order_id")
  order   Order?  @relation(fields: [orderId], references: [id])
}
```

### PHASE 2: COMMISSION SERVICE REFACTOR

#### 2.1. Conversion Oluşturma
```typescript
async calculateCommission(orderId: string) {
  const order = await this.prisma.order.findUnique({...});
  
  // 1. Program bul
  const program = await this.getActiveProgram();
  
  // 2. Conversion oluştur
  const conversion = await this.prisma.conversion.create({
    data: {
      programId: program.id,
      orderId: order.id,
      externalOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      affiliateId: order.affiliateId,
      referralId: order.referralUserId,
      winnerType: order.attributionType === 'AFFILIATE' ? 'AFFILIATE' : 'REFERRAL',
      winnerId: order.affiliateId || order.referralUserId,
    },
  });
  
  // 3. Commission oluştur
  if (order.affiliateId) {
    await this.createCommission(conversion, order);
  }
  
  // 4. Referral reward oluştur
  if (order.referralUserId) {
    await this.createReferralReward(conversion, order);
  }
}
```

#### 2.2. Commission Oluşturma
```typescript
private async createCommission(conversion, order) {
  const tier = await this.findApplicableTier(order.affiliateId);
  const rate = tier?.rate || order.package.commissionRate;
  const amount = order.amount.mul(rate);
  
  await this.prisma.commission.create({
    data: {
      conversionId: conversion.id,
      affiliateId: order.affiliateId,
      tierId: tier?.id,
      type: 'PERCENTAGE',
      amount,
      currency: order.currency,
      status: 'PENDING',
    },
  });
  
  // AffiliateLedger'a da yaz (compat)
  await this.writeLedgerEntry({
    affiliateId: order.affiliateId,
    amount,
    currency: order.currency,
    refId: order.id,
  });
}
```

#### 2.3. Referral Reward Oluşturma
```typescript
private async createReferralReward(conversion, order) {
  const signup = await this.prisma.referralSignup.findFirst({
    where: { newUserId: order.buyerId },
  });
  
  if (!signup) return;
  
  const rate = new Prisma.Decimal(0.05); // %5
  const amount = order.amount.mul(rate);
  
  await this.prisma.referralReward.create({
    data: {
      referralUserId: order.referralUserId,
      signupId: signup.id,
      orderId: order.id, // ✅ Order ilişkisi eklendi
      amount,
      currency: order.currency,
      status: 'PENDING',
    },
  });
}
```

### PHASE 3: AUTH SERVICE FIX

#### 3.1. AffiliateLink Code Basitleştirme
```typescript
private async createAffiliateLink(userId: string, username: string) {
  const program = await this.getOrCreateProgram();
  
  // ✅ Basit kod: kullanıcı adının kendisi
  await this.prisma.affiliateLink.create({
    data: {
      affiliateId: userId,
      programId: program.id,
      code: username, // aishedemo (karmaşık hex yok)
      targetUrl: `https://app.aishe.pro/?ref=${username}`,
    },
  });
}
```

### PHASE 4: USERS SERVICE FIX

#### 4.1. Stats API Düzeltme
```typescript
async getAffiliateStats(userId: string) {
  // ✅ Commission table'dan çek (artık dolu)
  const commissions = await this.prisma.commission.findMany({
    where: { affiliateId: userId },
    include: { 
      conversion: {
        include: {
          order: {
            include: {
              package: true,
            },
          },
        },
      },
    },
  });
  
  // Clicks
  const clicks = await this.prisma.click.count({
    where: { 
      affiliateLink: {
        affiliateId: userId,
      },
    },
  });
  
  // Stats hesapla
  const totalConversions = commissions.length;
  const totalEarnings = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const pendingEarnings = commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const paidEarnings = commissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  
  return {
    totalClicks: clicks,
    totalConversions,
    totalEarnings: totalEarnings.toFixed(2),
    pendingEarnings: pendingEarnings.toFixed(2),
    paidEarnings: paidEarnings.toFixed(2),
    conversionRate: clicks > 0 ? (totalConversions / clicks) * 100 : 0,
    currency: 'EUR',
  };
}
```

#### 4.2. Referral Stats
```typescript
async getReferralStats(userId: string) {
  const rewards = await this.prisma.referralReward.findMany({
    where: { referralUserId: userId },
    include: {
      signup: {
        include: {
          newUser: true,
        },
      },
      order: { // ✅ Order ilişkisi artık var
        include: {
          package: true,
        },
      },
    },
  });
  
  const totalReferrals = new Set(rewards.map(r => r.signup.newUserId)).size;
  const totalEarnings = rewards.reduce((sum, r) => sum + Number(r.amount), 0);
  
  return {
    totalReferrals,
    successfulReferrals: rewards.filter(r => r.order?.status === 'PAID').length,
    totalEarnings: totalEarnings.toFixed(2),
    pendingEarnings: rewards
      .filter(r => r.status === 'PENDING')
      .reduce((sum, r) => sum + Number(r.amount), 0)
      .toFixed(2),
    paidEarnings: rewards
      .filter(r => r.status === 'CREDITED')
      .reduce((sum, r) => sum + Number(r.amount), 0)
      .toFixed(2),
    currency: 'EUR',
  };
}
```

### PHASE 5: MIGRATION

#### 5.1. Schema Migration
```bash
npx prisma migrate dev --name add_order_conversion_relations
```

#### 5.2. Data Backfill (varolan orderlar için)
```typescript
async backfillConversions() {
  const orders = await this.prisma.order.findMany({
    where: {
      status: 'PAID',
      conversion: null,
    },
  });
  
  const program = await this.getActiveProgram();
  
  for (const order of orders) {
    const conversion = await this.prisma.conversion.create({
      data: {
        programId: program.id,
        orderId: order.id,
        externalOrderId: order.id,
        amount: order.amount,
        currency: order.currency,
        affiliateId: order.affiliateId,
        referralId: order.referralUserId,
        winnerType: order.affiliateId ? 'AFFILIATE' : 'REFERRAL',
        winnerId: order.affiliateId || order.referralUserId || order.buyerId,
      },
    });
    
    // Commission oluştur
    if (order.affiliateId) {
      // ...
    }
    
    // Referral reward oluştur
    if (order.referralUserId) {
      // ...
    }
  }
}
```

## 🎯 İMPLEMENTASYON SIRASI

1. ✅ Migration: Order-Conversion-ReferralReward ilişkileri
2. ✅ CommissionsService: Conversion + Commission oluşturma
3. ✅ AuthService: AffiliateLink code basitleştirme
4. ✅ UsersService: Stats API düzeltme
5. ✅ Backfill Script: Mevcut orderlar için conversion
6. ✅ Test: Demo kullanıcı ile end-to-end
7. ✅ Deploy: Production

## 📊 BEKLENEN SONUÇ

### Demo Kullanıcı Testi:
1. Register: `demo@aishe.local` / `Demo123!`
2. Affiliate link: `https://app.aishe.pro/?ref=aishedemo`
3. Yeni kullanıcı kaydı (ref=aishedemo)
4. Order oluşturma
5. Profile'da görmeli:
   - **Affiliate Stats**: 1 conversion, €X commission
   - **Referral Stats**: 1 referral, €Y reward

### API Responses:
```json
// GET /api/v1/affiliate/stats
{
  "totalClicks": 5,
  "totalConversions": 1,
  "totalEarnings": "5.00",
  "pendingEarnings": "5.00",
  "paidEarnings": "0.00",
  "conversionRate": 20.0,
  "currency": "EUR"
}

// GET /api/v1/referral/stats
{
  "totalReferrals": 1,
  "successfulReferrals": 1,
  "totalEarnings": "1.25",
  "pendingEarnings": "1.25",
  "paidEarnings": "0.00",
  "currency": "EUR"
}
```

---

## ⚠️ NOT
Bu plan kusursuz bir affiliate/referral sistemi için gerekli tüm değişiklikleri içeriyor. 
Her adım test edilmeli ve production'a deploy edilmeden önce staging'de doğrulanmalı.
