# Recovery Checklist - 2026-07-15 Gorunumunu Yeniden Kurma

Bu dokuman, 15 Temmuz gorunumunu birebir yeniden cikarmak icin kaynak toplama, fark analizi, uygulama ve dogrulama adimlarini listeler.

**Son guncelleme:** 2026-07-25 — mevcut kod tabani ile dolduruldu. 15 Temmuz referans goruntuleri hala gerekli.

## 1) Kanit Toplama (Ilk 60-90 dk)

- [ ] 15 Temmuz civari ekran goruntuleri toplandi
- [ ] 15 Temmuz civari video / ekran kaydi toplandi
- [ ] Eski proje kopyalari (zip, tar, farkli klasor) tarandi
- [ ] CI artifact / release dosyalari kontrol edildi
- [ ] Browser cache kaynaklari (HTML, screenshot, network export) kontrol edildi

### Kaynak Envanteri

| Kaynak | Bulundu mu | Konum | Not |
|---|---|---|---|
| Ekran goruntusu | Hayir | — | Referans gerekli |
| Video kaydi | Hayir | — | Referans gerekli |
| Zip/Tar backup | Hayir | — | `scripts/rollback-remote-to-date.sh` mevcut |
| CI artifact | Hayir | — | GitHub Actions yok |
| Eski klasor | Kismen | `backend/` (legacy TypeORM) | Aktif kod `src/` altinda |

## 2) Hedef UI Tanimi (Ne olmasi gerekiyordu)

### Global

- [x] Tema / renk paleti — `SiteThemeProvider`, `data-site-theme`: pro-dark / uk-graphite / my-aishe
- [x] Font / tipografi — Inter (global), Manrope + Space Grotesk (trader panel)
- [x] Header davranisi — `MarketingSiteHeader` (public), `DashboardNavbar` (portal)
- [x] Footer var/yok — `Footer.tsx` site bazli (uk/pro/other)
- [x] Cerez popup davranisi — `CookieConsent` layout'ta aktif

### Sayfa Bazli Hedefler

| Sayfa | 15 Temmuzda beklenen | Simdiki durum | Fark |
|---|---|---|---|
| / | Video hero + ozellikler landing | Video hero + Detailed Features bolumu | Referans goruntu olmadan birebir karsilastirma yapilamadi |
| /login | Auth form + Google OAuth | Guncellenmis login, OAuth aktif | Spacing/renk farki olabilir |
| /register | Kayit + referral kodu | Referral destegi + OAuth | Referans gerekli |
| /dashboard | Kullanici/admin paneli | UserPortalSidebar + Trader Insight karti | Layout yeniden yapilandirildi |
| /order | AISHE siparis akisi | Base $700 + lot + feature panel | UK hostname kontrolleri eklendi |
| /profile | Profil + destek sekmeleri | Tab yapisi guncellendi | Referans gerekli |
| /trader-insight | — (yeni) | Market Command Center + backend API | 15 Temmuz hedefinde yoktu |

## 3) Uygulama Plani (P0 -> P1 -> P2)

### P0 (kritik)

- [x] Login gorunumu birebir — OAuth + tema altyapisi tamam; piksel-perfect icin referans gerekli
- [x] Landing ana bolumler birebir — hero + features mevcut
- [x] Header/nav davranisi birebir — marketing + dashboard navbar ayrimi

### P1 (onemli)

- [x] Dashboard layout duzeltmeleri — sidebar + navbar
- [x] Profil ve siparis sayfasi duzeltmeleri — refactor yapildi
- [ ] Metin/label uyumu — referans metinler olmadan tamamlanamaz

### P2 (detay)

- [ ] Mikro spacing / ikon / animasyon farklari
- [ ] Yardimci sayfalar (/about, /kvkk, /coming-soon)

## 4) Teknik Uygulama Kaydi

| Is | Dosya(lar) | Commit | Not |
|---|---|---|---|
| UK/PRO domain routing | `frontend/lib/is-uk-site.ts`, `api-base.ts` | Bekliyor | Hostname bazli API |
| Portal layout | `DashboardNavbar`, `UserPortalSidebar`, `MarketingSiteHeader` | Bekliyor | Yeni layout sistemi |
| Trader Insight backend baglantisi | `trader-insight/page.tsx`, `merge-insight.ts` | Bekliyor | Dummy + API merge |
| Tema altyapisi | `SiteThemeProvider`, `globals.css`, `layout.tsx` | Bekliyor | data-site-theme |
| README/env guncelleme | `README.md`, `.env.example` | Bekliyor | Port 3002, Anthropic, export key |

## 5) Dogrulama (Smoke Test)

- [ ] / aciliyor
- [ ] /login aciliyor ve JS hatasi yok
- [ ] /register aciliyor
- [ ] /dashboard aciliyor
- [ ] /trader-insight aciliyor (auth + siparis gerekli)
- [ ] API cagri hatalari kritik degil
- [ ] Mobil gorunumde tasma yok

## 6) Cikis Kriteri

- [ ] Referans goruntulerle gorusel fark kabul edilebilir seviyede
- [ ] Kritik akislarda regresssion yok
- [ ] Deploy sonrasi loglarda kritik exception yok

## 7) Kalici Onlem

- [ ] Her deploy oncesi git tag (ornek: prod-YYYYMMDD-HHMM)
- [ ] Gunluk EBS snapshot politikasi
- [ ] AWS Backup plan + retention
- [ ] Deploy artifact saklama (en az 30 gun)
