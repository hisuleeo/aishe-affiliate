# 📊 AISHE Mock Data - Test Kullanıcıları ve Siparişler

## 🎯 Mock Data Özeti

Mock data başarıyla oluşturuldu! Bu data ile affiliate ve referral sistemini test edebilirsiniz.

### 👤 Ana Kullanıcı: Ayşe Yılmaz

**Giriş Bilgileri:**
- Email: `ayse.yilmaz@aishe.local`
- Kullanıcı adı: `ayse2026`
- Şifre: `Demo123!`
- Rol: **AFFILIATE**

**Affiliate & Referral Bilgileri:**
- **Affiliate Link Kodu:** `AYSE-SPRING-2026`
- **Referral Kodu:** `ayse2026`
- URL: `https://aishe.app/ayse`

---

## 👥 Affiliate Link ile Kayıt Olan Kullanıcılar

Bu kullanıcılar Ayşe'nin affiliate linkine tıklayıp kayıt oldular.

### 1. Mehmet Can
- Email: `mehmet.can@aishe.local`
- Kullanıcı adı: `mehmetcan`
- Şifre: `Demo123!`
- **Sipariş:** AISHE-2026-001 - **€150** (PAID) ✅
  - Seçenekler: lot, nps, recording, wave
  - Ayşe affiliate commission kazandı 💰

### 2. Zeynep Kara
- Email: `zeynep.kara@aishe.local`
- Kullanıcı adı: `zeynepk`
- Şifre: `Demo123!`
- **Sipariş:** AISHE-2026-002 - **€200** (PAID) ✅
  - Seçenekler: lot, nps, npse, recording, reca, statea
  - Ayşe affiliate commission kazandı 💰

---

## 🔗 Referral Code ile Kayıt Olan Kullanıcılar

Bu kullanıcılar kayıt olurken Ayşe'nin referral kodunu kullandılar: `ayse2026`

### 3. Ali Özkan
- Email: `ali.ozkan@aishe.local`
- Kullanıcı adı: `aliozkan`
- Şifre: `Demo123!`
- **Sipariş:** AISHE-2026-003 - **€120** (PAID) ✅
  - Seçenekler: lot, recording, wave
  - Ayşe referral reward kazandı 🎁

### 4. Fatma Yıldız
- Email: `fatma.yildiz@aishe.local`
- Kullanıcı adı: `fatmay`
- Şifre: `Demo123!`
- **Sipariş:** AISHE-2026-004 - **€180** (PAID) ✅
  - Seçenekler: lot, nps, recording, reca, wave
  - Ayşe referral reward kazandı 🎁

### 5. Cem Aksoy
- Email: `cem.aksoy@aishe.local`
- Kullanıcı adı: `cemaksoy`
- Şifre: `Demo123!`
- **Sipariş:** AISHE-2026-005 - **€95** (PENDING) ⏳
  - Seçenekler: lot, nps, recording
  - Ödeme bekleniyor

---

## 📈 İstatistikler

### Ayşe'nin Kazançları:
- **Affiliate Commission:**
  - Mehmet Can: €150
  - Zeynep Kara: €200
  - **Toplam:** €350 (Commission rate: %20 = €70) 💰

- **Referral Rewards:**
  - Ali Özkan: €120
  - Fatma Yıldız: €180
  - **Toplam:** €300 (Ödül olarak credit) 🎁

- **Bekleyen Sipariş:**
  - Cem Aksoy: €95 (PENDING) ⏳

### Toplam:
- **5 adet** sipariş
- **€745** toplam sipariş değeri
- **2 kişi** affiliate link ile kayıt
- **3 kişi** referral code ile kayıt
- **3 adet** affiliate link click kaydı

---

## 🔐 Admin Panelinde Görüntüleme

**Admin Girişi:**
- Email: `admin@aishe.local`
- Şifre: `ChangeMe123!`

### Admin panelde kontrol edilebilecekler:

1. **Kullanıcılar:**
   - Ayşe'yi affiliate olarak görüntüle
   - Diğer 5 kullanıcıyı normal user olarak görüntüle

2. **Affiliate Links:**
   - Ayşe'nin `AYSE-SPRING-2026` linkini görüntüle
   - Link'e ait click kayıtlarını gör (3 adet)

3. **Referral Codes:**
   - Tüm kullanıcıların referral kodlarını gör
   - Ayşe'nin `ayse2026` koduyla yapılan kayıtları gör

4. **Siparişler:**
   - 5 adet siparişi görüntüle
   - Attribution type'lara dikkat et (AFFILIATE / REFERRAL)
   - PAID ve PENDING statusleri kontrol et

5. **Commissions & Rewards:**
   - Ayşe'nin kazandığı affiliate commission'ları gör
   - Ayşe'nin kazandığı referral reward'ları gör

---

## 🧪 Test Senaryoları

### 1. Yeni Kullanıcı Kayıt Testi
```
Referral Code: ayse2026
```
- Kayıt sayfasında bu kodu gir
- Sistem Ayşe'yle ilişkilendirecek

### 2. Affiliate Link Click Testi
```
Affiliate Link Code: AYSE-SPRING-2026
```
- Bu link üzerinden site ziyaret edilebilir
- Click kaydı oluşturulur

### 3. Sipariş Attribution Testi
- Mehmet veya Zeynep ile giriş yap
- Yeni sipariş oluştur
- Ayşe'nin affiliate commission'u artar

---

## 🔄 Mock Data'yı Yeniden Çalıştırma

```bash
npm run prisma:seed:mock
```

Not: Eğer kullanıcılar zaten varsa, script "Ayşe kullanıcısı zaten mevcut" mesajı verecektir.

---

## 🗑️ Mock Data'yı Temizleme

Veritabanını sıfırlamak için:

```bash
npm run prisma:migrate:reset
npm run prisma:seed
```

Sonra tekrar mock data oluştur:

```bash
npm run prisma:seed:mock
```
