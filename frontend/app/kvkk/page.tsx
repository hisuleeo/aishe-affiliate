'use client';

import { MarketingSiteHeader } from '@/components/layout/MarketingSiteHeader';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isUkSiteHostname } from '@/lib/is-uk-site';

const content = {
  en: {
    title: 'Personal Data Protection Law (KVKK)',
    subtitle: 'Privacy Policy & Data Protection Notice',
    lastUpdated: 'Last Updated: April 18, 2026',
    controller: {
      label: 'Data Controller',
      name: 'Ali Sefa Torun',
      address: 'Tuna Mah. 1690 Sk. Saader Cebeci İş Hanı No: 48 İç Kapı No: 102 Karşıyaka/İzmir',
      contact: 'info@ainengroup.com',
    },
    sections: [
      {
        id: '1',
        title: '1. Purpose of Processing Personal Data',
        intro: 'In accordance with the Turkish Personal Data Protection Law (KVKK) No. 6698, your personal data is processed by Ali Sefa Torun for the following purposes:',
        items: [
          { label: 'License Activation', text: 'To link the AISHE System-Client to your specific device via a hardware-based ID (Hardware-ID).' },
          { label: 'Transaction Security', text: 'To manage your 14-day trial and subsequent monthly payment activations.' },
          { label: 'Legal Compliance', text: 'To fulfill our obligations under the Turkish Commercial Code and the Law on the Protection of Consumers.' },
        ],
      },
      {
        id: '2',
        title: '2. Collected Data Categories',
        intro: 'We adhere to the principle of "Data Minimization." We only collect:',
        items: [
          { label: 'Contact Information', text: 'E-mail address.' },
          { label: 'Technical Data', text: 'Hardware-ID (generated locally by the client software), IP address, and browser logs.' },
          { label: 'Transaction Data', text: 'Payment confirmation logs (Credit card details are processed via 256-bit SSL encrypted bank gateways and are not stored on our servers).' },
        ],
      },
      {
        id: '3',
        title: '3. Transfer of Personal Data',
        intro: 'Your data is not sold or shared with third parties for marketing purposes. Data may only be shared with:',
        items: [
          { label: 'Authorized Institutions', text: 'Legal authorities and regulatory bodies (e.g., BRSA/BDDK or Courts) upon official request.' },
          { label: 'Service Providers', text: 'Google Inc. (Hosting Provider) and İş Bankası (Payment Gateway) to facilitate the service performance.' },
        ],
      },
      {
        id: '4',
        title: '4. Method and Legal Basis of Data Collection',
        intro: 'Personal data is collected electronically via the app.aishe.pro dashboard and the AISHE System-Client software. The legal basis is Article 5/2 (c) of the KVKK: "The processing of personal data belonging to the parties of a contract is necessary, provided that it is directly related to the establishment or performance of the contract."',
        items: [],
      },
      {
        id: '5',
        title: '5. Your Rights Under Article 11 of the KVKK',
        intro: 'As a data subject, you have the following rights:',
        items: [
          { label: '', text: 'To learn whether your personal data is processed.' },
          { label: '', text: 'To request information if your data has been processed.' },
          { label: '', text: 'To request the correction of incomplete or inaccurate data.' },
          { label: '', text: 'To request the deletion or destruction of your personal data ("The Right to be Forgotten").' },
          { label: '', text: 'To object to the processing of data exclusively through automated systems (note: AISHE uses Hardware-IDs for licensing, not for profiling).' },
        ],
        footer: 'To exercise these rights, please send a written request to info@ainengroup.com from your registered e-mail address.',
      },
    ],
    nav: { home: 'Home', back: '← Back' },
  },
  tr: {
    title: 'Kişisel Verilerin Korunması Kanunu (KVKK)',
    subtitle: 'Gizlilik Politikası ve Veri Koruma Bildirimi',
    lastUpdated: 'Son Güncelleme: 18 Nisan 2026',
    controller: {
      label: 'Veri Sorumlusu',
      name: 'Ali Sefa Torun',
      address: 'Tuna Mah. 1690 Sk. Saader Cebeci İş Hanı No: 48 İç Kapı No: 102 Karşıyaka/İzmir',
      contact: 'info@ainengroup.com',
    },
    sections: [
      {
        id: '1',
        title: '1. Kişisel Verilerin İşlenme Amacı',
        intro: '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, kişisel verileriniz Ali Sefa Torun tarafından aşağıdaki amaçlarla işlenmektedir:',
        items: [
          { label: 'Lisans Aktivasyonu', text: 'AISHE System-Client\'ı donanım tabanlı bir kimlik (Hardware-ID) aracılığıyla cihazınıza bağlamak.' },
          { label: 'İşlem Güvenliği', text: '14 günlük deneme sürenizi ve ardından gelen aylık ödeme aktivasyonlarınızı yönetmek.' },
          { label: 'Yasal Uyumluluk', text: 'Türk Ticaret Kanunu ve Tüketicinin Korunması Hakkında Kanun kapsamındaki yükümlülüklerimizi yerine getirmek.' },
        ],
      },
      {
        id: '2',
        title: '2. Toplanan Veri Kategorileri',
        intro: '"Veri Minimizasyonu" ilkesine bağlıyız. Yalnızca şunları topluyoruz:',
        items: [
          { label: 'İletişim Bilgileri', text: 'E-posta adresi.' },
          { label: 'Teknik Veriler', text: 'Hardware-ID (istemci yazılımı tarafından yerel olarak oluşturulur), IP adresi ve tarayıcı logları.' },
          { label: 'İşlem Verileri', text: 'Ödeme onay logları (Kredi kartı bilgileri 256-bit SSL şifreli banka ağ geçitleri aracılığıyla işlenir ve sunucularımızda saklanmaz).' },
        ],
      },
      {
        id: '3',
        title: '3. Kişisel Verilerin Aktarımı',
        intro: 'Verileriniz pazarlama amaçlı olarak üçüncü şahıslara satılmaz veya paylaşılmaz. Veriler yalnızca aşağıdakilerle paylaşılabilir:',
        items: [
          { label: 'Yetkili Kurumlar', text: 'Resmi talep üzerine yasal makamlar ve düzenleyici kurumlar (örn. BDDK veya Mahkemeler).' },
          { label: 'Hizmet Sağlayıcılar', text: 'Hizmet performansını kolaylaştırmak için Google Inc. (Barındırma Sağlayıcısı) ve İş Bankası (Ödeme Ağ Geçidi).' },
        ],
      },
      {
        id: '4',
        title: '4. Veri Toplama Yöntemi ve Hukuki Dayanağı',
        intro: 'Kişisel veriler, app.aishe.pro panosu ve AISHE System-Client yazılımı aracılığıyla elektronik ortamda toplanmaktadır. Hukuki dayanak, KVKK Madde 5/2 (c): "Bir sözleşmenin taraflarına ait kişisel verilerin işlenmesinin, sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması kaydıyla gerekli olması."',
        items: [],
      },
      {
        id: '5',
        title: '5. KVKK Madde 11 Kapsamındaki Haklarınız',
        intro: 'Veri sahibi olarak aşağıdaki haklara sahipsiniz:',
        items: [
          { label: '', text: 'Kişisel verilerinizin işlenip işlenmediğini öğrenme.' },
          { label: '', text: 'Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme.' },
          { label: '', text: 'Eksik veya yanlış işlenmiş verilerin düzeltilmesini talep etme.' },
          { label: '', text: 'Kişisel verilerinizin silinmesini veya yok edilmesini talep etme ("Unutulma Hakkı").' },
          { label: '', text: 'Münhasıran otomatik sistemler aracılığıyla verilerinizin işlenmesine itiraz etme (not: AISHE, Hardware-ID\'leri lisanslama için kullanır, profilleme için değil).' },
        ],
        footer: 'Bu haklarınızı kullanmak için, kayıtlı e-posta adresinizden info@ainengroup.com adresine yazılı bir talep gönderiniz.',
      },
    ],
    nav: { home: 'Ana Sayfa', back: '← Geri' },
  },
};

type Lang = keyof typeof content;

export default function KVKKPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [isUkSite, setIsUkSite] = useState(false);

  useEffect(() => {
    setIsUkSite(isUkSiteHostname(window.location.hostname));
    const saved = localStorage.getItem('language');
    if (saved === 'tr') setLang('tr');
    else setLang('en');

    const onStorage = () => {
      const l = localStorage.getItem('language');
      setLang(l === 'tr' ? 'tr' : 'en');
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('languagechange', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('languagechange', onStorage);
    };
  }, []);

  const t = content[lang];
  const controllerName = isUkSite ? 'Seneca AG' : `${t.controller.name} (AINEN Group)`;

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-20">
      <MarketingSiteHeader sectionHrefPrefix="/" solidBackground />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 md:p-12 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t.title}</h1>
              <p className="text-indigo-400 text-sm font-medium mb-1">{t.subtitle}</p>
              <p className="text-slate-400 text-sm">{t.lastUpdated}</p>
            </div>
            <div className="flex shrink-0 rounded-lg border border-neutral-700 overflow-hidden text-xs">
              <button onClick={() => { setLang('en'); localStorage.setItem('language', 'en'); }} className={`px-3 py-1.5 transition ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}>EN</button>
              <button onClick={() => { setLang('tr'); localStorage.setItem('language', 'tr'); }} className={`px-3 py-1.5 transition ${lang === 'tr' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}>TR</button>
            </div>
          </div>

          {/* Data Controller */}
          <section className="mb-10">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-3">{t.controller.label}</h2>
              <p className="text-slate-300 mb-1"><strong className="text-white notranslate">{controllerName}</strong></p>
              <p className="text-slate-400 text-sm">{t.controller.address}</p>
              <p className="text-slate-400 text-sm mt-1">
                {lang === 'en' ? 'Contact' : 'İletişim'}:{' '}
                <a href={`mailto:${t.controller.contact}`} className="text-indigo-400 hover:text-indigo-300">{t.controller.contact}</a>
              </p>
            </div>
          </section>

          <div className="space-y-10 text-slate-300">
            {t.sections.map((section) => (
              <section key={section.id}>
                <h2 className="text-xl font-semibold text-white mb-4">{section.title}</h2>
                <p className="leading-relaxed mb-4">{section.intro}</p>
                {section.items.length > 0 && (
                  <ul className="space-y-3 ml-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>
                          {item.label && <strong className="text-white">{item.label}: </strong>}
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.footer && (
                  <div className="mt-6 bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/30">
                    <p className="text-sm text-indigo-200">{section.footer}</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-white transition">{t.nav.home}</Link>
          <span>•</span>
          <Link href="/register" className="hover:text-white transition">{t.nav.back}</Link>
        </div>
      </div>
    </main>
  );
}
