# AISHE – Affiliate & Referral Platformu

Bu repo, Affiliate & Referral akışlarını yöneten NestJS backend ve Next.js frontend içeren tam bir uygulamayı barındırır.

## İçerik
- `schema.sql`: Üretim şeması (Affiliate/Referral ledger ayrımı, tiered payout, tek kazanan attribution, zorunlu currency).
- `prisma/schema.prisma`: Prisma şema dosyası.
- `prisma/migrations/000_init/migration.sql`: İlk migration SQL'i.
- `src/`: NestJS backend.
- `frontend/`: Next.js frontend.

## Tasarım Notları
- **Affiliate** nakit ödeme (liability). Ledger: `affiliate_ledger`.
- **Referral** internal kredi (harcama). Ledger: `referral_credits`.
- **Tek kazanan attribution**: `conversions.winner_type` + `winner_id`.
- **Tiered payout**: `commission_tiers` tablosu ile yönetilir.
- **Multi-currency**: tüm para alanlarında `currency` zorunludur.

## Veritabanı Kurulumu
Docker Compose dosyası PostgreSQL'i `5433` portuna açar. `.env` dosyasında aynı portu kullanın.

```bash
docker compose up -d
```

## Backend (NestJS) Kurulum & Çalıştırma
```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev
```

Varsayılan port: `3000`.

## Frontend (Next.js) Kurulum & Çalıştırma
```bash
cd frontend
npm install
cp .env.example .env.local
PORT=3001 npm run dev
```

Frontend için `NEXT_PUBLIC_API_BASE_URL` değeri `http://localhost:3000` olarak beklenir.

## Auth & RBAC
- `POST /auth/register`
- `POST /auth/login`
- JWT `Authorization: Bearer <token>`
- `@Roles('ADMIN' | 'AFFILIATE' | 'USER')` decorator ile rol bazlı kontrol

## Admin-only test endpoint
- `GET /admin/users` → sadece `ADMIN`
- `USER` veya `AFFILIATE` ile çağrılırsa **403 Forbidden** döner

## Paket komisyon oranı
- Komisyon oranı `packages.commission_rate` alanında saklanır
- Komisyon hesaplama için hardcoded oran kullanılmaz

## Commission Rules
- Komisyon kuralları `commission_rules` tablosundan yönetilir
- `OrderPaidEvent` tetiklendiğinde kurallar okunur
- Uygun kural bulunamazsa varsayılan oran (%10) kullanılır

## Package & Order API
- `GET /packages` → public (listeleme)
- `GET /packages/:id` → public (detay)
- `POST /packages` → `ADMIN` (create)
- `PATCH /packages/:id` → `ADMIN` (update)
- `DELETE /packages/:id` → `ADMIN` (delete)
- `GET /orders` → giriş yapan kullanıcının siparişleri
- `POST /orders` → paket satın alma (attribution kontrolü + pending status)

## Admin seed
Varsayılan admin kullanıcısını oluşturmak için:

```bash
npm run prisma:seed
```

Seed değerleri `.env` üzerinden yönetilir: `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
