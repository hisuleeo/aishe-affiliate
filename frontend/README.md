# AISHE Frontend

Affiliate & Referral paneli için Next.js tabanlı arayüz.

## Kurulum
```bash
npm install
cp .env.example .env.local
```

## Çalıştırma
Backend `3000` portunda çalıştığı için frontend'i `3001` portunda başlatın.

```bash
PORT=3001 npm run dev
```

## Ortam Değişkenleri
- `NEXT_PUBLIC_API_BASE_URL`: Backend base URL (varsayılan: `http://localhost:3000`).
